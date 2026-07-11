# Admin Access Control

This guide documents the minimum permissions required for the Admin Access Control page and role management API.

## Required permissions

The following permissions must exist in the `permissions` table:

| Code | Module | Purpose |
| --- | --- | --- |
| `admin.access.view` | `admin-access` | View roles, permissions, and admin user role assignments. Required for `GET /admin/access/overview`. |
| `admin.access.manage` | `admin-access` | Assign and remove roles from admin users. Required for role mutation endpoints. |
| `admin.access.delegate` | `admin-access` | Create and revoke time-limited permission delegations. |

## API endpoints

| Method | Path | Permission |
| --- | --- | --- |
| `GET` | `/admin/access/overview` | `admin.access.view` |
| `POST` | `/admin/access/admin-users/:adminUserId/roles` | `admin.access.manage` |
| `DELETE` | `/admin/access/admin-users/:adminUserId/roles/:roleId` | `admin.access.manage` |
| `GET` | `/admin/access/delegations` | `admin.access.view` |
| `POST` | `/admin/access/delegations` | `admin.access.delegate` |
| `POST` | `/admin/access/delegations/:delegationId/revoke` | `admin.access.delegate` |

## Delegated access safety

Delegated access stores an explicit permission allow-list and expires after at most 168 hours. The following permissions can never be delegated:

- `*`
- `admin.create`, `admin.access.manage`, `admin.access.delegate`, `roles.update`
- wallet adjustment, withdrawal approval/success, security settings, and anti-bot override permissions

The Admin Auth Guard reads active delegations on every authenticated request. A revoked or expired delegation therefore stops granting access immediately. Delegated admins cannot create further delegations and protected owner accounts cannot receive them. Create and revoke actions are written to `admin_audit_logs`; revocation also invalidates the delegate's active sessions.

## Seed permissions

Run this after deploying the Admin Access Control feature:

```bash
pnpm tsx prisma/seed-access.ts
```

The seed script upserts these permissions:

- `admin.access.view`
- `admin.access.manage`
- `admin.access.delegate`

If a role with one of these codes exists, the script also attaches both permissions to it:

- `super_admin`
- `SUPER_ADMIN`
- `owner`
- `OWNER`

If no matching role exists, the permissions are still created, but you must attach them manually in the database or through a privileged admin account.

## Safety rules

The role removal API prevents an admin from removing their own critical access role when that role is:

- their last remaining role
- a wildcard `*` role
- a role containing `admin.access.manage`

This protects against locking yourself out of access management.

## Production checklist

Before enabling this page for multiple admins:

1. Run the seed script.
2. Confirm at least one active admin has either `*` or both `admin.access.view` and `admin.access.manage`.
3. Test `/access` with a non-super admin account.
4. Confirm access change events appear in `admin_audit_logs`.
5. Do not remove the final privileged admin role without a database rollback plan.
