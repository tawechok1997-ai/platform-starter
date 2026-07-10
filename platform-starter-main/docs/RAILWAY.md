# Railway Deployment

## Recommended setup

Create 4 Railway services:

1. PostgreSQL database
2. API service
3. Member web service
4. Admin web service

P1 does not need Redis or MinIO yet. Add them in later phases.

## API Service

Connect the GitHub repo and set the service to deploy from the repository root.

### Build command

```bash
pnpm install && pnpm build:api
```

### Start command

```bash
pnpm start:api
```

### Required variables

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_KEY=<set-a-long-random-value>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30
ADMIN_JWT_ACCESS_TTL=10m
ADMIN_REFRESH_TTL_HOURS=12
ADMIN_OTP_FOR_DEV=<temporary-dev-code>
DEFAULT_ADMIN_SECRET=<temporary-first-admin-password>
MEMBER_WEB_URL=https://your-member-service.up.railway.app
ADMIN_WEB_URL=https://your-admin-service.up.railway.app
```

Railway provides `PORT` automatically. The API listens to `process.env.PORT` first.

## Database migration and seed

After API build succeeds, run these once from Railway shell or a local terminal pointed at the Railway `DATABASE_URL`:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

`db:migrate` uses `prisma migrate deploy`, which is suitable for deployed environments.

## Member Web Service

### Build command

```bash
pnpm install && pnpm build:web-member
```

### Start command

```bash
pnpm start:web-member
```

### Variables

```env
NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app
```

## Admin Web Service

### Build command

```bash
pnpm install && pnpm build:web-admin
```

### Start command

```bash
pnpm start:web-admin
```

### Variables

```env
NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app
```

## First login

Seed creates the first admin:

```text
username: admin
secret: value from DEFAULT_ADMIN_SECRET
```

## Common errors

### API starts then exits

Check that `DATABASE_URL` exists and migrations have been applied.

### CORS error

Make sure `MEMBER_WEB_URL` and `ADMIN_WEB_URL` exactly match Railway public URLs.

### Prisma client error

Run:

```bash
pnpm db:generate
```

### No tables found

Run:

```bash
pnpm db:migrate
pnpm db:seed
```
