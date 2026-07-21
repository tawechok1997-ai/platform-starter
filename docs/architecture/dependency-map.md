# Dependency Map

## Intended direction

```text
HTTP / Controller
  -> Application service
    -> Domain policy / command
      -> Repository or infrastructure adapter
        -> Prisma / provider / storage / notification transport
```

Dependencies point inward toward stable policy and contract code. Presentation and infrastructure may depend on application contracts; domain policy must not depend on NestJS controllers, HTTP exceptions, Prisma implementation types or frontend packages.

## Shared foundations

- `DatabaseModule` is infrastructure and may be consumed by application services.
- `StorageModule` is infrastructure and exposes storage operations through its exported service.
- `JwtAuthModule` is shared security infrastructure and may be consumed by API modules that need `JwtService`.
- `packages/api-client` is the intended shared frontend transport layer.
- Guards and decorators under `apps/api/src/common` are cross-cutting presentation concerns.
- Actor types and request metadata are shared contracts, not ownership shortcuts for reaching into another module.

## Approved cross-module relationships

The table is the allowlist of supported domain-level relationships. A caller may use only a service or adapter exported by the callee's module. Direct imports of another module's controller, DTO or private repository are not public contracts.

| Caller | Callee | Public contract / reason |
|---|---|---|
| auth | anti-bot | Registration and password-recovery challenge verification |
| auth | risk-alerts | Registration phone/watchlist enforcement |
| auth | notifications | Authentication/security notification delivery |
| admin-auth | anti-bot | Admin-login challenge and adaptive anti-bot verification |
| admin-members | admin-audit | Administrative member-change audit projection |
| activity | admin-activity | Legacy operational activity routes delegate to the canonical admin activity projection |
| risk | risk-alerts | Legacy finance-risk summary route delegates to the canonical risk-alerts projection |
| topups | wallet | Idempotent deposit credit and ledger write |
| topups | finance | Financial workflow locking and reconciliation |
| topups | storage | Private slip object lifecycle |
| withdrawals | wallet | Balance reservation, debit and reversal |
| withdrawals | finance | Withdrawal completion and idempotency orchestration |
| withdrawals | bank-accounts | Destination-bank ownership and review state |
| withdrawals | risk-alerts | Withdrawal watchlist/risk enforcement and override audit |
| withdrawals | storage | Private proof object lifecycle |
| bank-accounts | risk-alerts | Duplicate-bank and watchlist enforcement |
| finance | queues | Deposit/withdrawal work-queue controllers and projections |
| finance | activity | Operational activity controllers and read models |
| finance | risk | Finance risk summary and review projections |
| finance | admin-members | Administrative member queries used by finance operations |
| promotions | wallet | Bonus wallet settlement |
| promotions | finance | Promotion settlement idempotency and transaction safety |
| affiliates | wallet | Commission wallet settlement |
| affiliates | finance | Commission settlement safety |
| game-platform | finance | Provider transfer reconciliation and ledger safety |
| game-platform | wallet | Member/provider balance movement |
| provider-simulator | wallet | Signed mock-provider balance reads and atomic game ledger mutations using the existing member wallet |
| money-ops | game-platform | Provider retry, fail, reverse and reconcile operations |
| money-ops | finance | Financial operation safety and audit |
| money-ops | wallet | Audited administrative wallet command delegation and ledger diagnostics |
| admin-access | admin-auth | Session revocation after privilege or ownership changes |
| support | auth/admin-members | Ticket ownership and member identity lookup through user records |
| support | finance | Deposit/withdrawal/provider reference correlation |
| support | storage | Private support attachment lifecycle |
| notifications | auth | Delivery target and preference resolution through user records |
| settings | storage | CMS binary asset lifecycle |
| risk-alerts | storage | Private KYC document lifecycle |
| reports | finance | Finance reporting projections |
| reports | admin-members | Member reporting projections |
| exports | reports | Export generation from report projections |

Relationships through `DatabaseModule`, `JwtAuthModule`, shared guards/decorators and actor types are cross-cutting infrastructure and are not repeated for every module.

## Background jobs and schedulers

Ownership is determined by the module folder containing the decorated handler. The architecture audit scans `@Cron`, `@Interval`, `@Timeout`, `@Processor` and `@Process` handlers and requires the owning module to be documented in the module map.

| Owning module | Job family | Side effects / safety requirement |
|---|---|---|
| auth | OTP/session expiration cleanup when configured | Delete or expire security records; must be idempotent |
| risk-alerts | KYC retention and expired access cleanup | Remove expired private documents/tokens with audit-safe behavior |
| notifications | Delivery/retry processing when configured | External channel calls, retry limits and preference enforcement |
| exports | Export generation/cleanup when configured | File creation/deletion and audit |
| game-platform | Provider reconciliation or snapshot refresh when configured | External provider calls, idempotency and rate limits |
| promotions | Campaign/turnover settlement when configured | Wallet-affecting settlement with transaction/idempotency guards |

A module not currently containing a scheduled handler may still reserve the family above. New job owners must be added here in the same change.

## Public module contracts

- The only supported NestJS entry point for another module is its `*.module.ts` export surface.
- Exported services/adapters are public only for the approved relationship table above.
- Controllers, DTO implementation files, Prisma repositories and internal helpers are private by default.
- Cross-module request/response shapes should move to explicit contract files or shared packages rather than importing controller DTOs.
- Frontends consume HTTP contracts through `packages/api-client`; they never import API source.
- Internal controller families (`activity`, `admin-members`, `queues`, `risk`, `system`) are transitional boundaries and must be folded into their owning first-class modules or promoted with explicit module entry points during R-007/R-012.
- Exceptions must be documented in this file with caller, callee, owner, reason and removal target.

## Prohibited relationships

- Controllers importing Prisma directly.
- One app importing source files from another app.
- Frontend code importing API server modules or server-only dependencies.
- Domain/policy code importing NestJS or Prisma implementation types.
- Deep imports into another module's internal DTO, controller, service or repository without a documented exported contract.
- Circular Nest module dependencies unless an explicitly documented temporary exception exists.

## Enforcement

- `pnpm audit:architecture-inventory` checks registered modules, controller ownership, route-owner coverage, background-job ownership, required documentation and cross-module relationships.
- `pnpm audit:architecture-boundaries` checks circular module dependencies, frontend server-only imports and cross-app relative imports.
- Both audits run in `.github/workflows/build.yml` and fail CI on violations.
