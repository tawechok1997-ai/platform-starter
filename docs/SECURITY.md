# Security Contract

Updated: **2026-07-31**  
Owner: **Platform Security / Platform Engineering**  
Status: **Active**  
Verification: `pnpm audit:dependency-security`, `node tools/audit-public-assets.mjs`, `pnpm check:architecture`

## Trust boundaries

- Member browser to Member Web and Member API routes
- Admin browser to Admin Web and Admin API routes
- API to PostgreSQL, Redis and private object storage
- API to provider endpoints and provider callbacks
- deployment platform, reverse proxy and secret store

Frontend authorization is advisory only. Backend guards, resource policies and transaction state transitions are authoritative.

## Primary threats

- credential theft, token reuse and session fixation
- privilege escalation or missing resource-level authorization
- duplicate, replayed or forged money/provider operations
- race conditions in wallet, settlement and account lifecycle paths
- malicious uploads and public exposure of private media
- secret leakage through source, logs, generated assets or deployment configuration
- XSS, clickjacking, unsafe external scripts and copied public bundles
- abusive login, OTP, password-reset, withdrawal and webhook traffic
- migration drift, startup dependency failure and release identity mismatch

## Required controls

### Member identity

- short-lived access tokens
- refresh token hashes only
- Argon2 or approved password hashing
- success/failure login history
- device and user-agent context
- expiring OTP and verification tokens
- session rotation and revocation

### Admin identity

- separate Admin authentication flow and cookies
- mandatory step-up/2FA for sensitive actions
- shorter Admin sessions
- backend permission and resource checks
- audit logs for login, logout and sensitive mutations
- optional IP allowlist with an emergency recovery procedure

### Money and provider operations

- database transactions and row locking where state can race
- idempotency and duplicate-proof constraints
- explicit state-transition guards
- signed callbacks with timestamp and replay protection
- reconciliation and failure/reversal handling
- real-money gates disabled until provider-specific UAT and approval

### Storage

- private-by-default finance, KYC and support media
- size, MIME and magic-byte validation
- active-content rejection and malware-scan boundary
- short-lived signed access after authorization
- lifecycle deletion and retention policy

### Browser and public assets

- Content Security Policy and baseline browser security headers
- no copied third-party JavaScript/HTML entrypoints in production public paths
- legacy executable reference assets quarantined with 404 responses
- no source maps, malformed filenames or secret-bearing public files
- see `docs/security/public-assets.md`

### Abuse protection

- account and IP rate-limit keys for authentication
- distributed Redis limits for multi-instance deployments
- sensitive routes fail closed in production when a configured Redis limiter errors
- bounded in-memory fallback for environments without Redis
- alerts for Redis failure and repeated security denials

## Backend guards

- `MemberAuthGuard`
- `AdminAuthGuard`
- `PermissionsGuard`
- `IpWhitelistGuard`
- `TwoFactorGuard`
- resource/domain authorization policies

A module using a guard must import an approved module exporting every dependency. Compilation alone is not evidence; API startup is verified in CI.

## Secret management and rotation

- never commit real credentials, OTP values, tokens, private keys or private-media URLs
- use independent secrets of at least 32 characters in production
- rotate JWT, 2FA, provider, anti-bot, storage and webhook secrets through an approved dual-key or session-revocation plan
- record owner, rotation date, affected services and rollback
- run repository secret and production dependency audits before release

## Incident response

1. stop promotion and isolate the affected environment
2. preserve logs, request IDs, audit events and deployment identity
3. revoke or rotate exposed credentials and sessions
4. reconcile wallet/provider state before reopening money paths
5. restore from a verified backup when integrity is uncertain
6. document root cause, blast radius, remediation and regression coverage

Operational escalation and support procedures live in `docs/operations/support-runbook.md` and `docs/operations/ci-alert-response.md`.

## Release gates

- lint, typecheck, tests and production builds
- architecture, permission, secret, dependency and public-asset audits
- clean working tree after builds
- API bootstrap plus `/health` and `/version` commit identity
- migration status and rollback evidence
- browser smoke/visual evidence for affected UI
- provider/vendor UAT before enabling real traffic
