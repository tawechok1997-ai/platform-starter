# Anti-bot rollout status

Last updated: 2026-07-10

## Completed

- Provider-neutral backend support for Cloudflare Turnstile, Google reCAPTCHA, and hCaptcha.
- Encrypted secret storage using `ANTIBOT_ENCRYPTION_KEY` and AES-256-GCM.
- Raw provider secrets are never returned by Admin or public APIs.
- Dedicated permissions:
  - `security.anti_bot.view`
  - `security.anti_bot.update`
  - `security.anti_bot.test`
  - `security.anti_bot.override`
- Admin configuration and provider test endpoints.
- Public configuration endpoints for Admin Login, Member Login, and Member Register.
- Admin configuration page at `/anti-bot`.
- CAPTCHA enforcement on:
  - Admin Login
  - Member Login
  - Member Register
- Frontend widgets for Turnstile, reCAPTCHA, and hCaptcha on all three protected routes.
- CAPTCHA tokens are kept only in component state and are not persisted in localStorage.
- Failed authentication or registration resets the challenge token.
- Missing, expired, or invalid CAPTCHA tokens are rejected by the backend when the route is enabled.
- Configuration changes and provider tests are audited.
- Default configuration is disabled and therefore does not lock out existing users.
- Unit coverage for default-off behavior, route enforcement, secret masking, and invalid enablement.
- Security events for rejected tokens and provider verification outages are written to the admin audit stream without storing CAPTCHA tokens or secrets.

## Safe rollout procedure

1. Set a strong `ANTIBOT_ENCRYPTION_KEY` in the API service environment.
2. Deploy API, Web Admin, and Web Member successfully.
3. Open `/anti-bot` as an administrator with the required permissions.
4. Select a provider and enter the provider site key and secret.
5. Use the provider test action before enabling any route.
6. Enable one route at a time, beginning with Admin Login.
7. Verify login in a private browser window before enabling Member Login or Member Register.
8. Keep an authenticated owner session open during the first rollout.
9. Disable the affected route immediately if the provider script or verification endpoint is unavailable.

## Still remaining

- Password-reset CAPTCHA route when password reset is implemented.
- Risk-score based adaptive challenge instead of the current configuration flag foundation.
- Alert routing/thresholds for provider outage and rejected-token spikes.
- End-to-end browser tests using provider test keys.
- Admin localization polish for the anti-bot settings page.

## Safety notes

- Do not enable a route until its frontend deployment contains the CAPTCHA widget.
- Do not log CAPTCHA response tokens or provider secrets.
- Do not reuse production provider secrets in local development.
- Do not run destructive Prisma commands for anti-bot configuration; this feature uses the existing `SiteSetting` tables and requires no schema migration.
