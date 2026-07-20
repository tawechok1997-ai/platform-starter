# Admin UI / Design System Refactor Worklist

เอกสารนี้เป็น source of truth สำหรับงานรีแฟกเตอร์ UI และ Design System ของ `apps/web-admin` โดยเฉพาะ แยกจาก `docs/admin-redesign-worklist.md` ซึ่งติดตามงานระบบและขอบเขตผลิตภัณฑ์หลัก

กติกา:

- ติ๊ก `[x]` เมื่อ implementation อยู่ใน `main` และ build ที่เกี่ยวข้องผ่าน
- รวมงานที่ไม่ชนไฟล์กันในรอบเดียว และรัน CI หลัง commit ชุดสุดท้ายเพื่อลดรอบ
- ห้ามแก้ไฟล์เดียวพร้อมกันหลายสาย
- ใช้ shared component ก่อนสร้างรูปแบบเฉพาะหน้า
- จำนวนงานต้องนับจาก checkbox จริง ไม่ใช้ตัวเลขที่จำจากบทสนทนา เพราะมนุษย์เก่งเรื่องทำตัวเลขคลาดเคลื่อนอย่างน่าประหลาด

อัปเดตล่าสุด: **2026-07-20**

## P0 — Foundation

- [x] ป้องกันข้อความและรหัสยาวล้น container กลาง
- [x] ทำ Page header responsive กลาง
- [x] ทำ Card spacing, compact mode และ responsive behavior กลาง
- [x] ทำ Typography hierarchy กลาง
- [x] ทำ Button tone และ size system
- [x] ทำ Dialog portal, scroll lock, safe area และ focus เริ่มต้น
- [x] ทำ Toolbar responsive baseline
- [x] ทำ Metric responsive baseline
- [x] เพิ่ม shared code และ data-value components

## P1 — UX wording

- [ ] กวาดคำอังกฤษที่ไม่จำเป็นในหน้า Admin หลัก
- [ ] ทำ action labels ให้สั้นและใช้คำเดียวกันทั้งระบบ
- [ ] ทำ status wording ให้ใช้ mapping กลาง
- [ ] ลดคำอธิบายที่ยาวเกินใน page/card/dialog
- [ ] เปลี่ยนข้อความเชิงเทคนิคให้ผู้ดูแลเข้าใจง่าย โดยยังเปิดดูค่าจริงได้

## P2 — Unified layout

- [ ] ทำ grid ของหน้าหลักให้ใช้ pattern เดียวกัน
- [ ] ทำ page และ section spacing ให้สม่ำเสมอ
- [ ] ทำ action area ให้ใช้ตำแหน่งและ wrapping contract เดียวกัน
- [x] เพิ่ม shared filter bar
- [x] เพิ่ม shared pagination
- [ ] ย้ายหน้าหลักที่มี filter/search/pager มาใช้ shared components
- [ ] ลด layout inline styles ที่ซ้ำกัน

## P3 — Mobile polish

- [ ] ตรวจ mobile viewport ของทุกหน้าหลัก
- [x] ทำปุ่มและ page actions wrap บนจอแคบ
- [x] ทำ data-value stack บนจอแคบ
- [x] ทำ filter controls stack บนจอแคบ
- [x] ทำ pagination stack บนจอแคบ
- [x] ทำ modal safe area และ sticky actions
- [ ] ตรวจตารางและการ์ดที่ยังต้อง horizontal scroll

## P4 — Shared components

- [x] Shared filter bar
- [x] Shared pagination
- [x] Shared empty, notice และ skeleton baseline
- [x] Shared detail/data rows
- [x] Shared JSON/payload viewer
- [ ] Shared action group
- [ ] Shared expandable technical details
- [ ] ลด component/helper ซ้ำในแต่ละโมดูล

## P5 — Visual polish

- [ ] ใช้ loading skeleton ครบทุกหน้าหลัก
- [x] Button hover, focus และ disabled baseline
- [ ] Dialog transition
- [ ] Expand/collapse animation
- [ ] Success/error feedback consistency audit
- [x] Reduced-motion baseline
- [ ] Contrast และ readability audit

## P6 — Cleanup

- [x] ลบ `window.confirm`
- [x] ลบ `window.prompt`
- [ ] ลด inline CSS ที่ยังเหลือ
- [ ] ลบ helper และ component ซ้ำ
- [ ] ลบ style ที่ไม่ได้ใช้
- [ ] ตรวจ dead imports และ dead code
- [ ] ตรวจ naming ให้ตรงกันทั้งระบบ

## Module migration status

- [x] Ledger
- [x] Transfer detail
- [x] Sessions
- [x] Webhook logs
- [x] Provider operations
- [x] Game catalog
- [x] Member filters
- [x] Reconciliation dialogs
- [x] Withdrawal dialogs
- [x] Promotion workflows
- [ ] Audit logs
- [ ] Reports
- [ ] Settings
- [ ] Support
- [ ] Risk detail surfaces

## รอบปัจจุบัน

- เพิ่ม `AdminFilterBar`, `AdminPagination` และ `AdminPayloadViewer` กลางที่ commit `6866f48d`
- ย้าย Webhook logs มาใช้ filter bar และ payload viewer กลางที่ commit `f1f148cd`
- ขั้นถัดไป: ย้ายหน้าที่มี filter/pager และ payload ซ้ำ จากนั้นกวาด wording และ inline styles ในโมดูลเดียวกัน
