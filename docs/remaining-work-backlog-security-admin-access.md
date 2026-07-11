# Security, Admin Accounts, Roles, and Delegated Access Backlog

This document is the authoritative latest backlog for platform security, admin identity, role-based access control, delegated administration, admin account creation, session protection, approval rules, and security auditability.

When an item here overlaps with older security, admin-role, permission, account-management, session, or access-control items, this document supersedes the older wording.

## Product goal

Build a least-privilege administration system where every admin sees only the menus, records, actions, and settings explicitly allowed by their effective permissions. Admin accounts may be created only by the website Owner or by an admin who has been explicitly delegated the permission to manage admin accounts.

Security controls must be enforced in the API and database access layer, not only by hiding buttons in the frontend.

## Priority 0: Admin identity model

- [ ] Define a permanent `OWNER` authority for the website owner account.
- [ ] Ensure the Owner account cannot be silently downgraded, disabled, deleted, or have ownership transferred by a lower-privileged admin.
- [ ] Support named admin accounts only; do not share one generic admin credential.
- [ ] Store admin display name, username, email, phone where used, status, role assignments, direct permission overrides, created by, approved by, created at, updated at, last login, password changed at, and 2FA state.
- [ ] Support admin statuses: Invited, Active, Suspended, Locked, Disabled, and Revoked.
- [ ] Require unique username and email where applicable.
- [ ] Prevent reuse of deleted or revoked identity data where security policy requires retention.
- [ ] Separate Member and Admin identities, sessions, password policies, and authentication endpoints.

## Priority 0: Admin account creation and invitation

- [ ] Allow the Owner to create or invite admin accounts.
- [ ] Allow delegated admins to create or invite admin accounts only when they have the explicit `admin_accounts.create` permission.
- [ ] Require the creator to assign one or more roles or a reviewed custom permission set before activation.
- [ ] Prevent a delegated admin from granting permissions they do not possess.
- [ ] Prevent a delegated admin from creating a role with privileges equal to or greater than the Owner.
- [ ] Prevent a delegated admin from granting `admin_accounts.create`, `roles.manage`, `permissions.manage`, or ownership-management capabilities unless separately authorized.
- [ ] Use invitation links with short expiration, one-time use, revocation, and secure token storage.
- [ ] Require the invited admin to set their own password rather than receiving a reusable password from another admin.
- [ ] Require 2FA enrollment before first privileged login when policy requires it.
- [ ] Show the inviter, assigned role, permission summary, expiry, and account status in Admin.
- [ ] Allow invite resend, revoke, and expiry extension with audit logs.
- [ ] Add optional approval flow for high-privilege accounts or sensitive roles.

## Priority 0: Roles and permissions

- [ ] Implement RBAC with explicit permissions and optional scoped constraints.
- [ ] Support system roles and custom roles.
- [ ] Suggested initial system roles: Owner, Super Admin, Operations Manager, Finance Reviewer, Finance Operator, Risk Analyst, Support Agent, Game/Provider Operator, Content Manager, Auditor, and Read-only Viewer.
- [ ] Define permissions as stable semantic codes, not page names alone.
- [ ] Suggested permission domains: dashboard, members, deposits, withdrawals, wallets, ledgers, game transfers, providers, games, sessions, webhooks, reconciliation, risk, promotions, CMS, support, reports, settings, security, admin accounts, roles, permissions, audit logs, exports, maintenance, and anti-bot controls.
- [ ] Define separate permissions for view, create, edit, approve, reject, assign, export, retry, reverse, force-fail, manage secrets, manage roles, and manage accounts where relevant.
- [ ] Support permission scopes such as own queue, assigned records, team, provider, branch, region, or all records where the data model supports it.
- [ ] Support explicit deny rules when a sensitive exception is needed.
- [ ] Compute effective permissions from roles plus direct grants and denies.
- [ ] Show an effective-permission preview before saving a role or admin account.
- [ ] Add permission templates for common jobs without making them immutable.

## Priority 0: Backend enforcement

- [ ] Enforce every sensitive permission in NestJS guards, policies, or service-level authorization.
- [ ] Never rely on hidden menus or disabled frontend buttons as the only protection.
- [ ] Reject unauthorized direct API calls with a safe localized error.
- [ ] Re-check permission inside money-changing, credential-changing, role-changing, maintenance, and account-management services.
- [ ] Add object-level checks so access to one member, provider, queue, or case does not imply access to all records.
- [ ] Add ownership and assignment checks where admins are limited to assigned cases.
- [ ] Ensure exports apply the same filters and permission scopes as the on-screen table.
- [ ] Ensure background jobs and server actions preserve the initiating admin identity and permission context where relevant.
- [ ] Add automated tests proving unauthorized roles cannot reach protected endpoints.

## Priority 0: Permission-aware Admin UI

- [ ] Build the Admin sidebar, command palette, dashboard widgets, quick actions, tables, filters, exports, detail drawers, and buttons from effective permissions.
- [ ] An admin must see only the routes and actions they are allowed to use.
- [ ] Do not show empty menu groups when all child routes are forbidden.
- [ ] Hide unauthorized dashboard metrics that reveal sensitive financial or security data.
- [ ] Show a clear access-denied page for bookmarked or manually entered routes.
- [ ] Disable or remove actions immediately after permission changes without requiring a full sign-out where technically safe.
- [x] Prevent cached frontend data from remaining visible after privilege reduction.
- [ ] Translate role names, permission labels, and access-denied explanations in Thai and English.
- [ ] Provide human-readable permission descriptions, not raw codes as the primary UI.

## Priority 0: High-risk action controls

- [ ] Require step-up authentication for sensitive actions such as role changes, admin creation, secret rotation, maintenance mode, manual wallet adjustment, transfer reversal, force-fail, ownership transfer, and anti-bot provider changes.
- [ ] Support 2FA challenge or recent-password confirmation for step-up authentication.
- [ ] Add confirmation screens showing exactly what will change.
- [ ] Require a reason or note for all sensitive actions.
- [ ] Add optional dual approval for configured high-risk operations.
- [ ] Prevent the same admin from requesting and approving a dual-control action when separation of duties is enabled.
- [ ] Make approval thresholds and sensitive-action policy configurable only by authorized security administrators or the Owner.
- [ ] Never expose raw provider secrets, API keys, password hashes, session tokens, recovery codes, CAPTCHA secret keys, or bot-detection credentials.

## Priority 0: Authentication security

- [ ] Require strong password policy for admins, stricter than Member policy.
- [ ] Store passwords using a modern adaptive password hash with reviewed parameters.
- [ ] Require 2FA for Owner and privileged roles.
- [ ] Support TOTP first; reserve WebAuthn/passkeys and hardware keys in the architecture.
- [ ] Provide one-time recovery codes stored securely and regenerated only after step-up authentication.
- [ ] Add failed-login rate limiting by account and source.
- [ ] Add progressive lockout and suspicious-login alerts.
- [ ] Do not reveal whether an admin username exists during public authentication failures.
- [ ] Add secure password reset with short-lived, single-use tokens and audit records.
- [ ] Notify the admin and Owner/security team for password reset, 2FA reset, new device, suspicious login, and privilege change events.

## Priority 0: Session security

- [ ] Use short-lived admin access tokens and securely rotated refresh tokens.
- [ ] Store refresh tokens hashed or otherwise protected server-side.
- [x] Detect refresh-token reuse and revoke the affected account's remaining sessions.
- [ ] Support session revocation by device and revoke all sessions.
- [ ] Show device, browser, IP summary, approximate location where available, created time, last active time, and current-session marker.
- [ ] Set an inactivity timeout and maximum session lifetime for admins.
- [ ] Require re-authentication after sensitive permission or security changes.
- [ ] Revoke sessions immediately when an admin is disabled, suspended, locked, or stripped of critical access.
- [ ] Prevent Member tokens from being accepted by Admin endpoints and vice versa.

## Priority 0: Owner and delegated authority rules

- [ ] The Owner can create admins, assign roles, delegate admin-account management, suspend accounts, revoke access, and review all security audit logs.
- [ ] Delegated authority must be explicit, granular, revocable, and time-limited where configured.
- [ ] Delegation must record who granted it, who received it, scope, start time, expiry, and reason.
- [ ] Delegated admins may manage only accounts and roles within their allowed scope.
- [ ] No delegated admin may modify the Owner account, transfer ownership, or grant ownership.
- [ ] Ownership transfer must require step-up authentication, explicit confirmation by the current Owner, and a complete audit trail.
- [ ] Add an emergency Owner recovery process that does not rely on lower-privileged admins.
- [ ] Support break-glass access only if explicitly enabled, strongly protected, time-limited, and heavily audited.

## Priority 1: Admin account management UI

- [ ] Add Admin Accounts list with status, roles, 2FA, last login, active sessions, inviter, creator, and risk flags.
- [ ] Add create/invite wizard with identity, roles, permission preview, scope, expiry, and optional approval.
- [ ] Add admin detail page with profile, roles, direct overrides, sessions, login history, security events, created by, and audit timeline.
- [ ] Add suspend, reactivate, lock, unlock, revoke sessions, reset 2FA, resend invite, and disable actions with permission checks.
- [ ] Add bulk actions only for safe account operations and never for Owner or critical roles.
- [ ] Add filters by role, status, 2FA state, last login, creator, and risk state.
- [ ] Add clear warnings when changing permissions could remove access to money, security, or account-management functions.

## Priority 1: Role and permission management UI

- [ ] Add role list and role detail pages.
- [ ] Add permission matrix grouped by domain and action.
- [ ] Add search, select all within domain, dependency warnings, and sensitive-permission badges.
- [ ] Add diff preview before saving role changes.
- [ ] Show which admins are affected by a role change.
- [ ] Require reason and step-up authentication for sensitive role changes.
- [ ] Add role cloning with safeguards.
- [ ] Prevent deleting roles still assigned to admins unless reassignment is completed.
- [ ] Add role version history and rollback subject to permission and safety checks.

## Priority 1: Audit and security monitoring

- [ ] Record login success/failure, logout, token refresh anomalies, password change, password reset, 2FA enrollment/reset, account creation, invite actions, role assignment, permission changes, delegation, session revocation, anti-bot configuration changes, and sensitive operations.
- [ ] Record actor, target, action, timestamp, source IP summary, user agent, request ID, before/after diff, reason, approval chain, and result.
- [ ] Make security audit logs append-only from normal application flows.
- [ ] Protect audit access with a separate permission.
- [ ] Add filters, export limits, retention policy, and tamper-evidence strategy.
- [ ] Alert on privilege escalation, repeated failed logins, disabled-account access attempts, Owner changes, 2FA resets, unusual exports, mass account changes, CAPTCHA bypass spikes, and bot-score anomalies.
- [ ] Add a security dashboard with privileged accounts, accounts without 2FA, stale accounts, active sessions, recent privilege changes, unresolved alerts, CAPTCHA challenges, and blocked automation attempts.

## Priority 1: Anti-bot, CAPTCHA, and abuse protection settings

- [ ] Add a dedicated Admin page under Security for anti-bot and abuse-protection controls.
- [ ] Support pluggable providers instead of hard-coding one vendor.
- [ ] Initial provider options should include Cloudflare Turnstile, Google reCAPTCHA, hCaptcha, and an internal no-provider mode for development only.
- [ ] Store public site keys separately from secret keys and never return secret keys to the browser after saving.
- [ ] Encrypt provider secrets at rest or store them in a managed secret store where available.
- [ ] Add provider test/health-check before activation.
- [ ] Add safe fallback behavior when the selected provider is unavailable.
- [ ] Prevent disabling all protection on production without an authorized confirmation, reason, audit log, and optional step-up authentication.

### Protection modes

- [ ] Support `OFF`, `INVISIBLE_SCORE`, `CHALLENGE_ON_RISK`, and `ALWAYS_CHALLENGE` modes where supported.
- [ ] Allow separate protection settings for Member login, Admin login, registration, password reset, admin invitation acceptance, deposit submission, withdrawal submission, support forms, promotion claims, and other high-abuse endpoints.
- [ ] Allow separate rules for guests, members, admins, trusted devices, and internal service traffic.
- [ ] Support configurable score thresholds, challenge thresholds, action names, token lifetime, and verification timeout.
- [ ] Support temporary emergency mode that increases challenge strictness during attacks.
- [ ] Add scheduled activation and expiry for temporary protection rules.

### Layered bot protection

- [ ] Add rate limits by IP, account, device, route, and action risk.
- [ ] Add progressive throttling before hard blocking where appropriate.
- [ ] Add honeypot fields and minimum-form-completion timing for public forms.
- [ ] Add duplicate-submission and replay protection.
- [ ] Add disposable-email and suspicious-domain rules for registration where policy allows.
- [ ] Add IP allowlist, denylist, CIDR rules, trusted proxy handling, and country/region rules where legally and operationally appropriate.
- [ ] Add device fingerprint or risk signals only with privacy review and clear retention limits.
- [ ] Add credential-stuffing detection, password-spray detection, and abnormal login-velocity rules.
- [ ] Add user-agent, headless-browser, automation-pattern, and request-signature signals as supporting indicators, never as the sole reason for a permanent block.
- [ ] Add optional proof-of-work or email/phone verification escalation for repeated suspicious activity.
- [ ] Add webhook/API abuse controls using API keys, signatures, timestamps, nonce/replay checks, and per-client rate limits rather than CAPTCHA.

### Admin controls and visibility

- [ ] Require explicit permissions such as `security.antibot.view`, `security.antibot.update`, `security.antibot.test`, and `security.antibot.override`.
- [ ] Show only non-secret configuration values to admins with view-only permission.
- [ ] Restrict secret rotation and provider switching to the Owner or explicitly delegated security admins.
- [ ] Add configuration preview showing which routes and user groups will be affected before publish.
- [ ] Add draft, publish, rollback, and version history for anti-bot rules.
- [ ] Add a kill switch that can disable a broken provider integration while preserving rate limits and internal protections.
- [ ] Add live metrics for challenge rate, pass rate, failure rate, provider errors, blocked requests, top attacked routes, top source networks, false-positive reports, and estimated bot score distribution.
- [ ] Add filtered event logs with privacy-safe IP summaries, route, action, provider, score, decision, reason, and request ID.
- [ ] Add alert thresholds for challenge spikes, verification failures, provider outage, attack bursts, and suspicious bypass patterns.

### User experience and accessibility

- [ ] Prefer invisible or risk-based challenges for normal users and show interactive challenges only when necessary.
- [ ] Provide accessible alternatives for users who cannot complete visual or interactive challenges.
- [ ] Preserve form input when a challenge expires or fails.
- [ ] Show natural Thai and English messages that explain what happened and how to continue.
- [ ] Do not accuse a user of being a bot in primary UI copy.
- [ ] Do not trap legitimate users in an endless challenge loop.
- [ ] Add retry, provider-fallback, and contact-support paths.
- [ ] Ensure desktop, tablet, and mobile flows work for all supported challenge types.

### Testing and acceptance

- [ ] Add sandbox/test mode with clearly marked test keys and no production secrets.
- [ ] Add automated tests for valid token, invalid token, expired token, replayed token, missing token, provider timeout, and provider outage.
- [ ] Add load tests for rate limiting and attack bursts.
- [ ] Verify protected server endpoints always validate tokens server-side.
- [ ] Verify a forged or skipped frontend challenge cannot bypass backend protection.
- [ ] Verify trusted bypass rules are scoped, expiring, and audited.
- [ ] Verify anti-bot changes take effect without exposing secrets or breaking active sessions.
- [ ] Verify false-positive handling and support escalation are documented.

## Priority 1: Data protection and platform hardening

- [ ] Apply secure headers, strict CORS allowlists, CSRF protection where cookie-based flows exist, input validation, output encoding, and content security policy.
- [ ] Redact secrets, tokens, passwords, recovery codes, personal data, provider credentials, and CAPTCHA secrets from logs.
- [ ] Encrypt sensitive configuration and secrets at rest using a managed secret store where available.
- [ ] Add secret rotation and expiration workflows.
- [ ] Apply rate limits to authentication, password reset, invitation, export, anti-bot verification, and sensitive mutation endpoints.
- [ ] Add dependency scanning, secret scanning, static analysis, and container/image scanning in CI.
- [ ] Add backup, restore, incident response, and security-contact procedures.
- [ ] Review file upload validation for slips, avatars, CMS assets, and attachments.

## Bilingual requirements

- [ ] All Admin Accounts, Roles, Permissions, Security, Sessions, Login History, Invitations, Approval, Audit, CAPTCHA, Anti-bot, and Abuse Protection pages must support Thai and English.
- [ ] Permission descriptions must remain precise in both languages.
- [ ] Security warnings must use natural language and state the consequence clearly.
- [ ] Technical identifiers may appear in an expandable detail section, but primary instructions must be written for humans.
- [ ] Email and in-app security notifications must have reviewed Thai and English versions.

## Desktop, Tablet, and Mobile

- [ ] Desktop uses permission matrix, split view, dense account table, side detail drawer, keyboard navigation, and full anti-bot analytics.
- [ ] Tablet uses responsive role grids, collapsible permission groups, full-height account drawers, and adaptive security charts.
- [ ] Mobile uses card-based admin account lists, full-screen role/permission panels, sticky save or approval actions, compact anti-bot controls, and no mandatory horizontal scrolling.
- [ ] Sensitive actions must remain available only to authorized users on every supported device.
- [ ] Security and permission behavior must be identical across device classes even when presentation differs.

## Acceptance criteria

- [ ] An admin with no permission for a module cannot see its navigation, dashboard data, records, actions, exports, or API responses.
- [ ] Direct API calls cannot bypass frontend permission restrictions.
- [ ] Only the Owner or an explicitly delegated admin can create or invite admin accounts.
- [ ] A delegated admin cannot grant permissions beyond their own delegable scope.
- [ ] Owner protections cannot be bypassed by lower-privileged roles.
- [ ] All privileged actions create complete audit records.
- [ ] Owner and privileged accounts require 2FA.
- [ ] Permission changes and account suspension take effect promptly and revoke access where required.
- [ ] Thai and English are complete across all security and access-control pages.
- [ ] Desktop, Tablet, and Mobile pass authenticated permission tests and visual regression.
- [ ] Automated tests cover allowed, denied, scoped, delegated, expired, suspended, revoked, challenged, throttled, and blocked cases.
- [ ] Anti-bot protection is enforced server-side and remains effective even when frontend JavaScript is modified or bypassed.
- [ ] Production cannot silently run with invalid CAPTCHA secrets or an unreachable selected provider without raising a visible alert.

## Recommended delivery order

1. Define admin identity, Owner rules, permission codes, role model, and delegation model.
2. Implement backend authorization guards and service-level checks.
3. Implement secure admin invitations, password setup, and mandatory 2FA.
4. Implement session security and immediate revocation behavior.
5. Build permission-aware navigation and route protection.
6. Build Admin Accounts and Role/Permission management UI.
7. Add configurable CAPTCHA, rate limiting, bot scoring, abuse rules, and anti-bot analytics.
8. Add high-risk step-up authentication and optional dual approval.
9. Add security audit dashboard, alerts, and bilingual notifications.
10. Run penetration-oriented authorization tests, anti-bot bypass tests, bilingual QA, and responsive visual regression.
