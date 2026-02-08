from __future__ import annotations

import re
from uuid import uuid4

import boto3


def _safe_file_name(file_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "-", file_name).strip("-")


def build_media_key(file_name: str) -> str:
    safe = _safe_file_name(file_name)
    return f"projects/{uuid4()}-{safe}"


def create_presigned_upload_url(
    *,
    bucket_name: str,
    region_name: str,
    key: str,
    content_type: str,
    expires_in: int = 900,
) -> str:
    s3_client = boto3.client("s3", region_name=region_name)
    return s3_client.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket_name, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )

