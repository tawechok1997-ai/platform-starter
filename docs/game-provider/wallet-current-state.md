# Game Wallet Current State

## Scope

This document records the current game-wallet architecture before further hardening. It is based on the implementation in `WalletService`, `GamePlatformModule`, and `ProviderSimulatorModule`.

## Source of truth

- Each user has one platform wallet.
- The platform wallet balance is the source of truth for simulator game transactions.
- The available balance is `balance - lockedBalance`.
- Game code must not update the wallet table directly.
- Game balance mutations must go through `WalletService.mutateGameBalance()`.

## Existing mutation flow

`WalletService.mutateGameBalance()` currently provides:

- Prisma Decimal amount handling
- user and wallet validation
- currency validation
- locked-balance validation
- serializable database transactions
- optional PostgreSQL advisory transaction locks
- idempotency through `WalletLedger.idempotencyKey`
- atomic wallet and ledger writes

## Existing simulator flow

The provider simulator already supports:

- balance
- launch
- transfer in and transfer out
- bet
- win
- refund
- rollback
- game catalog
- bet history

The simulator uses the platform wallet and does not keep a separate in-memory balance.

## Current gaps

1. Game ledger entries are stored as broad `TRANSFER` or `REVERSAL` types instead of explicit bet, win, refund, and rollback types.
2. Rollback is currently treated as a credit operation, which is wrong when reversing a win.
3. Refund does not yet enforce a reference to the original bet or partial-refund totals.
4. Round persistence exists, but refund and rollback are collapsed into the same event.
5. The catalog is still sourced from a repository constant instead of the database.
6. Simulator request signing has timestamp validation but no persisted nonce replay protection.
7. Provider wallet mode defaults to transfer mode even though the current target is seamless mode.

## Required architecture rule

All game operations must use the following path:

`Provider or simulator request -> game transaction policy -> WalletService.mutateGameBalance() -> Wallet + WalletLedger in one transaction`

The following are prohibited:

- direct wallet updates from controllers
- direct SQL balance mutations from provider adapters
- provider-specific wallet tables for simulator mode
- in-memory simulator balances
- permanent balance changes in the member or admin frontend

## Current migration direction

The existing implementation will be evolved rather than replaced. New work must extend the current wallet mutation service, round persistence, provider registry, and simulator modules. A second parallel game-wallet implementation must not be introduced.
