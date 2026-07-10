# PROJECT RULES

## Separation

- Member frontend and Admin frontend must be separate apps.
- Member auth and Admin auth must be separate.
- Admin APIs must never be exposed to the member app.

## Financial rules

- Never update balance directly.
- Every balance change must create ledger and transaction records.
- Every important admin action must create audit log.
- Duplicate requests must be protected by idempotency and locks.
