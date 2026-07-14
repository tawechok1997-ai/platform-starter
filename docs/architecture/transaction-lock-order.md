# Transaction Lock Order

Status: ACTIVE
Owner: API architecture
Applies to: critical write flows in `apps/api`

## Purpose

Every transaction that acquires more than one row lock must use one canonical order. This reduces deadlock risk and makes transaction ownership reviewable.

## Canonical order

1. Workflow or aggregate row
   - `deposit_requests`
   - `withdrawal_requests`
   - `kyc_requests`
   - `watchlist_entries`
   - `promotion_settlements`
   - admin ownership/account lifecycle rows
2. Member or actor row when the flow mutates actor state
   - `users`
   - `admin_users`
3. Wallet row
   - `wallets`
4. Ledger or settlement rows
   - `wallet_ledgers`
   - promotion/commission settlement ledgers
5. Audit/outbox rows
   - audit logs
   - notification or outbox records

## Rules

- Lock the existing workflow aggregate before the wallet for approval, completion, rejection, override, or settlement flows.
- A create flow may lock the wallet first only when the workflow row does not exist yet. It must create the workflow row inside the same transaction after the wallet mutation.
- Never acquire an aggregate lock after acquiring its wallet lock in a flow where that aggregate already exists.
- Do not perform network, storage, provider, email, or callback I/O while holding database row locks.
- All rows of the same table must be locked in deterministic primary-key order when more than one row is involved.
- A retry must preserve the same order and idempotency key.
- Any exception requires an ADR entry, owner, expiration date, and regression test.

## Current verified example

`WithdrawalsService.completeRequest` locks `withdrawal_requests` before `wallets`, then writes ledger, wallet, workflow state, and audit data inside the same Prisma transaction.

## Enforcement

`tools/audit-r009-lock-order.mjs` scans Prisma transaction callbacks for raw `FOR UPDATE` statements and reports known table-order inversions. Unknown locked tables are reported for review instead of being silently ignored.
