# Admin PR-3 — Authenticated Staging Acceptance

## เป้าหมาย

ปิด Acceptance gate ที่ส่งต่อจาก Admin PR-2 ด้วยหลักฐานจากระบบที่รันจริงบน Disposable Staging ไม่ใช้ Fixture-only verification และไม่ยิง Mutation ใส่ Production

## ขอบเขต

### Disposable Staging

- PostgreSQL 16 แยกต่อ Workflow run
- ใช้ Production build ของ API และ Admin Web จาก Commit ที่กำลังตรวจ
- ตรวจ `/health` และ `/version` ก่อนเริ่ม Browser acceptance
- Fail เมื่อ Runtime commit ไม่ตรงกับ Checked-out head
- ใช้ Secret ที่สุ่มต่อ Run และ Mask ใน GitHub Actions
- ปิด Provider simulator, Password delivery, Admin login anti-bot และ Privileged 2FA enforcement เฉพาะ Disposable environment

### Persona และ RBAC จริง

ใช้ Role template จริงจาก Access governance:

1. Finance
2. Deposit & Withdrawal
3. Marketing
4. Manager
5. System Administrator
6. Multi-role: Finance + Marketing
7. Explicit DENY: System Administrator พร้อม wildcard `DENY *`

Persona ทั้งเจ็ดถูกสร้างเป็น Admin account จริงในฐานข้อมูลชั่วคราว จากนั้น Login ผ่านหน้า `/login` และอ่าน Effective permission ผ่าน `/api/admin/auth/me`

### Release matrix

ใช้ Matrix owner เดิมจาก P8:

- Tier 0 routes: 15
- Persona: 7
- Chromium Desktop: ทุก Persona
- Chromium Tablet/Mobile: System Admin และ Explicit DENY
- Firefox/WebKit Desktop: System Admin และ Explicit DENY
- รวมทั้งหมด 225 cases

ทุก Case ตรวจ:

- ไม่ Redirect กลับ Login หลังยืนยันตัวตน
- Route access ตรงกับ Effective permission
- Explicit DENY เป็น Fail-closed ยกเว้น Self-service route ที่ Registry อนุญาตโดยตั้งใจ
- ไม่มี Horizontal overflow
- ไม่มี Broken image
- ไม่มี Browser page error
- ไม่มี HTTP 5xx

### Authenticated Mutation

Mutation acceptance ใช้ `dashboard-widget-layout-v1` ซึ่งเป็น Preference owner ที่มีอยู่แล้ว:

1. อ่าน Baseline
2. PATCH ค่า Acceptance marker
3. อ่านกลับและยืนยัน Persistence
4. PATCH คืนค่า Baseline
5. อ่านกลับและยืนยัน Restoration

Mutation ทำเฉพาะ Disposable Staging และ Session ถูก Logout หลังจบ Personaทุกตัว

### Accessibility

Authenticated System Administrator routes บน Chromium Desktop ใช้ Axe ตรวจและ Fail เมื่อพบระดับ:

- Serious
- Critical

ครอบคลุมข้อมูลจริงจาก API ชั่วคราว, Shell จริง, Route guard จริง และ Permission จริง

### Performance

เก็บ Runtime Navigation Timing และ Resource Timing จาก Production build ที่ Serve จริง:

- DOMContentLoaded ไม่เกิน 5 วินาที
- Load event ไม่เกิน 8 วินาที
- JavaScript transfer ไม่เกิน 2.5 MB ต่อ Route
- Total resource transfer ไม่เกิน 5 MB ต่อ Route

Bundle gzip budget เดิมจาก Admin Verification ยังคงทำงานเป็น Gate แยก จึงได้ทั้ง Build artifact budget และ Runtime transfer acceptance

## บั๊กที่พบระหว่าง PR-3

`AdminAuthGuard` คำนวณ Explicit DENY ถูกต้อง แต่ `AdminProfileQueryService` เคยนำ Role permission เดิมกลับมารวมกับ Effective session permission เมื่อสร้าง `/admin/auth/me` response ส่งผลให้ UI อาจแสดง Navigation ที่ API ปฏิเสธ

แก้โดย:

- Effective permission ที่ Guard ส่งมาเป็น Authority
- Empty array ที่ส่งมาอย่างชัดเจนยังคง Empty หลัง wildcard DENY
- Role permission ใช้เป็น Fallback เฉพาะ Legacy caller ที่ไม่ส่ง Session permission เท่านั้น
- เพิ่ม Unit test ล็อก Explicit DENY response

## Safety boundary

- Workflow ไม่ใช้ Railway หรือ Production URL
- Workflow ไม่รับ Production credential
- Persona seed ปฏิเสธ `NODE_ENV=production`
- Persona seed ต้องเปิด `PR3_ALLOW_DISPOSABLE_SEED=true`
- Persona seed อนุญาตเฉพาะ Local/PostgreSQL service hostname
- Evidence manifest ไม่บันทึก Password, JWT หรือ Secret
- ไม่มี Schema model ใหม่
- ไม่มีเงินจริง, Wallet, Ledger, Deposit, Withdrawal หรือ Provider transfer mutation
- Production smoke เดิมยัง Read-only และตรวจ Health/Commit identity แยกจาก Workflow นี้

## CI recovery rerun

หลัง GitHub Actions กลับมา Operational จากเหตุขัดข้องวันที่ 6 สิงหาคม 2026 ให้สร้าง Head ใหม่ที่มีเนื้อหาจริง แล้วรัน Required workflows ใหม่ทั้งหมดบน Head เดียวกัน ห้ามอ้างผล `queued`, `pending`, `cancelled` หรือผลจาก Commit ก่อนหน้าเป็น Acceptance evidence และห้าม Merge จนกว่า Workflow ชุดใหม่จะจบสถานะ `success`

## Definition of Done

- API unit tests รวม Effective DENY profile contract ผ่าน
- Admin source contracts ผ่าน
- Build, Full-System, Security, Quality, Visual และ Admin Browser workflows ผ่านบน Head เดียวกัน
- Admin PR-3 Staging Acceptance ผ่าน 225 cases
- Reversible mutation Persistence และ Restoration ผ่าน
- Authenticated Accessibility ผ่าน
- Runtime Performance budgets ผ่าน
- PR ไม่มี Review thread ค้าง
- Merge เข้า `main` และยืนยัน Merge commit เป็น Main head
