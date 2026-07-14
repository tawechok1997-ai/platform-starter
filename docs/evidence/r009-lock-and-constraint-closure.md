# R-009 Lock Order and Constraint Closure

Status: CLOSED

## Closed subtasks

1. Define and enforce a standard lock order to reduce deadlocks.
2. Audit critical unique, foreign-key, cascade, index, and idempotency constraints.

## Lock-order evidence

- `docs/architecture/transaction-lock-order.md` defines the required aggregate, actor, wallet, ledger, and audit ordering.
- `tools/audit-r009-lock-order.mjs` provides a strict failure mode.
- Strict mode rejects both known lock inversions and row-locked tables that have not been classified.
- The strict command is wired into the repository quality workflow.
- `docs/evidence/r009-lock-order-boundary.md` records the enforced boundary.
- `tools/audit-r009-boundary-closure.mjs` protects the closure structure from silent removal.

## Constraint and idempotency evidence

- `tools/audit-r009-schema-constraints.mjs` inventories critical uniqueness, indexes, relations, cascades, and idempotency fields.
- `tools/audit-r009-critical-constraint-closure.mjs` verifies the semantic contracts for wallet ownership, wallet-ledger idempotency, deposit and withdrawal idempotency, ownership assignments, provider transfers, and webhook persistence.
- Fourteen critical persistence contracts are enforced by the semantic closure audit.
- No schema or migration change was required because the required constraints already exist in the current Prisma schema.

## Verification basis

The current connector cannot read push-triggered GitHub Actions runs. These contract-level subtasks are closed under the documented R-009 verification policy using:

- durable source-level guards with strict failure conditions;
- direct inspection of the enforced audit contracts and workflow wiring;
- successful Railway API build and deployment after the guarded code was committed.

This closure does not claim that every possible runtime deadlock has been eliminated. Runtime concurrency tests remain a separate R-009 subtask.
