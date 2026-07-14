# R-010 Admin Member List Projection Cleanup

Status: verified by source guard and deployment status

## Scope

Outcome 4 requires list endpoints to avoid loading unnecessary relation payloads.

`AdminMembersQueryService.listMembers()` previously used:

- `include: { profile: true, wallet: true }`

That loaded complete profile and wallet relations even though the list response only uses:

- `profile.displayName`
- `wallet.balance`
- `wallet.lockedBalance`

## Implementation

- Added `MEMBER_LIST_PROJECTION` with the exact scalar and relation fields required by `mapMemberListItem`.
- Replaced the list query relation `include` with `select: MEMBER_LIST_PROJECTION`.
- Added `MemberListRecord` from the select projection so the mapper remains type checked.
- Left `getMemberDetail()` unchanged because the detail response legitimately needs broader profile and wallet data.

## Regression guard

`tools/audit-r010-admin-member-list-projection.mjs` verifies:

- `listMembers()` does not contain relation `include`.
- The list query uses `MEMBER_LIST_PROJECTION`.
- Profile is limited to `displayName`.
- Wallet is limited to `balance` and `lockedBalance`.
- The old broad payload and include-derived mapper type cannot return.

The guard is required by `.github/workflows/r010-query-boundaries.yml` together with API typecheck.

## Safety

- Public response keys are unchanged.
- Search, status filtering, ordering, offset pagination, totals, and page counts are unchanged.
- Detail endpoint behavior is unchanged.
- No mutation, transaction, permission, schema, wallet settlement, or provider behavior changed.
