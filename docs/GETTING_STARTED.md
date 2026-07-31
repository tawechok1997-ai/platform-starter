# Getting Started

Updated: **2026-07-31**  
Owner: **Platform Engineering**  
Status: **Active**  
Verification: `pnpm check:quick`

This is the shortest supported path for a new engineer to run, understand and safely change `platform-starter`.

## 1. Required runtime

- Node.js 22
- Corepack
- pnpm 11.13.0
- PostgreSQL 16
- Redis for distributed rate limiting and shared caches

```bash
corepack enable
corepack prepare pnpm@11.13.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

Do not reuse development secrets in a deployed environment.

## 2. Start infrastructure

Create a PostgreSQL database matching `DATABASE_URL` and a Redis instance matching `REDIS_URL`.

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed:access
```

Use `db:migrate`, not destructive reset or force-push commands, against shared environments.

## 3. Build before starting

```bash
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

Build commands are read-only. If generated catalogs or Admin reference assets drift, use the explicit write commands, review the diff and commit it:

```bash
pnpm --filter @platform/api normalize:generated-catalogs
pnpm --filter @platform/web-admin sync:reference-assets
```

## 4. Start applications

Run each command in a separate terminal:

```bash
pnpm start:api
pnpm start:web-admin
pnpm start:web-member
```

Default URLs:

| Service | URL |
| --- | --- |
| Member | `http://localhost:3000` |
| Admin | `http://localhost:3001` |
| API | `http://localhost:4000` |
| API health | `http://localhost:4000/health` |
| API version | `http://localhost:4000/version` |

## 5. Read the ownership contract

Before editing, read:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/master-project-worklist.md`
4. `docs/operations/codebase-professionalization-audit.md`
5. the architecture, security, finance, storage or UI contract for the affected scope

Do not move money, permission, session, KYC, provider or storage behavior between modules without an ownership review.

## 6. First-change checklist

- declare the affected app/domain
- locate the canonical owner and duplicate paths
- add or update tests before changing a high-risk path
- run package checks, then repository checks
- verify API startup for Nest module/provider changes
- verify rendered behavior for UI changes
- update the owning document in the same PR
- record migration, environment and rollback impact

## 7. Minimum verification

```bash
pnpm check:repository
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node tools/verify-api-startup.mjs
node tools/audit-build-purity.mjs
node tools/audit-public-assets.mjs
```

The startup verifier requires the API build and an available database. CI runs it after applying the disposable schema.

## 8. Safe handoff

Use `docs/operations/engineering-handoff.md`. A handoff is incomplete without the branch, commit, actual checks, startup result, environment changes, remaining risks and rollback path.
