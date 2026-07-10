# Money Ops Next Layer

This layer keeps real-money mutation disabled by default while making alerts, audits, and simulator testing more realistic.

## 1. Demo transfer 403 closure

`prisma/seed-games.ts` now seeds both providers:

- `demo-provider`
- `simulator-provider`

Each provider gets:

- `ACTIVE` status
- `LAUNCH`
- `BALANCE`
- `TRANSFER_IN`
- `TRANSFER_OUT`
- `WEBHOOK`
- `HEALTH_CHECK`
- `API_KEY`
- `WEBHOOK_SECRET`
- safe metadata flags

Run:

```bash
pnpm db:seed:games
```

## 2. Alert scan persistence

`POST /admin/money-ops/alert-rules/scan` now persists findings into `RiskAlert`.

Dedup rule:

```text
refType + refId + type + status in OPEN/REVIEWING
```

If an open/reviewing alert already exists, the scan returns it with `deduped: true`.

## 3. Audit instrumentation

Game money operations now write `AdminAuditLog` for:

- `game.provider.gates.update`
- `game.transfer.retry_dry_run`
- `game.transfer.review`
- `game.reconciliation.run`
- `game.reconciliation.review`
- `game.reconciliation.resolve`

Money ops alert scan writes:

- `alert_rules.scan`

Gated ledger mutation writes:

- `ledger.mutate`

## 4. Real ledger mutation feature flag

Real ledger mutation endpoint:

```text
POST /admin/money-ops/ledger/mutate
```

It is blocked unless:

```env
REAL_LEDGER_MUTATION_ENABLED=true
```

Default behavior is safe: disabled.

The mutation flow:

1. Parse and validate input.
2. Require wallet exists and is ACTIVE.
3. Run in DB transaction.
4. Update wallet balance.
5. Create immutable `WalletLedger` row.
6. Write admin audit log.

## 5. Provider simulator adapter

The adapter registry now includes:

```text
simulator-provider
```

It uses `SimulatorProviderAdapter`, which extends the safe demo adapter for adapter-registry testing.

## Verify

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```
