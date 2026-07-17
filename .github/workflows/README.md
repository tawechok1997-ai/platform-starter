# GitHub Actions Policy

This directory contains repository automation for build, test, security and deployed verification.

## Runtime

All Node-based workflows must use Node.js `22.x`, matching the root engine constraint. A workflow must not silently introduce a newer major runtime than production.

## Trigger policy

- `push`: default to `main` unless a workflow explicitly validates a named verification branch.
- `pull_request`: report failures through checks and the job summary.
- `workflow_dispatch`: use for credentialed, seeded or production verification that cannot run safely on every change.
- Temporary verification branches must not create repository issues.

## CI issue policy

A workflow may create a repository issue only when all conditions are true:

1. The failed run targets `main`.
2. The failure is not cancelled or intentionally skipped.
3. No open issue exists for the same workflow and branch.
4. The issue title and labels provide a stable deduplication key.

When the same workflow fails again, automation must append a concise update to the existing issue rather than create another issue. When a later run succeeds, automation must close the matching issue.

Recommended labels:

- `ci-alert`
- `workflow:<workflow-name>`
- `branch:main`

Do not append full logs to issue comments. Link the workflow run and include the failing job/step, commit SHA and a short action summary.

## Permissions

Use the least privilege required:

```yaml
permissions:
  contents: read
```

Add `issues: write`, `pull-requests: write` or other permissions only to the specific job that needs them.

## Required workflow hygiene

- Set a timeout for every non-trivial job.
- Pin the expected major version of maintained official actions.
- Use root package scripts rather than duplicating command logic in YAML.
- Upload browser evidence only when it helps diagnose failures.
- Never expose secrets through summaries, artifacts, cache keys or issue bodies.
- Keep production and credentialed verification separate from untrusted pull-request execution.

## Before adding a workflow

- [ ] Existing workflow cannot safely cover the scope
- [ ] Runtime matches production
- [ ] Permissions are minimal
- [ ] Trigger does not create duplicate work
- [ ] Failure reporting has deduplication
- [ ] Success behavior cleans up stale alerts
- [ ] Commands are documented in the root README or support runbook
