# R-010 Notification Projection Boundaries

## Scope

This evidence closes the list/detail/summary projection separation outcome for the notification read family without changing routes, permissions, mutation behavior, transaction ownership, or response semantics.

## Implementation

- `notification-read.projections.ts` owns named list projections for top-up, withdrawal, support-linked alert, login-history, and notification-state reads.
- The same file owns detail projections for category preferences and channel settings.
- The same file owns the feed summary projection helper and centralized source/result limits.
- `NotificationFeedReadRepository` applies all database projections.
- `NotificationsQueryService` performs orchestration and mapping without direct Prisma access.

## Guard

`tools/audit-r010-notification-projection-boundaries.mjs` fails when:

- a required list/detail/summary projection contract disappears,
- the repository stops using a required projection,
- Prisma access returns to `NotificationsQueryService`,
- state or preference reads escape the repository, or
- the summary helper is bypassed.

The guard runs in `.github/workflows/r010-query-boundaries.yml` before API typecheck.

## Safety

The existing notification response shape is preserved: `items`, `groups`, `total`, `counts`, and `preferences`. No schema, production data, secret, finance state, provider behavior, or mutation path changed.
