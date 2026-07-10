# Current Project Status and Remaining Backlog

Last updated: 2026-07-10

This document is the current source of truth for what has been completed, what is partially complete, and what remains in `tawechok1997-ai/platform-starter`.

## Safety rules

- Do not run `pnpm prisma db push --force-reset`.
- Stop if Prisma warns about destructive data loss or asks for `--accept-data-loss`.
- Money-changing operations must be idempotent and auditable.
- Provider credentials and raw secrets must never be returned to the frontend or written to logs.
- Real-money provider integration must remain gated until adapter, credential, webhook, reconciliation, and QA checks pass.

## Current architecture

- `apps/api`: NestJS API
- `apps/web-admin`: Next.js admin application
- `apps/web-member`: Next.js member application
- `prisma`: PostgreSQL schema and seed
- Package manager: pnpm
- Deployment: Railway

## Implementation audit update — 2026-07-10

This section supersedes optimistic checkmarks that only meant "source code exists". Each item must now be classified by implementation and verification state.

### Implemented and verified

- [x] API, Admin Web, and Member Web production builds.
- [x] API Jest suite: 50/50 tests passing.
- [x] Admin permission audit: 25 controllers reviewed, 0 unguarded non-allowlisted controllers.
- [x] Admin privileged 2FA guard behavior covered by tests.
- [x] Admin login progressive lockout behavior covered by tests.
- [x] Shared Member/Admin navigation focus and keyboard improvements in local working tree.

### Implemented but not fully verified

- [ ] Member Home across six target viewports and long Thai content.
- [ ] Login/Register autofill, keyboard overlap, 200% zoom, and anti-bot failure states.
- [ ] Deposit submit, retry, invalid-file, waiting, and duplicate-submit regression.
- [ ] Withdraw bonus-block, insufficient-balance, waiting, and duplicate-submit regression.
- [ ] Transactions and bank-account long-value, empty, error, and replacement-account states.
- [ ] Admin dashboard, top-up queue, withdrawal queue, members, and wallet-ledger responsive regression.
- [ ] Keyboard-only, screen-reader labels, dynamic brand contrast, landscape, and 200% zoom review.
- [ ] Authenticated Playwright visual baselines and E2E flows with seeded test accounts.
- [ ] Browser screenshot QA on 360, 390, 430, 768, 1024, and 1440 widths.

### Scaffold or demo only — do not count as production complete

- [ ] Real provider integrations beyond demo/simulator adapters.
- [ ] Provider credential, endpoint, callback signature, retry, reconciliation, and outage verification.
- [ ] Adapter Test and Webhook Test production-safety acceptance tests.
- [ ] Game transfer retry, manual reverse, force-fail, rollback, and idempotency acceptance tests.
- [ ] Game API Settings full endpoint mapping and connection-test workflow.
- [ ] Dashboard charts for money flow, transaction status, provider health, and member growth.
- [ ] Notification backend actions, preferences, optimistic updates, and rollback; current read/archive behavior is not a complete server workflow.
- [ ] Support attachments, pagination, ticket detail lifecycle, reply refresh, and retry behavior.
- [ ] Generic Settings forms with field validation, contrast warnings, versioning, approval, and rollback.
- [ ] Anti-bot provider selection, encrypted secrets, route policies, adaptive challenge, metrics, and emergency mode.

### Newly added work from code audit

#### Owner and Admin security

- [ ] Protect the last active Owner/Super Admin from suspension, deletion, downgrade, and role removal.
- [ ] Add ownership transfer with step-up authentication, explicit confirmation, recovery path, and audit trail.
- [ ] Add Admin suspend, lock, unlock, reactivate, and revoke flows with mandatory reason notes.
- [ ] Add per-admin detail, session management, login history, suspicious-login alerts, and new-device alerts.
- [ ] Add permission coverage tests for every route, dashboard widget, export, and mutation control.
- [ ] Confirm `ADMIN_2FA_ENFORCEMENT_ENABLED=true` is present in every production environment.

#### Member product

- [ ] Complete Games lobby discovery: featured, recent, favorites, provider/category filters, and launch error states.
- [ ] Complete Promotions and Bonus claim, progress, rejection, and expiry states.
- [ ] Complete Profile overview, edit, security status, login history, and session/device UX.
- [ ] Complete Notifications backend read/archive/preferences workflow.
- [ ] Complete Support ticket creation, attachments, conversation, close/reopen, FAQ search, and empty/error states.

#### Admin product and UX

- [ ] Add persistent/collapsible sidebar, icon-only mode, pinned pages, recent pages, and command palette.
- [ ] Add global search, system health, notifications, environment badge, and quick actions.
- [ ] Add dashboard skeleton, partial-error, stale-data, retry, last-updated, and date-range states.
- [ ] Run density and responsive pass on Reports, Activity, Risk, Security, Settings, Provider, and Webhook pages.
- [ ] Replace remaining legacy inline styles with shared Admin/Member primitives where practical.
- [ ] Complete Thai/English dictionaries for Admin navigation, errors, filters, empty states, and confirmations.

#### Platform quality and release

- [ ] Commit and enforce `pnpm-lock.yaml` in CI with a reproducible package-manager version.
- [ ] Remove or update stale `platform-starter` names, badges, and documentation references in the `New-web` repository.
- [ ] Add dependency, secret, static-analysis, container, and upload-security checks to CI.
- [ ] Verify secure headers, CORS, CSP, CSRF strategy, rate limits, log redaction, backups, and restore procedure.
- [ ] Recheck the latest Railway deployments against the exact commit before release.

## Completed foundations

### Platform and responsive foundation

- [x] Monorepo structure for API, Admin, and Member applications.
- [x] PostgreSQL and Prisma integration.
- [x] Shared responsive foundations for mobile, tablet, and desktop.
- [x] Safe-area handling for iPhone-style mobile layouts.
- [x] Shared Admin UI components and responsive shells.
- [x] Shared Member finance types and reusable components.

### Member UX completed or substantially refactored

- [x] Member shell and bottom navigation.
- [x] Member home polish and wallet summary.
- [x] Transactions page refactor using the Thai label `ประวัติ`.
- [x] Bank Accounts refactor using the label `การจัดการบัญชีธนาคาร`.
- [x] Deposit flow full refactor.
- [x] Withdraw responsive foundation.
- [x] Public/Auth shell and mobile-first login/register structure.
- [x] Member login language switcher simplified to underline tabs.
- [x] Member password `แสดง / ซ่อน` action without button frame/background.
- [x] Duplicate login heading/subtitle removed.

### Admin operation and provider tooling completed or scaffolded

- [x] Admin Operation Dashboard.
- [x] Adapter Test Harness UI.
- [x] Provider Setup Wizard validation and preview.
- [x] Provider Preset preview/edit UI.
- [x] Provider credential management polish.
- [x] Provider readiness traffic-light view.
- [x] Game Transfer Recovery UI for review, retry, reverse, and force-fail actions.
- [x] Reconciliation Snapshot Detail workflow.
- [x] Webhook Settlement Test Mode panel.
- [x] Wallet Ledger Detail page.
- [x] Admin sidebar grouping.

## Admin authentication and access control completed

### Login and 2FA

- [x] Admin login with access and refresh sessions.
- [x] Admin login UI simplified to one heading.
- [x] Admin language switcher uses underline tabs without framed buttons.
- [x] Admin password `แสดง / ซ่อน` action has no frame/background.
- [x] TOTP setup and enable flow.
- [x] Recovery codes generation and regeneration.
- [x] Recovery code single-use behavior.
- [x] Session listing and revoke controls.
- [x] Forced 2FA for privileged roles and permissions.
- [x] Backend route enforcement for privileged users without 2FA.
- [x] Frontend redirect to `/security/2fa` when 2FA setup is required.
- [x] Recovery codes are displayed once and not stored in localStorage.

### Invitations

- [x] Secure admin invitation creation.
- [x] Raw invitation token displayed only once.
- [x] Token stored as a hash.
- [x] Invitation expiry enforcement.
- [x] Public invitation inspection endpoint.
- [x] Public invitation acceptance flow.
- [x] Username and password setup during activation.
- [x] Invitation token single-use protection.
- [x] Invitation revoke.
- [x] Invitation reissue.
- [x] Reissue invalidates previous active token.
- [x] Invitation lifecycle audit logs.
- [x] Dedicated invitation management UI.

### Roles and permissions

- [x] Role assignment and removal.
- [x] Privilege ceiling checks for delegated administrators.
- [x] Protected Owner/Super Admin roles.
- [x] Empty permission sets no longer become wildcard access.
- [x] Duplicate permissions are normalized.
- [x] Admin sessions are revoked after role assignment/removal.
- [x] Privilege-change session revocation is audited.
- [x] Permission-aware Admin sidebar.
- [x] UI route gate for direct URL access.
- [x] API guards remain the authoritative access boundary.
- [x] Dedicated pages:
  - `/admin-accounts`
  - `/admin-roles`
  - `/admin-invitations`

### Tests added

- [x] Invitation expiry and replay protection.
- [x] Invitation transaction rollback safety.
- [x] Invitation lifecycle revoke/reissue safety.
- [x] Delegated privilege boundary tests.
- [x] Protected Owner role tests.
- [x] Empty permission wildcard regression test.
- [x] Privileged 2FA enforcement tests.
- [x] Session revocation after privilege changes.

## Current deployment status note

Recent connector checks showed:

- API: successful on the previous completed deployment, with later API commits occasionally still pending at the moment of inspection.
- Web Member: successful.
- Web Admin: successful on previous completed deployments, with newer commits occasionally pending at the moment of inspection.

Do not treat a pending Railway deployment as a successful build. Recheck the latest commit before release.

## Immediate next work

### P0: Owner and admin account protection

- [ ] Prevent suspending the last active Owner/Super Admin.
- [ ] Prevent downgrading or removing the last protected owner account.
- [ ] Add explicit ownership transfer flow.
- [ ] Require step-up authentication for ownership transfer.
- [ ] Require current 2FA confirmation for critical owner actions.
- [ ] Add full audit entries for ownership transfer.
- [ ] Add recovery path for owner lockout.

### P0: Admin account lifecycle

- [ ] Add account suspend action.
- [ ] Add account lock action.
- [ ] Add account unlock action.
- [ ] Add reason/note requirement for every lifecycle action.
- [ ] Revoke all active sessions after suspend/lock.
- [ ] Add account detail page with status timeline.
- [ ] Add per-account session management for authorized administrators.
- [ ] Add login-history view per admin account.

### P0: Permission-aware coverage audit

- [ ] Review every Admin route and map it to a permission.
- [ ] Review every sidebar item and dashboard widget.
- [ ] Review export actions.
- [ ] Review direct API endpoints for missing `RequirePermission` decorators.
- [ ] Add automated route/permission coverage tests where practical.
- [ ] Confirm read-only users cannot see mutation controls.

### P1: CAPTCHA and anti-bot settings

- [ ] Add provider selection: Turnstile, reCAPTCHA, hCaptcha.
- [ ] Add encrypted secret storage.
- [ ] Mask secret values in Admin UI.
- [ ] Add site key and secret validation.
- [ ] Add connection/test action using sanitized responses.
- [ ] Enable CAPTCHA per route: member login, register, password reset, admin login.
- [ ] Add adaptive challenge settings.
- [ ] Add emergency mode.
- [ ] Add permissions for view/update/test/override.
- [ ] Add audit logs for every anti-bot setting change.

### P1: Admin login hardening

- [ ] Add rate limits by IP and account.
- [ ] Add failed-login counter.
- [ ] Add progressive lockout.
- [ ] Add suspicious login alerts.
- [ ] Add new-device alerts.
- [ ] Add IP and device history.
- [ ] Add CAPTCHA only when risk threshold is met.
- [ ] Add safe admin recovery flow.

### P1: Admin localization

- [ ] Move sidebar copy to shared Thai/English dictionaries.
- [ ] Localize Admin Dashboard.
- [ ] Localize Admin Accounts.
- [ ] Localize Roles and Permissions.
- [ ] Localize Invitations.
- [ ] Localize Security and 2FA.
- [ ] Localize errors, empty states, filters, and confirmations.
- [ ] Persist locale consistently across all Admin pages.

## Backend verification still required

### Game Transfer Recovery

- [ ] Verify `PATCH /admin/game-transfers/:id/actions/manual-reverse`.
- [ ] Verify `PATCH /admin/game-transfers/:id/actions/force-fail`.
- [ ] Manual reverse runs only on safe states.
- [ ] Manual reverse cannot run twice.
- [ ] Balance-changing reversal writes a WalletLedger entry.
- [ ] Force-fail runs only on safe pending states.
- [ ] Retry uses a new idempotency key.
- [ ] Retry is blocked on unsafe provider/wallet state.
- [ ] Every recovery action requires an admin note.
- [ ] Every recovery action writes an AdminAuditLog.

### Provider Preset Apply

- [ ] Accept `enabledEndpoints` from the Admin UI.
- [ ] Accept `endpointOverrides`.
- [ ] Create only selected endpoints.
- [ ] Apply overridden endpoint URLs.
- [ ] Validate duplicate provider code.
- [ ] Audit preset apply with preset and override summary.
- [ ] Return created provider ID.

### Provider credentials

- [ ] Confirm raw secret is accepted only on create/rotate.
- [ ] Confirm raw secret is never returned.
- [ ] Confirm disabled credentials are never used.
- [ ] Confirm rotation updates `rotatedAt`.
- [ ] Add or verify `lastUsedAt` metadata.
- [ ] Confirm all credential actions write AdminAuditLog.
- [ ] Ensure health-check responses are sanitized.

### Webhook test mode

- [ ] Verify admin-safe simulator endpoint.
- [ ] Verify duplicate idempotency behavior.
- [ ] Verify invalid-signature logging.
- [ ] Verify normalized parsing for rollback/win/bet-settled events.
- [ ] Confirm test mode cannot settle real balances without explicit gates.
- [ ] Confirm raw and normalized payloads are displayed safely.

### Reconciliation workflow

- [ ] Return related game session.
- [ ] Return related game transfers.
- [ ] Return related risk alert.
- [ ] Require admin note on resolve.
- [ ] Write AdminAuditLog on resolve.
- [ ] Auto-close or link related RiskAlert when appropriate.
- [ ] Add review status/timeline.

## Remaining Member work

### Member Home and game discovery

- [ ] Finish market-style mobile home polish.
- [ ] Add featured games and recently played games.
- [ ] Add promotion/banner slots.
- [ ] Add game categories.
- [ ] Add provider filter.
- [ ] Add game search.
- [ ] Add favorites.
- [ ] Add maintenance/disabled states.
- [ ] Add fallback images/icons.

### Deposit and withdrawal

- [ ] Finish guided withdraw steps.
- [ ] Add review step before withdrawal submission.
- [ ] Confirm deposit expiration behavior.
- [ ] Confirm private slip storage and access controls.
- [ ] Add pending/rejected/approved status cards consistently.
- [ ] Add responsive regression coverage.

### Member profile and security

- [ ] Profile polish.
- [ ] Change-password flow.
- [ ] Login history.
- [ ] Logout all devices.
- [ ] Account status display.

### Unified history

- [ ] Unified transaction detail page/drawer.
- [ ] Filters by type, status, and date range.
- [ ] Include deposit, withdrawal, game transfer, adjustment, bonus, and reversal.
- [ ] Use Thai labels instead of raw enums.

## Remaining Admin operations

### Deposit and withdrawal queues

- [ ] Fast review drawers.
- [ ] Approve/reject with required note.
- [ ] Queue claim/lock to prevent concurrent processing.
- [ ] Member history and wallet summary inside review.
- [ ] Audit timeline.

### Risk workflow

- [ ] Assign admin.
- [ ] Note timeline.
- [ ] Filters by severity/status/type/provider/date.
- [ ] Links to transfer, ledger, webhook, snapshot, and member.
- [ ] Safe bulk actions for low-risk alerts.
- [ ] Auto-close suggestion when related records are resolved.

### Webhook operations

- [ ] Webhook detail page.
- [ ] Dry-run replay.
- [ ] Parse test.
- [ ] Signature test.
- [ ] Duplicate event view.
- [ ] Invalid signature view.

### Provider operations

- [ ] Endpoint editor with simple UX.
- [ ] Credential version/history view.
- [ ] Callback and IP whitelist fields.
- [ ] Provider outage banner.
- [ ] Adapter documentation and sample cURL.

## Product features still incomplete

### Promotion and bonus

- [ ] Campaign management completion.
- [ ] Bonus lifecycle completion.
- [ ] Turnover tracking QA.
- [ ] Member claim flow completion.
- [ ] Admin review completion.

### Affiliate and commission

- [ ] Referral link and agent code completion.
- [ ] Commission calculation and settlement workflow.
- [ ] Downline and reports.

### CMS and content

- [ ] Mobile banners.
- [ ] Announcements.
- [ ] Popups.
- [ ] Maintenance notices.
- [ ] Game category ordering.
- [ ] Featured games management.

### KYC and risk

- [ ] Phone verification.
- [ ] Bank verification.
- [ ] Duplicate bank detection.
- [ ] Risk status.
- [ ] Blacklist.

### Customer support

- [ ] Ticket flow.
- [ ] LINE/live chat configuration.
- [ ] FAQ.
- [ ] Deposit/withdrawal issue templates.
- [ ] Link tickets to money and provider records.

## Work requiring real provider documents

Do not start provider-specific production integration until the provider supplies:

- [ ] API documentation.
- [ ] UAT endpoint.
- [ ] Production endpoint.
- [ ] API key, secret, merchant ID, or agent ID.
- [ ] Signature algorithm.
- [ ] Request/response examples.
- [ ] Error code list.
- [ ] Webhook format and signature rules.
- [ ] Game list API or static catalog.
- [ ] IP whitelist requirements.
- [ ] Callback URL requirements.

After documents arrive:

- [ ] Create provider adapter.
- [ ] Register provider code.
- [ ] Map launch, balance, transfer-in, transfer-out, and game sync.
- [ ] Map bet history when supported.
- [ ] Validate webhook signatures.
- [ ] Add provider-specific test payloads.
- [ ] Run UAT with sandbox or small dry-run amounts before real money.

## Build and QA commands

Run after each isolated work batch:

```bash
pnpm build:web-admin
pnpm build:api
pnpm build:web-member
pnpm test:e2e:smoke
```

Additional focused tests should be run for:

- Admin invitation creation/accept/revoke/reissue.
- Privilege boundaries.
- Forced 2FA.
- Empty permission safety.
- Session revocation after role changes.
- Owner protection.
- Admin account lifecycle.
- CAPTCHA/anti-bot settings.
- Deposit/withdrawal money safety.
- Provider transfer idempotency and rollback.

## Recommended execution order

1. Owner protection and admin account lifecycle.
2. Permission coverage audit.
3. CAPTCHA and anti-bot settings.
4. Admin login hardening.
5. Admin localization.
6. Verify provider recovery, preset, credential, webhook, and reconciliation backends.
7. Complete Member profile, history, game discovery, and withdrawal polish.
8. Complete queue operations and risk workflow.
9. Complete promotion, affiliate, CMS, KYC, and support modules.
10. Integrate real providers only after official provider documents and UAT access are available.
