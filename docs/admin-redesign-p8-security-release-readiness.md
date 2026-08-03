# Admin Redesign P8 — Security, Accessibility และ Release Readiness

PR: `#497`

Branch: `agent/admin-phase-8-security-release-readiness`

Stack base ชั่วคราว: `agent/admin-phase-5-7-data-settings-design-system`

สถานะ: Implementation — ทำคู่ขนานได้ แต่ห้าม Merge ก่อน P2, P4 และ P5–P7 ถูก Merge และ Branch ถูก Retarget/Sync กับ `main` ล่าสุด

## เป้าหมาย

P8 เป็น Release gate ของ Admin ทั้งระบบ โดยไม่สร้าง Owner ซ้ำจาก Phase ก่อนหน้า:

- P2 เป็นเจ้าของ Role, Team, Effective access, Scope, Limit และ DENY
- P3 เป็นเจ้าของ Workspace selection และ Navigation visibility
- P4 เป็นเจ้าของ Chart/Widget และ Dashboard interaction
- P5 เป็นเจ้าของ Table, Form และ Drawer
- P6 เป็นเจ้าของ `/settings` และ `/system-settings`
- P7 เป็นเจ้าของ Design-system ownership และ CSS cleanup
- P8 บังคับ Security, Accessibility, Browser coverage, Resilience และ Release evidence

## Route inventory หลังปิดช่องว่าง

Route ที่ต้องอยู่ใน P8 coverage รวม **83 routes**:

- Navigation registry: **57**
- Additional, nested และ Legacy permission registry: **26**
- Unregistered known routes: **0**

### Overview — 3

- `/dashboard`
- `/operations`
- `/activity-center`

### Finance — 10

- `/topups`
- `/withdrawals`
- `/bulk-queue-operations`
- `/wallets`
- `/wallet-ledgers`
- `/wallet-statement`
- `/wallet-analytics`
- `/reconciliation-center`
- `/reports`
- `/exports`

### Members — 5

- `/members`
- `/member-insights`
- `/bank-accounts`
- `/kyc-center`
- `/support-center`

### Risk & Compliance — 3

- `/risk-alerts`
- `/provider-risk`
- `/audit-risk`

### Providers & Integrations — 13

- `/provider-health`
- `/simple-game-settings`
- `/provider-setup-wizard`
- `/provider-presets`
- `/game-providers`
- `/provider-credentials`
- `/provider-adapters`
- `/provider-wallet-snapshots`
- `/webhook-logs`
- `/webhook-settlement`
- `/webhook-test`
- `/adapter-test`
- `/game-api-settings`

### Games — 7

- `/game-control`
- `/game-control/home-games`
- `/game-assets`
- `/game-control/tournaments`
- `/games`
- `/game-sessions`
- `/game-transfers`

### Growth & Partners — 7

- `/growth-center`
- `/promotion-operations`
- `/promotion-center`
- `/promotion-claims`
- `/bonus-ledgers`
- `/affiliate-center`
- `/commission-ledgers`

### Content — 1

- `/content-center`

### Administration — 8

- `/admin-accounts`
- `/admin-roles`
- `/admin-invitations`
- `/audit`
- `/security`
- `/anti-bot`
- `/system-settings`
- `/settings`

### Additional, nested และ Legacy — 26

- `/profile`
- `/access`
- `/activity`
- `/aml`
- `/investigation`
- `/audit-logs`
- `/blacklist`
- `/finance`
- `/kyc`
- `/ledgers`
- `/member-detail`
- `/money-ops`
- `/risk-operations`
- `/settings/activities`
- `/settings/branding/history`
- `/settings/branding/preview`
- `/settings/branding`
- `/settings/icons`
- `/settings/website`
- `/settings/theme`
- `/settings/seo`
- `/settings/contact`
- `/settings/maintenance`
- `/settings/scripts`
- `/settings/features`
- `/settings/legal`

## Batch 0 — Inventory และ Route closure ✅

ทำแล้ว:

- เพิ่ม `/system-settings` เข้า Administration navigation
- ใช้ Permission ชุด Provider/Game/Feature ที่มีอยู่ ไม่สร้าง Permission ใหม่สุ่ม
- เพิ่ม `/settings/activities` เข้า specific permission registry ด้วย `settings.features.view`
- specific nested route ชนะ parent `/settings` จาก longest-prefix ordering
- กำหนด `/system-settings` และ nested routes ให้ Workspace `settings`
- เพิ่ม tests สำหรับ Navigation discovery, permission fail-closed, nested route และ unknown route
- เพิ่ม tests ล็อก Workspace owner ของ `/settings/activities` และ `/system-settings`

Owner ที่แก้:

- `apps/web-admin/app/(admin)/admin-nav.ts`
- `apps/web-admin/src/features/admin-modernization/workspaces.ts`

Tests:

- `apps/web-admin/app/(admin)/admin-nav-p8-route-closure.spec.ts`
- `apps/web-admin/src/features/admin-modernization/workspaces.spec.ts`

## Batch 1 — Security policy foundation ✅

เพิ่ม pure API policy กลาง:

- Permission หรือ wildcard authority
- Step-up evidence ผูกกับ Admin และ Session เดียวกัน
- Step-up freshness และ clock-skew validation
- Reason ขั้นต่ำสำหรับ Sensitive action
- Single/Dual approval
- Deduplicate approver
- No requester self-approval
- No target self-approval
- Wildcard ไม่ข้าม Step-up, Reason หรือ Approval
- Fail closed เมื่อ Policy ไม่ผ่าน

Sensitive reveal audit evidence:

- เก็บ Action, Permission, Actor, Session, Requester, Target และ Approver
- เก็บ Step-up method/time
- เก็บเฉพาะชื่อ Field ที่เปิดเผย
- เก็บ Reveal expiry
- ไม่รับหรือบันทึก Secret value ใน evidence contract

Files:

- `apps/api/src/common/admin-sensitive-action-policy.ts`
- `apps/api/src/common/admin-sensitive-action-policy.spec.ts`

ข้อจำกัดปัจจุบัน:

- Policy contract พร้อมแล้ว
- ยังไม่ประกาศว่า Endpoint จริงบังคับใช้ จนกว่า P2/P6 จะถูก Sync และ Service owners เรียก policy นี้
- ห้ามสร้าง Approval queue, 2FA page หรือ Audit owner ซ้ำ

## หน้าที่ไม่สร้างซ้ำ

`/security` มี Owner และ Tabs อยู่แล้ว:

- Overview
- Sessions และ Device information
- 2FA
- Owner recovery

P8 จะต่อ Step-up และ evidence เข้ากับ Owner เดิม ไม่สร้าง `/security/sessions`, `/security/2fa` หรือ `/security/recovery` ใหม่

Owner ที่ใช้ต่อ:

- `/operations` — Approval queue และ No self-approval
- `/activity-center` — Activity detail
- `/audit` — Audit trail
- `/security` — Session, 2FA และ Recovery

## Batch 2 — Accessibility 🚧

ทำแล้วชุดแรก:

- เพิ่ม Browser Matrix smoke สำหรับ `/system-settings`
- เพิ่ม Browser Matrix smoke สำหรับ `/settings/activities`
- ตรวจ Main/Heading/Link landmarks
- ตรวจ Keyboard focus ไม่ตกที่ document body
- ตรวจ Focus target มองเห็นได้
- ตรวจ Form control มี Label หรือ ARIA name
- ตรวจ Reduced motion
- ตรวจ Horizontal overflow
- ใช้ Matrix เดิมจึงรัน Desktop, Tablet และ Mobile

File:

- `tests/admin-browser-matrix/admin-p8-route-accessibility.spec.ts`

ยังเหลือ:

- WCAG AA contrast และ focus visibility ทุก Tier 0 owner
- Keyboard-only สำหรับ Menu, Tabs, Table, Drawer, Modal, Chart และ Form
- Focus trap/restore และ Escape behavior
- Screen-reader live region และ error summary
- Zoom 200%, text spacing และ forced colors

## Route priority

### Tier 0 — Security และเงิน

ต้องทดสอบ Role, Multi-role, DENY override และทุก Viewport:

- `/security`
- `/admin-accounts`
- `/admin-roles`
- `/admin-invitations`
- `/access`
- `/audit`
- `/operations`
- `/topups`
- `/withdrawals`
- `/bulk-queue-operations`
- `/wallets`
- `/reconciliation-center`
- `/risk-alerts`
- `/provider-credentials`
- `/system-settings`

### Tier 1 — Operational owners

- Dashboard/Widget routes
- Members/KYC/Support
- Provider/Game operations
- Growth/Promotion/Affiliate
- Settings และ `/settings/activities`
- Export, Report และ Ledger routes

### Tier 2 — Nested และ Legacy

ต้องมี Route guard, Redirect/Deprecation contract, no horizontal overflow และ smoke coverage โดยไม่คูณทุก Persona กับทุก Browser

## Batch 3 — Browser Matrix

Persona:

1. Finance
2. Deposit & Withdrawal
3. Marketing
4. Manager
5. System Administrator
6. Multi-role
7. Explicit DENY override

Viewport:

- Desktop 1440×900
- Tablet 834×1112
- Mobile 390×844

Browser:

- Chromium
- Firefox
- WebKit

ใช้ Tiered matrix เพื่อควบคุม Runner แต่ Tier 0 ต้องครอบคลุมเต็มกว่า Tier 1–2

## Batch 4 — Visual, Performance และ Resilience

- Visual regression ทุก Owner กลาง
- Loading, Empty, Error, Partial และ Permission-denied
- Long text, Long table, Large values และ TH/EN
- Bundle/route performance budget
- Drawer, Modal, Chart และ Workspace interaction leak
- Network timeout, retry และ stale-session behavior

## Batch 5 — Release gate

- Production smoke routes
- Migration/Seed verification
- Audit evidence และ workflow artifacts
- ไม่มี duplicate owner, duplicate writer หรือ Legacy write path
- Retarget `main` หลัง Dependency Merge
- Sync latest `main`
- Build, Typecheck, Unit, Full-system, Security, UI System, Browser Matrix และ Visual Regression ผ่านบน Head เดียวกัน

## Definition of Done

- Route inventory 83 รายการมี Permission และ Workspace owner ครบ
- ไม่มีหน้าใหม่หลุด Route audit หรือ Browser smoke
- Sensitive endpoints เรียก P8 policy จริงหลัง Sync P2/P6
- `/security` รองรับ Session, 2FA, Recovery และ Step-up โดยไม่สร้างหน้าซ้ำ
- Tier 0 ผ่าน Security/Accessibility/Browser coverage ตาม Persona และ Viewport
- Legacy routes เป็น Redirect/Deprecated/Read-only ตาม P6 inventory
- Required CI ผ่านบน Head เดียวกัน
- Branch ถูก Retarget/Sync เข้า `main` หลัง P2, P4 และ P5–P7 Merge
