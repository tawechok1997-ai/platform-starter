# SECURITY

## Security Layers

1. Auth security
2. Admin security
3. RBAC and permission
4. Wallet security
5. Idempotency
6. Distributed lock
7. Provider callback security
8. File upload security
9. Infrastructure security
10. Monitoring and alerting

## Phase 1 Requirements

### Member Auth

- Access token must be short lived.
- Refresh token must be stored as hash only.
- Password must be hashed by argon2 or bcrypt.
- Login history must be written for success and failure.
- Device id and user agent should be tracked.
- OTP and verification tokens must expire.

### Admin Auth

- Admin panel must use separate auth flow.
- Admin login should require 2FA after password check.
- Admin sessions should expire faster than member sessions.
- Admin API must check permission on the backend.
- Admin login/logout and sensitive actions must create audit logs.
- IP whitelist must be supported.

## Backend Guards

- MemberAuthGuard
- AdminAuthGuard
- PermissionsGuard
- IpWhitelistGuard
- TwoFactorGuard

## Rules

- Never trust frontend authorization.
- Never expose admin routes to member app.
- Never store raw refresh tokens.
- Never store raw OTP codes.
- Never skip audit logs for admin actions.
