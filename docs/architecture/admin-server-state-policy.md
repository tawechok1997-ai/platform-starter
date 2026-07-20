# Admin Server-State Policy

Updated: 2026-07-21  
Status: Proposed contract, implementation pending  
Scope: `apps/web-admin`

## Objective

Standardize how Admin pages fetch, cache, refresh, mutate and recover from server-state failures before adopting another client-state dependency.

## Principles

1. Authentication and permission checks remain authoritative on the server.
2. Client caches are convenience layers, never permission or balance sources of truth.
3. Read retries must be bounded and safe; mutations must never retry blindly.
4. Every request must support cancellation when its route, filter or component lifecycle changes.
5. Polling is domain-owned and visibility-aware.
6. Error codes are mapped centrally; UI must not parse human-readable backend messages for control flow.
7. Optimistic updates require a captured rollback snapshot and a defined conflict path.
8. Financial, risk, KYC and permission mutations preserve audit and idempotency semantics.

## Query-key contract

Use stable arrays with a domain prefix:

```ts
['admin', 'dashboard', filters]
['admin', 'members', 'list', filters]
['admin', 'members', memberId]
['admin', 'wallets', walletId, 'ledger', filters]
['admin', 'withdrawals', 'queue', filters]
['admin', 'risk', 'alerts', filters]
['admin', 'kyc', 'cases', filters]
['admin', 'reports', reportId, filters]
```

Rules:

- Serialize filters deterministically.
- Do not include functions, Date objects or mutable class instances.
- Keep list and detail keys distinct.
- Invalidate the narrowest owning key after a successful mutation.

## Default freshness policy

| Domain | Stale time | Background refresh | Notes |
|---|---:|---|---|
| Session and permissions | 0–30 seconds | On focus and explicit security events | Permission changes must surface quickly |
| Dashboard aggregates | 30–60 seconds | On focus | Each widget may recover independently |
| Queues and operational lists | 10–30 seconds | Visibility-aware polling when required | Pause when tab is hidden |
| Member/profile detail | 30–60 seconds | On focus after mutation | Avoid flashing the whole page |
| Static settings/catalogs | 5–15 minutes | On focus only when stale | Prefer server version markers |
| Reports | User initiated | No automatic retry for expensive jobs | Use export/job status endpoints |

Exact values remain domain decisions and must be recorded beside the owning query factory.

## Retry policy

### Safe reads

- Retry transient network failures and 5xx responses at most two times.
- Use exponential delay with jitter.
- Do not retry 400, 401, 403, 404, 409 or validation errors automatically.
- Surface a per-widget or per-section retry where partial rendering is possible.

### Mutations

- Never automatically retry approve, reject, release, adjustment, role, permission, KYC, wallet or destructive actions.
- Mutation retries require an idempotency key or an explicit server-declared retry-safe contract.
- Disable duplicate submission while a mutation is pending.
- Preserve the original reason, evidence reference and request identifier during an explicit retry.

## Cancellation

- Pass an `AbortSignal` through the Admin API client.
- Cancel superseded searches, filter requests and route transitions.
- Ignore aborted requests without rendering an error notification.
- Do not let an older response replace data from a newer filter or search.

## Polling

- Poll only queues, provider/system health, active incidents or explicitly live operational states.
- Pause polling when `document.visibilityState !== 'visible'`.
- Back off after repeated failures.
- Stop polling after session expiry or permission denial.
- Show the last successful refresh time and stale status.

## Session expiry and permission changes

- A 401 routes through one central session-expiry handler.
- A 403 renders a permission-denied state without pretending the record is missing.
- Clear sensitive cached data after logout, revoke-all or identity switch.
- Revalidate navigation and visible actions when permissions change.
- Never retain masked/unmasked data across users or delegated-access sessions.

## Optimistic updates and conflicts

Optimistic updates are allowed only when:

- the mutation has deterministic local effects;
- a complete rollback snapshot exists;
- the server returns a canonical record or version;
- a 409/version conflict has a dedicated recovery state.

High-risk financial, permission and compliance actions should prefer confirmed server responses over optimistic success.

## Partial failure contract

Dashboard and detail pages should keep successful sections visible when another section fails. Each failed section provides:

- a concise error state;
- last successful timestamp when available;
- retry action;
- no leaking of raw stack traces or internal error payloads.

## Library decision gate

Before adding TanStack Query or another server-state library, record:

- current request/effect inventory;
- measured duplicated behavior;
- bundle impact;
- migration sequence by domain;
- API-client integration design;
- rollback plan;
- test and browser evidence.

Until that ADR is approved, new Admin data fetching must still follow this policy and should not introduce another page-local fetch convention.

## Verification

- Unit tests for key factories, retry classification and error mapping.
- Browser tests for cancellation, stale indicators, focus refresh and session expiry.
- No duplicate mutation requests under double-click, slow network or React Strict Mode.
- No old-response overwrite after rapid search/filter changes.
- No sensitive cache retained after identity/session changes.
