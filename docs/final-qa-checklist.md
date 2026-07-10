# Final QA Checklist

ใช้ไฟล์นี้สำหรับเทสหลังเพิ่ม reports, activity timeline, CSV export, permission guard, smoke workflow และ E2E smoke

## 1. Install / build locally

```bash
pnpm install --frozen-lockfile=false
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

ถ้าต้องเช็ก shell scripts ด้วย:

```bash
bash -n scripts/*.sh
```

## 2. Seed permissions

หลัง deploy หรือหลัง pull code ล่าสุด ต้องรัน:

```bash
pnpm db:seed:access
```

สิ่งที่ seed เพิ่ม:

```txt
admin.access.view
admin.access.manage
admin.reports.view
admin.activity.view
```

ถ้าไม่รัน seed นี้ admin role ที่ไม่ได้มี `*` อาจเจอ:

```txt
403 Permission denied
```

## 3. Run database push only if needed

```bash
pnpm prisma db push
pnpm prisma generate
```

ห้ามใช้:

```bash
pnpm prisma db push --force-reset
```

ถ้า Prisma เตือน data loss ให้หยุดและอ่าน log ก่อน

## 4. API smoke test

### Local

```bash
API_URL="http://localhost:4000" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

### Production / Railway

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

Expected:

```txt
Smoke result: <n> passed, 0 failed
```

Smoke now checks:

```txt
/health
/version
/admin/finance/summary
/admin/reports/trends?days=7
/admin/reports/queue-aging
/admin/exports/report-trends.csv?days=7
/admin/exports/reconciliation.csv?limit=1
/admin/activity/timeline
/admin/activity/timeline?page=1&take=1&type=AUDIT&search=admin
/admin/audit-logs
/admin/members
/admin/wallets
/admin/topups
/admin/withdrawals
/admin/ledgers
/admin/risk-alerts
/admin/access/overview
/admin/auth/sessions
/member/wallet
/member/topups
/member/withdrawals
```

## 5. Playwright UI smoke

Install browser once:

```bash
pnpm exec playwright install
```

### Local

```bash
ADMIN_WEB_URL="http://localhost:3001" \
MEMBER_WEB_URL="http://localhost:3000" \
pnpm test:e2e:smoke
```

### Production / Railway

```bash
ADMIN_WEB_URL="https://admin-service.up.railway.app" \
MEMBER_WEB_URL="https://member-service.up.railway.app" \
pnpm test:e2e:smoke
```

The UI smoke checks:

```txt
Admin:
/login
/dashboard
/topups
/withdrawals
/reports
/activity
/security

Member:
/login
/register
/
/deposit
/withdraw
/transactions
```

## 6. Manual QA: Reports

Open:

```txt
/reports
```

Verify:

```txt
- page loads
- Wallets metric shows
- Total Balance shows
- Locked shows
- Ledger Items shows
- Pending Top-ups shows
- Pending Withdrawals shows
- Pending Queue Aging section loads
- Over 15m / Over 60m / Over 24h metrics show
- Finance Trend loads
- 7d / 14d / 30d buttons work
- Export CSV under Finance Trend downloads file
- Daily Summary still loads
- Reconciliation still loads
- Export CSV under Reconciliation downloads file
```

Direct API checks:

```bash
curl -i "$API_URL/admin/reports/trends?days=7" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -i "$API_URL/admin/reports/queue-aging" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -i "$API_URL/admin/exports/report-trends.csv?days=7" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -i "$API_URL/admin/exports/reconciliation.csv?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected HTTP status:

```txt
200
```

Without token, expected:

```txt
401
```

Without `admin.reports.view`, expected:

```txt
403
```

## 7. Manual QA: Activity Timeline

Open:

```txt
/activity
```

Verify:

```txt
- page loads
- ALL filter works
- AUDIT filter works
- LEDGER filter works
- TOPUP filter works
- WITHDRAWAL filter works
- Search works
- Actor filter works
- Member ID filter works
- Ref type filter works
- Ref ID filter works
- From date works
- To date works
- Apply works
- Reset works
- Previous / Next works
- quick links open related pages
```

Direct API checks:

```bash
curl -i "$API_URL/admin/activity/timeline?page=1&take=10&type=ALL" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -i "$API_URL/admin/activity/timeline?page=1&take=10&type=AUDIT&search=admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -i "$API_URL/admin/activity/timeline?page=1&take=10&from=2026-07-01&to=2026-07-08" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected HTTP status:

```txt
200
```

Without token, expected:

```txt
401
```

Without `admin.activity.view`, expected:

```txt
403
```

## 8. Manual QA: Permission / Access Control

Open:

```txt
/access
```

Verify permissions exist:

```txt
admin.reports.view
admin.activity.view
```

Verify role behavior:

```txt
- role with * can access reports/activity
- role with admin.reports.view can access /reports and exports
- role with admin.activity.view can access /activity
- role without these permissions gets 403 from API
```

## 9. GitHub Actions

### Build workflow

Run or wait for CI:

```txt
Actions → Build
```

Expected:

```txt
- install dependencies
- bash -n scripts/*.sh
- prisma generate
- build API
- build Admin Web
- build Member Web
```

### Smoke API workflow

Manual:

```txt
Actions → Smoke API → Run workflow
```

Inputs:

```txt
api_url=https://api-service.up.railway.app
run_env_verification=false for quick smoke
run_admin_checks=true if PROD_ADMIN_TOKEN is fresh
run_member_checks=false unless PROD_MEMBER_TOKEN is fresh
```

Scheduled smoke also runs every day at:

```txt
01:00 UTC
```

### E2E Smoke workflow

Manual:

```txt
Actions → E2E Smoke → Run workflow
```

Inputs:

```txt
admin_web_url=https://admin-service.up.railway.app
member_web_url=https://member-service.up.railway.app
```

## 10. Production env verification

Run in environment with production env loaded:

```bash
API_URL="https://api-service.up.railway.app" ./scripts/verify-production-env.sh
```

Required env:

```txt
DATABASE_URL
JWT_ACCESS_KEY
ADMIN_JWT_ACCESS_TTL
ADMIN_REFRESH_TTL_HOURS
MEMBER_WEB_URL
ADMIN_WEB_URL
PRIVATE_MEDIA_DIR
```

Optional but recommended:

```txt
REDIS_URL
STORAGE_DRIVER
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_FORCE_PATH_STYLE
```

## 11. Redis verification

Set in Railway API service:

```env
REDIS_URL=redis://...
```

Redeploy API, then test login/rate limit behavior.

Smoke should still pass:

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

## 12. R2/S3 slip storage verification

Set in Railway API service:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_FORCE_PATH_STYLE=true
```

Then verify:

```txt
- member uploads new slip
- object appears in R2 bucket under slips/YYYY-MM-DD/...
- admin can open slip preview
- old local/legacy slip fallback still does not break old records
```

## 13. Final pass criteria

Project is ready when all pass:

```txt
- pnpm build:api passes
- pnpm build:web-admin passes
- pnpm build:web-member passes
- pnpm db:seed:access has been run
- /reports loads
- /activity loads
- CSV exports download
- smoke-api passes
- Playwright smoke passes
- Redis env verified
- R2/S3 slip upload verified
```
