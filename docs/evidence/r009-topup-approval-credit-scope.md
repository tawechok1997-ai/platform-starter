# R-009 Top-up Approval/Credit Scope Evidence

## Conclusion

The current production API does not expose a top-up approval or credit command.

`TopUpsController` exposes only:

- member create/read routes
- admin list/read routes
- admin claim
- admin release

`TopUpsService` contains no approval, credit, completion, wallet mutation, or wallet-ledger mutation command. The deposit policy describes the allowed `PENDING_CREDIT -> COMPLETED` transition, but no production command executes it.

## R-009 decision

The requested consolidation of deposit approval/credit transaction ownership is not applicable to the current production implementation because there is no such money-moving path to consolidate.

Claim and release remain protected by row locks, transaction-scoped state mutation, and transaction-scoped audit persistence.

`tools/audit-r009-topup-transaction-boundary.mjs` now fails closed if any approval/credit/completion route, command, or wallet/ledger mutation is introduced in the top-up module without first defining an explicit transaction contract.

## Required contract for a future implementation

A future top-up approval/credit command must atomically include:

1. top-up request row lock and in-transaction revalidation
2. stable idempotency lookup
3. wallet row lock
4. wallet balance mutation
5. wallet-ledger insertion
6. top-up request transition to `COMPLETED`
7. admin audit persistence
8. rollback and concurrent-credit regression evidence

Until that command exists, R-009 treats this subtask as closed with an N/A production scope rather than inventing a dormant endpoint or silently broadening business behavior.
