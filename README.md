# Portfolio Website (AWS + CDK + FastAPI + Next.js)

This repository contains a production-ready baseline for a personal portfolio platform with:

- Public portfolio web app (desktop + mobile)
- CMS web app for admin content management
- FastAPI backend on AWS Lambda
- DynamoDB for project data
- S3 for static hosting and media objects
- CloudFront for global delivery and `/api/*` routing
- Cognito authentication for CMS admin access
- CloudWatch metrics, dashboard, and alarms
- GitHub Actions for CI/CD (staging auto, prod manual promote)

## Architecture

- `apps/site`: public portfolio app (Next.js static export)
- `apps/cms`: admin CMS app (Next.js static export + Cognito)
- `services/api`: FastAPI app for project CRUD, image upload URLs, metrics
- `infra/cdk`: AWS CDK (Python) infrastructure for staging/prod

## Prerequisites

- Node.js 20+
- Python 3.12+
- AWS CLI configured
- AWS CDK CLI installed (`npm i -g aws-cdk`)

## Local Development

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Create Python virtual env for API:

   ```bash
   cd services/api
   python -m venv .venv
   . .venv/Scripts/activate
   pip install -r requirements-dev.txt
   ```

3. Run API locally (auth disabled, in-memory storage):

   ```bash
   set DATA_BACKEND=memory
   set DISABLE_AUTH=true
   uvicorn app.main:app --reload --port 8000
   ```

4. In a second terminal, run public site:

   ```bash
   set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   npm run dev:site
   ```

5. In a third terminal, run CMS:

   ```bash
   set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   set NEXT_PUBLIC_ENABLE_AUTH=false
   npm run dev:cms
   ```

## Testing

- Frontend unit tests:

  ```bash
  npm run test:site
  npm run test:cms
  ```

- Backend tests:

  ```bash
  cd services/api
  . .venv/Scripts/activate
  pytest
  ```

## Deploy Infra (Temporary Endpoints)

1. Install CDK Python dependencies:

   ```bash
   cd infra/cdk
   python -m venv .venv
   . .venv/Scripts/activate
   pip install -r requirements.txt
   ```

2. Bootstrap account/region once:

   ```bash
   cdk bootstrap aws://ACCOUNT_ID/us-west-2
   ```

3. Build frontends:

   ```bash
   cd ../..
   npm run build:site
   npm run build:cms
   ```

4. Deploy staging:

   ```bash
   cd infra/cdk
   cdk deploy PortfolioStaging --context environment=staging --require-approval never
   ```

5. Deploy prod:

   ```bash
   cdk deploy PortfolioProd --context environment=prod --require-approval never
   ```

After deploy, stack outputs include:

- CloudFront temp domains for site/CMS
- API endpoint
- Bucket names and distribution IDs for content publish
- Cognito User Pool and Client IDs

## Custom Domains Later

When DNS is ready, set `customDomain.enabled=true` for each environment in:

- `infra/cdk/config/environments.json`

Then provide:

- Route53 hosted zone ID/name
- ACM certificate ARN in `us-east-1` that covers:
  - `ishanichuri.com`
  - `staging.ishanichuri.com`
  - `cms.ishanichuri.com`
  - `cms-staging.ishanichuri.com`

Redeploy the stack to attach aliases and Route53 records.

## CI/CD

- `.github/workflows/ci.yml`: lint + test + build checks
- `.github/workflows/deploy-staging.yml`: auto deploy on `main`
- `.github/workflows/deploy-prod.yml`: manual promotion from selected ref

Set repo variables/secrets listed in `docs/cicd.md`.
