# Project Worklist

Updated: 2026-07-11

ไฟล์นี้เป็นรายการงานกลางของโปรเจกต์ ใช้ตรวจว่างานใดเสร็จแล้ว งานใดกำลังทำ งานใดรอข้อมูลภายนอก และงานใดควรทำต่อเป็นลำดับถัดไป

## Status legend

- ✅ เสร็จและรวมเข้า `main` แล้ว
- 🧪 ทำแล้ว แต่ยังต้องทดสอบ regression หรือ production flow เพิ่ม
- 🚧 กำลังทำ
- ⏳ รอทำ
- ⛔ รอข้อมูลหรือการตัดสินใจภายนอก

## Completed

### Finance foundation

- ✅ แก้ปัญหาการเพิ่มยอดผิดพลาดและป้องกัน money mint bug
- ✅ เพิ่มระบบตรวจจับสลิปฝากซ้ำด้วย transaction reference, SHA-256 และ perceptual hash
- ✅ เพิ่ม risk alert สำหรับการใช้สลิปซ้ำหลายครั้ง
- ✅ แยก Prisma enum migration และ object migration เพื่อแก้ PostgreSQL migration failure
- ✅ Member Deposit เชื่อม staged slip review flow
- ✅ Admin Deposit ใช้ `approve-slip -> confirm-credit`
- ✅ Admin Withdrawal ใช้ `approve-for-payment -> payment-proof -> verify-payment`
- ✅ ปฏิเสธถอนพร้อมคืน `lockedBalance`
- ✅ ซ่อน action ที่ไม่ตรงกับสถานะและป้องกัน terminal action ซ้ำ
- ✅ เพิ่ม wallet row locking ด้วย `SELECT ... FOR UPDATE`
- ✅ เพิ่ม idempotency สำหรับยืนยันเครดิตฝากและยืนยันจ่ายถอน
- ✅ ป้องกันคำขอถอนพร้อมกันใช้ยอดเกิน available balance
- ✅ ป้องกันการแก้ balance และ locked balance เขียนทับกันระหว่าง concurrent requests

### UX/UI and application structure

- ✅ Member deposit UI รองรับการอัปโหลดสลิปและแสดงสถานะภาษาไทย
- ✅ Admin finance operations รองรับ mobile และ desktop
- ✅ แก้ route ซ้ำ `/withdrawals` ระหว่าง route groups
- ✅ `web-member` build ผ่านใน checkpoint ล่าสุด
- ✅ `web-admin` build ผ่านใน checkpoint ล่าสุด
- ✅ API build และ tests ผ่านใน checkpoint ล่าสุด

### Merged pull requests

- ✅ PR #2 `feat(finance): add duplicate slip detection foundation`
- ✅ PR #5 `fix(finance): split enum migration before payment audit objects`
- ✅ PR #7 `feat(member): connect deposit UX to staged slip review`
- ✅ PR #8 `feat(admin): build guarded deposit and withdrawal operations`
- ✅ PR #10 `fix(finance): serialize wallet mutations and retries`

## Current priority

### 1. Admin Audit Log UI

- ⏳ สร้างหน้ารวม audit logs
- ⏳ Filter ตาม module, action, admin และช่วงเวลา
- ⏳ แสดงเวลา, IP address และ user agent
- ⏳ แสดง old data / new data แบบอ่านง่าย
- ⏳ ลิงก์กลับไปยังรายการฝาก ถอน สมาชิก หรือ wallet ที่เกี่ยวข้อง
- ⏳ รองรับ mobile card และ desktop table/detail layout
- ⏳ จำกัดการเข้าถึงด้วย permission ที่เหมาะสม

### 2. Risk Alert Operations UI

- ⏳ แสดง risk alerts ที่เปิดอยู่
- ⏳ Filter ตาม severity, type, status และ member
- ⏳ Assign ผู้รับผิดชอบ
- ⏳ เปลี่ยนสถานะ `OPEN -> REVIEWING -> RESOLVED`
- ⏳ แสดง metadata ของสลิปซ้ำและรายการต้นฉบับ
- ⏳ ลิงก์ไปยังสมาชิกและ finance request ที่เกี่ยวข้อง

### 3. Finance E2E coverage

- ⏳ Member สร้างรายการฝากและส่งสลิป
- ⏳ Admin อนุมัติสลิปและยืนยันเครดิต
- ⏳ Member สร้างรายการถอน
- ⏳ Admin อนุมัติเตรียมจ่าย อัปโหลดหลักฐาน และยืนยันจ่าย
- ⏳ ทดสอบ duplicate slip, retry, timeout และ concurrent requests
- ⏳ ตรวจ wallet ledger และยอดก่อน/หลังทุก flow

### 4. Deployment monitoring

- ⏳ ตรวจ Railway deployment หลัง merge
- ⏳ ตรวจ `/health` และ `/version`
- ⏳ เพิ่ม smoke test สำหรับ staged finance endpoints
- ⏳ เพิ่ม alert เมื่อ migration หรือ finance smoke ล้มเหลว
- ⏳ ตรวจ storage preview สำหรับ deposit slips และ withdrawal proofs

## UX/UI backlog

### Member

- ⏳ Games lobby full pass
- ⏳ Promotions and bonus cards
- ⏳ Profile and security pages
- ⏳ Notifications
- ⏳ Support tickets and FAQ search
- 🧪 Deposit and withdrawal full regression across standard viewports

### Admin

- ⏳ Reports, activity, risk and security density pass
- ⏳ Admin settings migration
- ⏳ Member detail side panel
- ⏳ Safe bulk actions where justified
- ⏳ Collapsible sidebar, command entry and keyboard shortcuts
- 🧪 Long-value, empty-state and mobile regression checks

## Blocked or paused

- ⛔ งานเชื่อม provider/game camp ที่ต้องรอเอกสารค่ายหรือ API contract
- ⛔ Production provider adapter ที่ยังไม่มี credential, IP whitelist หรือ callback specification
- ⛔ Vercel configuration จนกว่าจะระบุ target app ชัดเจนว่าเป็น `web-member` หรือ `web-admin`

## Definition of done

งานหนึ่งถือว่าเสร็จเมื่อ:

- Build ของ app ที่เกี่ยวข้องผ่าน
- Tests ที่เกี่ยวข้องผ่าน
- Money action มี transaction, row lock และ idempotency ตามความเหมาะสม
- มี loading, empty, error, disabled และ success states
- ใช้งานได้ทั้ง mobile และ desktop
- มี audit trail สำหรับ sensitive action
- ไม่มี route ซ้ำหรือ action ที่กดซ้ำหลัง terminal state
- เอกสารและ worklist นี้ถูกอัปเดตให้ตรงกับสถานะจริง
