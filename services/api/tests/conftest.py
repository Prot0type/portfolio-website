import os

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_app


@pytest.fixture(scope="session", autouse=True)
def test_environment():
    os.environ["DATA_BACKEND"] = "memory"
    os.environ["DISABLE_AUTH"] = "true"
    os.environ["AWS_REGION"] = "us-west-2"
    os.environ["MEDIA_BUCKET_NAME"] = "mock-media-bucket"
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client

