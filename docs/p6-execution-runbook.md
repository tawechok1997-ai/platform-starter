# P6 External Verification Runbook

## Purpose

P6 verifies the deployed system, production-like data paths and vendor integrations. It does not introduce new repository implementation unless a verification failure exposes a defect.

## Required GitHub secrets

| Secret | Purpose |
|---|---|
| `SEED_MEMBER_WEB_URL` | HTTPS URL of the seeded Member deployment |
| `SEED_ADMIN_WEB_URL` | HTTPS URL of the seeded Admin deployment |
| `SEED_API_URL` | HTTPS URL of the matching API deployment |
| `APPROVED_DEPLOY_COMMIT` | Commit SHA expected from the deployed health/version response |
| `SEED_MEMBER_USERNAME` / `SEED_MEMBER_EMAIL` / `SEED_MEMBER_PHONE` | Member login identifier; at least one is required |
| `SEED_MEMBER_PASSWORD` | Seeded Member password |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_EMAIL` | Admin login identifier; at least one is required |
| `SEED_ADMIN_PASSWORD` | Seeded Admin password |

Never use an owner account or real customer account for automated browser regression. Use resettable, non-production seeded accounts with synthetic data.

## First execution

1. Confirm Member, Admin and API deployments are from the same approved commit.
2. Add the required GitHub Actions secrets.
3. Open Actions and run `P6 Authenticated Deployed Regression`.
4. Leave URL inputs blank to use repository secrets, or provide temporary HTTPS URLs as workflow inputs.
5. Review the endpoint preflight before browser execution.
6. Download the `p6-authenticated-regression-*` artifact.
7. Record the run URL, commit SHA, environment and outcome in P6 evidence.

## Evidence required to close initial P6 prerequisites

- Successful HTTPS preflight for Member, Admin and API.
- API health/version payload matching the approved commit.
- Successful Member login using the seeded account.
- Successful Admin login using the seeded account.
- Desktop and mobile screenshots.
- Playwright trace, video and HTML report.
- No secret values printed in logs or artifacts.

## Execution order

### Phase 1: Environment and identity

- Seeded Member/Admin credentials.
- Deployed Member/Admin/API URLs.
- Approved commit/version verification.
- Login, refresh, logout and session rotation regression.
- Read-only role and mutation-boundary regression.

### Phase 2: Product workflows

- Deposit and withdrawal end-to-end regression.
- Duplicate, retry and failure behavior.
- Notifications optimistic rollback.
- Support, CMS and Reports regression.
- KYC and risk regression.
- Six-viewport authenticated visual regression.

### Phase 3: Production readiness

- Reverse-proxy behavior.
- Anti-bot failure/fallback.
- Migration and rollback verification.
- Production index/query evidence.
- Aggregate/cache workload verification.
- Storage retention and malware-scan policy approval.

### Phase 4: Vendor UAT

- Endpoint and credentials.
- Signature and error contract.
- IP whitelist and callback requirements.
- Reconciliation regression.
- Provider-specific anti-bot validation.
- Final UAT sign-off before enabling real money.

## Failure handling

A failed verification is not closed by changing the checklist. Capture the failing request, response status, browser trace, affected commit and environment. Fix the underlying defect in a separate commit, redeploy the same environment and rerun the relevant P6 scenario.
