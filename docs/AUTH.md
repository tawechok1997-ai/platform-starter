# AUTH

## Scope

Phase 1 covers member authentication and admin authentication.

## Member Routes

- POST /member/auth/register
- POST /member/auth/login
- POST /member/auth/refresh
- POST /member/auth/logout
- POST /member/auth/forgot-password
- POST /member/auth/reset-password
- POST /member/auth/verify-phone
- POST /member/auth/verify-email
- GET /member/profile

## Admin Routes

- POST /admin/auth/login
- POST /admin/auth/2fa/verify
- POST /admin/auth/refresh
- POST /admin/auth/logout
- GET /admin/me

## Token Rules

- Access token: short lived
- Refresh token: stored as hash
- Session record: required
- Logout: revoke current session
- Logout all devices: revoke all active sessions

## Login History

Write login history for:

- successful member login
- failed member login
- successful admin login
- failed admin login
- 2FA failure
- blocked login
