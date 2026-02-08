# Custom Domain Activation

You can deploy now with temporary CloudFront domains. When your domain is ready, follow this:

## 1. Create ACM certificate in `us-east-1`

Requested names:

- `ishanichuri.com`
- `staging.ishanichuri.com`
- `cms.ishanichuri.com`
- `cms-staging.ishanichuri.com`

Use DNS validation.

## 2. Update environment config

Edit `infra/cdk/config/environments.json`:

- Set `customDomain.enabled` to `true` for both `staging` and `prod`
- Fill:
  - `customDomain.hostedZoneId`
  - `customDomain.hostedZoneName`
  - `customDomain.certificateArn` (from `us-east-1` ACM)

## 3. Redeploy stacks

```bash
cd infra/cdk
cdk deploy PortfolioStaging --context environment=staging --require-approval never
cdk deploy PortfolioProd --context environment=prod --require-approval never
```

This adds Route53 alias records pointing each domain to its CloudFront distribution.

