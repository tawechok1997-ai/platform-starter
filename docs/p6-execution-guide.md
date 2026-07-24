# P6 External Verification Execution Guide

เอกสารนี้รวมขั้นตอนสำหรับรันงาน P6 ที่ต้องใช้ deployed environment, seeded credentials หรือข้อมูลจาก vendor ภายนอก โดยไม่เก็บรหัสผ่าน, token, API key หรือ secret ใด ๆ ลง repository

## 1. ข้อมูลที่ต้องเตรียม

ตั้งค่าผ่าน environment variables ของเครื่องรันหรือ secret store เท่านั้น

### Deployed environment

```bash
export P6_ENVIRONMENT=non-production
export P6_API_URL=https://api.example.com
export P6_ADMIN_URL=https://admin.example.com
export P6_MEMBER_URL=https://member.example.com
```

เมื่อรันกับ production ให้ใช้ `P6_ENVIRONMENT=production` ระบบ readiness จะบังคับ HTTPS และตรวจว่า API, Admin และ Member ไม่ใช้ origin เดียวกัน

### Seeded credentials

```bash
export P6_ADMIN_EMAIL='...'
export P6_ADMIN_PASSWORD='...'
export P6_READONLY_ADMIN_EMAIL='...'
export P6_READONLY_ADMIN_PASSWORD='...'
export P6_MEMBER_EMAIL='...'
export P6_MEMBER_PASSWORD='...'
```

บัญชีเหล่านี้ต้องเป็นบัญชีทดสอบที่ไม่ใช่บัญชีบุคคลจริง และต้องใช้เฉพาะ non-production เว้นแต่ขั้นตอน production verification ได้รับอนุมัติชัดเจนแล้ว

### Vendor UAT

```bash
export P6_PROVIDER_CODE='...'
export P6_PROVIDER_BASE_URL='https://provider.example.com'
export P6_PROVIDER_API_KEY='...'
export P6_PROVIDER_SECRET='...'
export P6_PROVIDER_CALLBACK_URL='https://api.example.com/provider/callback'
```

`P6_PROVIDER_API_KEY`, `P6_PROVIDER_SECRET` และ callback URL เป็น optional ใน readiness baseline แต่ provider-specific UAT อาจต้องใช้ทั้งหมดตาม contract ของ vendor

## 2. เตรียมบัญชีทดสอบ

```bash
pnpm db:seed:p6:check
pnpm db:seed:p6
pnpm db:seed:p6:check
```

รัน seed เฉพาะฐานข้อมูล non-production ที่ได้รับอนุญาต ห้ามรันกับ production โดยอัตโนมัติ

## 3. ตรวจ readiness

```bash
pnpm verify:p6:readiness
pnpm verify:p6:readiness:strict
pnpm verify:p6:readiness:json > p6-readiness.json
```

Strict mode ต้องผ่าน deployed URLs และ seeded credentials ส่วน vendor UAT เป็นกลุ่ม optional จนกว่าจะเริ่มทดสอบ provider จริง

## 4. ตรวจ connectivity

```bash
pnpm verify:p6:connectivity
pnpm verify:p6:connectivity:strict
pnpm verify:p6:connectivity:json > p6-connectivity.json
```

Connectivity preflight ตรวจ:

- API `GET /health` ต้องตอบ JSON
- `service` ต้องเป็น `api`
- `status`, `database` และ `privateMedia` ต้องเป็น `ok`
- Admin และ Member ต้องตอบ HTTP 2xx หรือ 3xx ที่ผ่าน contract
- ไม่ยอมรับ cross-origin redirect

ตั้ง timeout ได้ด้วย `P6_CONNECTIVITY_TIMEOUT_MS` ช่วง 1,000 ถึง 30,000 ms

## 5. ตรวจ deployment identity

```bash
pnpm verify:p6:deployment
pnpm verify:p6:deployment:strict
pnpm verify:p6:deployment:json > p6-deployment.json
```

ผลต้องตรง approved commit ก่อนเริ่ม browser regression หรือ production verification

## 6. รัน regression ตามลำดับ

```bash
pnpm test:full-system:p6
pnpm test:e2e:smoke:strict
pnpm test:e2e:visual
pnpm test:e2e:a11y
pnpm test:e2e:kyc
pnpm test:e2e:cms-content
pnpm test:kyc:deployed
```

ลำดับแนะนำ:

1. readiness
2. connectivity
3. deployment identity
4. authenticated smoke
5. deposit/withdraw and duplicate/retry/error flows
6. permissions, owner transfer and session lifecycle
7. six-viewport visual regression
8. Support/CMS/Reports/KYC/Risk regression
9. staging migration and rollback verification
10. vendor/provider UAT

## 7. หลักฐานที่ต้องเก็บ

เก็บ artifact จากแต่ละรอบโดยไม่แนบ secret หรือข้อมูลส่วนบุคคล:

- readiness/connectivity/deployment JSON
- approved commit SHA
- environment name และ timestamp
- Playwright HTML report, screenshots, trace และ video เฉพาะ test account
- migration status และ rollback result
- provider request ID ที่ผ่านการ redact
- สรุป pass, fail, blocked พร้อมผู้รับผิดชอบและเหตุผล

ห้าม commit ไฟล์ `.env`, access token, cookie, private key, raw provider credential หรือ exported production data ลง repository

## 8. เกณฑ์ปิด P6

ปิด checkbox ได้เมื่อมีผลรันจาก environment จริงและหลักฐานที่ตรวจย้อนกลับได้ ไม่ปิดจาก implementation หรือ regression test ใน repository เพียงอย่างเดียว เพราะ P6 ถูกออกแบบให้ยืนยันสิ่งที่โค้ดจำลองแทนไม่ได้
