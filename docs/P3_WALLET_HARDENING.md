# P3 Wallet Hardening

Status: in progress

## Completed in this pass

- Top-up review is guarded with a conditional `PENDING` claim before wallet balance changes.
- Withdrawal complete/reject is guarded with a conditional `PENDING` claim before wallet balance or locked balance changes.
- Wallet ledger already uses a unique `idempotencyKey` and review flows now rely on deterministic keys.
- Manual wallet adjustment accepts an optional client idempotency key and rejects duplicate submissions.
- Admin reports API added:
  - `GET /admin/reports/daily`
  - `GET /admin/reports/reconciliation`
- Admin CSV export API added:
  - `GET /admin/exports/topups.csv`
  - `GET /admin/exports/withdrawals.csv`
  - `GET /admin/exports/ledgers.csv`
- Admin UI pages added:
  - `/reports`
  - `/exports`

## Still pending

- Full database-level row locking strategy for high concurrency balance updates.
- Automated reconciliation alerting.
- Queue notification badges.
- Private storage for slips.
- Production runbook for finance operations.

## Test checklist

1. Approve the same top-up from two tabs. Only one should succeed.
2. Complete the same withdrawal from two tabs. Only one should succeed.
3. Reject the same withdrawal from two tabs. Only one should succeed.
4. Submit the same manual adjustment twice with the same idempotency key. The second request should return conflict.
5. Open `/reports` and verify daily summary and reconciliation load.
6. Open `/exports` and download topups, withdrawals, and ledgers CSV files.
