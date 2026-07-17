# Repository Cleanup Policy

## Goal

Reduce dead files, duplicate scripts, stale evidence and accidental build inputs without deleting artifacts that are still required for operations, audits or historical closure.

## Classification

Every cleanup candidate must be classified as one of:

- `active`: required by CI, build, deploy or daily development.
- `scoped`: used only for a named domain or verification workflow.
- `historical`: retained as closure evidence and excluded from default execution.
- `unused`: no package script, workflow, test, documentation or source reference.
- `generated`: reproducible output that must not be edited manually.

## Evidence required before deletion

A file may be deleted only when all are true:

1. Repository search finds no source, script, workflow, test or documentation reference.
2. It is not listed in `tools/tool-registry.json` as active, scoped or historical.
3. It is not required by deployment, migration, incident response or audit evidence.
4. The relevant lint, typecheck, tests and build pass after removal.
5. The commit message names the removed artifact and why it was safe to delete.

## Safe cleanup order

1. Duplicate generated output and temporary files.
2. Broken or superseded documentation links.
3. Exact duplicate root command aliases with no external consumers.
4. Unreferenced scripts after registry review.
5. Source modules only after import and runtime evidence confirms they are dead.

## Prohibited cleanup shortcuts

- Do not delete by filename age alone.
- Do not treat a missing root command as proof that a tool is unused.
- Do not move historical evidence into active CI merely to make it look maintained.
- Do not combine cleanup with unrelated product behavior changes.
- Do not delete migrations that have been applied to any shared environment.

## Verification

Use:

```bash
pnpm audit:tool-registry
pnpm audit:unused-exports
pnpm audit:circular-dependencies
pnpm check:quick
```

For destructive cleanup, attach the search evidence and before/after command results to the commit or pull request.
