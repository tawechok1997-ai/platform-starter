# Web UI Remaining Worklist

Updated: 2026-07-21  
Scope: `apps/web-admin`  
Status source: source-code inspection of `main`; items marked “ต้องยืนยัน” require rendered/browser evidence.

## Status legend

- ✅ ทำแล้วใน source
- 🟡 ทำบางส่วน / ต้องเก็บงาน
- ⏳ ยังเหลือ
- 🧪 ต้องยืนยันด้วย browser, accessibility หรือ release evidence

## Project-fit rules

- **Scope:** Admin UI only (`apps/web-admin`) plus shared design tokens only when a page-level fix cannot solve the issue.
- **Reuse first:** use existing `AdminPage`, `AdminCard`, `AdminMetric`, `AdminBadge`, `AdminConfirmDialog`, `AdminBulkAction`, `AdminIcon` and `packages/api-client`.
- **No unapproved stack expansion:** do not add Tailwind, shadcn, Radix, TanStack, form libraries, chart libraries, or motion libraries for visual polish without an ADR and bundle/ownership review.
- **Contract safety:** preserve API routes, permissions, audit metadata, money semantics and production/UAT gates. UI changes must not enable real-money mutations.
- **Evidence rule:** “✅” means source implementation exists; it does not mean the rendered route is released. Move 🧪 to ✅ only after browser, accessibility and relevant build evidence.
- **Change slices:** land one coherent slice at a time: shared shell → safety/formatters → high-frequency queues → detail modules → visual polish/QA.

## Recommended execution slices

| Slice | Files/routes | Exit criteria |
|---|---|---|
| S1 Shell consistency | `(admin)/layout.tsx`, `admin-*.css`, design tokens | Sidebar/Profile decision, one palette, responsive shell, keyboard focus |
| S2 Safety baseline | `admin-ui.tsx`, game transfers, operations, provider credentials | safe errors, no raw payload, finite money formatting, permission guards |
| S3 Operations workflow | dashboard, operations, topups, withdrawals, bulk queue | queue priority/SLA, non-duplicated KPIs, confirmation/reason/audit |
| S4 Domain completeness | members, KYC, bank, support, risk, providers, growth, settings | loading/empty/error/permission states and mutation guards per route |
| S5 Release evidence | package lint/typecheck/build, Playwright, axe, six viewports | screenshots, console/network results, commit/deployment identity |

## Phase 0 — Shared foundation

| งาน | สถานะ | ขอบเขต |
|---|---:|---|
| Shared design tokens, status colors, buttons, badges, cards | 🟡 | รวมสีทอง/ม่วงให้เหลือ visual language เดียว; ลด CSS cascade |
| Thai typography (Noto Sans Thai/IBM Plex Sans Thai) | ⏳ | เพิ่ม font loading และกำหนด fallback ที่เหมาะสม |
| Shared Admin shell | 🟡 | shell มีแล้ว แต่ Profile ยังอยู่ Topbar |
| Profile block ใน Sidebar | ⏳ | avatar, name, role, online state, dropdown; เอา profile ซ้ำจาก Topbar ออก |
| Favorites / Recently used | ⏳ | เก็บแบบ permission-aware และไม่เพิ่ม route ซ้ำ |
| Command Palette | ✅ | มี Ctrl/Cmd+K ใน Admin layout |
| Notification Center | ✅ | มี queue/risk notifications |
| Environment badge | ✅ | มี Production/UAT badge |
| Responsive shell | 🟡 | มี responsive CSS; ต้องยืนยันที่ 360/390/430/768/1024/1440 |
| Shared loading/empty/error/permission states | 🟡 | primitive มีแล้ว; ต้องเติม route ที่ยังใช้ข้อความเฉพาะหน้า |

## Phase 1 — Bugs and security

| งาน | สถานะ | ขอบเขต |
|---|---:|---|
| กัน THB NaN ทุก formatter | 🟡 | game-transfers กันแล้วบางส่วน; ตรวจ operations และ shared formatter |
| Prisma/UUID error ใน member insights | 🟡 | route ใช้ API insights แล้ว; ต้องยืนยัน error path และ member detail route |
| ห้ามแสดง raw backend/provider error | ⏳ | เพิ่ม safe error mapper และไม่ render payload/errorMessage ตรง ๆ |
| ซ่อน technical payload ตาม permission | ⏳ | game-transfers/adapter/webhook ใช้ redaction + permission guard |
| Credential ตัวอย่าง / Demo-UAT-Production | 🟡 | provider credentials mask และตรวจ placeholder แล้ว; ยังต้องแยก environment ให้ชัด |
| 2FA/recovery/session security | ✅ | setup, QR, recovery codes และ session controls มี source รองรับ |
| Audit สำหรับ action สำคัญ | 🟡 | หลาย workflow มี reason/confirmation; ต้องตรวจ endpoint coverage |
| Confirmation และ disabled action | 🟡 | primitive/dialog มีแล้ว; ตรวจทุก mutation route ให้ครบ |

## Login

- ✅ validation, field error, password toggle, 2FA, loading, locale buttons
- 🟡 session-timeout notice และ accessibility association ของ error/help
- 🧪 ต้องยืนยัน desktop/mobile, keyboard, screen reader และ production copy

## Dashboard / Operations

### /dashboard

- 🟡 มี system status, queue, KPI, risk, finance และ activity แล้ว
- ⏳ ลด KPI/Finance card ที่ซ้ำ
- ⏳ เพิ่ม SLA countdown ที่อ่านง่าย
- ⏳ เพิ่ม Quick Actions แบบ permission-aware
- ⏳ จำกัด Recent Ledger เหลือ 5 รายการ + ดูทั้งหมด
- 🧪 ยืนยัน role-based dashboard และ responsive visual baseline

### /operations

- ✅ มี urgent summary และ quick links
- 🟡 มี queue age บางส่วน
- ⏳ priority filter, SLA countdown และ action drawer ต่อรายการ
- ⏳ เอาข้อความ debug/technical ออกจากเส้นทางใช้งานปกติ
- ⏳ ตรวจเงินทุกจุดไม่ให้ NaN

### /activity-center

- 🟡 มี activity data path
- ⏳ แยก Activity/Audit/Risk/Finance, timeline, severity filter และ detail drawer

## Finance

- 🟡 Topups/Withdrawals: มี workflow และ confirmation บางส่วน; ต้องทำ table/filter/drawer ให้เป็น pattern เดียว
- ✅ Bulk Queue: มี selected IDs, claim/release, workflow reason และ step-up
- 🟡 Wallets: ต้องยืนยัน balance before/after, adjustment reason และ confirmation ทุก mutation
- 🟡 Wallet Ledgers: ต้องยืนยัน filter/type/pagination/expand/export
- ✅ Wallet Statement: date/member filter, daily grouping, running balance, drawer, CSV และ print/PDF
- 🟡 Wallet Analytics: ต้องยืนยัน 7/30/90, chart accessibility, tooltip, legend และ empty state
- 🟡 Reconciliation/Reports/Exports: ต้องยืนยัน variance, export progress, retry, pagination และ row count ก่อนดาวน์โหลด

## Members / Risk

- ✅ Members: table, drawer, status/KYC/bank filters, masking บางส่วน
- ✅ Member Insights: trend, segmentation, date range, data source
- 🟡 Bank Accounts: ต้องยืนยัน receive/withdraw separation, duplicate warning และ approval guard
- 🟡 KYC Center: ต้องยืนยัน checklist, evidence drawer, risk reason และ reject reason
- 🟡 Support Center: ต้องยืนยัน priority, SLA, canned response และ conversation timeline
- 🟡 Risk Alerts: มี filters, scan, bulk dismiss และ reason; ต้องยืนยัน critical ordering/evidence/acknowledge
- 🟡 Provider Risk/Audit Risk: ต้องยืนยัน readiness, before/after, related record และ export

## Games / Providers

- 🟡 Provider Health: status/latency/webhook มีบางส่วน; saved views ยังต้องยืนยัน
- 🟡 Setup Wizard/Presets/Game Providers/Games/Sessions: ต้องตรวจ checklist, readiness, filters, drawer และ safe mutation
- 🟡 Game Transfers: direction/status/idempotency/retry มีแล้วบางส่วน; raw payload/error safety และ money formatting ยังเหลือ
- 🟡 Webhook Logs: ต้องยืนยัน signature status, payload drawer และ permission-gated replay

## Promotion / Growth

- 🟡 Growth/Promotion Operations/Promotion Center/Claims: ต้องยืนยัน status lifecycle, readiness, preview, SLA, reject reason และ bulk archive
- ✅ Bonus Ledger: source มี turnover/status/wallet impact/approval guard; ต้องยืนยัน rendered behavior
- ✅ Affiliate: downline, commission rule, duplicate warning และ review guard
- ✅ Commission Ledger: preview, basis/rate/cap และ confirmation
- 🟡 Content Center: route แยก feature แล้ว; ต้องยืนยัน PC/Mobile preview, asset validation, publish workflow และซ่อน raw JSON

## Admin / Settings / Security

- 🟡 Admin Accounts/Roles/Invitations: ต้องยืนยัน drawer, permission preview, resend/revoke, expiry และ validation
- 🟡 Audit: ต้องยืนยัน server pagination, module/action/user/IP filters, before/after และ permissioned export
- ⏳ Settings: ทำเป็น category index + search + quick links + unsaved warning
- 🟡 Anti-bot: ต้องยืนยัน setup wizard, test/production separation, route checklist และ key gate
- ✅ Security: 2FA, recovery codes, active sessions และ revoke flow
- 🟡 Provider Credentials: mask/rotation/test มีแล้ว; environment separation และ no-placeholder gate ต้องยืนยัน
- 🟡 Adapter Test/Game API Settings: ต้องยืนยัน safe/prod separation, payload redaction, preflight และ real-money gate

## Definition of Done

ทุก route ต้องผ่าน:

- ไม่มี NaN หรือ invalid money display
- ไม่มี raw backend/provider/SQL payload ใน UI ปกติ
- มี loading, empty, error, retry, permission และ session-expired state
- mutation สำคัญมี permission, confirmation, reason, busy/duplicate protection และ audit
- keyboard/focus/aria-label/200% zoom ใช้งานได้
- mobile 360–430px ไม่ล้นหรือซ้อน; desktop/tablet รักษาลำดับข้อมูล
- ผ่าน package lint, typecheck, build, targeted tests, Playwright smoke และ axe
- มี screenshot/console/network evidence ก่อนประกาศว่าเสร็จ
