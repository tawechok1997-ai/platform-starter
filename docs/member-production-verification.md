# Member Production Verification

Production URL:

```text
https://platformweb-member-production-26b4.up.railway.app
```

The workflow `.github/workflows/member-production-verification.yml` verifies:

1. The Member home page returns HTTP 2xx.
2. `/api/version` returns HTTP 2xx.
3. The JSON `commit` field matches the expected full or 12-character commit SHA.
4. Railway fallback responses such as `Application not found` fail immediately.
5. Evidence is uploaded for 14 days.

## Expected SHA rules

- Pull request: the target branch SHA, representing the production version expected before the PR is merged.
- Push to `main`: the pushed commit SHA, with retries for up to 15 minutes while Railway deploys.
- Manual run: optional `expected_sha` input, otherwise the workflow commit SHA.
- Manual SHA values must contain exactly 12 or 40 hexadecimal characters.
- Set the repository variable `MEMBER_PRODUCTION_URL` when Railway generates a replacement domain.
- Production URL overrides must use HTTPS.

The gate is read-only and does not call Member mutation endpoints.

## Pull-request enforcement

A pull request that changes `apps/web-member/**` must pass production verification. A pull request that changes only verification or recovery tooling still records the production outage and uploads evidence, but the known outage does not block adoption of the tooling required to repair it.

This exception applies only to workflow-only changes. It does not weaken the production gate for Member application changes, pushes to `main`, or manual verification runs.

## Railway Web Member recovery

Use `.github/workflows/railway-web-member-recovery.yml` only for Incident #584 or an equivalent confirmed deployment outage.

The workflow targets the existing Railway identities:

```text
Project:     9a018c35-5d56-4541-a133-2ac7e1d6731c
Environment: d0874330-b90d-4e5e-b265-08411afa6945
Service:     bcd0f4e5-b68b-4b78-bd92-3f0400254f7c
```

Railway CLI is pinned to `4.65.0`; do not replace it with a mutable `latest` image without reviewing the new CLI behavior and updating the workflow contracts.

### Authentication

Configure exactly one GitHub Actions secret:

- `RAILWAY_PROJECT_TOKEN` for project/environment-scoped deployment operations, or
- `RAILWAY_API_TOKEN` for account/workspace-scoped operations.

Do not configure both. Railway CLI rejects simultaneous project and API token authentication. Secret values are exposed only to the authentication step before the selected variable is written to the job environment for Railway commands.

### Recovery actions

- `inspect`: read service and deployment state only; `confirm` may remain false.
- `redeploy-latest`: redeploy the most recent Railway deployment without uploading new code.
- `deploy-main`: check out `main`, resolve its real 40-character commit SHA, and upload that source to the existing Web Member service.
- `generate-domain`: request a Railway-provided public domain for the existing service.
- `full-recovery`: upload checked-out `main`, then request a public domain. It intentionally does not also redeploy the previous deployment because two overlapping deployments can race and obscure which source became active.

Every mutating run requires `confirm=true`. Recovery outputs are uploaded as artifacts for 14 days.

## Bootstrap and recovery order

A newly added `workflow_dispatch` workflow must be available from the default branch before it can be relied on as the production recovery path. For the current outage:

1. Review and merge the workflow-only tooling PR after repository CI and workflow contracts pass.
2. Add exactly one Railway token secret.
3. Run the recovery workflow from `main` with action `inspect` first.
4. Choose the smallest required mutation:
   - `generate-domain` when the service is healthy and only routing is missing.
   - `redeploy-latest` when the latest known source is correct but the deployment needs rebuilding.
   - `deploy-main` when the service must receive the current `main` source.
   - `full-recovery` only when both a fresh `main` upload and Railway domain generation are required.
5. Wait for Railway to report a successful deployment.
6. Set `MEMBER_PRODUCTION_URL` when the active domain changed.
7. Run Member Production Verification with the expected `main` SHA.
8. Confirm `/` and `/api/version` return HTTP 2xx and the explicit `commit` field matches.
9. Close Incident #584 after production evidence passes.

The recovery workflow does not alter Wallet, Provider, database schema, production records, or Docker volumes. It targets only the existing Web Member Railway service and its deployment/domain state.
