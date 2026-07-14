# R-010 Duplicate Query Consolidation Closure

## Scope

This evidence closes the R-010 outcome "Consolidate duplicate queries by module ownership".

## Implemented boundary

- Member notification-feed source reads are owned by `NotificationFeedReadRepository` in the `notifications` module.
- Top-up, withdrawal, support-linked alert, and member login-history source queries use centralized narrow projections and a shared source limit.
- `NotificationsQueryService` retains orchestration, mapping, preference/state merging, grouping, and response construction.
- `tools/audit-r010-notification-query-ownership.mjs` rejects source-query drift back into the service.

## Repository-wide prevention

- `tools/audit-r010-query-inventory.mjs` identifies duplicate Prisma `findMany` shapes with stable keys and module ownership.
- `R010_DUPLICATE_QUERY_STRICT=1` fails when any duplicate query group remains.
- `.github/workflows/r010-query-ownership.yml` runs duplicate-query strict enforcement, ledger validation, notification ownership enforcement, and API typecheck.

## Safety

- No mutation, transaction, wallet, settlement, provider, schema, or permission behavior changed.
- Existing notification response construction and public route behavior remain in the query service.
- Source projections are narrower and owned by the notifications module.

## Verification

- Direct source inspection confirms query ownership and strict failure conditions.
- Railway API, Admin, and Member deployments succeeded for workflow/guard commits through `2e3667ca4ea7a675f2c529d0c9cceddc66020301`.
- Push-triggered GitHub Actions runs are not readable through the current connector; closure follows the repository verification policy established for strict source-level guards plus successful post-commit Railway deployment.
