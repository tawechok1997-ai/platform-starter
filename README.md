# Platform Starter

> Production-oriented monorepo for Member operations, Admin operations, wallet and finance workflows, provider integration, security controls, auditability and deployment verification.

![Build](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/build.yml/badge.svg)
![Smoke API](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/smoke.yml/badge.svg)
![E2E Smoke](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/e2e-smoke.yml/badge.svg)

## Current status

Updated: **2026-07-15**

| Area | Status |
|---|---|
| Monorepo, API, Admin and Member foundations | ✅ Done |
| Backend architecture R-001 through R-011 | ✅ Done |
| Finance concurrency and promotion settlement safeguards | ✅ Repository/CI evidence complete |
| Frontend feature architecture R-012 | 🚧 In progress |
| Shared UI system and accessibility R-013 | 🚧 In progress |
| Observability, runbooks and cleanup R-014 | ⏳ Mostly remaining |
| Authenticated browser regression | ⏸️ Requires safe credentials/deployed environment |
| Production migration/rollback verification | ⏸️ Requires approved production access |
| Real provider enablement | ⏸️ Code ready; vendor-specific UAT blocked |

The project-wide source of truth is [`docs/master-project-worklist.md`](docs/master-project-worklist.md). The UX/UI execution tracker is [`docs/master-worklist.md`](docs/master-worklist.md).

## Applications

| Application | Path | Responsibility |
|---|---|---|
| Member Web | `apps/web-member` | Member home, wallet, deposit/withdrawal, games, profile, notifications, support and KYC surfaces |
| Admin Web | `apps/web-admin` | Operations, finance, members, risk, reports, providers, games, CMS/settings, security and KYC administration |
| API | `apps/api` | NestJS application, authentication, finance, provider, content, support, KYC, security and audit domains |
| Database | `prisma/schema.prisma` | PostgreSQL schema and migrations managed with Prisma |
| Shared API client | `packages/api-client` | Central Admin/Member transport, auth refresh, errors, retries, uploads and private downloads |

## Architecture status

R-001 through R-011 are closed with implementation and automated/closure evidence:

1. Architecture inventory and ownership
2. Dependency rules and module boundaries
3. Regression safety net
4. DTO, type strictness and API contracts
5. Shared API client consolidation
6. CI quality baseline
7. Backend service decomposition
8. Domain model and policy separation
9. Repository, transaction and persistence boundaries
10. Query/read models and projection cleanup
11. Error, authorization and security boundaries

Active structural work continues under R-012 through R-014. Closure and evidence documents are kept under `docs/architecture`, `docs/evidence` and the individual `docs/r0xx-*.md` files.

## Technology

| Layer | Stack |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, Prisma |
| Authentication | JWT access/refresh, separated Admin/Member sessions, TOTP 2FA and recovery codes |
| Storage | Private local or S3/R2-compatible object storage |
| Rate limiting | In-memory fallback with Redis support |
| Testing | Jest, PostgreSQL integration/concurrency suites and Playwright smoke/visual workflows |
| CI/CD | GitHub Actions and Railway-ready deployment workflows |

## Core capabilities

### Member

- Authentication and session controls
- Wallet, deposits, withdrawals and transaction history
- Bank-account management
- Game discovery and launch states
- Promotions, profile and security
- Notifications, support/FAQ and KYC foundations
- Mobile-first responsive surfaces

### Admin

- Protected operations workspace with RBAC and resource-level authorization
- Deposit/withdrawal claims, review and settlement workflows
- Wallet, ledger, reconciliation and finance reports
- Member, risk, activity and security administration
- Provider readiness, credentials, webhook and recovery tooling
- CMS/settings, promotion, affiliate/commission and KYC workflows
- Audit timelines and stable error/security boundaries

### Safety and operations

- Transactional and idempotent money-changing paths
- PostgreSQL concurrency regression suites
- Domain policies and repository/transaction boundaries
- CSRF, token, XSS, anti-bot and sensitive-log guards
- Health/version checks, smoke workflows and CI quality gates
- Backup/restore verification foundations

## Quick start

```bash
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Run migrations only against an approved environment:

```bash
pnpm db:migrate
pnpm db:seed:access
```

> Never use `prisma db push --force-reset`, destructive reset commands or database concurrency suites against production.

## Development services

| Service | Default URL |
|---|---|
| Member Web | `http://localhost:3000` |
| Admin Web | `http://localhost:3001` |
| API | `http://localhost:4000` |

```bash
pnpm --filter @platform/api start:prod
pnpm start:web-admin
pnpm start:web-member
```

## Verification commands

Use the commands relevant to the affected scope:

```bash
pnpm lint
pnpm test
pnpm build
pnpm typecheck:api
pnpm typecheck:admin
pnpm typecheck:member
pnpm test:e2e:smoke
pnpm test:e2e:visual
```

Architecture closure commands are documented in the corresponding closure files. Browser and deployed checks must not be reported as passed unless an actual run produced evidence.

## Environment overview

Typical API configuration includes:

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_KEY=change-me
ADMIN_JWT_ACCESS_TTL=10m
ADMIN_REFRESH_TTL_HOURS=12
JWT_REFRESH_TTL_DAYS=30
MEMBER_WEB_URL=https://member.example.com
ADMIN_WEB_URL=https://admin.example.com
```

Optional infrastructure:

```env
REDIS_URL=redis://...
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-key>
S3_FORCE_PATH_STYLE=true
```

Web applications use the approved API base URL through the shared API client:

```env
NEXT_PUBLIC_API_URL=https://api-service.example.com
```

Never commit real credentials, OTP values, access/refresh tokens or private-media URLs.

## Documentation map

| Document | Purpose |
|---|---|
| [`docs/master-project-worklist.md`](docs/master-project-worklist.md) | Canonical project status, evidence and execution order |
| [`docs/current-execution-status.md`](docs/current-execution-status.md) | Concise operational checkpoint |
| [`docs/master-worklist.md`](docs/master-worklist.md) | Active UX/UI execution tracker |
| [`docs/production-verification.md`](docs/production-verification.md) | Production verification procedures |
| [`docs/playwright-smoke.md`](docs/playwright-smoke.md) | Browser smoke guidance |
| [`docs/storage.md`](docs/storage.md) | Private storage guidance |
| [`docs/rate-limits.md`](docs/rate-limits.md) | Rate-limit and Redis guidance |
| [`docs/admin-access-control.md`](docs/admin-access-control.md) | Admin RBAC and permission behavior |

## Release boundaries

Do not enable real-money provider traffic until all of the following are complete:

- vendor endpoint and credentials
- signature and error contract
- callback/IP whitelist requirements
- reconciliation and failure-path regression
- provider-specific UAT
- approved migration/deployment version checks

## License

Private/internal platform unless a license is added.