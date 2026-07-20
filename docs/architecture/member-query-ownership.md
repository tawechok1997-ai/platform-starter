# Member Query Ownership

## Owner

`AdminMembersQueryService` remains the implementation owner for the current admin member list, insights and detail projections.

Cross-module consumers must depend on the read-only `MEMBER_QUERY` token and `MemberQueryContract`, not on `AdminMembersService` or `AdminMembersCommandService`.

## Read contract

The public query boundary exposes:

- `listMembers(query)`
- `getMemberInsights()`
- `getMemberDetail(id)`

The existing controller routes, permissions and response payloads remain unchanged.

## Mutation boundary

Member status changes remain owned by `AdminMembersCommandService` and protected by the existing `users.suspend` permission at the controller boundary.

The query contract must never expose suspend, lock, close or status-update operations.

## Projection note

`getMemberDetail()` currently composes identity, profile, wallet, top-up, withdrawal, ledger and audit projections. This is retained for response compatibility. Future decomposition may introduce narrower projection collaborators, but the public member-detail response must remain compatible during that migration.

## Regression guard

Run:

```bash
node tools/audit-member-query-boundary.mjs
```

The audit verifies that the public contract remains read-only and that `MEMBER_QUERY` is bound and exported by `AdminMembersModule`.
