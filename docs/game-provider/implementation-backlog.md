# Game Platform Hardening Backlog

This backlog contains only work that remains after comparing the requested architecture with the current repository implementation.

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
- [ ] Make `WalletService.mutateGameBalance()` the documented and tested exclusive mutation boundary for game operations.
- [ ] Add configuration validation for simulator, seamless wallet, placeholder asset, and external-provider flags.

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
- [ ] Send insufficient-balance rollback-win cases to manual review.

## Workstream D: round persistence

- [ ] Promote the raw-SQL `game_rounds` table to a Prisma model.
- [ ] Add a game-round transaction model.
- [ ] Track total bet, win, refund, and rollback amounts.
- [ ] Support multiple bets and multiple wins per round.
- [ ] Split refund, rollback, cancel, and manual-review transitions.
- [ ] Add stale-round detection.

## Workstream E: security

- [ ] Add nonce replay protection.
- [ ] Sign a canonical payload or verified raw request body.
- [x] Reject development fallback credentials outside local and test environments.
- [ ] Add endpoint-specific rate limits.

## Workstream F: provider, catalog, and sessions

- [ ] Change the target provider wallet mode to seamless while preserving existing transfer integrations.
- [ ] Move simulator catalog reads from the repository constant to the database.
- [ ] Add explicit mobile, desktop, and both platform values.
- [ ] Return a consistent placeholder media contract.
- [ ] Add hashed launch tokens, expiry, revoke, close, and heartbeat lifecycle.

## Workstream G: reconciliation and tests

- [ ] Reconcile wallet balance against ledger totals.
- [ ] Reconcile round totals against round transactions.
- [ ] Detect missing round and ledger links.
- [ ] Add concurrent bet tests.
- [x] Add payload-conflict protection at the wallet idempotency boundary.
- [x] Add focused refund, rollback direction, source validation, and partial-refund tests.
- [ ] Add focused wallet ledger semantic/filter tests.
- [ ] Add full refund, rollback, and manual-review integration tests.

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
