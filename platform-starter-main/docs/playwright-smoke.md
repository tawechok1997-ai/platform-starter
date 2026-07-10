# Playwright UI Smoke Tests

ใช้สำหรับเช็กหน้าเว็บ admin/member แบบ browser smoke โดยไม่ทำธุรกรรมเงินจริงหรือเปลี่ยนสถานะรายการ

## Files

```txt
playwright.smoke.config.ts
tests/e2e-smoke/web-smoke.spec.ts
.github/workflows/e2e-smoke.yml
```

## What it checks

Admin public:

- `/login`

Admin protected pages, unauthenticated smoke:

- `/dashboard`
- `/topups`
- `/withdrawals`
- `/security`

Member public:

- `/login`
- `/register`

Member protected/public app pages:

- `/`
- `/deposit`
- `/withdraw`
- `/transactions`

The test checks that pages do not return server errors and that the page body renders.

## Local usage

Install dependencies and browsers:

```bash
pnpm install --frozen-lockfile=false
pnpm exec playwright install
```

Run against local apps:

```bash
ADMIN_WEB_URL="http://localhost:3001" \
MEMBER_WEB_URL="http://localhost:3000" \
pnpm test:e2e:smoke
```

Run against deployed apps:

```bash
ADMIN_WEB_URL="https://admin-service.up.railway.app" \
MEMBER_WEB_URL="https://member-service.up.railway.app" \
pnpm test:e2e:smoke
```

## GitHub Actions

Workflow:

```txt
E2E Smoke
```

How to run:

1. Open GitHub Actions
2. Select `E2E Smoke`
3. Click `Run workflow`
4. Enter admin/member web URLs
5. Run

The workflow installs Playwright Chromium/WebKit and uploads the Playwright report artifact.

## Safe behavior

This smoke suite intentionally does not:

- login with real credentials
- create topups
- upload slips
- approve/reject topups
- complete/reject withdrawals
- change wallet balances

It is meant to catch broken pages, bad routing, SSR errors, and obvious deployment problems.
