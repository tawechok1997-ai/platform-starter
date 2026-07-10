# CI Build Checks

Workflow: `.github/workflows/build.yml`

รันอัตโนมัติเมื่อ:

- push เข้า `main`
- pull request

## Checks

CI ทำตามลำดับนี้:

1. Checkout repository
2. Setup pnpm
3. Setup Node.js 20
4. Install dependencies with frozen lockfile
5. Validate shell scripts syntax
6. Generate Prisma client
7. Build API
8. Build Admin Web
9. Build Member Web

## Shell script validation

CI รัน:

```bash
bash -n scripts/*.sh
```

เพื่อจับ syntax error ใน scripts ก่อน deploy เช่น:

- backup script
- restore script
- health check script
- smoke test script
- production env verification script

## Build commands

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Admin/member web builds use:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Local equivalent

```bash
pnpm install --frozen-lockfile
bash -n scripts/*.sh
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

## Notes

CI does not push database schema changes. Run database updates manually and carefully:

```bash
pnpm prisma db push
pnpm prisma generate
```

Do not use `--force-reset` on production databases.
