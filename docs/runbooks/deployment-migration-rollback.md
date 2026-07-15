# Deployment, Migration, and Rollback Runbook

## Preconditions

- Confirm the approved commit SHA and deployment target.
- Confirm `pnpm db:migrate:status` is clean for the target database before deploying.
- Confirm backups/snapshots exist before running production migrations.
- Do not run `pnpm prisma db push --force-reset` against shared or production databases.

## Deploy

1. Build and test the approved commit in CI.
2. Run `pnpm db:generate`.
3. Run `pnpm db:migrate` against staging first.
4. Run smoke checks for API, Admin, and Member.
5. Promote the same commit to production after approval.

## Migration verification

1. Run `pnpm db:migrate:status` and capture output.
2. Verify app health/version endpoints match the approved commit.
3. Run domain smoke checks for auth, finance read paths, KYC reads, support reads, and provider health checks where credentials exist.

## Rollback

1. Stop new deployments and freeze money/provider operations if the incident affects balances or settlement.
2. Roll application code back to the last approved commit.
3. Do not reverse a database migration manually unless an approved down/forward-fix plan exists.
4. Prefer forward-fix migrations for already-applied production schema changes.
5. Re-run health/version and domain smoke checks before unfreezing operations.

## Evidence to attach

- Commit SHA.
- Migration status output.
- Deployment URL/version output.
- Smoke-test output.
- Incident or change ticket link.
