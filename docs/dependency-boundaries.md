# Dependency Boundaries

This policy defines allowed dependency directions for the monorepo. Automated audits must enforce these rules wherever practical.

## Repository layers

```text
apps/web-member ─┐
                 ├─> packages/api-client
apps/web-admin  ─┘

apps/api/controllers
        ↓
apps/api/application services
        ↓
apps/api/domain
        ↓
apps/api/repositories and infrastructure
        ↓
Prisma, Redis, storage and providers
```

## Backend rules

### Controllers

Controllers may:

- parse transport input
- call application services
- map approved response DTOs
- attach request and audit context

Controllers must not:

- import Prisma client or database models
- contain transaction logic
- mutate wallets or ledgers directly
- call external providers directly
- expose persistence records as API responses

### Domain and application services

Domain code must not import NestJS transport concerns, HTTP request objects or UI packages.

Application services coordinate use cases and may call repositories through explicit interfaces. Cross-domain workflows must use application-level contracts rather than reaching into another domain's repository.

### Repositories

Repositories own persistence queries and mapping. They must not contain HTTP response logic or provider callbacks.

Financial repositories must accept an explicit transaction client for multi-write workflows. Opening nested, unordered transactions is prohibited.

### Providers

Provider adapters translate external contracts. They must not directly mutate wallet, ledger, promotion or reconciliation tables.

Verified provider events are passed to an application service that owns idempotency and transaction boundaries.

## Frontend rules

### Route and page modules

Pages compose feature modules. They must not become permanent homes for business logic, API retry policy or authorization rules.

### Feature modules

Features may depend on:

- shared UI primitives
- design tokens
- API client contracts
- feature-local components and hooks

Features must not import private internals from another feature. Shared behavior moves to an explicit shared package only after at least two real consumers exist.

### Shared packages

- `@platform/api-client` owns transport behavior and API contracts.
- `@platform/config` owns reusable tooling configuration.
- `@platform/design-tokens` owns primitive visual values.
- A future `@platform/ui-core` may own accessible, product-neutral UI primitives.

Shared packages must not import from applications.

## Forbidden dependency patterns

- `packages/**` importing from `apps/**`
- frontend code importing Prisma or backend domain modules
- API domain code importing React or Next.js
- Controller files importing `@prisma/client`
- one domain importing another domain's repository implementation
- provider adapters writing financial records directly
- UI visibility checks being treated as authorization

## Enforcement

The permanent architecture gate is:

```bash
pnpm audit:architecture-boundaries
pnpm audit:r9-controller-prisma:strict
pnpm audit:r9-repository-boundaries:strict
pnpm audit:r9-transaction-escapes
pnpm audit:admin-permissions
```

These checks should be grouped under a stable `check:architecture` command and run in CI for relevant changes.

## Exceptions

An exception requires:

1. documented reason
2. named owner
3. expiry or removal condition
4. regression test or audit allowance scoped to the exact path

Permanent wildcard exceptions are not allowed. They are not architecture. They are surrender with formatting.
