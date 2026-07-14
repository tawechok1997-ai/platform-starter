# Transaction Lock Order

Status: ACTIVE
Owner: API architecture
Applies to: critical write flows in `apps/api`

## Purpose

Every transaction that acquires more than one row lock must use one canonical order. This reduces deadlock risk and makes transaction ownership reviewable.

## Canonical order

1. Workflow or aggregate row
   - `deposit_requests`
   - `top_up_requests`
   - `withdrawal_requests`
   - `kyc_requests`
   - `kyc_cases`
   - `kyc_documents`
   - `watchlist_entries`
   - `risk_watchlist_entries`
   - `promotion_settlements`
   - `bonus_ledgers` when it owns turnover and settlement lifecycle state
   - admin ownership/account lifecycle rows
2. Member or actor row when the flow mutates actor state
   - `users`
   - `admin_users`
3. Wallet row
   - `wallets`
4. Append-only ledger or settlement output rows
   - `wallet_ledgers`
   - promotion/commission settlement output ledgers
5. Audit/outbox rows
   - audit logs
   - notification or outbox records

## Rules

- Lock the existing workflow aggregate before the wallet for approval, completion, rejection, override, or settlement flows.
- A create flow may lock the wallet first only when the workflow row does not exist yet. It must create the workflow row inside the same transaction after the wallet mutation.
- Never acquire an aggregate lock after acquiring its wallet lock in a flow where that aggregate already exists.
- A table named as a ledger may still be an aggregate when it owns mutable lifecycle state. `bonus_ledgers` is classified this way because settlement reads and transitions its turnover/status fields before crediting the wallet.
- Do not perform network, storage, provider, email, or callback I/O while holding database row locks.
- All rows of the same table must be locked in deterministic primary-key order when more than one row is involved.
- A retry must preserve the same order and idempotency key.
- Any exception requires an ADR entry, owner, expiration date, and regression test.

## Current verified examples

- `WithdrawalsService.completeRequest` locks `withdrawal_requests` before `wallets`, then writes ledger, wallet, workflow state, and audit data inside the same Prisma transaction.
- `PromotionDomainRepository.settleBonus` locks `bonus_ledgers` before `wallets`, then writes the append-only wallet ledger and marks the bonus aggregate settled in the same transaction.

## Enforcement

`tools/audit-r009-lock-order.mjs` scans Prisma transaction callbacks for raw `FOR UPDATE` statements and reports known table-order inversions. Unknown locked tables are reported for review instead of being silently ignored.
