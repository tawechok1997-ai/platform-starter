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

## Severity response

### Critical

A critical candidate must not gain additional lines, constructor dependencies, or public methods without an explicit decomposition plan in the change description.

Preferred actions:

- extract domain orchestration from controllers;
- move persistence behind repository or transaction boundaries;
- separate unrelated command and query responsibilities;
- isolate provider-specific integration code;
- add characterization tests before moving behavior.

### High

High candidates should be included in the next related refactor. New unrelated responsibilities must not be added.

### Moderate

Moderate candidates remain warnings. Review cohesion before extending them and avoid introducing new cross-domain dependencies.

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
7. Do not replace one oversized service with an equally oversized generic helper.

## Safe decomposition sequence

1. Add or confirm regression tests around existing behavior.
2. Identify one responsibility boundary.
3. Extract it without changing the external API.
4. Run API typecheck and targeted tests.
5. Run database and concurrency tests when transaction code moved.
6. Run architecture and decomposition audits again.
7. Record whether lines, dependencies, and public methods improved.

## Ratchet workflow

The audit starts in inventory mode because immediately failing on historical candidates would create noisy CI without improving architecture.

Enforcement may be enabled only after:

1. the current candidate list is captured as a reviewed baseline;
2. each critical candidate has an owner or decomposition plan;
3. existing debt can be distinguished from regressions;
4. CI fails only when a candidate worsens or a new unapproved candidate appears.

Do not enable `R007_ENFORCE=1` against an unreviewed baseline.

## Commands

```bash
pnpm audit:backend-decomposition
pnpm audit:backend-decomposition:json
```

Use `R007_ENFORCE=1 node tools/audit-backend-decomposition.mjs` only after an approved baseline exists.

## Definition of done

A decomposition task is complete when:

- behavior remains covered by tests;
- controller or service metrics improve or remain within thresholds;
- dependency direction follows repository architecture rules;
- transaction boundaries are not weakened;
- public API and error contracts remain stable;
- no oversized replacement helper is introduced.
