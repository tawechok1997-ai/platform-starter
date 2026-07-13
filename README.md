# Platform Starter

> Production-ready web platform monorepo for member operations, admin operations, wallet workflows, finance reporting, security controls, and deployment verification.

![Build](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/build.yml/badge.svg)
![Smoke API](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/smoke.yml/badge.svg)
![E2E Smoke](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/e2e-smoke.yml/badge.svg)

## Overview

`platform-starter` is a full-stack platform foundation with separated member/admin applications and a NestJS API. It is designed around secure money operations, auditability, role-based admin access, production smoke testing, and operational visibility.

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
- Top-up and withdrawal review queues
- Claim/release/approve/reject/complete workflows
- Wallet and ledger visibility
- Member management
- Risk alerts
- Finance operations dashboard

### Finance, Activity, and Security

- Daily finance summary and trend reports
- Wallet reconciliation and queue aging
- CSV exports
- Admin audit logs and activity timeline
- Admin sessions, TOTP 2FA, and recovery codes
- RBAC and permission management

### Production Operations

- Health and version endpoints
- API and E2E smoke tests
- Production environment verification
- Database backup/restore scripts
- Redis-backed rate limiting
- Private slip storage with local or S3/R2 drivers

## Repository Structure

```txt
apps/
  api/                 NestJS API
  web-admin/           Next.js admin app
  web-member/          Next.js member app
prisma/
  schema.prisma
  seed.ts
  seed-access.ts
scripts/
  smoke-api.sh
  verify-production-env.sh
  check-health.sh
  backup-db.sh
  restore-db.sh
docs/
  master-worklist.md
  mobile-visual-regression-checklist.md
  responsive-surface-guardrails.md
  ux-regression-matrix-finance-operations.md
  final-qa-checklist.md
  member-ux-qa.md
  reports-analytics.md
  activity-timeline.md
  github-actions-smoke.md
  playwright-smoke.md
  production-verification.md
```

## Quick Start

```bash
pnpm install --frozen-lockfile=false
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Run database sync only when appropriate:

```bash
pnpm prisma db push
pnpm prisma generate
```

Seed access permissions:

```bash
pnpm db:seed:access
```

> Do not use `pnpm prisma db push --force-reset` on production.

## Development Ports

| Service | URL |
|---|---|
| Member Web | `http://localhost:3000` |
| Admin Web | `http://localhost:3001` |
| API | `http://localhost:4000` |

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

## Smoke Testing

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

```bash
ADMIN_WEB_URL="https://admin-service.up.railway.app" \
MEMBER_WEB_URL="https://member-service.up.railway.app" \
pnpm test:e2e:smoke
```

## Key Documentation

| Document | Purpose |
|---|---|
| [`docs/master-worklist.md`](docs/master-worklist.md) | Single source of truth for UX/UI status, priorities, dependencies, execution order, verification, and evidence |
| [`docs/mobile-visual-regression-checklist.md`](docs/mobile-visual-regression-checklist.md) | Mobile visual verification checklist |
| [`docs/responsive-surface-guardrails.md`](docs/responsive-surface-guardrails.md) | Mobile/desktop ownership and responsive safety rules |
| [`docs/ux-regression-matrix-finance-operations.md`](docs/ux-regression-matrix-finance-operations.md) | Finance and operations route/state/viewport regression evidence |
| [`docs/final-qa-checklist.md`](docs/final-qa-checklist.md) | Final QA and production verification checklist |
| [`docs/member-ux-qa.md`](docs/member-ux-qa.md) | Member finance-flow UX and production integration QA |
| [`docs/reports-analytics.md`](docs/reports-analytics.md) | Reports, queue aging, and CSV export guide |
| [`docs/activity-timeline.md`](docs/activity-timeline.md) | Activity timeline filters, permissions, and QA |
| [`docs/github-actions-smoke.md`](docs/github-actions-smoke.md) | Smoke API workflow guide |
| [`docs/playwright-smoke.md`](docs/playwright-smoke.md) | Playwright UI smoke guide |
| [`docs/production-verification.md`](docs/production-verification.md) | Production environment verification guide |
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
| Member UX/UI modernization | In progress |
| Admin UX/UI modernization | In progress |
| Public/Auth UX/UI modernization | In progress |
| Master tracking | [`docs/master-worklist.md`](docs/master-worklist.md) |

## License

Private/internal platform starter unless a license is added.
