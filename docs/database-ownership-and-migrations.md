# Database Ownership and Migration Policy

## Purpose

This document defines who owns database changes and how Prisma migrations are reviewed, deployed, verified and rolled back.

## Domain ownership

| Domain | Owns | May read through | Must not do |
| --- | --- | --- | --- |
| Auth and identity | users, sessions, credentials, OTP and recovery records | explicit identity queries and application services | mutate finance, KYC or provider state |
| Finance | wallets, ledger entries, deposits, withdrawals and reconciliation state | finance repositories and read models | allow controllers or provider adapters to write ledger rows directly |
| Promotions and affiliate | bonus, commission, settlement and eligibility state | finance settlement contracts | alter wallet balances outside approved finance transactions |
| KYC and risk | KYC cases, documents, watchlists, blacklist and risk lifecycle | private-storage and identity contracts | expose private objects through public URLs |
| Support and content | tickets, attachments, FAQ, CMS and notification content | shared storage contract | bypass file validation or authorization |
| Providers and games | provider configuration, webhook events, launch metadata and readiness state | finance application contracts | credit or debit balances directly |
| Audit and observability | append-only audit records and operational projections | sanitized domain events | become the source of truth for business state |

A domain may not import another domain's repository merely because both repositories use Prisma. Cross-domain work must go through an application service, policy or explicit contract.

## Data conventions

- Monetary values use exact decimal or integer-minor-unit representations. Floating-point values are forbidden for balances and settlement amounts.
- Persist timestamps in UTC. Convert to local time only at presentation boundaries.
- Foreign keys are required unless a documented lifecycle or external identifier makes them impossible.
- Index names should describe table and ordered columns. Avoid opaque generated names in hand-written SQL.
- Soft deletion is allowed only when retention, audit or recovery requirements justify it. Otherwise use explicit lifecycle states or hard deletion.
- Sensitive fields must not be copied into audit logs, metrics labels or error messages.

## Migration rules

1. Every schema change must include a Prisma migration and validation evidence.
2. Destructive changes require an expand-and-contract sequence.
3. New non-null columns on populated tables require a safe default, backfill or staged rollout.
4. Renames are performed as add, dual-read/write if needed, backfill, switch, then remove.
5. Large backfills must be bounded, resumable and observable.
6. Application releases must remain compatible with the database during rolling deployment.
7. Production migrations use `pnpm db:migrate`; `db push` is never a production deployment mechanism.
8. Migration status must be checked before and after deployment.

## Verification

Repository checks:

```bash
pnpm db:generate
pnpm audit:migration-validation
pnpm typecheck:api
```

Environment checks:

```bash
pnpm db:migrate:status
pnpm db:migrate
pnpm db:migrate:status
```

Production evidence must record the approved commit, migration names, start/end timestamps, status output and rollback decision.

## Rollback policy

- Prefer forward fixes after a successfully applied compatible migration.
- Application rollback is allowed only while the prior version remains schema-compatible.
- Data-destructive rollback requires an approved backup/restore procedure and explicit owner.
- Failed Prisma migrations must be inspected before using `prisma migrate resolve`; never mark a migration applied merely to silence deployment.

## Ownership

- Schema design owner: API/domain owner for the affected tables.
- Migration execution owner: deployment operator with approved environment access.
- Financial migration approval: finance-domain reviewer plus deployment owner.
- Production rollback decision: incident commander or designated production owner.
