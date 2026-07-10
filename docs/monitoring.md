# Monitoring Guide

คู่มือ monitoring production สำหรับ API, admin web และ member web

## Health checks

API endpoints:

```txt
GET /health
GET /version
```

ตัวอย่าง:

```bash
curl -s https://api-service.up.railway.app/health
curl -s https://api-service.up.railway.app/version
```

`/health` ควรตอบว่า API, database และ private media storage ใช้งานได้

`/version` ใช้เช็ก service, version, commit, environment, builtAt และ current time

## Basic uptime checks

ควรตั้ง monitor ทุก 1-5 นาที:

```txt
https://api-service.up.railway.app/health
https://admin-web.up.railway.app/login
https://member-web.up.railway.app/login
```

Alert เมื่อ:

- status ไม่ใช่ 2xx
- response time สูงผิดปกติ
- `/health` รายงาน database fail

## Request ID tracing

API response จะมี header:

```txt
X-Request-Id
```

Error response ก็มี:

```json
{
  "requestId": "...",
  "statusCode": 500,
  "message": "..."
}
```

เวลาเจอปัญหา ให้ขอข้อมูลนี้จากแอดมินหรือผู้ใช้:

```txt
Page:
Action:
Time:
Request ID:
Screenshot:
```

จากนั้นไปค้นใน Railway logs ด้วย requestId

## Railway logs

ตรวจ log API:

1. เปิด Railway project
2. เข้า service API
3. เปิด Logs
4. ค้นหา requestId หรือ path ที่พัง
5. ดู statusCode, durationMs, error message

Structured log ตัวอย่าง:

```json
{
  "level": "error",
  "event": "http_request",
  "requestId": "...",
  "method": "POST",
  "path": "/admin/topups/.../confirm",
  "statusCode": 500,
  "durationMs": 120
}
```

## Alerts ที่ควรมี

### API down

Trigger:

```txt
/health ไม่ตอบ 2xx ติดต่อกัน 2-3 ครั้ง
```

Action:

- ตรวจ Railway service status
- ตรวจ deploy ล่าสุด
- ตรวจ DATABASE_URL
- ตรวจ logs ด้วย requestId ถ้ามี

### Database fail

Trigger:

```txt
/health รายงาน database fail
```

Action:

- ตรวจ Railway PostgreSQL
- ตรวจ connection string
- ตรวจว่า DB service restart หรือ quota เต็มไหม
- ห้ามใช้ force reset

### Error 500 spike

Trigger:

```txt
500 มากผิดปกติใน 5-15 นาที
```

Action:

- แยก path ที่ error
- ตรวจ commit/deploy ล่าสุด
- rollback ถ้าเกิดหลัง deploy
- เปิด incident note

### Queue stuck

Trigger:

```txt
pending topups/withdrawals ค้างนานผิดปกติ
```

Action:

- เปิด admin dashboard
- ตรวจ claim owner
- release รายการค้างถ้าจำเป็น
- ตรวจ Risk Alerts

## Manual smoke test

หลัง deploy ทุกครั้ง:

```bash
curl https://api-service.up.railway.app/health
curl https://api-service.up.railway.app/version
```

Admin:

- `/login`
- `/dashboard`
- `/topups`
- `/withdrawals`
- `/risk-alerts`

Member:

- `/login`
- `/register`
- `/`
- `/deposit`
- `/withdraw`

## Incident levels

### Low

- UI เบี้ยวเล็กน้อย
- ไม่กระทบเงิน
- มี workaround

### Medium

- บางหน้า admin ใช้งานไม่ได้
- queue ช้า
- report ไม่ขึ้น

### High

- API 500 บน money action
- login ไม่ได้
- deposit/withdraw ส่งไม่ได้

### Critical

- wallet balance ผิด
- approve/reject ซ้ำ
- DB fail
- ข้อมูลส่วนตัวหรือ slip ถูกเปิดผิดทาง

## Related docs

- `docs/production-runbook.md`
- `docs/deploy-checklist.md`
- `docs/security-checklist.md`
- `docs/database-backup-restore.md`
