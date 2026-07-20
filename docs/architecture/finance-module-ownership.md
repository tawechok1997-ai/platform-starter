# Finance Module Ownership

## Decision

`FinanceModule` owns only the `/admin/finance` reporting surface and its read-only summary/report projections.

It must not act as the composition root for unrelated operational modules.

## Application composition

The following modules are registered directly by `AppModule`:

- `FinanceModule`
- `QueuesModule`
- `ActivityModule`
- `RiskModule`
- `AdminMembersModule`

This preserves every controller and route while removing the false implication that queues, activity, risk and member administration are children of finance.

## Route ownership

| Route family | Owner |
|---|---|
| `/admin/finance/*` | `FinanceModule` |
| `/admin/queues/*` | `QueuesModule` |
| `/admin/operations/*` | `ActivityModule` compatibility adapter |
| `/admin/risk/summary` | `RiskModule` compatibility adapter |
| `/admin/members/*` | `AdminMembersModule` |

## Safety

- No route path changed.
- No permission changed.
- No controller was removed.
- No Prisma mutation moved.
- No response contract changed.
- `FinanceModule` retains `DatabaseModule` because its summary and report projections query finance data directly.

## Regression rule

`FinanceModule` must not import `QueuesModule`, `ActivityModule`, `RiskModule` or `AdminMembersModule`. Those modules belong to the application composition root.
