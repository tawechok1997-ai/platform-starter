# Admin Modernization — Source Audit Corrections

> ตรวจจาก source บน `main` วันที่ 2026-07-24
>
> ไฟล์นี้เป็น correction layer สำหรับ `docs/admin-modernization-chat-worklist.md`
> จนกว่าจะรวมสถานะกลับเข้า canonical worklist แบบเต็มไฟล์
>
> หลักเกณฑ์: `[x]` มี implementation ใน source จริง · `[~]` ทำบางส่วนแต่ไม่ครบ contract · `[ ]` ยังไม่พบ implementation ตาม contract

## 1. ช่อง `[ ]` เดิมที่ทำแล้วจริง

### `/dashboard`

- [x] เรียง System status → Urgent queue → KPI → Risk → Finance → Activity
- [x] ลด KPI/กราฟซ้ำ
  - ลบ Finance flow แล้ว เก็บ Finance comparison เป็นกราฟการเงินหลัก

### `/operations`

- [x] งานเร่งด่วนก่อน
- [x] SLA/เวลาค้าง
  - ใช้ `/admin/reports/queue-aging`
  - แสดงใน KPI, queue row และ detail drawer
  - เกณฑ์สีต่ำกว่า 15 นาที / 15 นาที / 60 นาที
  - Implementation: `f385eac19961df7fe5776fedb80b6c9b53874aee`
  - Type fix: `3ed63bd81af100c61a9f8164881a669dadcc787a`
- [x] Priority filter: `all`, `critical`, `member`
- [x] Action drawer ต่อรายการ
  - ปัจจุบันใช้ shared `AdminDrawer`

### `/wallet-ledgers`

- [x] Date filter
- [x] Type filter
- [x] Export CSV
- [ ] Server-side pagination
  - ปัจจุบันโหลด `/admin/money-ops/ledger?take=100` แล้วกรองฝั่ง browser

### `/wallet-statement`

- [x] Filter สมาชิก/วันที่
- [x] Running balance
- [x] Grouping ตามวัน
- [x] Export CSV/PDF
- [x] Transaction detail drawer
  - ปัจจุบันใช้ shared `AdminDrawer`

### `/wallet-analytics`

- [x] ช่วงเวลา 7/30/90 วัน
  - Source รองรับ 7/14/30/90 วัน
- [x] Bar chart
- [x] Empty state
- [~] Tooltip/legend
  - มี tooltip ผ่าน `title` แต่ยังไม่มี legend contract ชัดเจน
- [ ] ลดความสูงกราฟ
  - ต้องยืนยันจาก visual evidence

### `/reports`

- [~] Date range picker กลางทั้งระบบ
  - หน้า Reports มี picker แล้ว แต่ยังไม่ใช่ shared contract ทุก route
- [ ] Comparison period
- [ ] ลดความยาวหน้า

### `/support-center`

- [~] Ticket priority
  - มี severity และ SLA แต่ยังไม่มี explicit priority ordering contract
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
- [x] Shared detail drawer

### `/game-sessions`

- [x] Session detail drawer
  - มี timeline และ transfers
  - ปัจจุบันใช้ shared `AdminDrawer`

### `/admin-roles`

- [x] Search
- [x] Accordion
- [x] Permission preview
  - ปัจจุบันใช้ shared `AdminDrawer`
- [ ] Editor/save workflow
  - หน้าปัจจุบันเป็น read-only

### `/anti-bot`

- [x] Setup wizard แบบ step
- [x] Client-side block เมื่อ key ไม่ครบ
- [ ] Test/Production mode

### `/content-center`

- [~] Raw JSON ใน Advanced mode
  - มี Preview JSON แบบ read-only แต่ยังแก้ JSON โดยตรงไม่ได้
- [ ] Draft/Published lifecycle
- [x] Unsaved changes warning
  - ใช้ shared dirty-state/navigation guard

## 2. ช่อง `[x]` เดิมที่ติ๊กเกิน implementation

### `/promotion-center`

- [ ] Campaign/Banner/Bonus/Coupon/Reward tabs
- [ ] Draft/Published/Archived lifecycle
- [~] Search/priority/banner preview/validation
  - มี priority, member preview และ validation แต่ยังไม่มี search
- [ ] Bulk archive พร้อม confirmation
- [x] Unsaved changes warning
  - ใช้ shared dirty-state/navigation guard

## 3. งานที่ยังค้างจริง

- `/topups`: Sticky filter, Proof drawer
- `/withdrawals`: Proof drawer, queue priority/SLA ordering
- `/wallet-ledgers`: Server-side pagination
- `/wallet-analytics`: chart height และ legend contract
- `/reconciliation-center`: Export รายการผิดปกติ
- `/reports`: shared date range, comparison period, ลดความยาวหน้า
- `/exports`: file type/date range และ row count ก่อนดาวน์โหลด
- `/risk-alerts`: Critical-first ordering
- `/game-providers`: Table contract และ Provider detail drawer
- `/webhook-logs`: Replay endpoint/workflow, server pagination, provider payload redaction
- `/promotion-operations`: readiness checklist, request priority, member preview
- `/promotion-center`: tabs, lifecycle, search, bulk archive
- `/content-center`: lifecycle และ editable raw JSON
- `/admin-roles`: editor/save workflow
- `/audit`: field-level masking
- `/anti-bot`: Test/Production mode
- `/security`: current-account login event history

## 4. งานซ้ำเชิงระบบ

### D-01 — Bulk queue review

- [x] เชื่อม Top-ups และ Withdrawals ไป Bulk Queue เดิม
  - Top-ups: `?kind=topups`
  - Withdrawals: `?kind=withdrawals`
  - Bulk route: `93685fcf5335ad13f384b2dc30f86647e9be0b65`
  - Top-ups entry: `750e6f871b59c47aa0e8edc648050c1c87f654f7`
  - Withdrawals entry: `a7a522b8c4b4f9c59f5bf342ebe5cf7876809463`

### D-02 — Finance queue contract

- [x] Shared queue shell/filter/pager/evidence และ migrate ฝาก/ถอน
  - Shared: `apps/web-admin/app/(admin)/_components/admin-finance-queue.tsx`
  - Contract: `399d3e2e3a5f8824d1c17b202a5a47b671851cd6`
  - Top-ups: `86b37afa9875b4cb60c56257d5a4ea759240dff1`
  - Withdrawals: `6c012c9d3e013255a0960c29cffeaf65215114df`
  - Type fix: `63a6943a19c5820e64a2a004a802c79aecf76f6a`

### D-03 — Unsaved changes และ save state

- [x] Shared dirty-state hook + navigation guard + save-state contract
  - Shared: `apps/web-admin/app/(admin)/_components/admin-unsaved-changes.tsx`
  - Settings: `ffdd71ca2d51609e6a87686245319c0a1a6e8b4b`
  - Promotion: `9bf59366e484d870dbdcfd4ee7380695ce6c78e9`
  - Content: `21b962296b6c7e0f1b2378ef259c7adb3a4a8a9e`
  - Duplicate prompt fix: `9ca792e4c3e042030691262b3cffdf0409d0a56a`

### D-04 — Safe error contract

- [x] Safe-error mapper กลาง + route audit matrix
  - Mapper: `apps/web-admin/app/(admin)/_components/admin-safe-error.ts`
  - Boundary: `apps/web-admin/app/admin-api.ts`
  - Matrix: `docs/admin-safe-error-audit.md`
  - Mapper commit: `5414b660aacbcb7d1047cc1f01bbbfae6ab7fd04`
  - Global sanitization: `9bbdebd3bcfa2224c1438fc08ee48018d9e269c8`
  - Type hardening: `ce81b0615808a3e6b1307f1af19a906f850e358b`
  - Header normalization: `ffc68414a1487a42078b2feb3b02001011b9af3e`
  - Matrix commit: `a80cd491b45cf33311e76b10957f24538ec1f2c1`
  - Regression spec added: `9bce7e8902d2bd9006e3607884c5a9f8bd84957b`
  - ยังไม่อ้างว่า spec ผ่าน เพราะ Railway build ไม่ได้รัน `pnpm test`

### D-05 — Confirmation และ mutation guard

- [x] Shared confirmation contract
  - ใช้ `AdminConfirmDialog`
  - ฝาก ถอน และ Bulk Queue ใช้ confirmation ก่อนงานที่มีผลจริง
- [x] Shared mutation/busy/idempotency guard
  - Boundary: `apps/web-admin/app/admin-api.ts`
  - UI hook: `apps/web-admin/app/(admin)/_components/admin-mutation-guard.tsx`
  - ครอบคลุม `POST`, `PUT`, `PATCH`, `DELETE`
  - เพิ่ม `Idempotency-Key` และ dedupe คำขอ method/path/body-hash เดียวกันขณะ in-flight
  - Global boundary: `82ae60347009bff836c8ff69b1e58abb27155107`
  - Busy hook: `7a06325793df8494030a2a36c98e008968fa7d32`
  - Bulk migration: `2642396018c32b40fcaee05b81eeb4321ecd1ccb`
  - Hardening: `0434a5e3b4ab1d1716b5e5601c9cfdca08e85316`
  - Regression spec: `56ca3d0fdf480255b262fb005ad92bcd5624ced9`
  - Matrix: `docs/admin-mutation-guard-audit.md`
  - Client dedupe ไม่ใช่ cross-tab/cross-device guarantee

### D-06 — Drawer/focus contract

- [x] Shared Drawer primitive + focus/escape/backdrop/mobile contract
  - Shared: `apps/web-admin/app/(admin)/_components/admin-drawer.tsx`
  - Portal, labelled dialog, initial focus, focus trap, Escape, backdrop, scroll lock และคืน focus
  - Compact/medium/wide และ mobile `100dvh` พร้อม safe-area
  - Busy close lock, optional footer และ reduced-motion fallback
  - Primitive: `3061900d321f2373b406fae06dc8db745aa2d444`
  - Stable focus lifecycle: `d23f44323b0b0c3e7ce53a69a0d44fd0257a1c79`
- [x] Route adoption matrix
  - Matrix: `docs/admin-drawer-adoption.md`
  - Wallet Statement: `8c45252765f3b7956be19cbac12a0a6f4f93ff85`
  - Game Sessions: `5b5eb0fdfa6b8f91f89d26bdfdfc8f7e600594e5`
  - Audit Risk: `551e42782946c9d73ae4716d07fb7056360d73a5`
  - Admin Roles: `69a89cc1a005ae608ec0d53dcc763358032ea510`
  - Operations: `940e74eff737425205c2836481eba4759c85da56`
  - Browser focus/mobile evidence ยังอยู่ D-08
  - Railway deploy: API, Member และ Admin ผ่าน

### D-07 — Permission gating

- [x] UI/API permission matrix กลาง
  - Contract: `apps/web-admin/app/(admin)/_components/admin-permission-contract.ts`
  - Shared gate: `apps/web-admin/app/(admin)/_components/admin-permissions.tsx`
  - Matrix: `docs/admin-permission-matrix.md`
  - Permission contract: `78f94866fa3d4b448ffbfd34724fef7086429950`
  - Shared gate: `2cc92b99fa0317b39b32103401604fd64af81fcc`
  - Invitation roles API: `e294b7e7c684a6008b298487dc9774f1609eaa4d`, `1f06ab4cdf269c653967de1cc65ca549c48fac3f`
  - Invitation UI: `41cbd96dab9b753a9256dab56ca4aec3ec0f4c5e`, `d417a5b583398edced063503ce97aae8a32e13ed`
  - Audit export API/UI: `59d1ded6c94579f3946dcf7dca27ac63148a5cbb`, `4aef688d8de06d7ae6476e3047d166f87550112d`, `ba4fc8a11dbe8ccdf6b0489cd444b51fac40f2e6`, `147309cbaa7570e15953b3659002f21eeded470e`
  - Audit Risk permission alignment: `61d753fe576438777cb2e3f40c236702aaee5455`
  - Webhook navigation alignment: `711a62731e60161634ff13ac49c342a0fc99627f`
  - Regression spec: `4fca22bb8c3e5d09ee0aa1d5b457e72b2092c8c4`
  - Matrix sync: `2fe2039153cdde9aa28009aaa08de62a108b2055`
  - Webhook replay ยังไม่มี endpoint จึงไม่แสดงปุ่ม ฟีเจอร์นี้ยังค้างใน route task ไม่ใช่ permission mismatch
  - ยังไม่อ้างว่า permission spec ผ่าน เพราะ Railway build ไม่ได้รัน `pnpm test`
  - Railway deploy: API, Member และ Admin ผ่าน

### D-08 — Responsive/mobile verification

- [ ] Route × role × viewport regression matrix

### D-09 — Payload redaction

- [ ] Redaction boundary กลาง + provider fixtures/tests

### D-10 — Server table/filter/pagination

- [ ] Shared server-table query/result contract

## 5. กติกาป้องกันทำซ้ำ

1. ตรวจ correction layer นี้ก่อนเริ่ม route task
2. งาน D-01 ถึง D-10 ให้แก้ shared contract ก่อน route adoption
3. ห้ามสร้าง component/workflow ใหม่ หากมี implementation เดิมทำหน้าที่เดียวกัน
4. `[x]` ต้องมี source path หรือ commit
5. งาน browser/focus/responsive ต้องมี evidence ก่อนถือว่าผ่านระดับ verification

## 6. สรุปรอบนี้

- ช่อง `[ ]` เดิมที่ยืนยันเป็น `[x]`: 32 งาน
- ช่อง `[ ]` เดิมที่ควรเป็น `[~]`: 4 งาน
- ช่อง `[x]` ที่ลดสถานะใน Promotion Center: 4 งาน
- กลุ่มงานซ้ำเชิงระบบ: 10 กลุ่ม
- งานใหม่ที่ปิดหลัง audit: 8 งาน
  1. `/operations` SLA/เวลาค้าง
  2. D-01 Bulk Queue entry points
  3. D-02 Shared finance queue contract
  4. D-03 Shared unsaved changes/save-state contract
  5. D-04 Shared safe-error contract
  6. D-05 Shared confirmation/mutation guard
  7. D-06 Shared drawer/focus contract และ adoption matrix
  8. D-07 Shared UI/API permission matrix และ action/API alignment

ตัวเลขนี้นับเฉพาะหัวข้อที่เปิด source ตรวจแล้ว ไม่รวมการคาดเดาจากชื่อ route หรือเอกสารเดิม
