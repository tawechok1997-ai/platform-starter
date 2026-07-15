# Notifications Module README

## Scope

Notifications covers member/admin notification feeds, read/archive behavior, deep links, channel preferences, and feed aggregation from finance/support/login-history sources.

## Primary implementation

- `apps/api/src/modules/notifications/notifications.controller.ts` — notification API surface.
- `apps/api/src/modules/notifications/notifications-command.service.ts` — read/archive/preference mutations.
- `apps/api/src/modules/notifications/notifications-query.service.ts` — feed/group/deep-link query behavior.
- `apps/api/src/modules/notifications/notification-feed-read.repository.ts` — source aggregation from related modules.

## Safety boundaries

- Notification deep links must not bypass authorization on the target resource.
- Preference updates must validate supported channels and keep rollback behavior testable.
- Feed aggregation should use projections that avoid sensitive fields.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- notifications --runInBand`
- Authenticated browser regression for optimistic rollback is still required.
