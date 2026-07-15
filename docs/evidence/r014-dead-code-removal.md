# R-014 Dead Code Removal Evidence

Date: 2026-07-15

## Scope removed

This evidence covers two safe cleanup passes. The broader R-014 dead-code task remains open until cleanup inventory review is complete across domains.

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

## Remaining cleanup policy

The broader R-014 dead-code task remains open. Future removals must be reviewed domain-by-domain with regression evidence; do not delete files solely because the static inventory marks them as candidates.

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

