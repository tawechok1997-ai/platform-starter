# Platform Starter

> Production-ready web platform monorepo for member operations, admin operations, wallet workflows, finance reporting, security controls, and deployment verification.

![Build](https://github.com/kogawz1997/platform-starter/actions/workflows/build.yml/badge.svg)
![Smoke API](https://github.com/kogawz1997/platform-starter/actions/workflows/smoke.yml/badge.svg)
![E2E Smoke](https://github.com/kogawz1997/platform-starter/actions/workflows/e2e-smoke.yml/badge.svg)

## Overview

`platform-starter` is a full-stack platform foundation with separated member/admin applications and a NestJS API. It is designed around secure money operations, auditability, role-based admin access, production smoke testing, and operational visibility.

The project is structured as a monorepo so API, admin web, member web, database schema, scripts, CI workflows, and deployment documentation stay together instead of being scattered around like someone dropped a toolbox down a staircase.

## Applications

| App | Path | Description |
|---|---|---|
| Member Web | `apps/web-member` | Member dashboard, wallet, deposits, withdrawals, bank accounts, transactions |
| Admin Web | `apps/web-admin` | Operations dashboard, topups, withdrawals, wallets, ledgers, reports, activity, security |
| API | `apps/api` | NestJS backend API, auth, wallet, finance, reports, storage, security |
| Database | `prisma/schema.prisma` | PostgreSQL schema managed with Prisma |

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, Prisma |
| Auth | JWT access/refresh, admin sessions, TOTP 2FA, recovery codes |
| Storage | Local private storage or S3/R2 compatible object storage |
| Rate Limit | Memory fallback with Redis support |
| CI/CD | GitHub Actions build, API smoke, E2E smoke |
| Runtime | Railway-ready services |

## Core Features

### Member Experience

- Member authentication
- Wallet balance view
- Deposit/top-up request flow
- Slip upload flow
- Withdrawal request flow
- Bank account management
- Transaction history
- Mobile-first member pages

### Admin Operations

- Admin login and protected operations area
- Top-up review queue
- Withdrawal review queue
- Claim/release workflows
- Confirm/decline/complete/reject operations
- Wallet overview
- Wallet ledger visibility
- Member management
- Risk alerts
- Finance operation dashboard

### Finance Reports & Analytics

- Daily finance summary
- 7/14/30 day trend reports
- Top-up volume
- Withdrawal volume
- Net flow
- Wallet reconciliation
- Pending queue aging
- CSV exports for report trends and reconciliation

### Activity & Auditability

- Admin audit logs
- Activity timeline from audit logs, ledgers, topups, and withdrawals
- Timeline filters by type, date, search, actor, member, and reference
- Quick links from timeline items to related pages
- Read-only operational visibility without extra event tables

### Security Controls

- Separate member and admin auth
- Admin session listing and revoke actions
- Logout current, other, or all admin sessions
- TOTP 2FA setup
- QR code setup flow
- Recovery codes
- Regenerate recovery codes
- Deactivate 2FA with TOTP or recovery code
- RBAC/permission guard
- Admin access overview
- Role assignment/removal UI
- Seeded permissions for access, reports, and activity

### Production Operations

- Health and version endpoints
- Shell health check script
- API smoke test script
- Production env verification script
- Database backup/restore scripts
- Redis-backed rate limit support
- Private slip storage with local or S3/R2 driver
- GitHub Actions build workflow
- Scheduled API smoke workflow
- Manual E2E smoke workflow

## Repository Structure

```txt
apps/
  api/                 NestJS API
  web-admin/           Next.js admin app
  web-member/          Next.js member app
prisma/
  schema.prisma        Database schema
  seed.ts              Base seed
  seed-access.ts       Admin access/report/activity permissions
scripts/
  smoke-api.sh         API smoke checks
  verify-production-env.sh
  check-health.sh
  backup-db.sh
  restore-db.sh
docs/
  ux-ui-master-roadmap.md
  mobile-visual-regression-checklist.md
  responsive-surface-guardrails.md
  ux-regression-matrix-finance-operations.md
  final-qa-checklist.md
  reports-analytics.md
  activity-timeline.md
  github-actions-smoke.md
  playwright-smoke.md
  production-verification.md
  member-ux-qa.md
```

## Quick Start

```bash
pnpm install --frozen-lockfile=false
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Run database sync when needed:

```bash
pnpm prisma db push
pnpm prisma generate
```

Seed access permissions:

```bash
pnpm db:seed:access
```

> Do not use `pnpm prisma db push --force-reset` on production. That is not a migration strategy. That is a bonfire with a CLI prompt.

## Development Ports

| Service | URL |
|---|---|
| Member Web | `http://localhost:3000` |
| Admin Web | `http://localhost:3001` |
| API | `http://localhost:4000` |

## Build Commands

```bash
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

## Start Commands

```bash
pnpm --filter @platform/api start:prod
pnpm start:web-admin
pnpm start:web-member
```

## Environment Variables

### API

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_KEY=change-me
ADMIN_JWT_ACCESS_TTL=10m
ADMIN_REFRESH_TTL_HOURS=12
JWT_REFRESH_TTL_DAYS=30
PRIVATE_MEDIA_DIR=/app/private-media/topup-slips
MEMBER_WEB_URL=https://member.example.com
ADMIN_WEB_URL=https://admin.example.com
ADMIN_OTP_ISSUER=Platform Admin
```

### Optional Redis

```env
REDIS_URL=redis://...
```

### Optional S3/R2 Slip Storage

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_FORCE_PATH_STYLE=true
```

### Web Apps

```env
NEXT_PUBLIC_API_URL=https://api-service.up.railway.app
```

## GitHub Actions

| Workflow | Purpose |
|---|---|
| Build | Installs dependencies, validates shell scripts, generates Prisma client, builds API/Admin/Member |
| Smoke API | Manual and scheduled API smoke checks against deployed API |
| E2E Smoke | Manual Playwright smoke checks against deployed admin/member web apps |

Scheduled API smoke runs daily at `01:00 UTC`.

## Smoke Testing

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

The smoke script checks public endpoints, protected endpoints, reports, exports, activity timeline, admin pages, member endpoints, and security endpoints.

## Playwright E2E Smoke

```bash
ADMIN_WEB_URL="https://admin-service.up.railway.app" \
MEMBER_WEB_URL="https://member-service.up.railway.app" \
pnpm test:e2e:smoke
```

## Production Checklist

- [ ] Deploy API service
- [ ] Deploy admin web service
- [ ] Deploy member web service
- [ ] Set `NEXT_PUBLIC_API_URL` on both web apps
- [ ] Run `pnpm db:seed:access`
- [ ] Verify `/health` and `/version`
- [ ] Run API smoke
- [ ] Run E2E smoke
- [ ] Verify `/reports` on mobile
- [ ] Verify `/activity` on mobile
- [ ] Verify `/deposit`, `/withdraw`, `/transactions`, and `/bank-accounts` on mobile
- [ ] Verify CSV exports
- [ ] Verify Redis rate limit if enabled
- [ ] Verify R2/S3 slip upload and admin preview if enabled

## Key Documentation

| Document | Purpose |
|---|---|
| [`docs/ux-ui-master-roadmap.md`](docs/ux-ui-master-roadmap.md) | Master status, backlog, execution order, and definition of done for UX/UI across Member, Admin, and Public/Auth |
| [`docs/mobile-visual-regression-checklist.md`](docs/mobile-visual-regression-checklist.md) | Mobile visual verification checklist |
| [`docs/responsive-surface-guardrails.md`](docs/responsive-surface-guardrails.md) | Mobile/desktop ownership and responsive safety rules |
| [`docs/ux-regression-matrix-finance-operations.md`](docs/ux-regression-matrix-finance-operations.md) | Finance and operations route/state/viewport regression matrix |
| [`docs/final-qa-checklist.md`](docs/final-qa-checklist.md) | Final QA and production verification checklist |
| [`docs/member-ux-qa.md`](docs/member-ux-qa.md) | Member mobile UX and production integration QA |
| [`docs/reports-analytics.md`](docs/reports-analytics.md) | Reports, queue aging, and CSV export guide |
| [`docs/activity-timeline.md`](docs/activity-timeline.md) | Activity timeline filters, permissions, and QA |
| [`docs/github-actions-smoke.md`](docs/github-actions-smoke.md) | Smoke API workflow guide |
| [`docs/playwright-smoke.md`](docs/playwright-smoke.md) | Playwright UI smoke guide |
| [`docs/production-verification.md`](docs/production-verification.md) | Production env verification guide |
| [`docs/storage.md`](docs/storage.md) | Local/S3/R2 private slip storage guide |
| [`docs/rate-limits.md`](docs/rate-limits.md) | Redis-backed rate limit guide |
| [`docs/admin-access-control.md`](docs/admin-access-control.md) | Admin RBAC and permission management |

## Current Status

| Area | Status |
|---|---|
| Core apps | Ready |
| Wallet flows | Ready |
| Admin operations | Ready |
| Reports/activity | Ready |
| Security/2FA | Ready |
| CI build | Passing at latest confirmed checkpoint |
| API smoke | Passing |
| E2E smoke | Passing |
| Member UX/UI modernization | In progress |
| Admin UX/UI modernization | In progress |
| Public/Auth UX/UI modernization | In progress |
| Master UX/UI tracking | [`docs/ux-ui-master-roadmap.md`](docs/ux-ui-master-roadmap.md) |

## UX/UI Polish Tracking

The master roadmap is maintained in:

- [`docs/ux-ui-master-roadmap.md`](docs/ux-ui-master-roadmap.md)
- [Issue #2: UX/UI polish backlog after CI pass](https://github.com/kogawz1997/platform-starter/issues/2)

## License

Private/internal platform starter unless a license is added.
