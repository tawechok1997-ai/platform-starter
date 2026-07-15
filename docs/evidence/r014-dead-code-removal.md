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
