from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import re
from typing import Dict, List, Optional

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

from app.models import (
    DEFAULT_HOME_BIO_MAIN,
    DEFAULT_HOME_BIO_SECONDARY,
    ProjectCreate,
    ProjectImage,
    ProjectRecord,
    ProjectStatus,
    ProjectUpdate,
    SiteContentRecord,
    SiteContentUpdate,
    normalize_project_short_name,
)

SITE_CONTENT_RECORD_KEY = "__site_content__"
DEFAULT_THUMBNAIL = ProjectImage(key="default-thumbnail", url="/images/project-1.svg", alt="Project thumbnail")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(record: ProjectRecord) -> Dict:
    payload = record.model_dump()
    payload["created_at"] = record.created_at.isoformat()
    payload["updated_at"] = record.updated_at.isoformat()
    return payload


def _deserialize(payload: Dict) -> ProjectRecord:
    normalized = dict(payload)
    normalized_short_name = normalized.get("project_short_name")
    if not normalized_short_name:
        fallback_short_name = normalized.get("title") or normalized.get("project_id") or "project"
        fallback_sanitized = re.sub(r"[^A-Za-z0-9 ]+", " ", str(fallback_short_name))
        fallback_sanitized = " ".join(fallback_sanitized.split()) or "project"
        normalized["project_short_name"] = normalize_project_short_name(fallback_sanitized)

    thumbnail_payload = normalized.get("thumbnail")
    if not isinstance(thumbnail_payload, dict) or not thumbnail_payload.get("key") or not thumbnail_payload.get("url"):
        first_image = normalized.get("images", [{}])[0] if normalized.get("images") else {}
        fallback_thumbnail = {
            "key": first_image.get("key") or DEFAULT_THUMBNAIL.key,
            "url": first_image.get("url") or DEFAULT_THUMBNAIL.url,
            "alt": first_image.get("alt") or DEFAULT_THUMBNAIL.alt,
            "width": first_image.get("width"),
            "height": first_image.get("height"),
        }
        normalized["thumbnail"] = fallback_thumbnail

    return ProjectRecord(
        **{
            **normalized,
            "created_at": datetime.fromisoformat(normalized["created_at"]),
            "updated_at": datetime.fromisoformat(normalized["updated_at"]),
        }
    )


def _default_site_content() -> SiteContentRecord:
    return SiteContentRecord(
        bio_main=DEFAULT_HOME_BIO_MAIN,
        bio_secondary=DEFAULT_HOME_BIO_SECONDARY,
        updated_at=_utcnow(),
    )


def _deserialize_site_content(payload: Dict) -> SiteContentRecord:
    bio_main = payload.get("bio_main") or DEFAULT_HOME_BIO_MAIN
    bio_secondary = payload.get("bio_secondary") or DEFAULT_HOME_BIO_SECONDARY
    updated_at_value = payload.get("updated_at")
    updated_at = datetime.fromisoformat(updated_at_value) if isinstance(updated_at_value, str) else _utcnow()
    return SiteContentRecord(bio_main=bio_main, bio_secondary=bio_secondary, updated_at=updated_at)


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
    def get_project_by_slug(self, project_slug: str) -> Optional[ProjectRecord]:
        raise NotImplementedError

    @abstractmethod
    def get_project_by_short_name(self, project_short_name: str) -> Optional[ProjectRecord]:
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

    @abstractmethod
    def get_site_content(self) -> SiteContentRecord:
        raise NotImplementedError

    @abstractmethod
    def upsert_site_content(self, payload: SiteContentUpdate) -> SiteContentRecord:
        raise NotImplementedError


class MemoryProjectRepository(ProjectRepository):
    def __init__(self) -> None:
        self._items: Dict[str, ProjectRecord] = {}
        self._site_content = _default_site_content()

    def list_projects(self, status: Optional[ProjectStatus]) -> List[ProjectRecord]:
        values = list(self._items.values())
        if status:
            values = [item for item in values if item.status == status]
        return _sort_projects(values)

    def get_project(self, project_id: str) -> Optional[ProjectRecord]:
        return self._items.get(project_id)

    def get_project_by_slug(self, project_slug: str) -> Optional[ProjectRecord]:
        for project in self._items.values():
            if project.project_slug == project_slug:
                return project
        return None

    def get_project_by_short_name(self, project_short_name: str) -> Optional[ProjectRecord]:
        normalized = normalize_project_short_name(project_short_name)
        for project in self._items.values():
            if project.project_short_name.lower() == normalized.lower():
                return project
        return None

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

    def get_site_content(self) -> SiteContentRecord:
        return self._site_content

    def upsert_site_content(self, payload: SiteContentUpdate) -> SiteContentRecord:
        self._site_content = SiteContentRecord(**payload.model_dump(), updated_at=_utcnow())
        return self._site_content


class DynamoProjectRepository(ProjectRepository):
    def __init__(self, table_name: str, region_name: str):
        self._table = boto3.resource("dynamodb", region_name=region_name).Table(table_name)

    def list_projects(self, status: Optional[ProjectStatus]) -> List[ProjectRecord]:
        params = {}
        if status:
            params["FilterExpression"] = Attr("status").eq(status)
        response = self._table.scan(**params)
        items = response.get("Items", [])
        records: List[ProjectRecord] = []
        for item in items:
            if item.get("project_id") == SITE_CONTENT_RECORD_KEY:
                continue
            try:
                records.append(_deserialize(item))
            except Exception:
                continue
        return _sort_projects(records)

    def get_project(self, project_id: str) -> Optional[ProjectRecord]:
        response = self._table.get_item(Key={"project_id": project_id})
        item = response.get("Item")
        if not item:
            return None
        if item.get("project_id") == SITE_CONTENT_RECORD_KEY:
            return None
        try:
            return _deserialize(item)
        except Exception:
            return None

    def get_project_by_slug(self, project_slug: str) -> Optional[ProjectRecord]:
        response = self._table.scan(FilterExpression=Attr("project_slug").eq(project_slug))
        for item in response.get("Items", []):
            if item.get("project_id") == SITE_CONTENT_RECORD_KEY:
                continue
            try:
                return _deserialize(item)
            except Exception:
                continue
        return None

    def get_project_by_short_name(self, project_short_name: str) -> Optional[ProjectRecord]:
        normalized = normalize_project_short_name(project_short_name)
        response = self._table.scan(FilterExpression=Attr("project_short_name").eq(normalized))
        for item in response.get("Items", []):
            if item.get("project_id") == SITE_CONTENT_RECORD_KEY:
                continue
            try:
                return _deserialize(item)
            except Exception:
                continue
        return None

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

    def get_site_content(self) -> SiteContentRecord:
        response = self._table.get_item(Key={"project_id": SITE_CONTENT_RECORD_KEY})
        item = response.get("Item")
        if not item:
            return _default_site_content()
        return _deserialize_site_content(item)

    def upsert_site_content(self, payload: SiteContentUpdate) -> SiteContentRecord:
        record = SiteContentRecord(**payload.model_dump(), updated_at=_utcnow())
        item = {
            "project_id": SITE_CONTENT_RECORD_KEY,
            "bio_main": record.bio_main,
            "bio_secondary": record.bio_secondary,
            "updated_at": record.updated_at.isoformat(),
            "record_type": "site_content",
        }
        self._table.put_item(Item=item)
        return record
