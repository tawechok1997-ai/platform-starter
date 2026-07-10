# ADMIN

## Admin Separation

Admin app and member app must be separated.

- Member: yourdomain.com
- Admin: admin.yourdomain.com

## Admin Levels

- Super Admin
- Owner
- Admin Manager
- Finance Manager
- Finance Staff
- Risk Officer
- Support Staff
- Marketing Staff
- Content SEO
- Provider Operator
- Auditor

## Phase 1 Admin Features

- Admin login
- 2FA verification
- Role management
- Permission management
- Admin user management
- Admin session list
- Admin audit log

## Important Rules

- Backend must check permission on every admin route.
- Frontend menu hiding is not security.
- Sensitive admin actions must be audited.
- Critical actions will require dual approval in later phases.
