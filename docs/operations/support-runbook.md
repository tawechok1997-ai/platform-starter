# Support Runbook

เอกสารนี้เป็นคู่มือรับช่วง ดูแล และตรวจระบบ `platform-starter` สำหรับงานประจำวันและเหตุขัดข้องเบื้องต้น

## Runtime baseline

- Node.js: `22.x`
- pnpm: `11.13.0`
- Database: PostgreSQL
- Package manager must match the root `packageManager` field

## Daily verification

Run the smallest relevant scope first:

```bash
pnpm check:runtime
pnpm check:quick
```

Before merging or deploying a broad change:

```bash
pnpm check:full
```

For browser-facing changes:

```bash
pnpm test:e2e:smoke
pnpm test:e2e:a11y
pnpm test:e2e:visual
```

## Deployment order

1. Confirm required environment variables.
2. Generate Prisma client.
3. Apply approved migrations.
4. Deploy API.
5. Verify API health/version.
6. Deploy Admin Web and Member Web.
7. Run deployed smoke checks.
8. Record the deployed commit SHA.

Recommended commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Never run destructive Prisma reset commands against production.

## Incident triage

### API failure

1. Check health/version endpoints.
2. Confirm `DATABASE_URL`, secrets and storage settings.
3. Check migration status.
4. Review structured logs and metrics without copying secrets into issues.
5. Roll back only to a known compatible application/database pair.

### Admin or Member Web failure

1. Confirm the deployed commit SHA.
2. Confirm `NEXT_PUBLIC_API_URL` points to the approved API.
3. Run the matching local build command.
4. Check browser console and failed network requests.
5. Verify authentication cookies, CSRF origin and API response shape.

### Finance workflow failure

1. Stop manual retries until idempotency state is known.
2. Inspect transaction, ledger and audit timeline together.
3. Confirm claim owner and state transition.
4. Reconcile provider reference, internal reference and wallet ledger.
5. Never repair balances with direct database edits without an approved reconciliation record.

## CI alert policy

- CI failures on pull requests belong in the PR checks and summary.
- Repository issues are reserved for failures on `main` that remain unresolved.
- Repeated failures must update one existing issue instead of creating duplicates.
- A successful later run must close the matching alert automatically.
- Temporary verification branches must not create repository issues.

## Escalation boundaries

The following require approved credentials or production/vendor access and remain P6 work:

- authenticated deployed browser regression
- production migration and rollback evidence
- real provider credentials, callback registration and IP whitelist
- provider-specific UAT
- production storage retention approval

## Handover checklist

- [ ] Current commit and deployment identity recorded
- [ ] API, Admin and Member status checked
- [ ] Migration status checked
- [ ] Open CI and production incidents reviewed
- [ ] Environment changes documented without secret values
- [ ] Rollback target identified
- [ ] P6 blockers recorded in `docs/master-project-worklist.md`
