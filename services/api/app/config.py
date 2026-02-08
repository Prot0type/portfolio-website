from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "portfolio-api"
    aws_region: str = "us-west-2"
    data_backend: str = "dynamodb"

    table_name: str = "portfolio-projects"
    media_bucket_name: str = ""
    media_base_url: str = "/media"

    cognito_region: str = "us-west-2"
    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""
    disable_auth: bool = False

    cors_allow_origins: str = "http://localhost:3000,http://localhost:3001"

    metric_namespace: str = "PortfolioWebsite"
    view_metric_name: str = "WebsiteViews"
    deployment_env: str = "local"

    @field_validator("data_backend")
    @classmethod
    def validate_backend(cls, value: str) -> str:
        normalized = value.lower().strip()
        if normalized not in {"memory", "dynamodb"}:
            raise ValueError("DATA_BACKEND must be memory or dynamodb")
        return normalized

    def parsed_cors_origins(self) -> List[str]:
        return [entry.strip() for entry in self.cors_allow_origins.split(",") if entry.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
