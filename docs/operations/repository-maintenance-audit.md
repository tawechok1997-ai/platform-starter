# Repository Maintenance Audit Runbook

## Purpose

This runbook turns the backend decomposition and repository cleanup inventories into retained evidence. It prevents baselines from being approved from copied console output, stale local trees, or estimates.

## Workflow

Use the GitHub Actions workflow **Repository Maintenance Audit**.

It runs automatically when relevant backend, baseline, audit-tool, or workflow files change on `main`. It may also be started manually with `workflow_dispatch`.

## Produced evidence

Each successful run uploads an artifact named:

```text
repository-maintenance-<commit-sha>
```

The artifact contains:

- `backend-decomposition.json`
- `repository-cleanup.txt`
- `context.json`

The context file ties the evidence to the repository, commit, ref, workflow run, and attempt.

## Baseline approval procedure

1. Download the artifact from a successful run on `main`.
2. Confirm the artifact commit matches the commit being reviewed.
3. Review every backend decomposition candidate against the decomposition policy.
4. Review every cleanup candidate against the cleanup policy and reference evidence.
5. Update the appropriate baseline JSON only after review.
6. Set `capturedAt` and change baseline status to `approved` only when the candidate list is complete.
7. Run the corresponding baseline validator.
8. Link the workflow run and commit SHA from the worklist or closure evidence.

## Required commands

```bash
node tools/audit-backend-decomposition-baseline.mjs
node tools/audit-repository-cleanup-baseline.mjs
pnpm check:repository
pnpm typecheck:api
```

Run additional targeted tests when a candidate is refactored, moved, or deleted.

## Stop conditions

Do not approve a baseline when:

- the workflow did not run against `main`;
- the artifact commit differs from the reviewed commit;
- candidate ownership or disposition is missing;
- a cleanup candidate still has unresolved references;
- backend metrics were captured after an unverified refactor;
- the baseline validator fails.

## Retention

Workflow artifacts are retained for 30 days. Copy durable conclusions, approved candidates, commit SHA, and the workflow run link into repository evidence before expiration.
