# R-014 Dead Code Removal Evidence

Date: 2026-07-15

## Scope removed

This evidence records the complete R-014 cleanup sequence. Passes 1-10 close the actionable dead-code cleanup inventory while retaining explicitly documented API/template artifacts with reasons.

### Pass 1: empty user/wallet placeholders

- `apps/api/src/modules/users/users.module.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/wallets/wallets.module.ts`
- `apps/api/src/modules/wallets/wallets.service.ts`

Why this was safe:

- `UsersModule` was an empty module; its only active reference was the import/imports entry in `apps/api/src/app.module.ts`.
- `UsersService` contained placeholder methods returning `null` or no value and was not injected anywhere.
- `WalletsModule` and `WalletsService` had no references outside their own files.
- The real wallet implementation remains in `apps/api/src/modules/wallet`, which is still imported by `AppModule`.

### Pass 2: empty/unreferenced placeholder modules and DTO

- `apps/api/src/modules/callbacks/callbacks.module.ts`
- `apps/api/src/modules/callbacks/guards/provider-ip.guard.ts`
- `apps/api/src/modules/callbacks/guards/provider-signature.guard.ts`
- `apps/api/src/modules/admin-queue/admin-queue.module.ts`
- `apps/api/src/modules/deposits/deposits.module.ts`
- `apps/api/src/modules/idempotency/idempotency.module.ts`
- `apps/api/src/modules/locks/locks.module.ts`
- `apps/api/src/modules/providers/providers.module.ts`
- `apps/api/src/modules/providers/adapters/provider-adapter.interface.ts`
- `apps/api/src/modules/topups/dto/review-top-up-request.dto.ts`

Why this was safe:

- The removed modules/classes/interfaces were not referenced by `apps/api/src`, `package.json`, or `tools` after exact-name search.
- The provider implementation used by the application is under `apps/api/src/modules/game-platform`, not the removed placeholder `apps/api/src/modules/providers` folder.
- The active top-up review workflow uses the existing top-up workflow/controller DTOs and did not reference `ReviewTopUpRequestDto`.

## Verification commands

- `rg -n "UsersModule|UsersService|modules/users|WalletsModule|WalletsService|modules/wallets" apps/api/src package.json tools || true`
- `rg -n "CallbacksModule|ProviderIpGuard|ProviderSignatureGuard|AdminQueueModule|DepositsModule|ProvidersModule|IdempotencyModule|LocksModule|ReviewTopUpRequestDto|modules/callbacks|modules/admin-queue|modules/deposits|modules/providers|modules/idempotency|modules/locks|review-top-up-request" apps/api/src package.json tools || true`
- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:api`

## Inventory delta

After pass 2, `pnpm audit:r14-cleanup-inventory` reported:

- files scanned: 573
- potential orphan sources: 116
- potentially unused exports: 117
- component files: 6
- potentially unused components: 1
- route files: 149
- feature flags: 3
- helper files: 11
- potentially unused helpers: 0
- CSS files: 38
- potentially unreferenced CSS files: 37

## Cleanup policy

The R-014 actionable cleanup inventory is closed. Future removals must still be reviewed domain-by-domain with regression evidence; do not delete files solely because a static inventory marks them as candidates.

## Pass 3 — CSS inventory correction and one unreferenced stylesheet

Date: 2026-07-15

Removed:

- `apps/web-member/app/casino-auth.css`

Why this is low risk:

- The cleanup inventory detector was corrected to recognize explicit `.css` import specifiers before using CSS results for removal decisions.
- After the detector fix, this was the only stylesheet still marked unreferenced.
- Exact searches for `casino-auth`, `casinoAuth`, `auth-actions`, and non-CSS source references found no source owner for the stylesheet.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:member`


## Pass 4 — cleanup inventory precision pass (no deletion)

Date: 2026-07-15

Changed:

- Updated `tools/audit-r014-cleanup-inventory.mjs` to treat Next.js App Router files (`page`, `route`, `layout`, `loading`, `error`, `not-found`, and `template`) as framework entrypoints instead of orphan-source candidates.
- Excluded route files from component-unused detection so app/page conventions are not misclassified as components.
- Included JavaScript tool/config files in the scan corpus for reference matching while treating root tools and common config files as entrypoints.

Why this is low risk:

- This pass does not delete runtime code.
- It reduces false-positive cleanup candidates before any future domain-by-domain removal.
- The regenerated inventory now reports `potentialOrphanSources: 6`, `potentiallyUnusedComponents: 0`, and `potentiallyUnreferencedCssFiles: 0`.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:api`
- `pnpm typecheck:member`


## Pass 5 — admin UI orphan cleanup

Date: 2026-07-15

Removed:

- `apps/web-admin/app/(admin)/_components/admin-confirm-dialog.tsx`
- `apps/web-admin/app/(dashboard)/content/cms-asset-uploader.tsx`
- `apps/web-admin/app/lib/finance-workflow.ts`

Why this is low risk:

- Exact source searches found references only inside the removed files themselves.
- The files were not App Router entrypoints, Nest providers/controllers, config files, or package exports.
- The cleanup inventory had already been refined to avoid route/component false positives before this deletion pass.

Regression evidence:

- `rg -n "AdminConfirmDialog|ConfirmDetailRow|CmsAssetUploader|UploadedCmsAsset|financeStatusLabel|allowedDepositActions|DepositWorkflowStatus|DepositWorkflowAction" apps/web-admin apps/api packages tools -g '!docs/evidence/r014-cleanup-inventory.json'`
- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:admin`


## Pass 6 — retained API/template orphan review

Date: 2026-07-15

Reviewed and retained:

- `apps/api/src/common/infrastructure/prisma-admin-ownership-repository.adapter.ts` — retained as R-009 transaction-scoped ownership adapter evidence and audit coverage.
- `apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts` — retained as R-009 transaction-scoped finance adapter evidence and audit coverage.
- `apps/api/src/modules/game-platform/adapters/real-provider-adapter.template.ts` — retained as a provider integration template and documentation artifact; it is explicitly not registered directly.

Why this is low risk:

- No runtime code was deleted in this pass.
- The remaining orphan-source candidates were reviewed and moved into an explicit retained list with reasons.
- The regenerated inventory now reports `potentialOrphanSources: 0` and `retainedOrphanSources: 3`; future cleanup should continue with export-level review instead of deleting these retained artifacts.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:api`


## Pass 7 — observability export-surface cleanup

Date: 2026-07-15

Changed:

- Converted `HttpMetricInput` in `apps/api/src/common/observability/runtime-metrics.ts` from an exported type to an internal type.
- Converted `ActorType`, `LogResult`, and `StructuredLogInput` in `apps/api/src/common/observability/structured-log.ts` from exported types to internal types.

Why this is low risk:

- Exact source searches showed these types are only used inside their defining files.
- Public runtime functions remain exported: `recordHttpMetric`, `recordDbPerformanceSignal`, `runtimeMetricsSnapshot`, `resetRuntimeMetricsForTest`, `buildStructuredLogRecord`, `inferModule`, and `inferAction`.
- The regenerated inventory reduced `potentiallyUnusedExports` from 103 to 99 without changing runtime behavior.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm --filter @platform/api test -- src/common/observability/structured-log.spec.ts src/common/observability/runtime-metrics.spec.ts --runInBand`
- `pnpm typecheck:api`


## Pass 8 — common query/security export-surface cleanup

Date: 2026-07-15

Changed:

- Converted file-local query helper types in `apps/api/src/common/query/cursor-pagination.ts` from exported to internal types.
- Converted file-local `SortDirection` in `apps/api/src/common/query/query-filters.ts` from exported to internal.
- Converted file-local security policy input/output/rule types in `domain-authorization-policy.ts`, `reason-audit-policy.ts`, and `step-up-policy.ts` from exported to internal.
- Converted `DOMAIN_AUTHORIZATION_RULES` to an internal constant because only `resolveAuthorizationDomain` and `authorizeDomainPermission` need to be public.

Why this is low risk:

- Exact source searches showed these symbols are only used inside their defining files.
- Public behavior remains exported through existing functions such as `parseCursorPage`, `buildCursorPage`, `parseSort`, `resolveAuthorizationDomain`, `authorizeDomainPermission`, `enforceReasonAndAudit`, `isFreshStepUp`, and `requireFreshStepUp`.
- The regenerated inventory reduced `potentiallyUnusedExports` from 99 to 86 without changing runtime behavior.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm --filter @platform/api test -- src/common/security/domain-authorization-policy.spec.ts --runInBand`
- `pnpm typecheck:api`


## Pass 9 — broad API file-local export cleanup

Date: 2026-07-15

Changed:

- Converted 23 API file-local exported types/classes/constants to internal declarations across common actors, repository ports, audit builders, domain/errors, validation, query-performance monitoring, activity/admin-auth/auth/anti-bot/finance helpers.
- Kept behavior-bearing public functions/classes exported where they are called by controllers, services, modules, or tests.

Why this is low risk:

- The cleanup inventory identified these symbols as not referenced outside their defining files.
- This pass does not remove runtime behavior; it narrows public export surface only.
- The regenerated inventory reduced `potentiallyUnusedExports` from 86 to 63 in one batch while keeping actionable orphan-source candidates at 0.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:api`


## Pass 10 — complete actionable cleanup inventory

Date: 2026-07-15

Changed:

- Converted remaining file-local API and frontend exported types/classes/constants/functions to internal declarations where exact-source review showed no external consumers.
- Removed unreferenced `SystemModule`, `SystemController`, `SystemService`, and `WalletLedgerModule` leftovers and removed the stale system row from `docs/architecture/module-map.md`.
- Kept package/public API exports untouched when they are part of a supported public surface.

Why this closes the R-014 dead-code cleanup item:

- The regenerated cleanup inventory now reports zero actionable orphan sources, zero potentially unused exports, zero potentially unused components, zero potentially unused helpers, and zero potentially unreferenced CSS files.
- Three API/template artifacts remain explicitly retained with reasons.
- Route and feature-flag inventories remain as inventory evidence, not deletion candidates.

Regression evidence:

- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:api`
- `pnpm typecheck:admin`
- `pnpm typecheck:member`

