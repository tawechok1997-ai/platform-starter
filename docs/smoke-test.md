# Smoke Test

ใช้ `scripts/smoke-api.sh` เพื่อตรวจว่า API หลัง deploy ยังตอบ endpoint สำคัญได้ถูกต้อง

## Basic check

เช็ก public health/version และ endpoint protected ว่าต้องตอบ `401` เมื่อไม่มี token

```bash
API_URL="https://api-service.up.railway.app" \
./scripts/smoke-api.sh
```

สิ่งที่เช็ก:

- `GET /health` ต้อง `200`
- `GET /version` ต้อง `200`
- admin protected endpoints ต้อง `401` ถ้าไม่มี token
- admin security endpoints ต้อง `401` ถ้าไม่มี token
- member protected endpoints ต้อง `401` ถ้าไม่มี token

## With admin token

ใช้ตรวจ endpoint admin ที่ต้อง login แล้ว เช่น security, audit, members, wallets, topups, withdrawals, ledgers, risk alerts และ finance summary

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

Admin checks now cover:

- current admin profile
- active sessions
- audit logs pagination
- members pagination
- wallets pagination
- topups pagination
- withdrawals pagination
- ledgers pagination
- risk alerts pagination
- finance summary

## With member token

```bash
API_URL="https://api-service.up.railway.app" \
MEMBER_TOKEN="<member-access-token>" \
./scripts/smoke-api.sh
```

Member checks:

- member wallet
- member topups
- member withdrawals

## With both tokens

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
MEMBER_TOKEN="<member-access-token>" \
./scripts/smoke-api.sh
```

## Local usage

```bash
chmod +x scripts/smoke-api.sh
API_URL="http://localhost:4000" ./scripts/smoke-api.sh
```

## Expected result

ถ้าทุกอย่างผ่าน จะเห็น:

```txt
Smoke result: <n> passed, 0 failed
```

ถ้ามี endpoint ใดตอบผิด script จะ exit code `1` เพื่อใช้ใน CI/CD หรือ deploy checklist ได้

## Deploy checklist

1. Deploy API
2. รัน smoke test แบบไม่มี token
3. Login admin แล้ว copy access token จาก browser devtools/localStorage
4. รัน smoke test พร้อม `ADMIN_TOKEN`
5. Login member แล้ว copy access token หากต้องการเช็ก member flow
6. ถ้าผ่านทั้งหมดค่อย deploy/QA web-admin และ web-member ต่อ

## Notes

Smoke test นี้เน้นตรวจ health, auth guard, pagination และ endpoint สำคัญหลัง deploy โดยไม่ทำ business operation ที่เปลี่ยนยอดเงินหรือสถานะรายการจริง
