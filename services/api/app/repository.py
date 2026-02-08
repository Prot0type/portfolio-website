from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

from app.models import ProjectCreate, ProjectRecord, ProjectStatus, ProjectUpdate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(record: ProjectRecord) -> Dict:
    payload = record.model_dump()
    payload["created_at"] = record.created_at.isoformat()
    payload["updated_at"] = record.updated_at.isoformat()
    return payload


def _deserialize(payload: Dict) -> ProjectRecord:
    return ProjectRecord(
        **{
            **payload,
            "created_at": datetime.fromisoformat(payload["created_at"]),
            "updated_at": datetime.fromisoformat(payload["updated_at"]),
        }
    )


def _sort_projects(projects: List[ProjectRecord]) -> List[ProjectRecord]:
    return sorted(
        projects,
        key=lambda item: (
            item.sort_order,
            item.project_date,
            item.updated_at.isoformat(),
        ),
        reverse=True,
    )


class ProjectRepository(ABC):
    @abstractmethod
    def list_projects(self, status: Optional[ProjectStatus]) -> List[ProjectRecord]:
        raise NotImplementedError

    @abstractmethod
    def get_project(self, project_id: str) -> Optional[ProjectRecord]:
        raise NotImplementedError

    @abstractmethod
    def create_project(self, payload: ProjectCreate) -> ProjectRecord:
        raise NotImplementedError

    @abstractmethod
    def update_project(self, project_id: str, payload: ProjectUpdate) -> Optional[ProjectRecord]:
        raise NotImplementedError

    @abstractmethod
    def delete_project(self, project_id: str) -> bool:
        raise NotImplementedError


class MemoryProjectRepository(ProjectRepository):
    def __init__(self) -> None:
        self._items: Dict[str, ProjectRecord] = {}

    def list_projects(self, status: Optional[ProjectStatus]) -> List[ProjectRecord]:
        values = list(self._items.values())
        if status:
            values = [item for item in values if item.status == status]
        return _sort_projects(values)

    def get_project(self, project_id: str) -> Optional[ProjectRecord]:
        return self._items.get(project_id)

    def create_project(self, payload: ProjectCreate) -> ProjectRecord:
        now = _utcnow()
        record = ProjectRecord(**payload.model_dump(), created_at=now, updated_at=now)
        self._items[record.project_id] = record
        return record

    def update_project(self, project_id: str, payload: ProjectUpdate) -> Optional[ProjectRecord]:
        existing = self._items.get(project_id)
        if not existing:
            return None
        patch = payload.model_dump(exclude_unset=True)
        updated = existing.model_copy(update={**patch, "updated_at": _utcnow()})
        self._items[project_id] = updated
        return updated

    def delete_project(self, project_id: str) -> bool:
        return self._items.pop(project_id, None) is not None


class DynamoProjectRepository(ProjectRepository):
    def __init__(self, table_name: str, region_name: str):
        self._table = boto3.resource("dynamodb", region_name=region_name).Table(table_name)

    def list_projects(self, status: Optional[ProjectStatus]) -> List[ProjectRecord]:
        params = {}
        if status:
            params["FilterExpression"] = Attr("status").eq(status)
        response = self._table.scan(**params)
        items = response.get("Items", [])
        records = [_deserialize(item) for item in items]
        return _sort_projects(records)

    def get_project(self, project_id: str) -> Optional[ProjectRecord]:
        response = self._table.get_item(Key={"project_id": project_id})
        item = response.get("Item")
        if not item:
            return None
        return _deserialize(item)

    def create_project(self, payload: ProjectCreate) -> ProjectRecord:
        now = _utcnow()
        record = ProjectRecord(**payload.model_dump(), created_at=now, updated_at=now)
        self._table.put_item(Item=_serialize(record))
        return record

    def update_project(self, project_id: str, payload: ProjectUpdate) -> Optional[ProjectRecord]:
        existing = self.get_project(project_id)
        if not existing:
            return None
        patch = payload.model_dump(exclude_unset=True)
        updated = existing.model_copy(update={**patch, "updated_at": _utcnow()})
        self._table.put_item(Item=_serialize(updated))
        return updated

    def delete_project(self, project_id: str) -> bool:
        try:
            response = self._table.delete_item(
                Key={"project_id": project_id},
                ConditionExpression=Attr("project_id").exists(),
                ReturnValues="ALL_OLD",
            )
            return bool(response.get("Attributes"))
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            raise
