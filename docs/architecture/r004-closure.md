# R-004 Closure: DTO, Type Strictness and API Contract

Status: **DONE**

Closed on: **2026-07-14**

## Scope completed

- Mutation route inventory covers every API `POST`, `PUT`, `PATCH`, and `DELETE` handler.
- Inline mutation body types are forbidden.
- Untyped mutation bodies are forbidden.
- Critical controller actors and request contexts use shared typed contracts.
- Request DTOs apply validation, normalization, enum allowlists, and bounded lengths where the payload is structured.
- Dynamic settings payloads use an explicit request contract without allowing the global validation pipe to erase arbitrary setting keys.
- API responses pass through a recursive sensitive-field sanitizer.
- Stable API error codes are catalogued and checked against resolver and contract tests.
- Type-debt ratchets prevent new unsafe typing in critical services.
- R-004 audits and API typecheck run in CI.

## Automated evidence

The following commands must pass:

```bash
pnpm audit:mutation-dto-coverage
pnpm audit:critical-controller-types
pnpm audit:critical-service-types
pnpm audit:api-response-safety
pnpm audit:error-code-catalog
pnpm audit:critical-error-contracts
pnpm typecheck:api
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

Reported CI evidence on 2026-07-14 confirms the response-safety audit and the R-004 validation sequence passed after the final fixture update.

## Guardrails

- New mutation handlers must declare a DTO, request, command, or input contract.
- Sensitive fields may not be returned by API responses even when a persistence model is accidentally exposed.
- Type-debt budgets are one-way ratchets and may not be increased without an architecture note.
- Error contracts must remain stable for Admin and Member clients.
