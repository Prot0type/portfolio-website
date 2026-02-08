from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

ProjectStatus = Literal["draft", "published"]


class ProjectImage(BaseModel):
    key: str = Field(min_length=1)
    url: str = Field(min_length=1)
    alt: str = ""
    width: Optional[int] = None
    height: Optional[int] = None


class ProjectBase(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=2, max_length=5000)
    tags: List[str] = Field(default_factory=list)
    project_date: str = Field(description="ISO date string, e.g. 2026-01-20")
    images: List[ProjectImage] = Field(default_factory=list)
    status: ProjectStatus = "draft"
    sort_order: int = 0
    extra: Dict[str, Any] = Field(default_factory=dict)


class ProjectCreate(ProjectBase):
    project_id: str = Field(default_factory=lambda: str(uuid4()))


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=140)
    description: Optional[str] = Field(default=None, min_length=2, max_length=5000)
    tags: Optional[List[str]] = None
    project_date: Optional[str] = None
    images: Optional[List[ProjectImage]] = None
    status: Optional[ProjectStatus] = None
    sort_order: Optional[int] = None
    extra: Optional[Dict[str, Any]] = None


class ProjectRecord(ProjectBase):
    project_id: str
    created_at: datetime
    updated_at: datetime


class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus


class PresignImageRequest(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=120)


class PresignImageResponse(BaseModel):
    key: str
    upload_url: str
    public_url: str


class MetricViewEvent(BaseModel):
    page: str = "/"
    source: str = "website"

