# R-007 Backend Service Decomposition

Status: **PARTIAL — NOT CLOSABLE YET**

Updated: **2026-07-14**

## Completed evidence

- Added an automated inventory for oversized controllers/services, constructor dependencies, and public method counts.
- Defined controller/service decomposition thresholds and migration rules.
- Split finance summary/report reads into dedicated query services and extracted response/decimal mappers with regression tests.
- Split Admin activity history into `AdminActivityQueryService` and extracted activity response mapping.
- Split notifications into query/command services and extracted notification mapping/normalization helpers with tests.
- Split Admin member list/detail reads and status commands; status mutation plus audit remain in one transaction.
- Split risk summary reads into `RiskSummaryQueryService` with wallet/ledger mismatch regression coverage.
- Extracted report mapping/decimal/date-range helpers and added precision/aging regression tests.
- Split the remaining reports read orchestration into `ReportsQueryService`; `ReportsController` now injects it directly while `ReportsService` remains a compatibility facade.
- Added shared `admin-audit.builder.ts`, migrated Admin member lifecycle audit payload construction to it, and added focused regression coverage.

## Remaining closure scope

R-007 cannot be marked DONE until the following areas have implementation and regression evidence:

- Remaining Admin auth/account lifecycle command-query decomposition beyond Admin member management.
- KYC/watchlist command-query decomposition beyond the risk-summary slice.
- Support command-query decomposition.
- CMS decomposition beyond existing report slices.
- Shared Prisma-to-domain-to-response mappers for remaining critical domains.
- Migrate remaining audit writers to the shared builder and extract metadata formatters.
- CSV/report serializer extraction once concrete CSV consumers are identified.
- Provider orchestration extraction.
- Settlement orchestration extraction.
- Constructor dependency reduction for every inventory violation.
- Focused regression tests for each remaining extracted handler/service.

## Verification commands

```bash
pnpm audit:backend-decomposition
pnpm audit:r7-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- admin-audit.builder.spec.ts --runInBand
pnpm --filter @platform/api test -- report.mapper.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked R-007 worklist items remain. This prevents documentation from claiming completion before the code and regression evidence exist.
