# Backup Automation

คู่มือใช้ `scripts/backup-db.sh` สำหรับ backup PostgreSQL แบบ custom dump

## Requirements

ต้องมี PostgreSQL client tools:

```bash
pg_dump --version
pg_restore --version
```

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql-client
```

macOS:

```bash
brew install libpq
brew link --force libpq
```

## Manual backup

```bash
chmod +x scripts/backup-db.sh
DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require' ./scripts/backup-db.sh
```

ค่า default:

```txt
BACKUP_DIR=backups
APP_NAME=platform
RETENTION_DAYS=14
```

ตัวอย่างกำหนดเอง:

```bash
APP_NAME=platform-prod \
BACKUP_DIR=/secure/backups \
RETENTION_DAYS=30 \
DATABASE_URL='postgresql://...' \
./scripts/backup-db.sh
```

ผลลัพธ์:

```txt
backups/platform/platform-YYYYMMDD-HHMMSS.dump
backups/platform/platform-latest.dump
```

## Verify backup

```bash
pg_restore --list backups/platform/platform-latest.dump | head
```

เช็กขนาดไฟล์:

```bash
ls -lh backups/platform/
```

## Restore to staging first

```bash
export STAGING_DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/STAGING_DB?sslmode=require'
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --dbname="$STAGING_DATABASE_URL" \
  backups/platform/platform-latest.dump
```

ห้าม restore ทับ production โดยยังไม่ได้ verify backup เพราะนั่นคือการเล่นรูเล็ตกับข้อมูลจริง ซึ่งเป็นงานอดิเรกที่ไม่ควรมีใครภูมิใจ

## Cron example

รัน backup ทุกวัน 02:15 UTC:

```cron
15 2 * * * cd /path/to/platform-starter && DATABASE_URL='postgresql://...' APP_NAME=platform-prod BACKUP_DIR=/secure/backups ./scripts/backup-db.sh >> /var/log/platform-backup.log 2>&1
```

## Storage recommendation

ควร copy backup ออกไป storage นอกเครื่องด้วย เช่น:

- S3
- Cloudflare R2
- Google Drive แบบ private
- external backup server

เก็บ local อย่างเดียวไม่พอ ถ้าเครื่องหาย backup ก็หายไปด้วย แบบนั้นเรียกว่า screenshot ความหวัง ไม่ใช่ backup

## Retention

แนะนำขั้นต่ำ:

```txt
Daily: 14-30 วัน
Weekly: 8-12 สัปดาห์
Monthly: 6-12 เดือน
```

## Related docs

- `docs/database-backup-restore.md`
- `docs/production-runbook.md`
- `docs/security-checklist.md`
