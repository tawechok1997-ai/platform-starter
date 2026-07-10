# Project Worklist

Updated: 2026-07-11

> Maintenance mode: อัปเดตไฟล์นี้ด้วย direct commit เข้า `main` โดยไม่เปิด PR เว้นแต่งานนั้นมีความเสี่ยงสูงหรือมีการเปลี่ยน schema/migration ขนาดใหญ่

ไฟล์นี้เป็นรายการงานกลางของโปรเจกต์ ใช้ตรวจว่างานใดเสร็จแล้ว งานใดกำลังทำ งานใดรอข้อมูลภายนอก และงานใดควรทำต่อเป็นลำดับถัดไป

## Status legend

- ✅ เสร็จและรวมเข้า `main` แล้ว
- 🧪 ทำแล้ว แต่ยังต้องทดสอบ regression หรือ production flow เพิ่ม
- 🚧 กำลังทำ
- ⏳ รอทำ
- ⛔ รอข้อมูลหรือการตัดสินใจภายนอก

## Emergency finance hardening

### P0 completed

- ✅ ปิด legacy Admin Top-up routes ที่เพิ่มเครดิตทันที
- ✅ หน้า Admin Top-up ใช้ staged flow `approve-slip -> confirm-credit` เท่านั้น
- ✅ ถอด legacy `POST /admin/withdrawals/:id/complete`
- ✅ บังคับ claim ownership ใน backend สำหรับ approve slip, confirm credit และ reject deposit
- ✅ บังคับ claim ownership ใน backend สำหรับ approve withdrawal, upload payment proof และ verify payment
- ✅ เงื่อนไข update ของ finance workflow ตรวจทั้ง status และ `claimed_by`
- ✅ Deposit credit และ withdrawal verification ใช้ wallet row lock ก่อนแก้ยอด
- ✅ `prisma/schema.prisma` ตรงกับ enum และคอลัมน์จาก finance migrations
- ✅ `pnpm prisma format`, `pnpm prisma validate` และ `pnpm prisma generate` ผ่าน
- ✅ `pnpm build:api`, `pnpm build:web-admin` และ API tests ผ่าน checkpoint ล่าสุด
- ⏳ ทดสอบ claim conflict ด้วยแอดมินสองบัญชีบนข้อมูลจริง

### P1 in progress

- ✅ เพิ่ม storage delete สำหรับ local และ S3
- ✅ ลบ withdrawal payment proof เมื่อ DB transaction ล้มเหลว
- ✅ เพิ่ม test ยืนยัน local storage delete และ retry
- ✅ เพิ่ม Prisma validation และ API tests เป็น CI gate ก่อน build
- 🚧 เพิ่ม compensation สำหรับ deposit slip upload เมื่อ DB state เปลี่ยนหลังอัปโหลด
- 🚧 เพิ่มและบังคับใช้ `pnpm-lock.yaml` กับ `--frozen-lockfile`
- ⏳ ทำ production smoke ให้ fail เมื่อ token ที่จำเป็นหาย

## Completed

### Finance foundation

- ✅ แก้ปัญหาการเพิ่มยอดผิดพลาดและป้องกัน money mint bug
- ✅ เพิ่มระบบตรวจจับสลิปฝากซ้ำด้วย transaction reference, SHA-256 และ perceptual hash
- ✅ เพิ่ม risk alert สำหรับการใช้สลิปซ้ำหลายครั้ง
- ✅ แยก Prisma enum migration และ object migration เพื่อแก้ PostgreSQL migration failure
- 🧪 Member Deposit เชื่อม staged slip review flow
- 🧪 Admin Deposit ใช้ `approve-slip -> confirm-credit`
- 🧪 Admin Withdrawal ใช้ `approve-for-payment -> payment-proof -> verify-payment`
- ✅ ปฏิเสธถอนพร้อมคืน `lockedBalance`
- ✅ ซ่อน action ที่ไม่ตรงกับสถานะและป้องกัน terminal action ซ้ำ
- ✅ เพิ่ม wallet row locking ด้วย `SELECT ... FOR UPDATE`
- ✅ เพิ่ม idempotency สำหรับยืนยันเครดิตฝากและยืนยันจ่ายถอน
- ✅ ป้องกันคำขอถอนพร้อมกันใช้ยอดเกิน available balance
- ✅ ป้องกันการแก้ balance และ locked balance เขียนทับกันระหว่าง concurrent requests
- ✅ ตัด endpoint ฝากแบบเพิ่มเครดิตทันที เหลือ staged flow เดียว `submit slip -> approve slip -> confirm credit`
- ✅ Admin Top-up และ Admin Withdrawal ใช้ staged finance workflow เดียวกับ API
- ✅ Prisma schema ตรงกับ enum, evidence fields และ ledger relations ของ migration
- ✅ บังคับ claim owner กับการตรวจสลิป, ยืนยันเครดิต, แนบหลักฐานจ่าย และยืนยันจ่าย
- ✅ ลบไฟล์หลักฐานออกเมื่อ DB transaction ไม่สำเร็จ เพื่อลด orphan storage objects
- ✅ เพิ่ม API tests เป็น CI gate และ lock dependency ด้วย `pnpm-lock.yaml`

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
- ✅ PR #11 `docs: add current project worklist`

## Current priority after P1

### 1. Admin Audit Log UI

- 🧪 สร้างหน้ารวม audit logs
- 🧪 Filter ตาม module, action, admin, target, keyword และช่วงเวลา
- 🧪 แสดงเวลา, IP address และ user agent
- 🧪 แสดง old data / new data แบบอ่านง่าย
- 🧪 ลิงก์กลับไปยังรายการฝาก ถอน สมาชิก wallet ledger หรือ risk alert ที่เกี่ยวข้อง
- 🧪 รองรับ mobile card และ desktop detail layout
- ✅ จำกัดการเข้าถึงด้วย `admin.access.view`
- ⏳ ทดสอบ filter, pagination, empty state และ target links บนข้อมูลจริง

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

- ⏳ ตรวจ Railway deployment หลัง direct commit
- ⏳ ตรวจ `/health` และ `/version`
- ⏳ เพิ่ม smoke test สำหรับ staged finance endpoints
- ⏳ เพิ่ม alert เมื่อ migration หรือ finance smoke ล้มเหลว
- ⏳ ตรวจ storage preview สำหรับ deposit slips และ withdrawal proofs

### 5. Follow-up after workflow hardening

- 🧪 รัน migration กับ staging database ก่อน production และตรวจ `prisma migrate status`
- 🧪 ตั้งค่า `PROD_ADMIN_TOKEN` และ `PROD_MEMBER_TOKEN` เพื่อให้ scheduled smoke ตรวจ authenticated flow จริง
- 🧪 รัน Playwright E2E บน staging สำหรับ staged deposit/withdrawal หลังมีบัญชีทดสอบ

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
