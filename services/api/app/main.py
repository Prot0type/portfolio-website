from __future__ import annotations

from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.auth import optional_claims, require_admin
from app.config import Settings, get_settings
from app.media import build_media_key, create_presigned_upload_url
from app.metrics import put_view_metric
from app.models import (
    MetricViewEvent,
    PresignImageRequest,
    PresignImageResponse,
    ProjectCreate,
    ProjectRecord,
    ProjectStatus,
    ProjectStatusUpdate,
    ProjectUpdate,
)
from app.repository import DynamoProjectRepository, MemoryProjectRepository, ProjectRepository


def build_repository(settings: Settings) -> ProjectRepository:
    if settings.data_backend == "memory":
        return MemoryProjectRepository()
    return DynamoProjectRepository(table_name=settings.table_name, region_name=settings.aws_region)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title=settings.app_name)
    app.state.settings = settings
    app.state.repo = build_repository(settings)

    origins = settings.parsed_cors_origins()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "service": settings.app_name}

    def get_repo(request: Request) -> ProjectRepository:
        return request.app.state.repo

    def is_authorized(claims: Optional[dict]) -> bool:
        return claims is not None

    @app.get("/api/projects", response_model=list[ProjectRecord])
    def list_projects(
        status_filter: Literal["published", "draft", "all"] = "published",
        claims: Optional[dict] = Depends(optional_claims),
        repo: ProjectRepository = Depends(get_repo),
    ) -> list[ProjectRecord]:
        if status_filter in {"draft", "all"} and not is_authorized(claims):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Auth required")

        if status_filter == "all":
            return repo.list_projects(status=None)
        project_status: ProjectStatus = "draft" if status_filter == "draft" else "published"
        return repo.list_projects(status=project_status)

    @app.get("/api/projects/{project_id}", response_model=ProjectRecord)
    def get_project(
        project_id: str,
        claims: Optional[dict] = Depends(optional_claims),
        repo: ProjectRepository = Depends(get_repo),
    ) -> ProjectRecord:
        project = repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.status == "draft" and not is_authorized(claims):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    @app.post("/api/projects", response_model=ProjectRecord, status_code=status.HTTP_201_CREATED)
    def create_project(
        payload: ProjectCreate,
        _: dict = Depends(require_admin),
        repo: ProjectRepository = Depends(get_repo),
    ) -> ProjectRecord:
        return repo.create_project(payload)

    @app.put("/api/projects/{project_id}", response_model=ProjectRecord)
    def update_project(
        project_id: str,
        payload: ProjectUpdate,
        _: dict = Depends(require_admin),
        repo: ProjectRepository = Depends(get_repo),
    ) -> ProjectRecord:
        updated = repo.update_project(project_id=project_id, payload=payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return updated

    @app.post("/api/projects/{project_id}/status", response_model=ProjectRecord)
    def update_project_status(
        project_id: str,
        payload: ProjectStatusUpdate,
        _: dict = Depends(require_admin),
        repo: ProjectRepository = Depends(get_repo),
    ) -> ProjectRecord:
        updated = repo.update_project(project_id=project_id, payload=ProjectUpdate(status=payload.status))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return updated

    @app.delete(
        "/api/projects/{project_id}",
        status_code=status.HTTP_204_NO_CONTENT,
        response_class=Response,
    )
    def delete_project(
        project_id: str,
        _: dict = Depends(require_admin),
        repo: ProjectRepository = Depends(get_repo),
    ) -> Response:
        deleted = repo.delete_project(project_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.post("/api/images/presign", response_model=PresignImageResponse)
    def presign_upload(
        payload: PresignImageRequest,
        _: dict = Depends(require_admin),
    ) -> PresignImageResponse:
        if not settings.media_bucket_name:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Media bucket missing")

        key = build_media_key(payload.file_name)
        upload_url = create_presigned_upload_url(
            bucket_name=settings.media_bucket_name,
            region_name=settings.aws_region,
            key=key,
            content_type=payload.content_type,
        )
        base = settings.media_base_url.rstrip("/")
        public_url = f"{base}/{key}" if base else f"/media/{key}"
        return PresignImageResponse(key=key, upload_url=upload_url, public_url=public_url)

    @app.post("/api/metrics/view", status_code=status.HTTP_202_ACCEPTED)
    def record_view(payload: MetricViewEvent) -> dict:
        try:
            put_view_metric(
                region_name=settings.aws_region,
                namespace=settings.metric_namespace,
                metric_name=settings.view_metric_name,
                environment=settings.deployment_env,
                source=payload.source,
            )
        except Exception:
            return {"accepted": False}
        return {"accepted": True}

    return app


app = create_app()
handler = Mangum(app)
