# R-009 Transaction Lock Order Evidence

Status: ENFORCED, awaiting latest quality-workflow confirmation

## Scope

This evidence covers the R-009 checklist item requiring a standard row-lock order to reduce deadlock risk in critical write flows.

## Policy and guard

- Policy: `docs/architecture/transaction-lock-order.md`
- Audit: `tools/audit-r009-lock-order.mjs`
- Strict command: `pnpm audit:r9-lock-order:strict`
- The strict guard fails when:
  - a transaction acquires known row locks in reverse rank order; or
  - a row-locked table has not been classified in the policy map.

The second rule is essential: an unknown table cannot silently bypass the lock-order standard.

## Closure rule

This checklist item may be marked DONE only when the strict command executes in the required quality workflow with zero inversions and zero unclassified locked tables. Any future inversion or unclassified table must fail CI.

## Safety

The guard changes no runtime lock statement, query order, transaction boundary, schema, migration, production data, permission, provider setting, or financial behavior.
