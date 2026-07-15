# R-014 Dead Code Removal Evidence

Date: 2026-07-15

## Scope removed

This pass removed only two low-risk placeholder modules identified by the cleanup inventory:

- `apps/api/src/modules/users/users.module.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/wallets/wallets.module.ts`
- `apps/api/src/modules/wallets/wallets.service.ts`

## Why this was safe

- `UsersModule` was an empty module; its only active reference was the import/imports entry in `apps/api/src/app.module.ts`.
- `UsersService` contained placeholder methods returning `null` or no value and was not injected anywhere.
- `WalletsModule` and `WalletsService` had no references outside their own files.
- The real wallet implementation remains in `apps/api/src/modules/wallet`, which is still imported by `AppModule`.

## Verification commands

- `rg -n "UsersModule|UsersService|modules/users|WalletsModule|WalletsService|modules/wallets" apps/api/src package.json tools`
- `pnpm audit:r14-cleanup-inventory`
- `pnpm typecheck:api`

## Remaining cleanup policy

The broader R-014 dead-code task remains open. Future removals must be reviewed domain-by-domain with regression evidence; do not delete files solely because the static inventory marks them as candidates.
