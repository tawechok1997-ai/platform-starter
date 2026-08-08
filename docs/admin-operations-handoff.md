# Admin Operations Handoff

> Canonical handoff สำหรับ `apps/web-admin` และ Admin-facing API owners หลัง P1–P8, PR-1/PR-2/PR-3 closure และ reference-asset hardening

## Current baseline

- Audit baseline: `main` at `5534c0b0a9e2b29d59b71daacbf77a9a8e6e2433`
- P5–P7 settings/data/design-system: PR #492, merged as `882643c496ffee91d540898a22cbc3951252996e`
- P2 access governance: PR #533, merged as `666955e2e509d2f8a0f499153479b3d6aea676af`
- P4 charts/widgets: PR #552, merged as `d7fe012d85a772fa78d7b0bc540b7d9a01746850`
- P8 security/release readiness: PR #554, merged as `c6084dc1e24fe36169d393b02b3954cb98ca359f`
- Layout integrity: PR #615, merged as `eb7f59082399e1369f01bc653d54d95f61d7d1fe`
- Authenticated PR-3 closure: stale PR #608 was closed without merge and superseded by PR #622, merged as `719d424084acb1f8aa2ac9b983ae1a46eabadcb4`
- Reference asset hardening: PR #624, merged as `5534c0b0a9e2b29d59b71daacbf77a9a8e6e2433`

Do not use stale Draft text or cancelled/pre-head CI runs as current release evidence.

## 1. Authenticated staging acceptance

Owner documents:

- `docs/admin-pr3-staging-acceptance.md`
- `.github/workflows/admin-pr3-staging-acceptance.yml`
- `tests/admin-pr3-staging/admin-pr3-staging-acceptance.spec.ts`
- `prisma/seed-admin-pr3-personas.ts`

The canonical PR-3 acceptance is the version merged through PR #622, not PR #608.

Release matrix:

- 7 Admin personas: Finance, Deposit & Withdrawal, Marketing, Manager, System Administrator, Finance + Marketing multi-role, Explicit `DENY *`
- 15 Tier-0 routes
- 225 Route × Persona × Browser × Viewport cases
- Chromium Desktop for all personas
- Chromium Tablet/Mobile for System Administrator and Explicit DENY
- Firefox/WebKit Desktop for System Administrator and Explicit DENY
- real login and `/admin/auth/me` effective-permission verification
- explicit DENY fail-closed
- reversible preference mutation with baseline restoration
- Axe Serious/Critical gate
- runtime navigation/resource budgets

`AdminAuthGuard` effective permissions are authoritative. `/admin/auth/me` must never re-add role permissions after an explicit empty session permission set.

## 2. Settings ownership and Member propagation

Only two Admin write owners are allowed:

| Domain | Canonical workspace | Main ownership source |
|---|---|---|
| Website, contact, SEO, legal | `/settings` | `settings-ownership.ts` |
| Branding, logo/icons, theme/layout | `/settings` | `settings-ownership.ts` |
| Feature visibility, activities/rewards | `/settings` | `settings-ownership.ts` |
| Maintenance, scripts/tracking | `/settings` | `settings-ownership.ts` |
| Provider configuration, credentials, presets/adapters | `/system-settings` | `settings-ownership.ts` + mutation owner |
| Legacy game API configuration | `/system-settings` | deprecated route redirects to canonical workspace |
| Home-game configuration | `/system-settings` | canonical system-settings owner |

Canonical files:

- `apps/web-admin/src/features/admin-modernization/settings-ownership.ts`
- `apps/web-admin/app/admin-settings-mutation-owner.ts`
- `apps/web-member/app/site-settings-provider.tsx`
- `apps/web-member/app/member-runtime-provider.tsx`
- `apps/web-member/app/site-settings-media.ts`

Member propagation path:

1. Admin writes settings through the canonical owner.
2. Public runtime exposes `/public/site-settings`.
3. `SiteSettingsProvider` normalizes and owns the public snapshot.
4. `MemberRuntimeProvider` derives feature visibility, theme, icons, navigation, CMS/home content, game sections and summary from the same typed snapshot.
5. Theme variables are applied at the document root, so child Member routes inherit the runtime theme instead of maintaining route-local theme owners.

The settings ownership registry rejects duplicate data-key writers. Legacy settings routes are merge/redirect/deprecated compatibility surfaces, not independent owners.

## 3. Game and Provider Management

Canonical operational chain:

- Admin system settings: provider configuration, credentials, presets/adapters and home-game configuration
- Game platform: provider adapter registry, provider queries, availability, monitoring, reconciliation and webhook status
- Member catalog: member game catalog and provider/game availability policy

Important owners include:

- `apps/api/src/modules/game-platform/game-availability.ts`
- `apps/api/src/modules/game-platform/game-provider-query.service.ts`
- `apps/api/src/modules/game-platform/game-platform-monitoring.service.ts`
- `apps/api/src/modules/game-platform/provider-reconciliation-command.service.ts`
- `apps/api/src/modules/game-platform/member-game-catalog.service.ts`

Availability is fail-closed for Member presentation: a game is unavailable when either the game or provider is not `ACTIVE`; provider-reported `INACTIVE`, `MAINTENANCE` or `REMOVED` also removes it from availability.

PC/Mobile presentation, category/tag and artwork remain presentation/catalog concerns; provider operational status remains an API/runtime concern. Do not create a second availability formula in Admin or Member UI.

## 4. Member Management

Canonical data owner:

- `apps/api/src/modules/admin-members/admin-members-query.service.ts`

The Admin member query reads the primary database and provides:

- profile and member status
- wallet balance, locked balance and available balance
- deposit/top-up history
- withdrawal history
- wallet ledger history
- Admin audit activity
- search/status/bank/KYC filters
- member insight date ranges and trends

Access-governance owners add Admin-side effective access, role/team/DENY/scope/approval-limit/session history for Admin accounts. Member mutations must remain behind API RBAC and sensitive-action policy; hiding a button in the UI is not authorization.

## 5. Finance and Operations

Canonical read models and operational owners include:

- `apps/api/src/modules/money-ops/money-ops-dashboard-query.service.ts`
- `apps/api/src/modules/money-ops/money-ops-ledger-query.service.ts`
- finance lifecycle/concurrency tests
- provider-wallet reconciliation and game transfer owners

The control center reads real Prisma-backed records for wallets, ledgers, failed/pending game transfers, provider-wallet mismatch snapshots, failed/duplicate webhooks and open risk alerts.

Mutation safety:

- destructive or money-sensitive actions require API permission enforcement and the P8 sensitive-action policy where applicable
- PR-3 acceptance never mutates Production wallet/ledger/deposit/withdrawal/provider transfer data
- real ledger mutation remains explicitly gated by runtime configuration
- reconciliation evidence must come from the ledger/provider snapshot owners, not a UI-only calculated balance

## 6. Reports, Analytics and Dashboard

Canonical owners:

- `apps/api/src/modules/reports/admin-dashboard-reports.controller.ts`
- `apps/api/src/modules/reports/reports-query.service.ts`
- `apps/api/src/modules/reports/report-range.ts`
- `apps/web-admin/src/features/admin-modernization/admin-chart.tsx`
- `apps/web-admin/src/features/admin-modernization/admin-widget-workspace.tsx`
- `apps/web-admin/src/features/admin-modernization/chart-export.ts`
- `apps/web-admin/app/(admin)/dashboard/dashboard-widgetized.tsx`

Contracts:

- dashboard/report API remains permission-guarded
- custom `from`/`to` ranges require both values and may not exceed 366 days
- chart states distinguish loading, empty, error and partial data
- CSV/PNG export, drill-down, fullscreen and responsive layouts are shared capabilities
- widgets must not invent successful KPI values when a permission, request or data source is unavailable
- role/workspace visibility and data-source permission checks are separate from visual widget visibility

## 7. Security and Governance

Canonical owners:

- `apps/api/src/modules/admin-access/admin-effective-access.ts`
- `apps/api/src/modules/admin-access/admin-access-governance.service.ts`
- `apps/api/src/modules/admin-access/admin-access-session.service.ts`
- `apps/api/src/common/admin-sensitive-action-policy.ts`
- `apps/api/src/common/admin-sensitive-action-enforcement.ts`
- `apps/api/src/common/guards/admin-auth.guard.ts`
- `apps/api/src/common/guards/permissions.guard.ts`

Required behavior:

- multi-role and team/reporting hierarchy
- explicit DENY precedence over role, delegation, ALLOW and wildcard
- fail-closed policy hydration
- delegated access cannot create authority after a failed policy lookup
- sensitive values are redacted from audit/evidence
- sensitive actions cannot bypass step-up/reason/approval through wildcard permission
- session revocation occurs after privilege-changing actions and is itself audited
- route registry denies unknown protected routes even for wildcard admins

## 8. Route and permission handoff

Use the route registry and permission guards as executable authority. Documentation must not fork a second permission formula.

Key workspaces:

| Workspace | Primary responsibility |
|---|---|
| `/dashboard` | Role-aware operational summary and widgets |
| `/members` | Member list/detail and shared data-table owner |
| `/admin-accounts` | Admin identities, security and effective access |
| `/admin-roles` | Role, team, reporting, override and scope governance |
| `/settings` | Website/brand/theme/content/feature settings |
| `/system-settings` | Provider/system/game operational settings |
| `/reconciliation-center` | Finance/provider reconciliation operations |
| `/security` | Sessions, 2FA, recovery and security controls |
| `/activity-center` | Operational/audit activity presentation |

For exact route permission resolution, use the executable Admin route registry and `PermissionsGuard`; do not maintain a hand-written duplicate list that can drift.

## 9. Troubleshooting runbook

### Admin sees a menu that API rejects

1. Read `/admin/auth/me` effective permissions.
2. Verify explicit DENY and delegation resolution in `AdminAuthGuard`.
3. Verify the protected route exists in the canonical route registry.
4. Do not fix by loosening `PermissionsGuard` or by unioning role permissions again in the profile response.

### Settings save but Member does not change

1. Confirm the mutation went through `/settings` or `/system-settings` ownership metadata.
2. Read `/public/site-settings` and verify the changed data key.
3. Verify `SiteSettingsProvider` normalization.
4. Verify `MemberRuntimeProvider` derives the affected theme/feature/icon/content value.
5. Check CMS asset lifecycle/enabled state and local/remote asset resolution.

### Game/provider state differs between Admin and Member

1. Inspect provider and game status in the game-platform API owner.
2. Inspect provider-reported status stored in game metadata.
3. Apply `isGameAvailableForMember()` as the single availability rule.
4. Verify platform/category/tag presentation after availability, not instead of it.

### Finance totals or pending queues disagree

1. Compare wallet ledger, transfer state and provider wallet snapshots.
2. Check failed/pending transfers and webhook failure/duplicate queues.
3. Use reconciliation owner output as evidence.
4. Never patch a displayed total to hide an unresolved ledger/provider mismatch.

### Old CI alert appears on an obsolete Admin branch

1. Identify the alert commit and branch.
2. Compare it with the final merged PR/head that superseded it.
3. Confirm required current-main gates are green.
4. Close the alert as obsolete/superseded with a reference to the later evidence.
5. Do not revive the stale branch merely to make its historical run green.

## Release gates

Admin-impacting changes must run the gates relevant to the affected ownership boundary on one current head. The closure baseline uses:

- Build/typecheck/tests
- P5 Security Audit
- R-006 Quality Baseline
- Admin Functional Capability Audit
- Admin Verification & Bundle
- Admin Browser Regression Matrix
- R-013 UI System and Visual Regression when presentation is affected
- Full-System Automated Tests for API/shared-runtime changes
- Admin PR-3 Staging Acceptance for auth/permissions/Admin routes/API/Prisma/preferences/release-matrix changes

## Production boundary

Repository, disposable staging and browser/CI evidence are separate from Production deployment identity. A green PR-3 matrix does not prove Railway is serving the newest `main` commit. Production identity/authenticated smoke is tracked separately and must remain read-only unless an explicitly designed recovery or mutation workflow is being used.
