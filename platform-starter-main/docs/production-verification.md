# Production Verification

ใช้ checklist นี้หลัง deploy API หรือหลังเปลี่ยนค่า environment ใน Railway/production

## 1. Verify environment

Script:

```bash
chmod +x scripts/verify-production-env.sh
API_URL="https://api-service.up.railway.app" ./scripts/verify-production-env.sh
```

ถ้ารันใน shell ที่มี env production อยู่แล้ว script จะเช็ก:

- required API env
- Redis env
- storage env
- API health/version reachability

Required env:

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_KEY=...
ADMIN_JWT_ACCESS_TTL=10m
ADMIN_REFRESH_TTL_HOURS=12
MEMBER_WEB_URL=https://...
ADMIN_WEB_URL=https://...
PRIVATE_MEDIA_DIR=/app/private-media/topup-slips
```

Production optional but recommended env:

```env
REDIS_URL=redis://...
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_FORCE_PATH_STYLE=true
```

## 2. Smoke API

Anonymous check:

```bash
API_URL="https://api-service.up.railway.app" ./scripts/smoke-api.sh
```

Admin check:

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

Member check:

```bash
API_URL="https://api-service.up.railway.app" \
MEMBER_TOKEN="<member-access-token>" \
./scripts/smoke-api.sh
```

## 3. Redis verification

Expected:

- `REDIS_URL` is set in API service
- API redeployed after setting env
- login/rate-limited endpoints still respond normally
- repeated invalid login attempts should trigger `429` after configured threshold

Useful env:

```env
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE=10
RATE_LIMIT_MEMBER_REGISTER_PER_MINUTE=8
RATE_LIMIT_ADMIN_LOGIN_PER_MINUTE=10
RATE_LIMIT_ADMIN_2FA_PER_MINUTE=10
RATE_LIMIT_ADMIN_REFRESH_PER_MINUTE=30
RATE_LIMIT_TOPUPS_PER_MINUTE=20
RATE_LIMIT_SLIP_UPLOAD_PER_MINUTE=12
RATE_LIMIT_WITHDRAWALS_PER_MINUTE=12
```

## 4. R2/S3 slip verification

Expected:

1. Set storage env
2. Redeploy API
3. Upload a new member slip
4. Confirm object appears in bucket under `slips/YYYY-MM-DD/...`
5. Open admin topup page
6. Confirm protected slip preview loads

## 5. Security verification

Expected:

- admin login works
- 2FA enable works
- recovery codes appear once
- login with recovery code works once
- deactivate 2FA works after valid TOTP/recovery code
- audit log shows security events

## 6. Build commands

```bash
pnpm prisma db push
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Do not use:

```bash
pnpm prisma db push --force-reset
```

That command wipes data. Use it only on disposable local databases.
