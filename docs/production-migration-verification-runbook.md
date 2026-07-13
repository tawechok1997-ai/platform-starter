# Production Migration Verification Runbook

ใช้เอกสารนี้ตรวจว่า production database อยู่ตรงกับ migration ใน `main` ก่อนปิด P0

## 1. ตรวจสถานะโดยไม่เปลี่ยนข้อมูล

รันใน Railway service ที่มี `DATABASE_URL` ของ API:

```bash
pnpm db:migrate:status
```

ผลที่ยอมรับได้ต้องระบุว่า database up to date และไม่มี pending migration

## 2. ตรวจ schema/client

```bash
pnpm prisma validate --schema prisma/schema.prisma
pnpm prisma generate --schema prisma/schema.prisma
```

## 3. Deploy migration แบบปลอดภัย

ทำเฉพาะเมื่อข้อ 1 พบ pending migration และตรวจ backup/เวลาปล่อยระบบแล้ว:

```bash
pnpm db:migrate
```

ห้ามใช้ `prisma db push` กับ production เพราะไม่ใช้ migration history เป็น source of truth

## 4. ตรวจหลัง deploy

```bash
pnpm db:migrate:status
curl -fsS "$API_URL/health"
```

ต้องได้ migration status เป็น up to date และ health แสดง database เป็น `ok`

## เกณฑ์ปิด P0

ปิดรายการ production migration ใน M-001, M-002 และ M-003 ได้เมื่อมีหลักฐานจากข้อ 1 และข้อ 4 ใน deployment เดียวกันเท่านั้น รายงานล่าสุดยืนยันแล้วว่า CI PostgreSQL migration/finance concurrency ผ่าน และ production `/health` เชื่อม database ได้ แต่ยังไม่มีผล `prisma migrate status` จาก Railway จึงยังไม่ติ๊ก production migration ผ่านจนกว่าจะรันคำสั่งนี้
