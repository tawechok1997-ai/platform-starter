# Admin Modernization — Source Audit Corrections

> ตรวจจาก source บน `main` วันที่ 2026-07-23
>
> ไฟล์นี้เป็น correction layer สำหรับ `docs/admin-modernization-chat-worklist.md`
> จนกว่าจะรวมสถานะกลับเข้า canonical worklist แบบเต็มไฟล์
>
> หลักเกณฑ์: `[x]` มี implementation ใน source จริง · `[~]` มีบางส่วนแต่ไม่ครบข้อความของงาน · `[ ]` ยังไม่พบ implementation ตาม contract

## 1. ช่อง `[ ]` ที่ทำแล้วจริง

### `/dashboard`

- [x] เรียง System status → Urgent queue → KPI → Risk → Finance → Activity
  - Source: `apps/web-admin/app/(admin)/dashboard/page.tsx`
  - หมายเหตุ: operational queue อยู่ก่อน Activity แต่ลำดับหลักตาม contract ครบ
- [x] ลด KPI/กราฟซ้ำ
  - ลบ Finance flow แล้ว เก็บ Finance comparison เป็นกราฟการเงินหลัก

### `/operations`

- [x] งานเร่งด่วนก่อน
  - มี priority score และ sort งานที่มีจำนวนค้างก่อน
- [x] Priority filter
  - รองรับ `all`, `critical`, `member`
- [x] Action drawer ต่อรายการ
  - มี task detail dialog/drawer และลิงก์เข้าคิวจริง
- [ ] SLA/เวลาค้าง
  - ยังไม่มี age/SLA ของแต่ละ queue task

### `/wallet-ledgers`

- [x] Date filter
- [x] Type filter แยกเฉพาะ
- [x] Export CSV
- [ ] Server-side pagination
  - ปัจจุบันโหลด `/admin/money-ops/ledger?take=100` แล้วกรองฝั่ง browser

### `/wallet-statement`

- [x] Filter สมาชิก/วันที่
- [x] Running balance
- [x] Grouping ตามวัน
- [x] Export CSV/PDF
- [x] Transaction detail drawer

### `/wallet-analytics`

- [x] ช่วงเวลา 7/30/90 วัน
  - Source รองรับ 7/14/30/90 วัน
- [x] Line/bar chart
  - ใช้ bar chart ของ net flow รายวัน
- [x] Empty state
- [~] Tooltip/legend
  - มี tooltip ผ่าน `title` แต่ยังไม่มี legend contract ชัดเจน
- [ ] ลดความสูงกราฟ
  - ต้องยืนยันจาก CSS/visual evidence เพิ่ม

### `/reports`

- [~] Date range picker กลางทั้งระบบ
  - หน้า Reports มี date range picker แล้ว แต่ยังไม่ใช่ shared contract ที่ทุก route ใช้ร่วมกัน
- [ ] Comparison period
- [ ] ลดความยาวหน้า

### `/support-center`

- [~] Ticket priority
  - มี severity badge/tone และ SLA ตาม severity แต่ยังไม่มี explicit priority ordering contract
- [x] SLA
- [x] Canned response
- [x] Conversation timeline
- [x] Open/Pending/Resolved

### `/audit-risk`

- [x] Event timeline
- [x] Risk type filter
- [x] Before/after
- [x] Export
- [x] Related record

### `/game-sessions`

- [x] Session detail drawer
  - มี session detail, timeline และ transfers

### `/admin-roles`

- [x] Search
- [x] Accordion
- [x] Permission preview
- [ ] Editor/save workflow
  - หน้าปัจจุบันเป็น read-only

### `/anti-bot`

- [x] Setup wizard แบบ step
- [x] Client-side block เมื่อ key ไม่ครบ
- [ ] Test/Production mode

### `/content-center`

- [x] Raw JSON ใน Advanced mode
  - มี `Advanced: Preview JSON` แบบ read-only
- [ ] Draft/Published lifecycle ชัดเจน
- [ ] Unsaved changes warning

## 2. ช่อง `[x]` ที่ติ๊กเกิน implementation จริง

### `/promotion-center`

- [ ] Campaign/Banner/Bonus/Coupon/Reward tabs
  - Source ปัจจุบันเป็น Campaign editor หน้าเดียว ไม่มี tabs ห้าหมวด
- [ ] Draft/Published/Archived lifecycle
  - Source ใช้ `enabled` toggle ไม่มี lifecycle ดังกล่าว
- [~] Search/priority/banner preview/validation
  - มี priority, member preview และ validation แต่ยังไม่มี search
- [ ] Bulk archive พร้อม confirmation
  - ไม่พบ bulk archive workflow
- [ ] Unsaved changes warning

## 3. งานที่ตรวจแล้วว่ายังค้างจริง

- `/operations`: SLA/เวลาค้าง
- `/topups`: Sticky filter, Proof drawer
- `/withdrawals`: Proof drawer เฉพาะทาง, queue priority/SLA ordering
- `/wallet-ledgers`: Server-side pagination
- `/wallet-analytics`: chart height และ legend contract
- `/reconciliation-center`: Export รายการผิดปกติ
- `/reports`: shared date-range contract, comparison period, ลดความยาวหน้า
- `/exports`: file type/date-range contract และ row count ก่อนดาวน์โหลด
- `/risk-alerts`: Critical-first ordering contract
- `/game-providers`: Table contract และ Provider detail drawer
- `/webhook-logs`: Replay permission, server-side pagination, provider payload redaction
- `/promotion-operations`: readiness checklist, request priority, member preview
- `/promotion-center`: tabs/lifecycle/search/bulk archive/unsaved guard
- `/content-center`: lifecycle และ unsaved guard
- `/admin-roles`: editor/save workflow
- `/audit`: permission-gated export และ field-level masking
- `/settings`: shared unsaved/save-state contract
- `/anti-bot`: Test/Production mode
- `/security`: current-account login event history

## 4. งานซ้ำที่ต้องรวมก่อนพัฒนาต่อ

### D-01 — Bulk queue review

ลิสเดิมนับ Bulk review แยกใน `/topups` และ `/withdrawals` แต่มี `/bulk-queue-operations` รองรับฝาก/ถอนอยู่แล้ว

งานที่ถูกต้องเหลือหนึ่งงาน:

- [ ] เชื่อม entry point จาก Top-ups และ Withdrawals ไป Bulk Queue เดิม พร้อมส่งชนิดคิว/ตัวกรองเริ่มต้น

ห้ามสร้าง batch workflow ใหม่ในสองหน้า

### D-02 — Finance queue contract

`/topups` และ `/withdrawals` มีโครงสร้างซ้ำ:

- status filter
- pagination
- claim/release
- note
- proof preview
- busy guard
- confirmation

งานรวม:

- [ ] สร้าง shared queue shell/filter/pager/evidence contract แล้ว migrate สองหน้า

### D-03 — Unsaved changes และ save state

ซ้ำใน Promotion Center, Content Center และ Settings

งานรวม:

- [ ] Shared dirty-state hook + navigation guard + save-state contract

### D-04 — Safe error contract

ซ้ำใน Phase 1, route รายหน้า และ Definition of Done

งานรวม:

- [ ] Safe-error mapper กลาง + route audit matrix

### D-05 — Confirmation และ mutation guard

ซ้ำใน finance, security, provider, promotion, bonus, affiliate และ admin accounts

งานรวม:

- [ ] Shared confirmation contract
- [ ] Shared mutation/busy/idempotency guard

### D-06 — Drawer/focus contract

ซ้ำใน proof, KYC, promotion claim, provider, session, audit และ admin detail

งานรวม:

- [ ] Shared Drawer primitive + focus/escape/backdrop/mobile contract
- [ ] Route adoption matrix

### D-07 — Permission gating

ซ้ำใน dashboard, webhook replay, audit export, invitations และ global navigation

งานรวม:

- [ ] UI/API permission matrix กลาง

### D-08 — Responsive/mobile verification

ซ้ำใน Phase 0, route ต่าง ๆ และ Definition of Done

งานรวม:

- [ ] Route × role × viewport regression matrix

### D-09 — Payload redaction

ซ้ำใน Game Transfers, Webhook Logs, error tracking และ Definition of Done

งานรวม:

- [ ] Redaction boundary กลาง + provider fixtures/tests

### D-10 — Server table/filter/pagination

ซ้ำใน Top-ups, Withdrawals, Game Providers, Wallet Ledgers, Webhook Logs และ Audit

งานรวม:

- [ ] Shared server-table query/result contract

## 5. กติกาป้องกันทำซ้ำ

1. ก่อนเริ่ม route task ต้องตรวจ correction layer นี้ก่อน
2. งานที่อยู่ใน D-01 ถึง D-10 ให้แก้ shared contract ก่อน route adoption
3. ห้ามสร้าง component/workflow ใหม่ ถ้ามี implementation เดิมที่ทำหน้าที่เดียวกัน
4. `[x]` ต้องระบุ source path ที่ตรวจได้
5. งาน browser/focus/responsive ต้องมี evidence ก่อนเปลี่ยน `[~]` เป็น `[x]`

## 6. ผลการตรวจรอบนี้

- ช่อง `[ ]` ที่มี implementation จริงและควรเปลี่ยนเป็น `[x]`: 32 งาน
- ช่อง `[ ]` ที่ควรเปลี่ยนเป็น `[~]`: 3 งาน
- ช่อง `[x]` ที่ต้องลดสถานะใน Promotion Center: 4 งาน
- กลุ่มงานซ้ำเชิงระบบ: 10 กลุ่ม

ตัวเลขนี้นับเฉพาะหัวข้อที่เปิด source ตรวจแล้ว ไม่รวมการคาดเดาจากชื่อ route หรือเอกสาร audit เดิม
