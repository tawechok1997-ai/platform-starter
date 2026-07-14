# R-007 Backend Service Decomposition

Status: **PARTIAL — NOT CLOSABLE YET**

Updated: **2026-07-14**

## Completed evidence

- Added an automated inventory for oversized controllers/services, constructor dependencies, and public method counts.
- Defined controller/service decomposition thresholds and migration rules.
- Extracted finance response mapping and decimal aggregation from `FinanceService`.
- Added regression tests for finance request mapping and decimal arithmetic.
- Split finance summary and report reads into dedicated query services.
- Kept a temporary `FinanceService` compatibility facade so existing consumers can migrate without a flag day.
- Registered the new query services in `FinanceModule` and injected them directly into `FinanceController`.

## Remaining closure scope

R-007 cannot be marked DONE until the following worklist areas have implementation and regression evidence:

- Admin lifecycle/auth command-query decomposition.
- KYC/watchlist command-query decomposition.
- Support/notifications command-query decomposition.
- CMS/reports command-query decomposition beyond the finance report slice.
- Shared Prisma-to-domain-to-response mappers for remaining critical domains.
- Shared audit builder and metadata formatter extraction.
- CSV/report serializer extraction.
- Provider orchestration extraction.
- Settlement orchestration extraction.
- Constructor dependency reduction for every inventory violation.
- Focused regression tests for each extracted handler/service.

## Verification commands

```bash
pnpm audit:backend-decomposition
pnpm audit:r7-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked R-007 worklist items remain. This prevents documentation from claiming completion before the code and regression evidence exist.
