# CI/CD Configuration

## Required GitHub Secrets

Set these in repository settings:

- `AWS_STAGING_DEPLOY_ROLE_ARN`: IAM role for staging deployment workflow
- `AWS_PROD_DEPLOY_ROLE_ARN`: IAM role for production deployment workflow

Both roles should trust GitHub OIDC and allow:

- CloudFormation/CDK deploy actions
- Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito, CloudWatch, IAM pass-role related permissions

## Deployment Behavior

- Push to `main`:
  - Deploys `PortfolioStaging` stack
  - Builds site/CMS
  - Uploads static artifacts to S3
  - Invalidates staging CloudFront distributions

- Manual production workflow:
  - Select branch/tag/SHA
  - Confirm with `DEPLOY`
  - Deploys `PortfolioProd`
  - Builds and uploads artifacts
  - Invalidates production CloudFront distributions

## Promotion Model

1. Merge to `main` to test changes on staging.
2. Trigger `Deploy Production` workflow with the exact staging-tested ref.
3. Use GitHub environment protection rules for extra manual approval.

