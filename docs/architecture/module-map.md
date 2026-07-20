# API Module Map

Updated: **2026-07-21**  
Status: **Active**

Source of truth: `apps/api/src/app.module.ts` and module files under `apps/api/src/modules`.

Every module owns its controllers, application services, DTOs, persistence orchestration and audit behavior. The module file named in **Public entry point** is the supported NestJS import boundary. Files inside another module are private unless an exported service or adapter is explicitly recorded in `dependency-map.md`.

| Module | Primary responsibility | Primary owners | Data / side effects | Public entry point |
|---|---|---|---|---|
| auth | Member authentication, registration, password and phone verification | Identity | User, session, OTP, audit events | `auth/auth.module.ts` |
| admin-auth | Admin login, 2FA, refresh and session lifecycle | Security | Admin session, login history, security audit | `admin-auth/admin-auth.module.ts` |
| anti-bot | CAPTCHA provider configuration and verification | Security | Provider config, adaptive mode, audit | `anti-bot/anti-bot.module.ts` |
| admin-members | Admin member queries and mutations | Identity / Operations | User state, member projections and audit | `admin-members/admin-members.module.ts` |
| settings | Website, legal, branding and CMS settings | Platform | Settings, CMS assets, storage and audit | `settings/settings.module.ts` |
| wallet | Wallet commands, balances and ledger queries | Finance | Wallet, ledger entries and audit | `wallet/wallet.module.ts` |
| topups | Deposit request and review lifecycle | Finance | Top-up request, slip storage and wallet credit workflow | `topups/topups.module.ts` |
| withdrawals | Withdrawal lifecycle and proof handling | Finance | Withdrawal, ledger, bank/provider side effects | `withdrawals/withdrawals.module.ts` |
| finance | Finance dashboard/report projections only | Finance | Read-only finance summaries and reports | `finance/finance.module.ts` |
| queues | Deposit/withdrawal operational queue projections | Finance / Operations | Read-only queue projections | `queues/queues.module.ts` |
| activity | Legacy compatibility adapter for operational history routes | Operations | Delegates to admin-activity projections | `activity/activity.module.ts` |
| risk | Legacy compatibility adapter for `/admin/risk/summary` | Risk / Operations | Delegates to risk-alerts finance-risk projection | `risk/risk.module.ts` |
| reports | Operational and finance reporting | Operations | Read models and CSV output | `reports/reports.module.ts` |
| exports | Export job and file generation | Operations | Export files and audit | `exports/exports.module.ts` |
| bank-accounts | Member bank account review and duplicate detection | Risk / Finance | Bank account, review status and audit | `bank-accounts/bank-accounts.module.ts` |
| risk-alerts | Risk alerts, watchlist, enforcement and finance-risk projection | Risk | RiskAlert, watchlist, enforcement, KYC and audit | `risk-alerts/risk-alerts.module.ts` |
| admin-access | Roles, permissions, ownership and delegation | Security | Role assignment, sessions and audit | `admin-access/admin-access.module.ts` |
| admin-audit | Immutable admin audit log access | Security | AdminAuditLog | `admin-audit/admin-audit.module.ts` |
| admin-activity | Admin activity timeline and history read models | Operations | Read-only audit projections | `admin-activity/admin-activity.module.ts` |
| game-platform | Provider, game session, transfer and webhook orchestration | Provider | Provider config, transfer, webhook and snapshot | `game-platform/game-platform.module.ts` |
| provider-simulator | Signed mock-provider routes backed by the existing member wallet | Provider / Finance | Wallet/ledger reads and game callback simulation | `provider-simulator/provider-simulator.module.ts` |
| money-ops | Operational dashboard, reconciliation diagnostics, simulator tools and compatibility adapters | Finance / Provider | Reads, diagnostics, test logs and delegated wallet command | `money-ops/money-ops.module.ts` |
| support | FAQ and support ticket lifecycle | Support | Ticket, reply and private attachment lifecycle | `support/support.module.ts` |
| storage | Private object storage, upload policy, malware scanning and signed delivery | Platform / Security | Object writes/reads/deletes and signed token verification | `storage/storage.module.ts` |
| promotions | Campaign, claim, bonus and settlement | Growth / Finance | Promotion, claim, turnover and bonus ledger | `promotions/promotions.module.ts` |
| affiliates | Referral, downline and commission | Growth / Finance | Affiliate relation and commission ledger | `affiliates/affiliates.module.ts` |
| notifications | Member notifications and preferences | Platform | Notification and channel preference | `notifications/notifications.module.ts` |
| health | Liveness/readiness endpoints | Platform | No durable data | `health/health.module.ts` |

## Cross-cutting foundations

| Foundation | Owner | Contract |
|---|---|---|
| `database` | Platform | Infrastructure only; never imported by frontend |
| `common/security/JwtAuthModule` | Security infrastructure | Exports shared `JwtService`; does not own Admin/Member session policy |
| `common/guards` and `common/decorators` | Security | Shared presentation-layer authorization and actor extraction |
| `modules/storage` | Platform | Storage adapter consumed through exported service |
| `packages/api-client` | Platform | Shared frontend transport; API server imports are forbidden |

## Ownership rules

- Each module owns its controllers, services, DTOs, tables it mutates and audit events it emits.
- Cross-module calls use exported public services or adapters declared in the dependency map.
- Database access belongs in services or repositories, never controllers.
- Critical mutations declare actor, permission, data, external side effects, lock/idempotency and audit behavior.
- Compatibility adapters retain routes but do not regain duplicated query or mutation ownership.
- A module using a guard must import a module exporting all guard dependencies; transitive providers are not assumed visible.
- A new module is incomplete until registered in `AppModule`, listed here, represented in route ownership and accepted by architecture audits.
