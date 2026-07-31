# Platform Starter

> Production-oriented monorepo for Member operations, Admin operations, wallet and finance workflows, provider integration, security controls, auditability and deployment verification.

![Build](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/build.yml/badge.svg)
![Smoke API](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/smoke.yml/badge.svg)
![E2E Smoke](https://github.com/tawechok1997-ai/platform-starter/actions/workflows/e2e-smoke.yml/badge.svg)

## Current status

Updated: **2026-07-31**

| Area | Status |
| --- | --- |
| Monorepo, API, Admin and Member foundations | ✅ Implemented |
| Backend architecture R-001 through R-011 | ✅ Implemented with automated boundaries |
| Frontend feature architecture R-012 | ✅ Implemented |
| Shared UI system and accessibility R-013 | ✅ Implemented |
| Observability and cleanup R-014 | ✅ Implemented |
| Performance, storage and CI hardening P5 | ✅ Implemented |
| Read-only build and generated-asset drift gates | ✅ Implemented; CI acceptance required per PR |
| API bootstrap, health and commit-identity gate | ✅ Implemented; CI acceptance required per PR |
| Public executable asset quarantine | ✅ Active for legacy Member reference roots |
| Authenticated browser regression | ⏸️ Requires safe credentials and a deployed environment |
| Production migration/rollback verification | ⏸️ Requires approved production access |
| Real provider enablement | ⏸️ Code foundation ready; vendor-specific UAT blocked |
| Repository history size migration | 📋 Planned operational migration requiring coordinated approval |

The project-wide checkbox source of truth is [`docs/master-project-worklist.md`](docs/master-project-worklist.md). Start new engineering work with [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md), then use the complete [`docs/README.md`](docs/README.md) map. Historical worklists must not be restored as competing sources of truth.

Implementation is governed by [`AGENTS.md`](AGENTS.md). UI contracts are maintained in the Member/Admin design, menu, consistency and motion documents linked from the documentation map.

## Applications

| Application | Path | Responsibility |
| --- | --- | --- |
| Member Web | `apps/web-member` | Member home, wallet, deposit/withdrawal, games, profile, notifications, support and KYC surfaces |
| Admin Web | `apps/web-admin` | Operations, finance, members, risk, reports, providers, games, CMS/settings, security and KYC administration |
| API | `apps/api` | NestJS application, authentication, finance, provider, content, support, KYC, security and audit domains |
| Database | `prisma/schema.prisma` | PostgreSQL schema and migrations managed with Prisma |
| Shared API client | `packages/api-client` | Central Admin/Member transport, auth refresh, session-scoped caching, errors, retries, uploads and private downloads |

## Architecture status

R-001 through R-014 are closed in the repository with implementation and automated or documented evidence:

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
12. Frontend feature architecture and large-page decomposition
13. Shared UI system, design tokens and accessibility
14. Observability and cleanup

External verification remains under P6. Evidence documents are kept under `docs/architecture`, `docs/evidence` and the individual `docs/r0xx-*.md` files.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, Prisma |
| Authentication | JWT access/refresh, separated Admin/Member sessions, TOTP 2FA and recovery codes |
| Storage | Private local or S3/R2-compatible object storage |
| Rate limiting | Redis-backed distributed limits with bounded in-memory fallback |
| Testing | Jest, PostgreSQL integration/concurrency suites and Playwright smoke/visual workflows |
| CI/CD | GitHub Actions and Railway-ready deployment workflows |

## Core capabilities

### Member

- authentication and session controls
- wallet, deposits, withdrawals and transaction history
- bank-account management
- game discovery and launch states
- promotions, profile and security
- notifications, support/FAQ and KYC foundations
- mobile-first responsive surfaces

### Admin

- protected operations workspace with RBAC and resource-level authorization
- deposit/withdrawal claims, review and settlement workflows
- wallet, ledger, reconciliation and finance reports
- member, risk, activity and security administration
- provider readiness, credentials, webhook and recovery tooling
- CMS/settings, promotion, affiliate/commission and KYC workflows
- audit timelines and stable error/security boundaries

### Safety and operations

- transactional and idempotent money-changing paths
- PostgreSQL concurrency regression suites
- domain policies and repository/transaction boundaries
- CSRF, token, XSS, anti-bot and sensitive-log guards
- browser security headers and public-asset quarantine
- clean, read-only production builds
- API bootstrap, health/version and deployment identity checks
- backup/restore verification foundations

## Requirements

- Node.js 22
- Corepack enabled
- pnpm `11.13.0`, matching the root `packageManager` field
- PostgreSQL 16
- Redis for distributed rate limiting and shared production caches

## Quick start

```bash
corepack enable
corepack prepare pnpm@11.13.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Detailed setup, startup and first-change instructions: [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md).

Run migrations only against an approved environment:

```bash
pnpm db:migrate
pnpm db:seed:access
```

> Never use `prisma db push --force-reset`, destructive reset commands or database concurrency suites against production.

Generated catalogs and Admin reference assets are synchronized only through explicit write commands. Normal builds refuse drift and must leave the tracked tree unchanged.

```bash
pnpm --filter @platform/api normalize:generated-catalogs
pnpm --filter @platform/web-admin sync:reference-assets
```

Review and commit the resulting diff before building.

## Development services

| Service | Default URL |
| --- | --- |
| Member Web | `http://localhost:3000` |
| Admin Web | `http://localhost:3001` |
| API | `http://localhost:4000` |
| Health | `http://localhost:4000/health` |
| Version | `http://localhost:4000/version` |

```bash
pnpm start:api
pnpm start:web-admin
pnpm start:web-member
```

## Verification commands

Use the commands relevant to the affected scope:

```bash
pnpm check:repository
pnpm lint
pnpm test
pnpm build
pnpm typecheck
pnpm test:full-system:auto
pnpm test:e2e:smoke
pnpm test:e2e:visual
pnpm audit:master-worklist
node tools/audit-build-purity.mjs
node tools/audit-public-assets.mjs
node tools/verify-api-startup.mjs
```

The startup verifier requires a built API, an available migrated database and the required test environment. Browser and deployed checks must not be reported as passed unless an actual run produced evidence.

## Environment overview

Use [`.env.example`](.env.example) as the maintained variable map. Typical API configuration includes:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_KEY=<independent-secret-at-least-32-characters>
MEMBER_WEB_URL=https://member.example.com
ADMIN_WEB_URL=https://admin.example.com
API_PUBLIC_URL=https://api.example.com
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
```

Web applications use the approved API base URL through the shared API client:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

Never commit real credentials, OTP values, access/refresh tokens or private-media URLs.

## Documentation map

| Document | Purpose |
| --- | --- |
| [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) | Local setup and newcomer path |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common failures and safe fixes |
| [`docs/master-project-worklist.md`](docs/master-project-worklist.md) | Canonical checkbox status and external work |
| [`docs/README.md`](docs/README.md) | Documentation index and current replacement links |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Threat boundaries, controls and release gates |
| [`docs/security/public-assets.md`](docs/security/public-assets.md) | Public asset governance and quarantine |
| [`docs/operations/engineering-handoff.md`](docs/operations/engineering-handoff.md) | Required transfer evidence |
| [`docs/operations/repository-size-migration.md`](docs/operations/repository-size-migration.md) | Coordinated Git-history cleanup plan |
| [`docs/production-verification.md`](docs/production-verification.md) | Production verification procedures |
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
- API startup and health/version commit identity

Do not rewrite repository history to reduce size until the operational migration runbook has owner approval, backup verification and a coordinated re-clone window.

## License

Private/internal platform unless a license is added.
