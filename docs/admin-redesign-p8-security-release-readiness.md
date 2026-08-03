# Admin Redesign P8 — Security, Accessibility และ Release Readiness

PR stack base: `agent/admin-phase-5-7-data-settings-design-system`

Base commit ตอนเปิดงาน: `ca97d069114d25b271c262cb7d00ab7b3d001a03`

สถานะ: Planning/Inventory — ทำคู่ขนานได้ แต่ห้าม Merge ก่อน P2, P4 และ P5–P7 ถูก Merge และ Branch ถูก Sync กับ `main` ล่าสุด

## เหตุผลที่ต้องปรับ Scope

ลิส P8 เดิมระบุเพียง Security, Accessibility และ Browser Matrix แบบกว้างเกินไป หลัง P3 และงาน P5–P7 มี Route owner, Settings owner, Table/Drawer owner และหน้าใหม่เพิ่มขึ้น จึงต้องใช้ Route inventory จริงแทนการเลือกทดสอบเฉพาะหน้าหลัก

แหล่งข้อมูลที่ใช้กำหนดลิสนี้:

- `app/(admin)/admin-nav.ts`
- `src/features/admin-modernization/settings-ownership.ts`
- PR `#492` P5–P7
- PR `#496` P4 Chart/Widget System
- `/security` owner ปัจจุบันใน `src/features/auth/admin-security-page.tsx`

## Route Inventory ปัจจุบัน

Route ที่ต้องอยู่ใน P8 coverage รวม **83 routes**:

- Route จาก Navigation registry: 56
- Route รอง/Legacy จาก permission registry: 25
- Route ที่มีไฟล์จริงหรือ Owner ใหม่แต่ตกจาก Navigation/permission list: 2

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

### Administration — 7

- `/admin-accounts`
- `/admin-roles`
- `/admin-invitations`
- `/audit`
- `/security`
- `/anti-bot`
- `/settings`

### Additional, nested และ Legacy routes — 25

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

### หน้าที่ตกจากลิสเดิม — ต้องเพิ่ม 2

1. `/system-settings`
   - เพิ่มใน P6 เป็น Write owner สำหรับ Provider, Credential และ Game configuration
   - ต้องเพิ่มเข้า Navigation และ Route permission registry
   - ต้องทดสอบ Permission, Confirm, Reason, Audit และการไม่แสดง Secret โดยไม่จำเป็น

2. `/settings/activities`
   - มีไฟล์ Route จริงและอยู่ใน P6 Settings ownership registry
   - ต้องเพิ่มเข้า Route permission registry
   - ต้องกำหนดว่าจะเปิดเป็นหน้ารองใน `/settings` หรือ Redirect เข้า Owner กลาง

## หน้าที่ไม่ต้องสร้างซ้ำ

### Security

ไม่สร้าง `/security/sessions`, `/security/2fa` หรือ `/security/recovery` แยก เพราะ `/security` มี Owner และ Tabs ครบแล้ว:

- Overview
- Sessions และ Device information
- 2FA
- Owner recovery

P8 ต้องเสริม Step-up policy, audit และ Browser/Accessibility coverage ใน Owner เดิม

### Approval และ Sensitive reveal

ไม่สร้างหน้า Approval/Audit ชุดใหม่โดยไม่มีเหตุผล ให้ใช้ Owner ที่มีอยู่:

- `/operations` สำหรับ Approval queue และ No self-approval
- `/activity-center` สำหรับรายละเอียดกิจกรรม
- `/audit` สำหรับ Audit trail
- `/security` สำหรับ Session, 2FA และ Recovery

## Route Priority สำหรับ P8

### Tier 0 — Security และเงิน

ต้องทดสอบครบทุก Role, Multi-role, DENY override และทุก Viewport:

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

ต้องทดสอบ Role ที่เกี่ยวข้อง, Desktop/Tablet/Mobile และ failure states:

- Dashboard/Widget routes
- Members/KYC/Support
- Provider/Game operations
- Growth/Promotion/Affiliate
- Settings และ `/settings/activities`
- Export, Report และ Ledger routes

### Tier 2 — Read-only, nested และ Legacy

ต้องมี Route guard, Redirect/Deprecation contract, no horizontal overflow และ smoke coverage โดยไม่จำเป็นต้องคูณทุก Persona กับทุก Browser

## P8 Batch ใหม่

### Batch 0 — Inventory และ Route closure

- เพิ่ม `/system-settings` เข้า Navigation และ permission registry
- เพิ่ม `/settings/activities` เข้า permission registry และกำหนด Owner/Redirect
- เพิ่ม audit ที่ล้มเมื่อมี `page.tsx` ใหม่แต่ไม่มี Route coverage classification
- จัด Tier 0–2 ให้ครบทุก Route

### Batch 1 — Security policy

- Approval policy และ No self-approval
- Step-up 2FA ก่อน Sensitive action
- Session revocation หลัง Role, Team, Permission, Credential หรือ Sensitive setting เปลี่ยน
- Device/session fingerprint แสดงเท่าที่จำเป็น
- Sensitive reveal ต้องมี Permission, Reason และ Audit
- Fail closed เมื่อ policy/effective access โหลดไม่ได้

### Batch 2 — Accessibility

- WCAG AA contrast และ focus visibility
- Keyboard-only สำหรับ Menu, Tabs, Table, Drawer, Modal, Chart และ Form
- Focus trap/restore และ Escape behavior
- Screen-reader labels, live region และ error summary
- Zoom 200%, text spacing และ no horizontal overflow
- Forced colors, High contrast และ Reduced motion

### Batch 3 — Browser Matrix

Persona หลัก:

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

ใช้ Tiered matrix เพื่อไม่รัน 83 routes × 7 personas × 3 viewports × 3 browsers แบบสุ่มเปลือง Runner แต่ Tier 0 ต้องครอบคลุมเต็มกว่า Tier อื่น

### Batch 4 — Visual, Performance และ Resilience

- Visual regression ทุก Owner กลาง
- Loading, Empty, Error, Partial และ Permission-denied state
- Long text, Long table, Large values และ Thai/English
- Bundle and route performance budget
- Memory/interaction leak สำหรับ Drawer, Modal, Chart และ Workspace switch
- Network timeout, retry และ stale-session behavior

### Batch 5 — Release gate

- Production smoke routes
- Migration/Seed verification
- Audit evidence และ workflow artifacts
- ไม่มี duplicate owner, duplicate writer หรือ Legacy write path
- Sync latest `main`
- Build, Typecheck, Unit, Full-system, Security, UI System, Browser Matrix และ Visual Regression ผ่านบน Head เดียวกัน

## Dependency ต่อ Phase อื่น

- P2 เป็นเจ้าของ Role, Team, Effective access, Scope, Limit และ DENY
- P3 เป็นเจ้าของ Workspace selection และ Navigation visibility
- P4 เป็นเจ้าของ Chart/Widget behavior และ Dashboard interaction
- P5 เป็นเจ้าของ Table/Form/Drawer interaction
- P6 เป็นเจ้าของ `/settings` และ `/system-settings`
- P7 เป็นเจ้าของ Design-system ownership และ CSS cleanup
- P8 ตรวจว่าทุก Owner ทำงานร่วมกันโดยไม่ลด Security, Accessibility หรือ Release quality

## Definition of Done

- Route inventory 83 รายการมี Classification ครบ
- ไม่มีหน้าใหม่ที่หลุด Route guard หรือ Browser smoke
- `/system-settings` และ `/settings/activities` ถูกลงทะเบียนถูกต้อง
- `/security` Owner เดิมรองรับ Sessions, 2FA, Recovery และ Step-up โดยไม่สร้างหน้าซ้ำ
- Tier 0 ผ่าน Security/Accessibility/Browser coverage ตาม Persona และ Viewport
- Legacy routes ถูก Redirect/Deprecated/Read-only ตาม P6 inventory
- Required CI ผ่านบน Head เดียวกัน
- Branch ถูก Retarget/Sync เข้า `main` หลัง P2, P4 และ P5–P7 Merge
