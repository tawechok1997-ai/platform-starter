# Dependency Map

## Intended direction

```text
HTTP / Controller
  -> Application service
    -> Domain policy / command
      -> Repository or infrastructure adapter
        -> Prisma / provider / storage / notification transport
```

## Shared foundations

- `DatabaseModule` is infrastructure and may be consumed by application services.
- `packages/api-client` is the only intended shared frontend transport layer.
- Guards and decorators under `apps/api/src/common` are cross-cutting presentation concerns.
- Domain rules must not depend on NestJS controllers, HTTP exceptions or frontend packages.

## Approved cross-module relationships

| Caller | Callee | Reason |
|---|---|---|
| topups / withdrawals | wallet / finance | Ledger settlement and idempotent balance changes |
| bank-accounts | risk-alerts | Duplicate-bank and watchlist enforcement |
| auth / users | risk-alerts | Registration and profile enforcement |
| promotions / affiliates | wallet / finance | Bonus and commission settlement |
| game-platform / money-ops | finance | Provider transfer reconciliation and ledger safety |
| admin-access | admin-auth | Session revocation after privilege changes |
| support | users / finance references | Ticket ownership and money-flow correlation |
| notifications | users | Delivery target and preference resolution |

## Prohibited relationships

- Controllers importing Prisma directly.
- One app importing source files from another app.
- Frontend code importing API server modules.
- Domain/policy code importing NestJS or Prisma implementation types.
- Deep imports into another module's internal DTO, service or repository file without a documented public contract.

## Current enforcement state

This document records the intended architecture. Automated checks begin with `audit:architecture-inventory`; stricter import-boundary and circular-dependency enforcement belongs to R-002/R-006.
