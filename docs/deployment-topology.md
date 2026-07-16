# Deployment Topology and Operations Map

## Runtime topology

```text
Member Web ─┐
            ├── HTTPS API ── PostgreSQL
Admin Web ──┘          ├── Redis/cache and rate-limit backend
                       ├── Private object storage (local or S3/R2 compatible)
                       └── External provider and game APIs
```

## Services

| Service | Repository path | Default local port | Responsibility |
| --- | --- | ---: | --- |
| Member Web | `apps/web-member` | 3000 | Member journeys, wallet, finance, games, profile, support and KYC |
| Admin Web | `apps/web-admin` | 3001 | Operations, finance review, members, risk, reports, providers, CMS and security |
| API | `apps/api` | 4000 | Authentication, domain workflows, persistence, provider integration and audit |
| PostgreSQL | external managed service | n/a | Transactional source of truth |
| Redis | optional external managed service | n/a | Shared cache, rate limiting and operational acceleration |
| Object storage | local/S3/R2 compatible | n/a | Private KYC, finance and support objects |

## Network boundaries

- Public clients communicate only with Member Web, Admin Web and approved API endpoints over HTTPS.
- PostgreSQL, Redis and private object storage are not exposed directly to browsers.
- Admin and Member origins are independently allowlisted.
- Refresh cookies are separated by surface and use secure, HttpOnly and appropriate SameSite settings.
- Provider callbacks terminate at dedicated API webhook routes and must pass signature, replay and idempotency checks.
- Private object downloads require authorization and short-lived signed access.

## Environment ownership

| Concern | Owner |
| --- | --- |
| Member/Admin public URLs | deployment owner |
| API URL and health endpoint | API deployment owner |
| Database URL and migration execution | database/deployment owner |
| Redis URL and failover policy | platform owner |
| Storage bucket, retention and scanner configuration | storage/security owner |
| Provider endpoints, credentials, callbacks and IP allowlists | provider integration owner |
| CORS origins and cookie domains | security/API owner |
| Production secrets | environment owner; never repository files |

## Deployment order

1. Confirm approved commit and runtime contract.
2. Validate environment variables and secret presence.
3. Generate Prisma client and check migration status.
4. Apply approved migrations.
5. Deploy API and verify health/version metadata.
6. Deploy Admin and Member applications.
7. Run smoke checks for public and authenticated critical paths.
8. Confirm metrics, logs, provider callbacks and storage access.

## Rollback boundaries

- Web applications may roll back independently when API contracts remain compatible.
- API rollback requires database compatibility with the prior application version.
- Applied destructive migrations are not rolled back casually; use the database migration and restore policy.
- Provider enablement is controlled separately from deployment through readiness and real-money safety gates.
- A rollback record must include commit, affected services, reason, migration state and verification result.

## Required production evidence

- Approved Git commit SHA
- Deployed service version/health responses
- Migration status before and after deployment
- Authenticated login/refresh/logout result
- Deposit and withdrawal safe-path result
- Storage upload/download authorization result
- Provider callback or provider-down behavior
- Error rate, latency and database health snapshot

External verification items remain tracked under P6 in `docs/master-project-worklist.md`.
