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
- Extracted Admin activity history reads into `AdminActivityQueryService`.
- Extracted activity response shaping into `activity.mapper.ts` and removed the untyped Prisma `where` object.
- Kept `ActivityService` as a compatibility facade while `OperationsController` now injects the query service directly.
- Added mapper regression coverage for audit metadata and missing admin identities.
- Split member notification reads/preferences into `NotificationsQueryService`.
- Split notification read/archive/preference mutations into `NotificationsCommandService`.
- Extracted notification labels, currency formatting, preference defaults, channel normalization, and key construction into `notification.mapper.ts`.
- Kept `NotificationsService` as a compatibility facade while `NotificationsController` injects query and command services directly.
- Added regression coverage for notification mapping and preference normalization.
- Split Admin member list/detail reads into `AdminMembersQueryService`.
- Split Admin member status mutation and audit into `AdminMembersCommandService` with one transaction boundary.
- Kept `AdminMembersService` as a compatibility facade while `AdminMembersController` injects query and command services directly.
- Added regression coverage proving Admin member status update and audit execute in the same transaction.
- Split risk summary reads into `RiskSummaryQueryService` and kept `RiskService` as a compatibility facade.
- Added regression coverage for wallet/ledger mismatch classification.
- Extracted report date-range, decimal aggregation, grouped response, and queue-aging mapping into `report.mapper.ts`.
- Removed report helper `any` usage and added precision/aging regression tests.

## Remaining closure scope

R-007 cannot be marked DONE until the following worklist areas have implementation and regression evidence:

- Remaining Admin auth/account lifecycle command-query decomposition beyond Admin member management.
- KYC/watchlist command-query decomposition beyond the risk-summary slice.
- Support command-query decomposition.
- CMS/report query decomposition beyond the finance, activity, risk-summary, and report-mapper slices.
- Shared Prisma-to-domain-to-response mappers for remaining critical domains.
- Shared audit builder and metadata formatter extraction.
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
pnpm --filter @platform/api test -- admin-members-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- risk-summary-query.service.spec.ts --runInBand
pnpm --filter @platform/api test -- report.mapper.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked R-007 worklist items remain. This prevents documentation from claiming completion before the code and regression evidence exist.
