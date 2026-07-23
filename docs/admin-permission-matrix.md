# Admin UI / API Permission Matrix

> Source audit on `main` · 2026-07-24
>
> UI contract: `apps/web-admin/app/(admin)/_components/admin-permission-contract.ts`
>
> Shared gate: `apps/web-admin/app/(admin)/_components/admin-permissions.tsx`

## Contract rules

1. The Admin shell hides navigation items and blocks deep-linked routes using the route permission list in `admin-nav.ts`.
2. Action buttons use `AdminPermissionGate` or `useAdminPermissions` with a named requirement from `ADMIN_ACTION_PERMISSIONS`.
3. UI gating is not the security boundary. Every protected API endpoint must still use `AdminAuthGuard`, `PermissionsGuard`, and `@RequirePermission`.
4. Wildcard permission `*` satisfies all UI permission checks.
5. `anyOf` means one listed permission is sufficient. `allOf` means every listed permission is required.

## Current source-inspected matrix

| Surface | UI route/view requirement | UI action requirement | API endpoint | API permission | Status |
|---|---|---|---|---|---|
| Global sidebar / command palette | From `admin-nav.ts` | N/A | N/A | N/A | ✅ Navigation filtered and deep links blocked by Admin shell |
| Audit list | `admin.access.view` | N/A | `GET /admin/audit-logs` | `admin.access.view` | ✅ Aligned |
| Audit risk summary | `risk.view` route, API currently uses access permission | N/A | `GET /admin/audit-logs/risk-summary` | `admin.access.view` | ⚠️ Route/API vocabulary differs; existing page works only when actor also has API permission |
| Audit CSV export | `admin.access.view` to open page | `admin.access.manage` | `GET /admin/audit-logs/export` | `admin.access.manage` | ✅ UI and API action guard added |
| Admin invitation list | `admin.create` | `admin.create` | `GET /admin/access/invitations` | `admin.create` | ✅ Aligned |
| Assignable invitation roles | `admin.create` | `admin.create` | `GET /admin/access/invitations/roles` | `admin.create` | ✅ Added to remove former `admin.access.view` mismatch |
| Create invitation | `admin.create` | `admin.create` | `POST /admin/access/invitations` | `admin.create` | ✅ Shared permission gate and API guard |
| Reissue invitation | `admin.create` | `admin.create` | `POST /admin/access/invitations/:id/reissue` | `admin.create` | ✅ Shared permission gate and API guard |
| Revoke invitation | `admin.create` | `admin.create` | `DELETE /admin/access/invitations/:id` | `admin.create` | ✅ Shared permission gate and API guard |
| Webhook log view | `game.providers.view` or `provider.view` in navigation | N/A | `GET /admin/webhook-logs` | `game.providers.view` | ⚠️ Navigation alias `provider.view` can open a route whose API requires `game.providers.view` |
| Webhook replay | Future action requirement: `game.providers.manage` | `game.providers.manage` | No replay endpoint exists | N/A | ⏳ Not implemented; do not render a replay button yet |
| Dashboard top-up queue links | Dashboard is broadly visible | `topups.view` or `deposit.view` | Queue/top-up endpoints | Endpoint-specific | ⚠️ Deep-link shell blocks destination, but card-level adoption remains |
| Dashboard withdrawal queue links | Dashboard is broadly visible | `withdraw.view` | Queue/withdrawal endpoints | Endpoint-specific | ⚠️ Deep-link shell blocks destination, but card-level adoption remains |
| Dashboard risk links | Dashboard is broadly visible | `risk.view` | Risk endpoints | `risk.view` | ⚠️ Deep-link shell blocks destination, but card-level adoption remains |

## Changes in this pass

- Added central permission names and action requirements.
- Added module-cached `/admin/auth/me` permission loader and shared UI gate.
- Removed the invitation panel's private duplicate `/admin/auth/me` request.
- Added actor-filtered assignable invitation roles under the same `admin.create` permission as the invitation page.
- Added permission-gated server-side Audit CSV export under `admin.access.manage`.
- Audit export excludes `oldData` and `newData`; payload masking/redaction remains tracked under D-09.
- Recorded Webhook replay as absent instead of creating an unbacked UI action.

## Remaining permission alignment work

1. Decide whether `/audit-risk` should require `admin.access.view`, or move the API summary to a risk-specific permission.
2. Remove the `provider.view` alias from Webhook navigation or allow the API endpoint to accept the same supported alias through an explicit permission policy.
3. Adopt action gates inside Dashboard cards rather than relying only on destination route denial.
4. Add a replay endpoint and audit trail before enabling Webhook replay UI.
5. Run browser role fixtures for owner, finance, risk, support, and read-only roles under D-08.

## Verification limits

- Railway build/deploy verifies compilation and packaging, not role behavior in a browser.
- The helper regression spec is committed, but must not be described as passing until the repository test command runs it.
- Backend permission metadata remains covered by `pnpm audit:admin-permissions` when that audit is executed.
