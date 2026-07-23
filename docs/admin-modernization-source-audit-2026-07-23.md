# Admin Modernization — Source Audit Corrections

> ตรวจจาก source บน `main` และ browser evidence ล่าสุดวันที่ 2026-07-24
>
> ไฟล์นี้เป็น correction layer ของ `docs/admin-modernization-chat-worklist.md`
>
> `[x]` มี implementation/evidence จริง · `[~]` ทำบางส่วน · `[ ]` ยังไม่ครบ contract

## 1. สถานะที่เอกสารเดิมตาม source ไม่ทัน

### `/dashboard`

- [x] เรียง System status → Urgent queue → KPI → Risk → Finance → Activity
- [x] ลด KPI/กราฟซ้ำ เหลือ Finance comparison เป็นกราฟหลัก

### `/operations`

- [x] งานเร่งด่วนก่อน
- [x] SLA/เวลาค้างจาก `/admin/reports/queue-aging`
- [x] Priority filter: `all`, `critical`, `member`
- [x] Action drawer ต่อรายการผ่าน shared `AdminDrawer`

### `/wallet-ledgers`

- [x] Date filter
- [x] Type filter
- [x] Export CSV
- [ ] Server-side pagination

### `/wallet-statement`

- [x] Filter สมาชิก/วันที่
- [x] Running balance
- [x] Grouping ตามวัน
- [x] Export CSV/PDF
- [x] Transaction detail ผ่าน shared `AdminDrawer`

### `/wallet-analytics`

- [x] ช่วงเวลา 7/14/30/90 วัน
- [x] Bar chart
- [x] Empty state
- [~] Tooltip มีผ่าน `title` แต่ legend contract ยังไม่ชัด
- [ ] ยืนยันความสูงกราฟจาก visual evidence เพิ่ม

### `/reports`

- [~] มี date range แต่ยังไม่ใช่ shared contract ทุก route
- [ ] Comparison period
- [ ] ลดความยาวหน้า

### `/support-center`

- [~] มี severity/SLA แต่ explicit priority ordering ยังไม่ครบ
- [x] SLA
- [x] Canned response
- [x] Conversation timeline
- [x] Open/Pending/Resolved

### `/audit-risk`

- [x] Timeline, filter, before/after, export และ related record
- [x] Shared detail drawer
- [x] Route/API permission ตรงกันที่ `risk.view`

### `/game-sessions`

- [x] Session detail, timeline และ transfers ผ่าน shared drawer

### `/admin-roles`

- [x] Search
- [x] Accordion
- [x] Permission preview ผ่าน shared drawer
- [ ] Editor/save workflow

### `/anti-bot`

- [x] Step setup wizard
- [x] Block เมื่อ key/config ไม่ครบ
- [ ] Test/Production mode

### `/content-center`

- [~] Advanced JSON เป็น preview แบบ read-only
- [ ] Draft/Published lifecycle
- [x] Shared unsaved-change guard

## 2. Promotion Center ที่เอกสารเดิมติ๊กเกิน source

- [ ] Campaign/Banner/Bonus/Coupon/Reward tabs
- [ ] Draft/Published/Archived lifecycle
- [~] มี priority, member preview และ validation แต่ยังไม่มี search
- [ ] Bulk archive พร้อม confirmation
- [x] Shared unsaved-change guard

## 3. งาน route ที่ยังค้างจริง

- `/topups`: Sticky filter และ Proof drawer
- `/withdrawals`: Proof drawer และ queue priority/SLA ordering
- `/wallet-ledgers`: Server-side pagination
- `/wallet-analytics`: chart height และ legend contract
- `/reconciliation-center`: Export รายการผิดปกติ
- `/reports`: shared date range, comparison period และลดความยาวหน้า
- `/exports`: file type/date range และ row count ก่อนดาวน์โหลด
- `/risk-alerts`: Critical-first ordering
- `/game-providers`: Table contract และ Provider detail drawer
- `/webhook-logs`: Replay endpoint/workflow, server pagination และ payload redaction
- `/promotion-operations`: readiness checklist, request priority และ member preview
- `/promotion-center`: tabs, lifecycle, search และ bulk archive
- `/content-center`: lifecycle และ editable raw JSON
- `/admin-roles`: editor/save workflow
- `/audit`: field-level masking; permission-gated export ทำแล้ว
- `/anti-bot`: Test/Production mode
- `/security`: current-account login event history

## 4. งานซ้ำเชิงระบบ

### D-01 — Bulk queue review

- [x] Top-ups และ Withdrawals เชื่อมเข้า Bulk Queue เดิมพร้อม `kind`
  - Bulk: `93685fcf5335ad13f384b2dc30f86647e9be0b65`
  - Entries: `750e6f871b59c47aa0e8edc648050c1c87f654f7`, `a7a522b8c4b4f9c59f5bf342ebe5cf7876809463`

### D-02 — Finance queue contract

- [x] Shared frame/filter/pager/evidence และ migrate ฝาก/ถอน
  - `apps/web-admin/app/(admin)/_components/admin-finance-queue.tsx`

### D-03 — Unsaved changes/save state

- [x] Shared dirty-state, navigation guard และ save state
  - `apps/web-admin/app/(admin)/_components/admin-unsaved-changes.tsx`
  - ใช้ใน Settings, Promotion และ Content

### D-04 — Safe error contract

- [x] Safe-error mapper และ route audit matrix
  - Mapper: `apps/web-admin/app/(admin)/_components/admin-safe-error.ts`
  - Matrix: `docs/admin-safe-error-audit.md`

### D-05 — Confirmation/mutation guard

- [x] Shared confirmation contract
- [x] Shared busy/idempotency/in-flight dedupe boundary
  - `apps/web-admin/app/(admin)/_components/admin-mutation-guard.tsx`
  - `apps/web-admin/app/admin-api.ts`

### D-06 — Drawer/focus contract

- [x] Shared portal/focus/Escape/backdrop/scroll/mobile drawer
- [x] Adoption matrix
  - `docs/admin-drawer-adoption.md`
  - Adopted: Operations, Wallet Statement, Game Sessions, Audit Risk, Admin Roles

### D-07 — Permission gating

- [x] Shared UI/API permission matrix และ action/API alignment
  - Contract: `apps/web-admin/app/(admin)/_components/admin-permission-contract.ts`
  - Gate: `apps/web-admin/app/(admin)/_components/admin-permissions.tsx`
  - Matrix: `docs/admin-permission-matrix.md`
  - Invitation Role API, Audit export, Audit Risk และ Webhook navigation aligned
  - Webhook replay ยังไม่มีฟีเจอร์ จึงไม่แสดงปุ่ม

### D-08 — Responsive/mobile verification

- [x] Route × Role × Viewport regression matrix พร้อม browser evidence
  - Config: `playwright.admin-matrix.config.ts`
  - Suite: `tests/admin-browser-matrix/admin-route-role-viewport.spec.ts`
  - Workflow: `.github/workflows/admin-browser-regression-matrix.yml`
  - Matrix: `docs/admin-browser-regression-matrix.md`
  - Roles: Owner, Finance, Risk, Support, Read-only
  - Viewports: 1440×900, 834×1112, 390×844
  - Routes: 9
  - Browser checks: 135
  - Permission mismatches: 0
  - Runtime/critical network issues: 0
  - Maximum horizontal overflow: 0 px
  - Owner screenshots: 27
  - Workflow run: `30036250614`
  - Job: `89304839529`
  - Artifact: `8575441418`
  - Verification PR #148 ปิดโดยไม่ merge marker file

### D-09 — Payload redaction

- [ ] Redaction boundary กลาง + provider fixtures/tests

### D-10 — Server table/filter/pagination

- [ ] Shared server-table query/result contract

## 5. กติกาป้องกันทำซ้ำ

1. ตรวจ correction layer นี้ก่อนเริ่ม route task
2. งาน D-01 ถึง D-10 ให้แก้ shared contract ก่อน route adoption
3. ห้ามสร้าง component/workflow ใหม่ หากของเดิมทำหน้าที่เดียวกัน
4. `[x]` ต้องมี source path, commit หรือ browser evidence
5. Browser/focus/responsive ต้องมี workflow artifact ไม่ใช้ build status แทน browser test

## 6. สรุป

- ช่อง `[ ]` เดิมที่ source ยืนยันเป็น `[x]`: 32 งาน
- ช่อง `[ ]` เดิมที่ควรเป็น `[~]`: 4 งาน
- ช่อง `[x]` เดิมที่ลดสถานะใน Promotion Center: 4 งาน
- กลุ่มงานซ้ำเชิงระบบ: 10 กลุ่ม
- งานใหม่ที่ปิดหลัง audit: 9 งาน
  1. Operations SLA/เวลาค้าง
  2. D-01 Bulk Queue entry points
  3. D-02 Shared finance queue contract
  4. D-03 Shared unsaved-change/save-state contract
  5. D-04 Shared safe-error contract
  6. D-05 Shared confirmation/mutation guard
  7. D-06 Shared drawer/focus contract
  8. D-07 Shared UI/API permission matrix
  9. D-08 Route × Role × Viewport browser regression matrix
