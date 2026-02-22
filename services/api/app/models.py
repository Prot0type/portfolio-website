from __future__ import annotations

from datetime import datetime
import re
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator

ProjectStatus = Literal["draft", "published"]
ProjectCategory = Literal["Personal", "College", "Work", "Freelance"]

DEFAULT_HOME_BIO_MAIN = "IITH graduate with 3+ years of experience and a passion to create."
DEFAULT_HOME_BIO_SECONDARY = "Mi khoop katkat karte."

_SHORT_NAME_PATTERN = re.compile(r"^[A-Za-z0-9 ]+$")
_PROJECT_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def normalize_project_short_name(value: str) -> str:
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        raise ValueError("Project short name is required.")
    if not _SHORT_NAME_PATTERN.fullmatch(cleaned):
        raise ValueError("Project short name can only contain letters, numbers, and spaces.")
    return cleaned


def project_short_name_to_slug(value: str) -> str:
    normalized = normalize_project_short_name(value)
    return "-".join(normalized.lower().split())


class ProjectImage(BaseModel):
    key: str = Field(min_length=1)
    url: str = Field(min_length=1)
    alt: str = ""
    width: Optional[int] = None
    height: Optional[int] = None


class ProjectBase(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    project_short_name: str = Field(
        min_length=1,
        description="Required short name. Allowed characters: letters, numbers, spaces.",
    )
    project_slug: str = Field(default="")
    description: str = Field(min_length=2, max_length=5000)
    tags: List[str] = Field(min_length=1, max_length=20)
    category: ProjectCategory
    project_date: str = Field(description="ISO date string, e.g. 2026-01-20")
    thumbnail: ProjectImage
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

    @field_validator("project_short_name")
    @classmethod
    def normalize_short_name(cls, value: str) -> str:
        return normalize_project_short_name(value)

    @model_validator(mode="after")
    def sync_project_slug(self) -> "ProjectBase":
        self.project_slug = project_short_name_to_slug(self.project_short_name)
        if not _PROJECT_SLUG_PATTERN.fullmatch(self.project_slug):
            raise ValueError("Derived project slug is invalid.")
        return self


class ProjectCreate(ProjectBase):
    project_id: str = Field(default_factory=lambda: str(uuid4()))


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=140)
    project_short_name: Optional[str] = None
    project_slug: Optional[str] = None
    description: Optional[str] = Field(default=None, min_length=2, max_length=5000)
    tags: Optional[List[str]] = None
    category: Optional[ProjectCategory] = None
    project_date: Optional[str] = None
    thumbnail: Optional[ProjectImage] = None
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

    @field_validator("project_short_name")
    @classmethod
    def normalize_optional_short_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return normalize_project_short_name(value)

    @model_validator(mode="after")
    def sync_optional_project_slug(self) -> "ProjectUpdate":
        if self.project_slug is not None and self.project_short_name is None:
            raise ValueError("Project slug cannot be set directly.")
        if self.project_short_name is not None:
            self.project_slug = project_short_name_to_slug(self.project_short_name)
        return self


class ProjectRecord(ProjectBase):
    project_id: str
    created_at: datetime
    updated_at: datetime


class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus


class SiteContentBase(BaseModel):
    bio_main: str = Field(default=DEFAULT_HOME_BIO_MAIN, min_length=2, max_length=240)
    bio_secondary: str = Field(default=DEFAULT_HOME_BIO_SECONDARY, min_length=2, max_length=240)

    @field_validator("bio_main", "bio_secondary")
    @classmethod
    def normalize_bio_line(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned:
            raise ValueError("Bio fields are required.")
        return cleaned


class SiteContentUpdate(SiteContentBase):
    pass


class SiteContentRecord(SiteContentBase):
    updated_at: datetime


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
