# Member Authenticated Production Smoke Runbook

This runbook explains how to run the manual `Member Authenticated Production Smoke` workflow safely.

## Purpose

The workflow gathers read-only evidence from the deployed Member application after a real authenticated session. It checks session persistence, protected-route access, public settings, feature flags, category visibility, Home content, broken images, horizontal overflow, console errors, failed requests and critical HTTP responses.

It does not register users, reset passwords, submit wallet actions, change settings or mutate database records.

## Authentication options

Use exactly one of these options.

### Option A: production Member access token

Repository secret:

- `PROD_MEMBER_TOKEN`

Use a short-lived token from a dedicated smoke account. Do not use a personal account or an account with real funds.

When token authentication is active, Playwright trace and video capture are disabled so the token cannot be written into evidence artifacts.

### Option B: seeded Member credentials

Repository secrets:

- `SEED_MEMBER_USERNAME`, `SEED_MEMBER_EMAIL` or `SEED_MEMBER_PHONE`
- `SEED_MEMBER_PASSWORD`

Legacy P6 aliases are also supported:

- `P6_MEMBER_USERNAME`, `P6_MEMBER_EMAIL` or `P6_MEMBER_PHONE`
- `P6_MEMBER_PASSWORD`

Only one identity field is required. The workflow selects the first non-empty value in username, email and phone order.

## Optional deployment URL secrets

- `SEED_MEMBER_WEB_URL` or `P6_MEMBER_URL`
- `SEED_API_URL` or `P6_API_URL`

Without URL secrets, the workflow uses the current Railway production Member and API URLs declared in the workflow.

## Safe account requirements

The smoke account must:

- be dedicated to automated verification
- have no real balance or provider credential access
- remain active and unlocked
- not require an interactive OTP or CAPTCHA after credentials are submitted
- have stable permissions matching a normal Member account
- be rotated when exposed or when the environment is rebuilt

Do not store credentials in source files, workflow inputs, PR comments, issue comments or artifacts.

## Running the workflow

1. Open GitHub Actions.
2. Select `Member Authenticated Production Smoke`.
3. Choose `Run workflow` on `main`.
4. Leave URL inputs empty to use configured secrets/default production URLs, or provide the intended deployed URLs.
5. Run the workflow.

A valid evidence run must execute the test. A skipped test is not accepted as success.

## Expected evidence

The workflow uploads an artifact named:

`member-authenticated-production-<run-id>`

The artifact contains:

- full-page Member Home screenshots for Desktop and Mobile
- Playwright HTML report
- sanitized audit JSON with route, settings state and runtime failures

Secret values must never appear in the artifact.

## Failure triage

### `Invalid credentials`

The seeded account is missing, disabled, locked, rebuilt with a different password or points to a different deployment database. Repair or rotate the dedicated smoke account; do not weaken the test or accept a skipped run.

### Redirect back to `/login`

The token is missing/expired, the credential login did not establish a session, or the deployed Member/API pair does not share the expected authentication environment.

### Feature assertion failure

Compare `/public/site-settings` with the rendered route. The deployed settings are the source of truth; do not hardcode a feature into the test merely to make the run green.

### Broken image or request failure

Inspect the sanitized audit JSON and network evidence. Fix the asset/API owner rather than suppressing the failure globally.

## Closing the worklist item

The authenticated Home acceptance item may be closed only when:

- Desktop and Mobile tests both execute and pass
- the final URL is authenticated Home, not Login
- no critical console, page, image, static request or HTTP failure remains
- evidence comes from the intended deployed Member/API pair
- the artifact is reviewed and linked from the completion record
