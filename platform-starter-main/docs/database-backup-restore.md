# Database Backup and Restore Guide

คู่มือ backup/restore PostgreSQL สำหรับ production database

## Safety rules

- ห้าม restore ทับ production โดยไม่ยืนยัน backup ล่าสุด
- ห้ามใช้ `pnpm prisma db push --force-reset` บน production
- ห้ามแชร์ `DATABASE_URL` ใน chat, issue, screenshot หรือ log สาธารณะ
- ก่อน restore ต้องปิด writes หรือหยุด service ที่เขียน DB ถ้าจำเป็น

## Required tools

ติดตั้ง PostgreSQL client tools ให้มีคำสั่ง:

```bash
pg_dump --version
psql --version
pg_restore --version
```

บน Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql-client
```

บน macOS:

```bash
brew install libpq
brew link --force libpq
```

## Environment

ตั้งค่า connection string แบบไม่พิมพ์ซ้ำใน command history เยอะเกินไป:

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require'
```

ตรวจว่าเชื่อมต่อได้:

```bash
psql "$DATABASE_URL" -c 'select now();'
```

## Backup: custom format

เหมาะสำหรับ restore ด้วย `pg_restore` และเลือก restore object ได้ยืดหยุ่นกว่า

```bash
mkdir -p backups
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="backups/platform-$(date +%Y%m%d-%H%M%S).dump"
```

เช็กไฟล์:

```bash
ls -lh backups/
pg_restore --list backups/platform-YYYYMMDD-HHMMSS.dump | head
```

## Backup: plain SQL

อ่านง่าย ใช้ `psql` restore ได้ตรง ๆ

```bash
mkdir -p backups
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file="backups/platform-$(date +%Y%m%d-%H%M%S).sql"
```

บีบอัด:

```bash
gzip backups/platform-YYYYMMDD-HHMMSS.sql
```

## Restore to a new/staging database first

อย่า restore ลง production ทันทีเหมือนโยนของมีคมขึ้นฟ้าแล้วหวังว่าจะตกไม่โดนหัว

```bash
export STAGING_DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/STAGING_DB?sslmode=require'
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --dbname="$STAGING_DATABASE_URL" \
  backups/platform-YYYYMMDD-HHMMSS.dump
```

หรือถ้าเป็น plain SQL:

```bash
psql "$STAGING_DATABASE_URL" < backups/platform-YYYYMMDD-HHMMSS.sql
```

หลัง restore staging ให้ตรวจ:

```bash
psql "$STAGING_DATABASE_URL" -c '\dt'
psql "$STAGING_DATABASE_URL" -c 'select count(*) from users;'
psql "$STAGING_DATABASE_URL" -c 'select count(*) from wallets;'
```

## Emergency production restore

ใช้เฉพาะเมื่อมีเหตุจำเป็นและมี backup ที่ verify แล้ว

1. ประกาศ maintenance
2. หยุด API service หรือปิด writes
3. สำรอง production ปัจจุบันทันทีอีกชุด
4. Restore backup ที่ต้องการ
5. รัน health checks
6. เปิด API กลับ

Backup ก่อน restore:

```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="backups/pre-restore-$(date +%Y%m%d-%H%M%S).dump"
```

Restore custom dump:

```bash
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --dbname="$DATABASE_URL" \
  backups/platform-YYYYMMDD-HHMMSS.dump
```

## Post-restore checks

```bash
pnpm prisma generate
```

API checks:

```bash
curl https://api-service.up.railway.app/health
curl https://api-service.up.railway.app/version
```

Admin UI checks:

- Login admin
- Open `/dashboard`
- Open `/finance`
- Open `/reports`
- Open `/risk-alerts`
- Open `/members`

Money checks:

- Wallet balances look correct
- Ledger latest balance matches wallet balance for sampled users
- Pending topups/withdrawals are present
- Receiving bank accounts are present

## Restore drill schedule

ควรซ้อม restore อย่างน้อยเดือนละครั้ง:

- สร้าง backup จาก production
- Restore ลง staging database
- ชี้ staging API ไป DB นั้นชั่วคราว
- Run smoke tests
- ลบ staging database เมื่อเสร็จ

## What not to do

```bash
pnpm prisma db push --force-reset
```

คำสั่งนี้ล้างข้อมูลได้ เหมือนปุ่มลบจักรวาลขนาดจิ๋ว อย่ากดบน production

## Related docs

- `docs/production-runbook.md`
- `docs/deploy-checklist.md`
