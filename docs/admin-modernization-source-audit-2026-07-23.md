# Admin Modernization — Source Audit Corrections

> ตรวจจาก source บน `main` วันที่ 2026-07-23
>
> ไฟล์นี้เป็น correction layer สำหรับ `docs/admin-modernization-chat-worklist.md`
> จนกว่าจะรวมสถานะกลับเข้า canonical worklist แบบเต็มไฟล์
>
> หลักเกณฑ์: `[x]` มี implementation ใน source จริง · `[~]` ทำบางส่วนแต่ไม่ครบข้อความของงาน · `[ ]` ยังไม่พบ implementation ตาม contract

## 1. ช่อง `[ ]` ที่ทำแล้วจริง

### `/dashboard`

- [x] เรียง System status → Urgent queue → KPI → Risk → Finance → Activity
  - Source: `apps/web-admin/app/(admin)/dashboard/page.tsx`
  - Operational queue อยู่ก่อน Activity และลำดับหลักตาม contract ครบ
- [x] ลด KPI/กราฟซ้ำ
  - ลบ Finance flow แล้ว เก็บ Finance comparison เป็นกราฟการเงินหลัก

### `/operations`

- [x] งานเร่งด่วนก่อน
  - มี priority score และ sort งานที่มีจำนวนค้างก่อน
- [x] SLA/เวลาค้าง
  - ดึงข้อมูลจาก `/admin/reports/queue-aging`
  - แสดงเวลาค้างสูงสุดของคิวฝากและถอนใน KPI, queue row และ detail drawer
  - สีสถานะใช้เกณฑ์ต่ำกว่า 15 นาที / 15 นาที / 60 นาที
  - Queue-aging เป็นข้อมูลเสริม หาก endpoint นี้ล้ม Operations หลักยังใช้งานได้
  - Implementation: `f385eac19961df7fe5776fedb80b6c9b53874aee`
  - Type fix: `3ed63bd81af100c61a9f8164881a669dadcc787a`
  - Railway deploy: API, Member และ Admin ผ่าน
- [x] Priority filter
  - รองรับ `all`, `critical`, `member`
- [x] Action drawer ต่อรายการ
  - มี task detail dialog/drawer และลิงก์เข้าคิวจริง

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

- [~] Raw JSON ใน Advanced mode
  - มี `Advanced: Preview JSON` แบบ read-only แต่ยังแก้ JSON โดยตรงไม่ได้
- [ ] Draft/Published lifecycle ชัดเจน
- [x] Unsaved changes warning
  - ใช้ shared dirty-state/navigation guard และ saved snapshot หลังโหลดหรือบันทึกสำเร็จ

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
- [x] Unsaved changes warning
  - ใช้ shared dirty-state/navigation guard และ saved snapshot หลังโหลดหรือบันทึกสำเร็จ

## 3. งานที่ตรวจแล้วว่ายังค้างจริง

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
- `/promotion-center`: tabs/lifecycle/search/bulk archive
- `/content-center`: lifecycle และ editable raw JSON
- `/admin-roles`: editor/save workflow
- `/audit`: permission-gated export และ field-level masking
- `/anti-bot`: Test/Production mode
- `/security`: current-account login event history

## 4. งานซ้ำที่ต้องรวมก่อนพัฒนาต่อ

### D-01 — Bulk queue review

ลิสเดิมนับ Bulk review แยกใน `/topups` และ `/withdrawals` แต่มี `/bulk-queue-operations` รองรับฝาก/ถอนอยู่แล้ว

- [x] เชื่อม entry point จาก Top-ups และ Withdrawals ไป Bulk Queue เดิม พร้อมส่งชนิดคิว/ตัวกรองเริ่มต้น
  - `/topups` ส่ง `?kind=topups`
  - `/withdrawals` ส่ง `?kind=withdrawals`
  - Bulk Queue อ่าน query หลัง mount ก่อนโหลดข้อมูล จึงไม่เกิด hydration mismatch
  - สลับชนิดคิวแล้ว reset action เป็น `claim` ป้องกัน action เก่าค้างผิดประเภท
  - Bulk route: `93685fcf5335ad13f384b2dc30f86647e9be0b65`
  - Top-ups entry: `750e6f871b59c47aa0e8edc648050c1c87f654f7`
  - Withdrawals entry: `a7a522b8c4b4f9c59f5bf342ebe5cf7876809463`
  - Railway deploy: API, Member และ Admin ผ่าน

ห้ามสร้าง batch workflow ใหม่ในสองหน้า

### D-02 — Finance queue contract

`/topups` และ `/withdrawals` เคยมีโครงสร้าง filter, pagination, loading/empty และ evidence preview ซ้ำกัน

- [x] สร้าง shared queue shell/filter/pager/evidence contract แล้ว migrate สองหน้า
  - Shared component: `apps/web-admin/app/(admin)/_components/admin-finance-queue.tsx`
  - Shared frame คุม metric grid, toolbar, notice, loading, empty และ content stack
  - Shared toolbar คุม status options, page boundary และ disabled state
  - Shared evidence ใช้ preview contract และ CSS class เดียวกัน
  - Workflowเฉพาะฝาก/ถอน, claim/release, note และ confirmation ยังแยกตามธุรกิจเดิม
  - Shared contract: `399d3e2e3a5f8824d1c17b202a5a47b671851cd6`
  - Top-ups migration: `86b37afa9875b4cb60c56257d5a4ea759240dff1`
  - Withdrawals migration: `6c012c9d3e013255a0960c29cffeaf65215114df`
  - Optional evidence type fix: `63a6943a19c5820e64a2a004a802c79aecf76f6a`
  - Railway deploy: API, Member และ Admin ผ่าน

### D-03 — Unsaved changes และ save state

เคยแยก logic ใน Promotion Center, Content Center และ Settings

- [x] Shared dirty-state hook + navigation guard + save-state contract
  - Shared component: `apps/web-admin/app/(admin)/_components/admin-unsaved-changes.tsx`
  - Save state: `saved`, `dirty`, `saving`
  - ป้องกัน reload/ปิดแท็บด้วย `beforeunload`
  - ป้องกันคลิกลิงก์ออกจากหน้า Admin และยืนยันเพียงครั้งเดียว
  - Promotion/Content มี saved snapshot หลังโหลดและหลัง save สำเร็จ
  - Refresh ของ Promotion/Content ถามก่อนทับค่าที่แก้ค้าง
  - Settings ทุกหมวดใช้ guard ผ่าน `useAdminSettingsForm`
  - Shared guard: `1cf282479b899410ac7cc7df720337ba8688c28a`
  - Settings migration: `ffdd71ca2d51609e6a87686245319c0a1a6e8b4b`
  - Promotion migration: `9bf59366e484d870dbdcfd4ee7380695ce6c78e9`
  - Content migration: `21b962296b6c7e0f1b2378ef259c7adb3a4a8a9e`
  - Duplicate prompt fix: `9ca792e4c3e042030691262b3cffdf0409d0a56a`
  - Railway deploy: API, Member และ Admin ผ่าน

### D-04 — Safe error contract

เคยซ้ำใน Phase 1, route รายหน้า และ Definition of Done

- [x] Safe-error mapper กลาง + route audit matrix
  - Mapper: `apps/web-admin/app/(admin)/_components/admin-safe-error.ts`
  - Global boundary: `apps/web-admin/app/admin-api.ts`
  - Route matrix: `docs/admin-safe-error-audit.md`
  - ทุก non-2xx response ที่ผ่าน `adminApiFetch` ถูก sanitize ก่อน route อ่าน payload
  - ยอมให้เฉพาะข้อความธุรกิจสั้นที่ผ่าน pattern guard
  - Known code/status mapping รองรับไทยและอังกฤษ
  - ตัด top-level `stack`, `trace`, `traceback`, `debug`, `exception`, `cause`, `query`, `sql`
  - Login ที่ใช้ API client ตรงแสดงเฉพาะ generic local copy
  - Token refresh failure ไม่แสดง payload ต่อผู้ใช้
  - Mapper: `5414b660aacbcb7d1047cc1f01bbbfae6ab7fd04`
  - Global sanitization: `9bbdebd3bcfa2224c1438fc08ee48018d9e269c8`
  - Type hardening: `ce81b0615808a3e6b1307f1af19a906f850e358b`
  - Header normalization: `ffc68414a1487a42078b2feb3b02001011b9af3e`
  - Audit matrix: `a80cd491b45cf33311e76b10957f24538ec1f2c1`
  - Regression spec added: `9bce7e8902d2bd9006e3607884c5a9f8bd84957b`
  - ยังไม่อ้างว่า regression spec ผ่าน เพราะ Railway build ไม่ได้รัน `pnpm test`
  - Runtime code Railway deploy: API, Member และ Admin ผ่าน

### D-05 — Confirmation และ mutation guard

ซ้ำใน finance, security, provider, promotion, bonus, affiliate และ admin accounts

- [ ] Shared confirmation contract
- [ ] Shared mutation/busy/idempotency guard

### D-06 — Drawer/focus contract

ซ้ำใน proof, KYC, promotion claim, provider, session, audit และ admin detail

- [ ] Shared Drawer primitive + focus/escape/backdrop/mobile contract
- [ ] Route adoption matrix

### D-07 — Permission gating

ซ้ำใน dashboard, webhook replay, audit export, invitations และ global navigation

- [ ] UI/API permission matrix กลาง

### D-08 — Responsive/mobile verification

ซ้ำใน Phase 0, route ต่าง ๆ และ Definition of Done

- [ ] Route × role × viewport regression matrix

### D-09 — Payload redaction

ซ้ำใน Game Transfers, Webhook Logs, error tracking และ Definition of Done

- [ ] Redaction boundary กลาง + provider fixtures/tests

### D-10 — Server table/filter/pagination

ซ้ำใน Top-ups, Withdrawals, Game Providers, Wallet Ledgers, Webhook Logs และ Audit

- [ ] Shared server-table query/result contract

## 5. กติกาป้องกันทำซ้ำ

1. ก่อนเริ่ม route task ต้องตรวจ correction layer นี้ก่อน
2. งานที่อยู่ใน D-01 ถึง D-10 ให้แก้ shared contract ก่อน route adoption
3. ห้ามสร้าง component/workflow ใหม่ ถ้ามี implementation เดิมที่ทำหน้าที่เดียวกัน
4. `[x]` ต้องระบุ source path หรือ commit ที่ตรวจได้
5. งาน browser/focus/responsive ต้องมี evidence ก่อนเปลี่ยน `[~]` เป็น `[x]`

## 6. ผลการตรวจและการทำงานรอบนี้

- ช่อง `[ ]` เดิมที่มี implementation จริงและยืนยันเป็น `[x]`: 32 งาน
- ช่อง `[ ]` เดิมที่ควรเป็น `[~]`: 4 งาน
- ช่อง `[x]` ที่ต้องลดสถานะใน Promotion Center: 4 งาน
- กลุ่มงานซ้ำเชิงระบบ: 10 กลุ่ม
- งานใหม่ที่ปิดหลัง audit: 5 งาน
  1. `/operations` SLA/เวลาค้าง
  2. D-01 เชื่อม Top-ups/Withdrawals เข้าสู่ Bulk Queue เดิม
  3. D-02 Shared finance queue shell/filter/pager/evidence contract
  4. D-03 Shared unsaved changes/navigation/save-state contract
  5. D-04 Shared safe-error mapper/global boundary/route audit matrix

ตัวเลขนี้นับเฉพาะหัวข้อที่เปิด source ตรวจแล้ว ไม่รวมการคาดเดาจากชื่อ route หรือเอกสาร audit เดิม
