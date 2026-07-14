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
- Split member/admin support reads into `SupportQueryService` and support mutations into `SupportCommandService`.
- `SupportController` now injects query and command services directly; `SupportService` remains a compatibility facade only.
- Extracted support metadata, public attachment shaping, and ticket response mapping into `support-ticket.mapper.ts`.
- Migrated Support Admin audit payloads to the shared audit builder.
- Added regression coverage for member reply reopen behavior, attachment ownership enforcement, Admin reply audit shape, deleted attachments, and private storage-key suppression.
- Split Admin session listing into `AdminSessionsQueryService` and extracted active/current response logic into `admin-session.mapper.ts`.
- Split Admin logout, single-session revoke, revoke-others, and revoke-all mutations into `AdminSessionCommandService`.
- Admin session mutations now write the matching audit record inside the same transaction using the shared audit builder.
- Added regression coverage for session ownership rejection, current/other-session action selection, transaction usage, and revoked-count audit metadata.
- Added `audit-admin-audit-writers.mjs` plus normal and strict package scripts to inventory legacy `adminAuditLog.create` writers that have not migrated to the shared builder.
- Split member/Admin KYC reads into `KycDocumentsQueryService`; both KYC controllers now route read endpoints directly to the query service.
- Extracted KYC case/document response shaping into `kyc.mapper.ts` and added focused mapping regression tests.
- Split member KYC upload/submit mutations into `KycMemberCommandService` while preserving storage rollback and serializable submission boundaries.
- Split Admin KYC case/document reviews into `KycReviewCommandService`; review mutation and audit now share one transaction and use the shared audit builder.
- Added focused KYC command coverage for required-document submission, stale review versions, transaction usage, and audit shape.
- Split watchlist list/match reads into `RiskWatchlistQueryService`; `RiskWatchlistController` routes reads directly to the query service.
- Extracted watchlist response and match-result shaping into `risk-watchlist.mapper.ts` with blacklist/empty-result regression coverage.
- Split watchlist create/release mutations into `RiskWatchlistCommandService`; both operations now write audit records through the shared builder inside their transaction boundaries.
- Added focused watchlist command coverage for optimistic-version rejection, release transaction usage, and audit shape.
- Searched the repository for concrete CSV consumers; none are currently present, so serializer work remains blocked on a real endpoint instead of adding unused infrastructure.

## Remaining closure scope

R-007 cannot be marked DONE until the following areas have implementation and regression evidence:

- Remaining Admin auth/account lifecycle decomposition beyond Admin member management and session query/commands.
- Remaining KYC access-token/download and retention-cleanup orchestration extraction.
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
pnpm --filter @platform/api test -- kyc-member-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- kyc-review-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- risk-watchlist-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- kyc.mapper.spec.ts --runInBand
pnpm --filter @platform/api test -- risk-watchlist.mapper.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked R-007 worklist items remain. This prevents documentation from claiming completion before the code and regression evidence exist.
