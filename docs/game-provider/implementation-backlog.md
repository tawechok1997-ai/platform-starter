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

- [ ] Add explicit game ledger types for bet, win, refund, rollback bet, rollback win, cancel, adjustment, and reconciliation.
- [ ] Replace broad transfer/reversal classification for seamless game transactions.
- [ ] Add member and admin history filters for provider, game, round, and game operation.
- [ ] Preserve backward-compatible reads for existing transfer/reversal rows.

## Workstream C: transaction correctness

- [ ] Split rollback-bet from rollback-win.
- [ ] Require refunds to reference an original bet.
- [ ] Support partial refunds without exceeding the original bet.
- [ ] Add canonical payload hashes for idempotency conflict detection.
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
- [ ] Reject development fallback credentials outside local and test environments.
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
- [ ] Add duplicate callback and payload-conflict tests.
- [ ] Add refund, rollback, and manual-review integration tests.

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
