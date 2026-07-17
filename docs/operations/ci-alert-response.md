# CI Alert Response Runbook

Use this runbook when GitHub Actions opens or updates a `[CI ALERT]` issue.

## Triage order

1. Confirm the failed workflow, branch, commit and run URL.
2. Inspect the first failed job and first failed step. Later skipped steps are effects, not root causes.
3. Reproduce the narrow command locally before running the full suite.
4. Fix the source failure rather than editing alert text or closing the issue early.
5. Push one focused commit and verify the workflow result.
6. Close the alert only after the same workflow succeeds on `main`.

## Common commands

```bash
pnpm check:runtime
pnpm typecheck:api
pnpm typecheck:admin
pnpm typecheck:member
pnpm check:architecture
pnpm test
pnpm build
```

Use the narrowest command matching the failed step first. Running every command immediately wastes time and hides the first useful error under several screens of ceremonial suffering.

## Issue lifecycle

- One open issue per workflow and branch.
- Repeated failures append a concise comment containing commit, run and failed step.
- Pull-request and temporary verification branches must not create repository issues.
- A successful run on `main` closes the matching issue.
- Do not paste full logs, credentials, private URLs or raw payloads into an issue.

## Required evidence before closing

- Successful workflow run URL
- Passing commit SHA
- Root cause summary
- Fix summary
- Any remaining deployment or environment risk

## Escalation

Escalate instead of retrying blindly when the failure involves production secrets, database migration divergence, finance reconciliation, private storage, provider webhooks or repeated infrastructure failures outside the repository.