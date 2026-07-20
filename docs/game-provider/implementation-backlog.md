# Game Platform Hardening Backlog

This backlog contains only work that remains after comparing the requested architecture with the current repository implementation.

## Status convention

- `[x]` implementation is present in the branch.
- `Awaiting CI` means the code is complete but merge readiness still depends on the required workflow result.
- unchecked items require additional implementation, migration evidence, external-provider work, or production-safe data validation.

## Completed foundation already in the repository

- platform wallet and wallet ledger
- serializable wallet mutations
- advisory transaction locking
- basic idempotency
- provider simulator endpoints
- provider registry models
- game, media, session, transfer, snapshot, and webhook models
- adapter registry
- round policy and round persistence
- reconciliation and monitoring services
- member game catalog service

## Workstream A: architecture cleanup

- [x] Document the current wallet architecture and source of truth.
- [x] Add a runtime guard that isolates simulator mode from external provider mode.
- [ ] Consolidate overlapping responsibilities between `game-platform` and `provider-simulator`.
- [x] Make `WalletService.mutateGameBalance()` the documented and tested exclusive mutation boundary for game operations. Awaiting CI.
- [x] Centralize and test simulator versus external-provider runtime mode validation. Awaiting CI.
- [ ] Add configuration validation for seamless wallet and placeholder asset flags.

## Workstream B: wallet and ledger semantics

- [ ] Add database-native game ledger types for bet, win, refund, rollback bet, rollback win, cancel, adjustment, and reconciliation.
- [ ] Replace broad transfer/reversal persistence classification after migration compatibility is verified.
- [x] Add member and admin history filters for provider, game, round, and game operation.
- [x] Preserve backward-compatible reads for existing transfer/reversal rows by deriving game operation from metadata and reference type.
- [x] Return normalized game operation, provider, game, round, and original transaction fields in ledger responses.

## Workstream C: transaction correctness

- [x] Split rollback-bet from rollback-win at the simulator transaction boundary.
- [x] Require refunds to reference an original transaction.
- [x] Verify that refund and rollback references match the original bet or win for the same user, game, and round.
- [x] Support partial refunds without exceeding the original bet.
- [x] Add canonical payload hashes for idempotency conflict detection.
- [x] Send insufficient-balance rollback-win cases to a persistent manual-review queue.

## Workstream D: round persistence

- [ ] Promote the raw-SQL `game_rounds` table to a Prisma model.
- [x] Add the additive migration foundation for `game_round_transactions`.
- [x] Persist webhook round transactions with provider transaction and idempotency uniqueness.
- [x] Track total bet, win, refund, and rollback amounts for newly persisted webhook transactions.
- [x] Support multiple bets and multiple wins in the round transition policy.
- [x] Split refund, rollback, and cancel transitions.
- [x] Add separate refund and cancel transaction references to round persistence.
- [x] Preserve refund semantics when simulator rounds are reconstructed from wallet ledger history.
- [x] Add persistent manual-review records for game transaction exceptions.
- [x] Add stale-round detection that marks rounds for manual review.
- [ ] Backfill existing round totals and transaction rows from historical webhook and wallet data.
- [ ] Add final Prisma models after migration validation against an existing database snapshot.

## Workstream E: security

- [x] Add persistent nonce replay protection with merchant and nonce uniqueness.
- [x] Sign a canonical JSON payload together with timestamp and nonce.
- [x] Reject development fallback credentials outside local and test environments.
- [x] Add endpoint-specific per-merchant rate limits.
- [x] Add focused canonical-signature, nonce, and rate-limit tests. Awaiting CI.

## Workstream F: provider, catalog, and sessions

- [ ] Change the target provider wallet mode to seamless while preserving existing transfer integrations.
- [ ] Move simulator catalog reads from the repository constant to the database.
- [ ] Add explicit mobile, desktop, and both platform values.
- [ ] Return a consistent placeholder media contract.
- [ ] Add hashed launch tokens, expiry, revoke, close, and heartbeat lifecycle.

## Workstream G: reconciliation and tests

- [ ] Reconcile wallet balance against ledger totals.
- [x] Reconcile stored round totals against persisted round transactions.
- [x] Detect round transactions that have no linked wallet ledger entry.
- [x] Add concurrent bet tests. Awaiting PostgreSQL CI.
- [x] Add payload-conflict protection at the wallet idempotency boundary.
- [x] Add focused refund, rollback direction, source validation, and partial-refund tests.
- [x] Add focused wallet ledger semantic/filter tests. Awaiting CI.
- [x] Add round-policy tests for repeated bets, repeated wins, refund, cancel, replay, and closed-round rejection.
- [x] Add game-round transaction persistence and duplicate-event integration tests. Awaiting PostgreSQL CI.
- [x] Add provider simulator runtime configuration tests.
- [ ] Add full refund, rollback, and manual-review integration tests.
- [ ] Add diagnostics service tests against disposable PostgreSQL.

## Code-complete items awaiting CI

- provider simulator service and transaction unit suites
- wallet game-ledger semantic/filter suite
- PostgreSQL simulator concurrency suite
- PostgreSQL game-round persistence and duplicate replay suite
- API typecheck and build
- Member contract tests, typecheck, build, and browser regression

These items must remain open for merge readiness until the workflow reports success. A commit existing is evidence of implementation, not evidence that GitHub Actions approves of human ambition.

## Deferred until the repository UI and asset audit is complete

- member lobby adaptation
- admin provider, game, and round page adaptation
- asset import framework adaptation
- migration, seed, and CI consolidation

## Safety rules

1. Do not push money-core changes directly to `main`.
2. Do not modify the same file in parallel workstreams.
3. Keep schema migrations separate from UI changes.
4. Preserve backward compatibility until data migration is verified.
5. Require API build, typecheck, focused tests, and migration validation before merge.
