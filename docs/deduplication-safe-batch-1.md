# Deduplication Safe Batch 1

## Goal

Reduce repeated verification work and add evidence-driven duplicate detection without changing production business behavior.

## Completed

1. Separated Admin tests from `next build`.
2. Added matching `verify` lifecycles to Admin and Member.
3. Replaced Member's hand-maintained test file list with `src/**/*.spec.ts` discovery.
4. Added a report-only duplicate structure audit.
5. Exposed report, JSON and strict audit commands at the repository root.
6. Added an explicit allowlist config with no ignored findings by default.
7. Added a seven-target architecture backlog with safety exit criteria.

## Safety boundaries

This batch does not change:

- Prisma schema or migrations
- production routes
- business services
- wallet or ledger mutations
- provider integrations
- permissions or authentication behavior
- dependency versions

The duplicate audit is report-only unless `--strict` is passed. The allowlist is committed and reviewable; ignored findings cannot be hidden in source code.

## Validation commands

```bash
pnpm --filter @platform/web-admin test
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-member test
pnpm --filter @platform/web-member typecheck
pnpm --filter @platform/web-member build
pnpm audit:duplicate-structure
pnpm audit:duplicate-structure:json
```

Use strict mode only after current findings are classified:

```bash
pnpm audit:duplicate-structure:strict
```

## Remaining work

Seven production-oriented targets remain. They are tracked in `docs/architecture/deduplication-targets.md` and must be handled as focused changes after route, mutation, permission, audit and test ownership are documented.
