# Production Runbook

คู่มือสั้นสำหรับ deploy, rollback, database sync และ incident handling ของ platform-starter

## Golden rules

- ห้ามรัน `pnpm prisma db push --force-reset` บน production
- ห้ามเปลี่ยน `JWT_ACCESS_KEY` โดยไม่มีแผน logout ทุก session
- ก่อน deploy API ที่มี Prisma schema ใหม่ ให้รัน `pnpm prisma db push` และ `pnpm prisma generate`
- ถ้า Railway logs มี Prisma `P2021` แปลว่าตารางใน database ยังไม่ตรงกับ schema

## Services

- API: NestJS, Prisma, PostgreSQL
- Web Admin: Next.js admin
- Web Member: Next.js member
- Database: Railway PostgreSQL
- Private media: Railway volume path `/app/private-media`

## Required environment variables

### API

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_KEY=keep-the-same-value
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30
ADMIN_JWT_ACCESS_TTL=10m
ADMIN_REFRESH_TTL_HOURS=12
MEMBER_WEB_URL=https://member.example.com
ADMIN_WEB_URL=https://admin.example.com
PRIVATE_MEDIA_DIR=/app/private-media/topup-slips
RATE_LIMIT_PER_MINUTE=20
RISK_HIGH_WITHDRAWAL_AMOUNT=50000
```

### Web Admin / Web Member

```env
NEXT_PUBLIC_API_URL=https://api-service.up.railway.app
```

## Safe deploy order

1. Push code to GitHub
2. Run database sync if Prisma schema changed

```bash
pnpm prisma db push
pnpm prisma generate
```

3. Build API

```bash
pnpm build:api
```

4. Build admin/member frontends

```bash
pnpm build:web-admin
pnpm build:web-member
```

5. Redeploy Railway services

Recommended order:

1. API
2. Web Admin
3. Web Member

## Health checks

After API deploy, verify:

```txt
GET /health
GET /version
```

Expected `/health` shape:

```json
{
  "status": "ok",
  "service": "api",
  "database": "ok",
  "privateMedia": "ok"
}
```

Expected `/version` shape:

```json
{
  "service": "api",
  "version": "0.1.0",
  "environment": "production",
  "time": "..."
}
```

## Risk Alerts checklist

If `/admin/risk-alerts` returns 500 with `public.risk_alerts does not exist`:

```bash
pnpm prisma db push
pnpm prisma generate
pnpm build:api
```

Then redeploy API.

Test from admin UI:

1. Open `/risk-alerts`
2. Click `Scan now`
3. Confirm list loads without Prisma `P2021`
4. Test status actions: Reviewing, Resolve, Dismiss

## Permission denied checklist

If admin Settings shows permission denied:

1. Confirm API was redeployed after permission guard fixes
2. Confirm admin role has permissions or wildcard `*`
3. Refresh admin session by logging out and logging in again
4. Check API logs for `403` and permission names

## Rollback

Preferred rollback order:

1. Revert or redeploy previous API commit
2. Revert or redeploy previous frontend commit
3. Do not rollback database unless a written restore plan exists

For Git rollback:

```bash
git revert <commit-sha>
git push
```

For Railway:

- Open the affected service
- Go to Deployments
- Redeploy a known good deployment

## Database backup and restore

Before risky database changes:

1. Create a Railway PostgreSQL backup if available
2. Export a dump using the database connection string when needed
3. Store backup outside the app container

Do not run destructive commands without a verified backup.

## Common incidents

### API starts but admin pages fail

Check:

- `NEXT_PUBLIC_API_URL` in web-admin points to API service, not admin service
- API `/health` returns ok
- Browser localStorage has current admin token
- Admin refresh endpoint returns 201

### Token expired logs

`TokenExpiredError` followed by `POST /admin/auth/refresh 201` is normal. It means access token expired and refresh worked.

### Private media fails

Check:

- `PRIVATE_MEDIA_DIR=/app/private-media/topup-slips`
- Railway volume is mounted at `/app/private-media`
- `/health` shows `privateMedia: ok`

### Rate limit issues

Sensitive routes are rate-limited in `apps/api/src/main.ts`.

Optional env overrides:

```env
RATE_LIMIT_PER_MINUTE=20
RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE=10
RATE_LIMIT_MEMBER_REGISTER_PER_MINUTE=8
RATE_LIMIT_ADMIN_LOGIN_PER_MINUTE=10
RATE_LIMIT_TOPUPS_PER_MINUTE=20
RATE_LIMIT_SLIP_UPLOAD_PER_MINUTE=12
RATE_LIMIT_WITHDRAWALS_PER_MINUTE=12
```

If users are blocked too aggressively, raise route-specific limits first instead of disabling the middleware.
