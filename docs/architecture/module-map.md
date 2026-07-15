# API Module Map

Source of truth: `apps/api/src/app.module.ts` and module files under `apps/api/src/modules`.

Every module owns its controllers, application services, DTOs, persistence orchestration and audit behavior. The module file named in **Public entry point** is the supported NestJS import boundary. Files inside another module are private unless an exported service or adapter is explicitly recorded in `dependency-map.md`.

| Module | Primary responsibility | Primary owners | Data / side effects | Public entry point |
|---|---|---|---|---|
| auth | Member authentication, registration, password and phone verification | Identity | User, session, OTP, audit events | `auth/auth.module.ts` |
| admin-auth | Admin login, 2FA, refresh and session lifecycle | Security | Admin session, login history, security audit | `admin-auth/admin-auth.module.ts` |
| anti-bot | CAPTCHA provider configuration and verification | Security | Provider config, adaptive mode, audit | `anti-bot/anti-bot.module.ts` |
| admin-members | Legacy/admin member queries and mutations composed into finance/admin surfaces | Identity / Operations | User, request, ledger and audit projections | Internal module imported by `finance/finance.module.ts` |
| settings | Website, legal, branding and CMS settings | Platform | Settings, CMS assets, storage and audit | `settings/settings.module.ts` |
| wallet | Wallet balance and ledger operations | Finance | Wallet, ledger entries, audit | `wallet/wallet.module.ts` |
| topups | Deposit request lifecycle | Finance | Top-up request, slip storage, wallet credit | `topups/topups.module.ts` |
| withdrawals | Withdrawal lifecycle and proof handling | Finance | Withdrawal, ledger, bank/provider side effects | `withdrawals/withdrawals.module.ts` |
| finance | Cross-domain finance orchestration and reconciliation | Finance | Transactions, locks, idempotency | `finance/finance.module.ts` |
| queues | Finance queue/read-model endpoints composed into finance operations | Finance / Operations | Deposit and withdrawal queue projections | Internal module imported by `finance/finance.module.ts` |
| activity | Operational activity projections composed into finance/admin surfaces | Operations | Audit and transaction activity projections | Internal module imported by `finance/finance.module.ts` |
| risk | Legacy finance risk/read-model endpoints composed into finance operations | Risk / Operations | Wallet, deposit, withdrawal and risk projections | Internal module imported by `finance/finance.module.ts` |
| reports | Operational and finance reporting | Operations | Read models and CSV output | `reports/reports.module.ts` |
| exports | Export job and file generation | Operations | Export files and audit | `exports/exports.module.ts` |
| bank-accounts | Member bank account review and duplicate detection | Risk / Finance | Bank account, review status, audit | `bank-accounts/bank-accounts.module.ts` |
| risk-alerts | Risk alerts, watchlist and KYC lifecycle | Risk | RiskAlert, watchlist, KYC case/document | `risk-alerts/risk-alerts.module.ts` |
| admin-access | Roles, permissions, ownership and delegation | Security | Role assignment, sessions and audit | `admin-access/admin-access.module.ts` |
| admin-audit | Immutable admin audit log access | Security | AdminAuditLog | `admin-audit/admin-audit.module.ts` |
| admin-activity | Admin activity timeline and detail read models | Operations | Read-only audit projections | `admin-activity/admin-activity.module.ts` |
| game-platform | Provider, game session, transfer and webhook orchestration | Provider | Provider config, transfer, webhook and snapshot | `game-platform/game-platform.module.ts` |
| money-ops | Manual finance/provider operations | Finance / Provider | Reconcile, retry, fail and reverse actions | `money-ops/money-ops.module.ts` |
| support | FAQ and support ticket lifecycle | Support | Ticket, reply and attachment metadata | `support/support.module.ts` |
| storage | Private object storage, upload policy, malware scanning and signed object delivery | Platform / Security | Object writes/reads/deletes, signed token verification and response headers | `storage/storage.module.ts` |
| promotions | Campaign, claim, bonus and settlement | Growth / Finance | Promotion, claim, turnover and bonus ledger | `promotions/promotions.module.ts` |
| affiliates | Referral, downline and commission | Growth / Finance | Affiliate relation and commission ledger | `affiliates/affiliates.module.ts` |
| notifications | Member notifications and preferences | Platform | Notification and channel preference | `notifications/notifications.module.ts` |
| health | Liveness/readiness endpoints | Platform | No durable data | `health/health.module.ts` |

## Cross-cutting foundations

| Foundation | Owner | Contract |
|---|---|---|
| `database` | Platform | `database/database.module.ts`; infrastructure only, never imported by frontend |
| `common/guards` and `common/decorators` | Security | Shared presentation-layer authorization and actor extraction |
| `modules/storage` | Platform | Storage adapter consumed through `StorageModule` and `StorageService` |
| `packages/api-client` | Platform | Shared frontend transport helpers; server implementation imports are forbidden |

## Ownership rules

- Each module owns its controllers, services, DTOs, tables it mutates and audit events it emits.
- Cross-module calls must use an exported public service or adapter declared in the dependency map. Deep imports into another module remain private and unsupported.
- Database access belongs in services or repositories, never controllers.
- Critical mutations must declare actor, permission, data, external side effects and audit behavior in the route ownership inventory.
- Controllers, cron handlers and background processors inherit the owner of their enclosing module folder.
- Internal controller families that are composed into another registered module remain listed here until they are merged or promoted to first-class modules.
- A new module is incomplete until it is registered in `AppModule`, listed here, represented in route ownership when it exposes HTTP routes, and accepted by the architecture inventory CI audit.