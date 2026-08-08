# Admin Operations Handoff

> Canonical handoff สำหรับ `apps/web-admin` และ Admin-facing API owners หลัง P1–P8, authenticated PR-3 closure และ Admin closure audit วันที่ 2026-08-08

## Current baseline

Audit เริ่มจาก `main` commit `5534c0b0a9e2b29d59b71daacbf77a9a8e6e2433`.

Merged foundations:

- P5–P7 settings/data/design-system: PR #492 → `882643c496ffee91d540898a22cbc3951252996e`
- P2 access governance: PR #533 → `666955e2e509d2f8a0f499153479b3d6aea676af`
- P4 charts/widgets: PR #552 → `d7fe012d85a772fa78d7b0bc540b7d9a01746850`
- P8 security/release readiness: PR #554 → `c6084dc1e24fe36169d393b02b3954cb98ca359f`
- Layout integrity: PR #615 → `eb7f59082399e1369f01bc653d54d95f61d7d1fe`
- Authenticated PR-3 closure: PR #608 ถูก supersede และปิดโดยไม่ merge; canonical PR #622 → `719d424084acb1f8aa2ac9b983ae1a46eabadcb4`
- Reference asset hardening: PR #624 → `5534c0b0a9e2b29d59b71daacbf77a9a8e6e2433`

ห้ามใช้ข้อความ Draft, cancelled run หรือ pre-head CI จาก branch เก่าเป็น current release evidence.

## Closure audit matrix

| # | Scope | Status after audit | Evidence / action |
|---|---|---|---|
| 1 | Authenticated staging acceptance | Closed | PR #608 superseded by merged PR #622; 7 personas, 15 Tier-0 routes, 225 cases, Axe, performance and explicit DENY fail-closed |
| 2 | Settings → Member ownership | Verified | `/settings` + `/system-settings` are canonical writers; public site-settings → SiteSettingsProvider → MemberRuntimeProvider |
| 3 | Game / Provider management | Fixed + verified | Existing provider/game status, maintenance, sync, category and assets kept; closure adds Admin PC/Mobile/Both metadata + freeform tags without overwriting provider metadata |
| 4 | Member management | Fixed + one explicit blocker | Adds sessions/login history/masked bank data; KYC/Risk load through `risk.view` owners; VIP persistent owner is intentionally unresolved in Issue #625 |
| 5 | Finance / Operations | Fixed + verified | Real Prisma/ledger/reconciliation owners already exist; misleading `retry-dry-run` real-money action fixed into safe legacy rejection + explicit real `/retry` sensitive action |
| 6 | Reports / Analytics / Dashboard | Verified | Prisma-backed read models, permission guards, loading/empty/error states, date filters and CSV/export owners |
| 7 | Security / Governance | Verified + strengthened | DENY/multi-role/team/delegation/session-revoke owners remain authoritative; real provider retry now enters sensitive-action policy with reason |
| 8 | Documentation / handoff | Fixed | P2/P4/P5–P7/P8 stale Draft docs updated; this file is canonical cross-domain runbook |
| 9 | Old Admin CI alerts | Cleaned | obsolete Admin CI Alert #617 closed after comparison against merged green heads; unrelated Member/main alerts are not mass-closed |

### Remaining intentional blocker

Issue #625 is the only closure item that is not safe to fabricate: there is no verified persistent Member VIP source of truth/business rule in current `main`. Until it is defined, Admin must display VIP as unresolved instead of inventing a tier from UI fallback values.

## 1. Authenticated staging acceptance

Canonical owners:

- `docs/admin-pr3-staging-acceptance.md`
- `.github/workflows/admin-pr3-staging-acceptance.yml`
- `tests/admin-pr3-staging/admin-pr3-staging-acceptance.spec.ts`
- `prisma/seed-admin-pr3-personas.ts`

Matrix:

- 7 Admin personas: Finance, Deposit & Withdrawal, Marketing, Manager, System Administrator, Finance + Marketing multi-role, Explicit `DENY *`
- 15 Tier-0 routes
- 225 Route × Persona × Browser × Viewport cases
- Chromium Desktop all personas
- Chromium Tablet/Mobile for System Administrator and Explicit DENY
- Firefox/WebKit Desktop for System Administrator and Explicit DENY
- real login and `/admin/auth/me` effective-permission verification
- explicit DENY fail-closed
- reversible preference mutation with baseline restoration
- Axe Serious/Critical gate
- runtime navigation/resource budgets

`AdminAuthGuard` effective permissions are authoritative. `/admin/auth/me` must not re-add role permissions after an explicitly empty session permission set.

## 2. Settings ownership and Member propagation

Only two Admin write owners are allowed:

| Domain | Canonical workspace |
|---|---|
| Website, contact, SEO, legal | `/settings` |
| Branding, logo/icons, theme/layout | `/settings` |
| Feature visibility, activities/rewards | `/settings` |
| Maintenance, scripts/tracking | `/settings` |
| Provider configuration, credentials, presets/adapters | `/system-settings` |
| Legacy game API configuration | `/system-settings` |
| Home-game configuration | `/system-settings` |

Canonical files:

- `apps/web-admin/src/features/admin-modernization/settings-ownership.ts`
- `apps/web-admin/app/admin-settings-mutation-owner.ts`
- `apps/web-member/app/site-settings-provider.tsx`
- `apps/web-member/app/member-runtime-provider.tsx`
- `apps/web-member/app/site-settings-media.ts`

Propagation:

1. Admin writes through the canonical settings owner.
2. Public runtime exposes `/public/site-settings`.
3. `SiteSettingsProvider` normalizes one typed public snapshot.
4. `MemberRuntimeProvider` derives feature visibility, theme, icons, navigation, CMS/home content, game sections and summary from that snapshot.
5. Theme variables apply at document root so child Member routes inherit the same runtime theme.

The settings registry rejects duplicate data-key writers. Legacy routes are compatibility/redirect surfaces, not independent owners.

## 3. Game and Provider Management

Operational owners:

- `apps/api/src/modules/game-platform/game-availability.ts`
- `apps/api/src/modules/game-platform/game-platform.service.ts`
- `apps/api/src/modules/game-platform/game-platform-monitoring.service.ts`
- `apps/api/src/modules/game-platform/provider-reconciliation-command.service.ts`
- `apps/api/src/modules/game-platform/member-game-catalog.service.ts`
- `apps/web-admin/app/(admin)/games/page.tsx`
- `apps/web-admin/app/(admin)/game-control/page.tsx`
- `apps/web-admin/app/(admin)/game-assets/page.tsx`

Availability is fail-closed: Member cannot use a game if Admin game status or provider status is not `ACTIVE`, and provider-reported `INACTIVE`, `MAINTENANCE` or `REMOVED` also removes availability.

Closure addition:

- `/games` now owns editable `metadata.platform` as `pc`, `mobile` or `both`
- `/games` owns freeform `metadata.tags`
- category, featured/new/popular and sort remain editable
- metadata writes preserve existing provider/runtime metadata before replacing platform/tags
- Shared / PC / Mobile artwork remains owned by `/game-assets`

Do not create a second availability formula in Admin/Member UI.

## 4. Member Management

Core owner:

- `apps/api/src/modules/admin-members/admin-members-query.service.ts`

`users.view` Member detail now exposes only data inside that boundary:

- profile/status and verification timestamps
- wallet balance, locked and available balance
- member bank accounts with masked account numbers
- top-up/deposit history
- withdrawal history with masked account numbers
- wallet ledgers
- Member auth sessions
- Login history
- Admin audit activity

Additional permission boundaries stay separate:

- Risk: `/admin/risk-alerts?memberId=...` requires `risk.view`
- KYC: `/admin/kyc/members/:memberId` reuses `KycDocumentsQueryService.memberCase()` and requires `risk.view`
- KYC review remains exclusively in KYC owner with `risk.resolve`
- VIP: no persistent owner verified; tracked by Issue #625

Member status mutation still requires `users.suspend` at API guard. UI mirrors the effective permission only for UX; hiding/disable state is not authorization.

## 5. Finance and Operations

Primary owners include:

- Top-up/Deposit service and domain policy
- Withdrawal service, withdrawal policy and wallet settlement policy
- `apps/api/src/modules/money-ops/money-ops-dashboard-query.service.ts`
- ledger/reconciliation read models
- provider wallet reconciliation owners
- `apps/api/src/modules/game-platform/provider-transfer-command.service.ts`

Safety properties already present:

- idempotency keys on member money requests and provider transfer/wallet mutation
- transaction + row locks for Deposit/Withdrawal workflows
- claim ownership and claim timeout handling
- approved withdrawal bank-account validation
- wallet reserve/settlement domain policy
- ledger-backed balance mutations
- provider transfer failure rollback for wallet→provider flow
- failed transfer retry allowed only from `FAILED`
- Admin audit records for queue/retry actions
- provider gates and adapter/credential/endpoint preconditions

### Provider retry closure fix

The old UI/route labelled retry as a dry-run even though `ProviderTransferCommandService.retry()` performs real provider/wallet mutations. This is no longer allowed:

- canonical real mutation: `POST /admin/game-transfers/:id/retry`
- legacy `retry-dry-run` route rejects instead of mutating
- UI explicitly warns that Debit/Credit/Provider mutation can occur
- retry body uses `reason`, minimum 8 characters
- `PermissionsGuard` treats real retry as sensitive and requires authenticated session context + `game.providers.manage` + reason
- transfer command still enforces FAILED-only state, provider gates, adapter, credential, endpoint and rollback/idempotency rules

PR-3 browser acceptance must never mutate Production wallet, ledger, deposit, withdrawal or provider transfer data.

## 6. Reports, Analytics and Dashboard

Canonical owners:

- `apps/api/src/modules/reports/admin-dashboard-reports.controller.ts`
- `apps/api/src/modules/reports/reports-query.service.ts`
- `apps/api/src/modules/reports/admin-dashboard-read.model.ts`
- `apps/api/src/modules/reports/report-range.ts`
- `apps/web-admin/src/features/admin-modernization/admin-chart.tsx`
- `apps/web-admin/src/features/admin-modernization/admin-widget-workspace.tsx`
- `apps/web-admin/src/features/admin-modernization/chart-export.ts`
- `apps/web-admin/app/(admin)/dashboard/dashboard-widgetized.tsx`
- `apps/web-admin/app/(admin)/reports/page.tsx`

Contracts:

- dashboard/report API is permission guarded
- KPIs aggregate real Prisma TopUp/Withdrawal/Wallet/Ledger/Pending data
- custom `from`/`to` validation is backend-owned and capped
- trend presets and reconciliation/queue-aging use real read models
- loading, empty, error and partial states remain distinct
- CSV/PNG export, drill-down, fullscreen and responsive layout use shared owners
- widgets must never invent a successful KPI when permission/request/data source is unavailable

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
- delegated access cannot create authority after failed policy lookup
- sensitive values redacted from audit/evidence
- wildcard cannot bypass sensitive-action requirements
- privilege-changing Admin actions revoke sessions and write audit evidence
- unknown protected routes fail closed even for wildcard Admin
- permission-specific data such as Risk/KYC must not be moved under a weaker `users.view` response

## 8. Route and permission handoff

Use the executable route registry and API permission decorators/guards as authority. Documentation must not fork a second permission formula.

| Workspace | Primary responsibility |
|---|---|
| `/dashboard` | Role-aware operational summary and widgets |
| `/members` | Member list/detail and users.view data |
| `/kyc-center` | KYC review lifecycle |
| `/risk-alerts` | Risk queue and risk.view/resolve data |
| `/admin-accounts` | Admin identities, security and effective access |
| `/admin-roles` | Role/team/reporting/override/scope governance |
| `/settings` | Website/brand/theme/content/feature settings |
| `/system-settings` | Provider/system/game operational settings |
| `/games` | Game catalog/category/platform/tag/status |
| `/game-control` | Effective game/provider operational state |
| `/game-assets` | Shared/PC/Mobile provider/game artwork |
| `/game-transfers` | Provider transfer review and explicit real retry |
| `/reconciliation-center` | Finance/provider reconciliation |
| `/security` | Sessions, 2FA, recovery and security controls |
| `/activity-center` | Operational/audit activity presentation |

## 9. Troubleshooting runbook

### Admin sees a menu that API rejects

1. Read `/admin/auth/me` effective permissions.
2. Verify explicit DENY and delegation resolution in `AdminAuthGuard`.
3. Verify route registry/permission decorator.
4. Do not loosen `PermissionsGuard` or union role permissions back into profile response.

### Settings save but Member does not change

1. Confirm mutation owner is `/settings` or `/system-settings`.
2. Read `/public/site-settings` and verify the data key.
3. Verify `SiteSettingsProvider` normalization.
4. Verify `MemberRuntimeProvider` derives the affected value.
5. Check CMS/media lifecycle and local/remote asset resolution.

### Game/provider state differs between Admin and Member

1. Inspect Admin game/provider status.
2. Inspect provider-reported status in metadata.
3. Apply `isGameAvailableForMember()` as the single availability policy.
4. Check platform/category/tag after availability, not instead of it.

### Finance totals or pending queues disagree

1. Compare wallet ledger, transfer state and provider-wallet snapshots.
2. Check failed/pending transfers and failed/duplicate webhook queues.
3. Use reconciliation output as evidence.
4. Never patch displayed totals to hide a ledger/provider mismatch.

### Failed provider transfer needs retry

1. Confirm original status is `FAILED`.
2. Inspect provider preflight/gates and reconciliation evidence.
3. Use the explicit **real retry** action only with `game.providers.manage` and an auditable reason.
4. Never call the deprecated `retry-dry-run` route expecting a harmless simulation.
5. Re-check transfer state, wallet ledger and reconciliation after retry.

### Old CI alert appears on obsolete Admin branch

1. Identify alert commit/branch.
2. Compare against the merged head that superseded it.
3. Confirm current-head required gates are green.
4. Close only when obsolete/superseded is proven.
5. Do not revive stale branches solely to green historical runs.

## Release gates

Admin-impacting changes run relevant gates on one current head:

- Build/typecheck/tests
- P5 Security Audit
- R-006 Quality Baseline
- Admin Functional Capability Audit
- Admin Verification & Bundle
- Admin Browser Regression Matrix
- R-013 UI System / Visual Regression when presentation changes
- Full-System Automated Tests for API/shared-runtime changes
- Admin PR-3 Staging Acceptance for auth/permissions/Admin routes/API/Prisma/preferences/release-matrix changes

## Production boundary

Repository CI, disposable staging and Production deployment identity are separate evidence. Green PR-3 does not prove Railway serves newest `main`. Production identity/authenticated smoke remains read-only unless an explicitly designed recovery/mutation workflow is used.
