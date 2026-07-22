# Admin Modernization — Risk and Promotion Code Audit

อัปเดต: 2026-07-23

ตรวจจากโค้ดบน `main` เท่านั้น ไม่ใช้ checkbox เดิมเป็นหลักฐานโดยลำพัง

## `/risk-alerts`

- [x] มี severity filter และ status/type/provider/member/date filters
- [x] มี summary ของ open และ critical alerts
- [x] มีรายละเอียด/evidence metadata และลิงก์ไป record ที่เกี่ยวข้อง
- [x] มี acknowledge/review workflow ผ่านสถานะ OPEN / REVIEWING / RESOLVED / DISMISSED
- [x] มี bulk dismiss พร้อม selected count, เหตุผลขั้นต่ำ และ confirmation
- [x] มี pagination และ cooldown ป้องกัน scan ซ้ำ
- [~] ลำดับ Critical ใช้ summary/filter แต่ยังไม่พบ explicit server ordering contract ว่า Critical อยู่บนสุดเสมอ
- [~] ยังพบ raw backend `message` ถูกนำมาแสดงบางจุด จึงยังไม่ผ่าน global safe-error contract

## `/provider-risk`

- [x] มี readiness score
- [x] มี blocker ก่อนเปิดเงินจริง
- [x] แยก warning/danger/success readiness state
- [x] มี preflight checklist และ real-money gate
- [x] แสดง unresolved mismatch และ failed transfer signals
- [~] ใช้ `window.confirm` สำหรับเปิดเงินจริง แทน shared confirm dialog
- [~] async actions ยังไม่มี `try/finally` ครบทุกจุด

## `/growth-center`

- [x] เป็น read-only summary dashboard
- [x] รวม queue Promotion, Bonus, Affiliate, Commission, Support และ KYC
- [x] มี direct links ไปหน้าปฏิบัติการ
- [x] ไม่อนุมัติ ไม่จ่ายเงิน และไม่แตะ wallet โดยตรง
- [~] ข้อความไทย/อังกฤษยังปนกัน
- [~] ใช้ native button style แทน shared AdminButton ใน action หลัก

## `/promotion-center`

- [x] มี tabs/list สำหรับ Campaign, Banner, Bonus, Coupon และ Reward
- [x] มี Draft / Published / Archived lifecycle
- [x] มี bulk archive พร้อม confirmation
- [x] มี search, priority sorting และ quick add
- [x] มี loading, empty และ busy guard ระหว่าง save
- [x] มี banner preview เมื่อมี image URL
- [x] มี validation ก่อนบันทึก
- [~] error handling ยังอาจแสดง backend message โดยตรง
- [~] ยังไม่พบ unsaved-changes warning เมื่อออกจากหน้า

## สรุปสถานะลิสต์

### ควรติ๊กเพิ่ม

- `/risk-alerts`: Severity filter, Evidence, Acknowledge workflow, Bulk review + confirmation
- `/provider-risk`: Readiness score, Blocker ก่อนเปิดเงินจริง, Warning/Critical แยกกัน, Preflight checklist
- `/growth-center`: Read-only summary dashboard, Queue ทุก feature, Link ไปหน้าปฏิบัติการโดยตรง
- `/promotion-center`: Campaign/Banner/Bonus/Coupon tabs, Draft/publish state, Bulk archive

### ยังไม่ควรติ๊กเต็ม

- Critical อยู่บนสุด จนกว่าจะยืนยัน ordering contract
- ลดข้อความซ้ำใน Growth Center จนกว่าจะ audit rendered UI
- Global raw backend error
- Unsaved changes warning ของ Promotion Center
