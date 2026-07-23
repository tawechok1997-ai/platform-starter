# Admin Mutation Guard Audit

> Source audit on `main` · 2026-07-24
>
> Scope: shared confirmation, UI busy protection, duplicate in-flight request suppression, and idempotency header propagation for Admin mutations.

## Shared contracts

| Contract | Status | Evidence | Behavior |
|---|---|---|---|
| Confirmation dialog | ✅ Shared | `AdminConfirmDialog` in `admin-ui.tsx` | Focus trap, Escape/backdrop cancel, busy lock, standard destructive/success presentation |
| Mutation request boundary | ✅ Shared | `adminApiFetch` in `app/admin-api.ts` | Covers POST, PUT, PATCH, DELETE automatically |
| In-flight duplicate suppression | ✅ Shared | `inFlightAdminMutations` | Same method/path/body hash shares one network result until completion |
| Idempotency header | ✅ Added | `Idempotency-Key` | Generated once for the underlying request and retained across auth refresh retry |
| Replayable response | ✅ Added | Response snapshot/replay | Duplicate callers receive independently readable Response bodies |
| Bodyless response handling | ✅ Added | HTTP 204/205/304 | Replayed with `null` body as required by Fetch |
| Sensitive signature handling | ✅ Added | FNV-style body hash | Request body, reason, and 2FA code are not stored in the in-memory signature |
| UI busy hook | ✅ Shared | `useAdminMutationGuard` | Blocks the same UI mutation key while its promise is running |

## Finance adoption

| Surface | Confirmation | Busy protection | Request dedupe / key | Status |
|---|---|---|---|---|
| `/topups` | `AdminConfirmDialog` for approve, credit, reject | Existing item-level `busyId` | Global `adminApiFetch` mutation boundary | ✅ Covered |
| `/withdrawals` | `AdminConfirmDialog` for approve, settle, reject | Existing item-level `busyId` | Global `adminApiFetch` mutation boundary | ✅ Covered |
| `/bulk-queue-operations` | Typed phrase + final `AdminConfirmDialog` | Shared `useAdminMutationGuard` | Global boundary for batch and per-row requests | ✅ Covered |
| Claim/release actions | No destructive confirmation required | Existing item/batch busy lock | Global boundary prevents duplicate POST | ✅ Covered |

## Global route behavior

Every authenticated Admin route using `adminApiFetch` inherits the request guard without adding route-specific code:

- Finance, wallet, reconciliation, bonus, affiliate, promotion, provider, security, audit, settings, support, and admin-account mutations.
- Mutation signatures use uppercase method, API path, and a hash of the body.
- Two identical calls made while the first call is still running receive replayed copies of the same result.
- After completion, a deliberate new action receives a new Idempotency-Key and may run normally.

## Confirmation requirements

Use `AdminConfirmDialog` for:

- Real balance changes.
- Reject/reverse/refund actions.
- Permission, role, credential, provider, or security changes.
- Bulk actions.
- Actions that cannot be reversed easily.

Claim/release, refresh, search, filtering, and preview-only actions do not require confirmation unless the route adds business risk.

## Limitations kept explicit

- Client in-flight suppression protects one loaded Admin application instance. It does not coordinate across tabs, devices, or administrators.
- `Idempotency-Key` is propagated to the API, but server-side replay guarantees depend on each backend endpoint supporting the header.
- This task does not claim database-level idempotency for endpoints that ignore the header.
- Browser double-click and keyboard evidence remains part of D-08.
- Endpoint-level concurrency and money-ledger tests remain backend verification work.

## Regression coverage

`apps/web-admin/app/admin-api.spec.ts` covers:

1. Stable signature for equivalent method/path/body.
2. Different signature when a body changes.
3. No raw 2FA/request content in the signature.
4. Admin namespace for generated idempotency keys.

The spec is committed and included by the Admin test script. Railway production build does not run `pnpm test`, so test execution must not be claimed from deploy status alone.

## Rule for new mutations

- Use `adminApiFetch`; do not call authenticated Admin mutation endpoints with raw `fetch`.
- Use `AdminConfirmDialog` for consequential actions.
- Use `useAdminMutationGuard` when a component needs visible shared busy state beyond the request-level dedupe.
- Keep route buttons disabled while the mutation is active.
- Never generate an idempotency key inside a retry loop.
