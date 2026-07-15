# Auth Module README

## Scope

Auth covers member authentication, admin authentication, sessions, refresh-token rotation, phone OTP, SMS provider abstraction, admin login defense, two-factor setup, step-up checks, and session revocation.

## Primary implementation

- `apps/api/src/modules/auth` — member auth, phone OTP, member risk enforcement, and SMS delivery abstraction.
- `apps/api/src/modules/admin-auth` — admin login, refresh session, session tokens, 2FA, step-up, login defense, and session commands.
- `apps/api/src/common/guards/member-auth.guard.ts` — member access-token validation and request actor population.
- `apps/api/src/common/guards/admin-auth.guard.ts` — admin access-token validation, role/permission loading, delegation loading, and request actor population.

## Safety boundaries

- Access tokens stay in memory on the frontend; refresh tokens stay in HttpOnly cookies.
- Admin/member cookies and session types must remain separated.
- 2FA and step-up checks must not be bypassed for high-risk admin actions.
- Phone OTP secrets must be hashed/limited and never logged.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- phone-otp.service.spec.ts admin-auth.guard.spec.ts admin-auth.guard.2fa.spec.ts --runInBand`
- `pnpm --filter @platform/api test -- src/modules/auth/phone-otp.db.spec.ts --runInBand`
