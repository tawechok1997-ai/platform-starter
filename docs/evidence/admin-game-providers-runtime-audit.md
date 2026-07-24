# Admin Game Providers Runtime Audit

Date: 2026-07-25

Target: `apps/web-admin/src/features/finance/game-providers-page.tsx`

## Current status

The page is functionally complete but its asynchronous actions are not yet hardened against network throws, malformed payloads, or overlapping mutations. This document is the implementation checklist for closing the Game Providers runtime task without changing the existing UI contract.

## Confirmed findings

### List loading

- `loadProviders()` sets `loading` before the request but does not use `try/catch/finally`.
- A rejected request can leave `loading` stuck at `true`.
- The list payload is normalized, but `summary` is accepted without a type guard.
- A failed refresh keeps the previous payload, which is acceptable, but the failure state must always release `loading`.

### Provider detail

- `loadDetail()` accepts the response body directly through `setDetail(data)`.
- The response must be checked for provider identity and array-shaped `endpoints` / `credentials` before state mutation.
- A failed detail load must not clear the currently selected valid detail.

### Provider create/update

- `submit()` does not guard against a second submit before React has committed `saving=true`.
- A rejected request can leave `saving` stuck at `true`.
- Numeric `sortOrder` needs a finite-number fallback.
- Form and detail state must reset only after a confirmed successful response.

### Status and game sync

- `confirmPendingAction()` uses `syncing` only for sync actions. Status changes have no busy state.
- The confirmation dialog can be cancelled while a status request is running.
- Network throws are not caught.
- Sync payload is accepted without validating `created`, `updated`, and `skipped` as finite numbers.
- `Promise.all([loadDetail(), loadProviders()])` must not turn a successful mutation into a misleading failure when one refresh request fails.

### Health check

- `testConnection()` can leave `checking` stuck after a rejected request.
- Health payload status must be limited to `ONLINE`, `OFFLINE`, or `DEGRADED` before `setHealth()`.
- A successful health result should remain visible even if the following detail refresh fails.

### Endpoint mutation

- Endpoint save has no dedicated busy state or double-submit guard.
- Timeout and retry values need finite, bounded numeric normalization.
- Form reset must happen only after a successful response.
- Mutation controls should be disabled while another provider mutation is active.

### Credential mutation

- Credential save has no dedicated busy state or double-submit guard.
- The secret value must never be copied into messages, logs, query strings, or persistent browser storage.
- Form reset must happen only after a successful response.

## Required implementation contract

The runtime task is complete only when all of the following are true:

1. Every request path uses `try/catch/finally` or an equivalent shared helper that always releases its busy state.
2. List, detail, health, and sync payloads are validated before state mutation.
3. Provider, status, sync, health, endpoint, and credential actions cannot overlap.
4. Confirmation dialog cancellation is blocked while its mutation is running.
5. Success messages are shown only after the mutation succeeds.
6. Refresh failures after a successful mutation do not overwrite the mutation success message with a false mutation failure.
7. No raw backend error message or credential value is rendered.
8. Existing pagination, filtering, readiness, endpoint, credential, health, and sync UI remains intact.
9. `pnpm --filter @platform/web-admin build` passes.
10. A source-contract regression test is added in `tools/` and the three Railway deploy checks pass.

## Planned state model

Use a single mutation discriminator instead of independent booleans where practical:

```ts
type ProviderMutation =
  | 'provider'
  | 'status'
  | 'sync'
  | 'health'
  | 'endpoint'
  | 'credential'
  | null;
```

`loading` may remain separate for list loading. Detail loading may use a provider id so only the selected row is disabled.

## Worklist accounting

- Runtime hardening: open
- Regression evidence: open
- No work count should be reduced from this audit alone.
