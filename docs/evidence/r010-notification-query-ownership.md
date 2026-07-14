# R-010 Notification Query Ownership Evidence

## Scope

This evidence records the first safe duplicate-query consolidation under R-010. It does not claim that every duplicate query family in the repository has been resolved.

## Consolidated family

The member notification feed previously issued four source-list queries directly from `NotificationsQueryService` using the same read pattern:

- member-scoped filter
- descending timestamp order
- fixed source limit
- narrow `select` projection

The sources were top-up requests, withdrawal requests, support-linked risk alerts, and member login history.

## New ownership

`apps/api/src/modules/notifications/notification-feed-read.repository.ts` now owns those source reads. It defines:

- one feed source limit
- explicit projection constants for each source
- one `loadMemberFeedSources(userId)` entry point

`NotificationsQueryService` remains responsible for notification mapping, preference filtering, state merging, grouping, and response formatting.

## Regression guard

`tools/audit-r010-notification-query-ownership.mjs` fails if:

- the repository or required projections disappear
- `NotificationsQueryService` stops routing through the repository
- any of the four source `findMany` calls return to the service
- the repository is not registered in `NotificationsModule`

The guard and API typecheck are required by `.github/workflows/r010-query-boundaries.yml`.

## Verification

Railway API, Admin, and Member deployments succeeded for workflow commit `f11e31280648643efe6871e720c7f5056b7067bb`.

## Closure decision

This closes the notifications query family only. R-010 outcome 2 remains active until the current duplicate-query inventory is fully reviewed and every remaining family is consolidated or documented with a justified exception.
