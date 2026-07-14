# R-007 Backend Service Decomposition

Status: **PARTIAL — NOT CLOSABLE YET**

Updated: **2026-07-14**

## Completed evidence

- Added automated inventories for oversized backend services and legacy Admin audit writers.
- Defined controller/service decomposition thresholds and migration rules.
- Split finance, reports, activity, notifications, Admin member lifecycle, risk summary, and support into focused query/command services with compatibility facades where needed.
- Extracted shared finance, report, activity, notification, support, Admin session, KYC, and watchlist response mappers with focused regression coverage.
- Added shared `admin-audit.builder.ts` and migrated Admin member, support, Admin session, KYC review/download, and watchlist command audit payloads to it.
- Split Admin session listing and revocation/logout mutations into dedicated query/command services; session mutation and audit share transaction boundaries.
- Split KYC reads, member upload/submit commands, Admin review commands, secure access-token/download orchestration, and retention cleanup into dedicated services.
- `KycDocumentsService` is now a compatibility facade; `AdminKycController` routes reads, reviews, secure access, and retention cleanup directly to their focused services.
- KYC secure downloads bind tokens to the issuing Admin, validate HMAC signatures and expiry, and write download audits through the shared builder.
- KYC retention cleanup now updates database state only after storage deletion succeeds and reports storage failures without falsely marking documents deleted.
- Added focused KYC access tests for Admin binding, tamper rejection, and audit shape plus retention tests for successful and failed storage deletion.
- Split watchlist list/match and create/release operations into dedicated query/command services with optimistic locking, shared audit building, and regression coverage.
- Searched the repository for concrete CSV consumers; none are currently present, so serializer work remains blocked on a real endpoint instead of adding unused infrastructure.

## Remaining closure scope

R-007 cannot be marked DONE until the following areas have implementation and regression evidence:

- Remaining Admin auth/2FA/token lifecycle decomposition beyond Admin member and session services.
- CMS decomposition beyond existing report slices.
- Shared Prisma-to-domain-to-response mappers for remaining critical domains.
- Migrate remaining audit writers identified by `pnpm audit:admin-audit-writers` to the shared builder and extract metadata formatters.
- CSV/report serializer extraction when a concrete CSV endpoint or consumer exists.
- Provider orchestration extraction.
- Settlement orchestration extraction.
- Constructor dependency reduction for every inventory violation.
- Focused regression tests for each remaining extracted handler/service.

## Verification commands

```bash
pnpm audit:backend-decomposition
pnpm audit:admin-audit-writers
pnpm audit:admin-audit-writers:strict
pnpm audit:r7-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- kyc-access.service.spec.ts --runInBand
pnpm --filter @platform/api test -- kyc-retention.service.spec.ts --runInBand
pnpm --filter @platform/api test -- kyc-member-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- kyc-review-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- risk-watchlist-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked R-007 worklist items remain. The audit-writer search must be run in a workspace because GitHub code search returned no indexed matches during this change.
