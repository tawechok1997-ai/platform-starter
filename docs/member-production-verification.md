# Member Production Verification

Production URL:

```text
https://platformweb-member-production.up.railway.app
```

The workflow `.github/workflows/member-production-verification.yml` verifies:

1. The Member home page returns HTTP 2xx.
2. `/api/version` returns HTTP 2xx.
3. The version response contains the expected full or 12-character commit SHA.
4. Railway fallback responses such as `Application not found` fail immediately.
5. Evidence is uploaded for 14 days.

## Expected SHA rules

- Pull request: the target branch SHA, representing the production version expected before the PR is merged.
- Push to `main`: the pushed commit SHA, with retries for up to 15 minutes while Railway deploys.
- Manual run: optional `expected_sha` input, otherwise the workflow commit SHA.
- Set the repository variable `MEMBER_PRODUCTION_URL` when Railway generates a replacement domain.

The gate is read-only and does not call Member mutation endpoints.

## Railway Web Member recovery

Use `.github/workflows/railway-web-member-recovery.yml` only for Incident #584 or an equivalent confirmed deployment outage.

The workflow targets the existing Railway identities:

```text
Project:     9a018c35-5d56-4541-a133-2ac7e1d6731c
Environment: d0874330-b90d-4e5e-b265-08411afa6945
Service:     bcd0f4e5-b68b-4b78-bd92-3f0400254f7c
```

### Authentication

Configure exactly one GitHub Actions secret:

- `RAILWAY_PROJECT_TOKEN` for project/environment-scoped deployment operations, or
- `RAILWAY_API_TOKEN` for account/workspace-scoped operations.

Do not configure both. Railway CLI rejects simultaneous project and API token authentication.

### Recovery actions

- `inspect`: read service and deployment state only.
- `redeploy-latest`: redeploy the most recent Railway deployment without uploading new code.
- `deploy-main`: check out `main` and upload the repository root to the existing Web Member service.
- `generate-domain`: request a Railway-provided public domain for the existing service.
- `full-recovery`: redeploy latest, upload `main`, and request a public domain.

Every mutating run requires the `confirm` input. Recovery outputs are uploaded as artifacts for 14 days.

After Railway reports a successful deployment:

1. Set `MEMBER_PRODUCTION_URL` to the active domain when it changed.
2. Re-run Member Production Verification with the expected `main` SHA.
3. Confirm `/` and `/api/version` return HTTP 2xx.
4. Merge the verification PR only after the production gate passes.
