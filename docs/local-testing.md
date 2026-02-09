# Local Testing Guide

## API

```powershell
cd services/api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements-dev.txt
$env:DATA_BACKEND="memory"
$env:DISABLE_AUTH="true"
$env:MEDIA_BUCKET_NAME="mock-media-bucket"
py -m uvicorn app.main:app --reload --port 8000
```

## Public Site

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
npm run dev:site
```

## CMS (Auth disabled for local)

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
$env:NEXT_PUBLIC_ENABLE_AUTH="false"
npm run dev:cms
```

In local mode (`NEXT_PUBLIC_ENABLE_AUTH=false`), image upload in CMS falls back to browser-local preview URLs if S3 presign is unavailable.

## Tests

```powershell
npm run test:site
npm run test:cms

cd services/api
.\.venv\Scripts\Activate.ps1
py -m pytest
```
