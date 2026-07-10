# Phase 3 Closeout

Status: closed

Phase 3 focused on wallet hardening, finance operations, queue visibility, private slip handling, reports, and the first version of the admin operation center.

## Completed scope

### Money safety

- Top-up approval and rejection guard against non-pending requests.
- Withdrawal complete and reject guard against non-pending requests.
- Ledger idempotency keys are used for high-risk money actions.
- Manual wallet adjustment sends an idempotency key from admin UI.
- Wallet balance changes are recorded through wallet ledger entries.
- Reviewed top-up and withdrawal queues hide duplicate action buttons in admin UI.

### Reports and reconciliation

- Finance summary endpoint exists.
- Daily report endpoint exists.
- Reconciliation report endpoint exists.
- Reports admin UI displays wallet totals, ledger totals, pending queues, reconciliation checked count, and mismatch count.
- Exports first pass exists for finance records.

### Private slip storage

- Member deposit flow uploads slips through a separate private endpoint.
- New top-up notes store `slipFileId` instead of full base64 images.
- Admin top-up review loads slips through a guarded admin endpoint.
- Legacy base64 note fallback remains supported in admin UI.
- Production setup guide exists at `docs/PRIVATE_MEDIA_STORAGE.md`.

### Queue and operation center

- Queue summary endpoint exists at `GET /admin/queues/summary`.
- Admin drawer/topbar uses the queue summary endpoint for pending badges.
- Operation dashboard exists at `/dashboard`.
- Dashboard displays wallet totals, finance queues, recent ledgers, and risk alerts.
- Activity history endpoint exists at `GET /admin/operations/history`.
- Activity admin page exists at `/activity`.

### Risk and member operations

- Risk summary endpoint exists at `GET /admin/risk/summary`.
- Risk rules first pass checks wallet/ledger mismatch, negative available balance, stale pending top-ups, stale pending withdrawals, and locked balances.
- Admin member detail endpoint exists at `GET /admin/members/:id`.
- Admin member detail page exists at `/member-detail?id=<memberId>`.
- Wallet list links to member detail.

## Production notes before real traffic

- Set `PRIVATE_MEDIA_DIR` to a persistent path backed by a Railway Volume.
- Recommended API env: `PRIVATE_MEDIA_DIR=/app/private-media/topup-slips`.
- Mount a Railway Volume at `/app/private-media`.
- Run production deploy checks for API and admin web after every schema/service change.
- Confirm `/dashboard`, `/topups`, `/withdrawals`, `/wallets`, `/reports`, `/activity`, and `/member-detail` after deploy.

## Deferred to later phases

These are intentionally moved out of P3:

- Full queue claim/release ownership UI.
- Bank account management.
- Advanced risk rules such as duplicate amount, rapid withdrawal, and bank-account-change-before-withdrawal alerts.
- Full notification center.
- Rate limit and production security headers.
- Monitoring, backup, and runbook.

## Next phase

Phase 4 starts with deeper admin operation center work:

- Member search and filters.
- Member status management.
- Member bank account review.
- Queue owner / lock status UI.
- Queue timeout / release UI.
- Admin notifications.
