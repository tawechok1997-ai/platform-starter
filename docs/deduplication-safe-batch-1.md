# Deduplication Safe Batch 1

## Purpose

ลดงานซ้ำโดยเริ่มจากการเปลี่ยนแปลงที่ไม่แตะ business logic, database schema, API routes หรือ financial state transitions ก่อน

## Changes in this batch

1. `web-admin` build no longer executes the same feature test suite internally. Tests, type checking and build are composed explicitly through `pnpm verify`.
2. `web-member` test discovery uses `src/**/*.spec.ts` instead of a hand-maintained file list, preventing new tests from being silently omitted.
3. Admin and Member now expose the same `test`, `typecheck`, `build`, and `verify` lifecycle.
4. `tools/audit-duplicate-structure.mjs` inventories duplicate normalized Nest routes and repeated named declarations across `apps` and `packages`.

## Safety properties

- No production route, controller, service, repository, Prisma schema or migration is changed.
- No dependency version is changed.
- The duplicate audit reports findings by default and only fails when explicitly run with `--strict`.
- Existing app-level `test`, `typecheck` and `build` commands remain available.

## Validation commands

```bash
pnpm --filter @platform/web-admin test
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-member test
pnpm --filter @platform/web-member typecheck
pnpm --filter @platform/web-member build
node tools/audit-duplicate-structure.mjs
node tools/audit-duplicate-structure.mjs --json
```

Do not enable strict duplicate enforcement until the initial inventory has been reviewed and an allowlist or ownership rule is agreed. Duplicate declaration names can be legitimate across bounded contexts, while duplicate normalized HTTP method/path pairs are generally higher priority.

## Next safe batch

Use the generated inventory to classify each finding into:

- true duplicate requiring consolidation;
- intentional bounded-context duplication;
- legacy compatibility surface with a removal target;
- false positive requiring audit refinement.

Only after classification should transitional modules such as `risk`, `activity`, `queues`, and `admin-members` be moved or folded into first-class owners.
