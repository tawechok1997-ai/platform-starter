# R-010 Query Inventory Foundation

## Scope

This evidence closes the first R-010 outcome from `docs/master-project-worklist.md`: inventory duplicate queries and hard-coded `take` values.

## Implementation

`tools/audit-r010-query-inventory.mjs` scans TypeScript source under `apps/api/src` and records:

- numeric `take` literals with stable keys,
- embedded/default page-size values,
- Prisma `findMany` query shapes,
- duplicate query-shape groups,
- source file, method, and line metadata.

Stable finding keys allow later review ledgers and ratchets without relying on unstable array positions.

## Modes

- Default: human-readable inventory.
- `R010_QUERY_JSON=1`: deterministic JSON output for evidence and tooling.
- `R010_QUERY_STRICT=1`: fails when hard-coded takes or duplicate query groups remain. Strict mode is intentionally not enabled yet because the baseline must first be reviewed and migrated.

## Safety

The audit is read-only. It does not modify runtime queries, response contracts, pagination behavior, database schema, production data, permissions, transactions, wallets, settlements, providers, or secrets.

## Closure decision

The inventory capability is implemented and durable. Consolidation, pagination foundations, projection cleanup, and strict enforcement remain separate R-010 outcomes.

Implementation commit: `14049883c7e768a3e9dffc223b78615999871d7e`
