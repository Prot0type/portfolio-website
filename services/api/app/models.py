from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator

ProjectStatus = Literal["draft", "published"]
ProjectCategory = Literal["Personal", "College", "Work", "Freelance"]


class ProjectImage(BaseModel):
    key: str = Field(min_length=1)
    url: str = Field(min_length=1)
    alt: str = ""
    width: Optional[int] = None
    height: Optional[int] = None


class ProjectBase(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=2, max_length=5000)
    tags: List[str] = Field(min_length=1, max_length=20)
    category: ProjectCategory
    project_date: str = Field(description="ISO date string, e.g. 2026-01-20")
    images: List[ProjectImage] = Field(default_factory=list)
    is_highlighted: bool = False
    status: ProjectStatus = "draft"
    sort_order: int = 0
    extra: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: List[str]) -> List[str]:
        cleaned = [tag.strip() for tag in value if tag and tag.strip()]
        if not cleaned:
            raise ValueError("At least one tag is required. The first tag is the primary tag.")
        return cleaned


class ProjectCreate(ProjectBase):
    project_id: str = Field(default_factory=lambda: str(uuid4()))


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=140)
    description: Optional[str] = Field(default=None, min_length=2, max_length=5000)
    tags: Optional[List[str]] = None
    category: Optional[ProjectCategory] = None
    project_date: Optional[str] = None
    images: Optional[List[ProjectImage]] = None
    is_highlighted: Optional[bool] = None
    status: Optional[ProjectStatus] = None
    sort_order: Optional[int] = None
    extra: Optional[Dict[str, Any]] = None

    @field_validator("tags")
    @classmethod
    def normalize_optional_tags(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return value
        cleaned = [tag.strip() for tag in value if tag and tag.strip()]
        if not cleaned:
            raise ValueError("At least one tag is required. The first tag is the primary tag.")
        return cleaned


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
