# Local Testing Guide

## API

```bash
cd services/api
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements-dev.txt
set DATA_BACKEND=memory
set DISABLE_AUTH=true
uvicorn app.main:app --reload --port 8000
```

## Public Site

```bash
set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev:site
```

## CMS (Auth disabled for local)

```bash
set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
set NEXT_PUBLIC_ENABLE_AUTH=false
npm run dev:cms
```

## Tests

```bash
npm run test:site
npm run test:cms

cd services/api
. .venv/Scripts/activate
pytest
```

