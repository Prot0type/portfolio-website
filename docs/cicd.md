# CI/CD Configuration

## Required GitHub Secrets

Set these in GitHub Actions secrets (repo-level or environment-level). If using environment-level secrets, the workflow job must declare the matching environment.

- `AWS_STAGING_DEPLOY_ROLE_ARN`: IAM role for staging deployment workflow
- `AWS_PROD_DEPLOY_ROLE_ARN`: IAM role for production deployment workflow

Both roles should trust GitHub OIDC and allow:

- CloudFormation/CDK deploy actions
- Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito, CloudWatch, IAM pass-role related permissions

## Deployment Behavior

- Push to `dev`:
  - Deploys `PortfolioStaging` stack
  - Builds site/CMS
  - Uploads static artifacts to S3
  - Invalidates staging CloudFront distributions
  - Uses GitHub Environment: `development` (for approvals/branch rules/environment secrets)

- Manual staging workflow:
  - Can also be triggered via `workflow_dispatch` on `Deploy Staging`
  - Useful for re-deploying staging without a new commit

- Push to `main`:
  - Runs CI validation (lint/test/build)
  - Does not automatically deploy staging (after branch strategy update)

- Manual production workflow:
  - Select branch/tag/SHA
  - Confirm with `DEPLOY`
  - Deploys `PortfolioProd`
  - Builds and uploads artifacts
  - Invalidates production CloudFront distributions
  - Uses GitHub Environment: `production`

## Promotion Model

1. Push/merge to `dev` to test changes on staging.
2. Merge the staging-tested ref into `main` (or choose the same SHA directly).
3. Trigger `Deploy Production` workflow with the exact staging-tested ref.
4. Use GitHub environment protection rules for extra manual approval.
