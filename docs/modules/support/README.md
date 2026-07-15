# Support Module README

## Scope

Support covers ticket creation, thread timeline, ticket close/reopen, attachment policy, FAQ/content references, polling fallback, and links to money/provider context.

## Primary implementation

- `apps/api/src/modules/support/support.controller.ts` — member/admin support API surface.
- `apps/api/src/modules/support/support-command.service.ts` — ticket/thread mutations.
- `apps/api/src/modules/support/support-query.service.ts` — list/detail/pagination queries.
- `apps/api/src/modules/support/support-attachments.service.ts` — attachment metadata, MIME/size policy, and storage-key handling.
- `apps/api/src/modules/support/support.service.ts` — compatibility/facade behavior.

## Safety boundaries

- Attachment keys must stay private and validated for traversal/absolute-path protection.
- Ticket lifecycle mutations must preserve auditability and actor identity.
- Money/provider references must link to existing records without duplicating settlement logic.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- support --runInBand`
- Browser support-thread regression remains required before marking product support complete.
