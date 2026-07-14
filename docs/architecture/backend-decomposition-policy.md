# Backend Decomposition Policy

Status: **ACTIVE FOR R-007**

## Purpose

Keep NestJS controllers and services small enough to review, test, replace, and own without hiding transaction, permission, audit, or provider behavior inside oversized classes.

## Inventory thresholds

A file becomes an R-007 decomposition candidate when any threshold is exceeded:

| Type | Line threshold | Constructor dependencies | Public methods |
|---|---:|---:|---:|
| Controller | 350 | 8 | 20 |
| Service | 600 | 8 | 20 |

Thresholds identify review candidates. They do not justify mechanical splitting that creates pass-through classes or moves domain rules without regression coverage.

## Required decomposition shape

- Controllers coordinate HTTP concerns only: actor, permission, validation, response mapping, and delegation.
- Command services own mutations and transaction boundaries.
- Query services own read models, filters, pagination, and report preparation.
- Domain policies remain independent from NestJS, Prisma, and transport exceptions where practical.
- Prisma-to-domain and domain-to-response mapping must be explicit for critical flows.
- Audit metadata builders, CSV serializers, provider adapters, and storage adapters should be isolated when reused or independently testable.

## Safety rules

1. Preserve existing API contracts and stable error codes.
2. Do not split finance, auth, KYC, support, or provider orchestration without characterization/regression evidence.
3. Keep transaction boundaries visible and atomic.
4. Do not introduce circular dependencies or cross-module deep imports.
5. Each decomposition batch must pass API typecheck, relevant tests, architecture audits, and the R-007 inventory.
6. Inventory debt is initially informational. Enforcement may be enabled only after the current candidate list is recorded and ratcheted down.

## Commands

```bash
pnpm audit:backend-decomposition
pnpm audit:backend-decomposition:json
```

Use `R007_ENFORCE=1 node tools/audit-backend-decomposition.mjs` only after an approved baseline exists.
