# API Module Map

Source of truth: `apps/api/src/app.module.ts` and module files under `apps/api/src/modules`.

| Module | Primary responsibility | Primary owners | Data / side effects |
|---|---|---|---|
| auth | Member authentication, registration, password and phone verification | Identity | User, session, OTP, audit events |
| admin-auth | Admin login, 2FA, refresh and session lifecycle | Security | Admin session, login history, security audit |
| anti-bot | CAPTCHA provider configuration and verification | Security | Provider config, adaptive mode, audit |
| users | Member profile and member administration | Identity | User profile, contact data, status |
| settings | Website, legal, branding and CMS settings | Platform | Settings, CMS assets, audit |
| wallet | Wallet balance and ledger operations | Finance | Wallet, ledger entries, audit |
| topups | Deposit request lifecycle | Finance | Top-up request, slip/storage, wallet credit |
| withdrawals | Withdrawal lifecycle and proof handling | Finance | Withdrawal, ledger, bank/provider side effects |
| finance | Cross-domain finance orchestration and reconciliation | Finance | Transactions, locks, idempotency |
| reports | Operational and finance reporting | Operations | Read models and CSV output |
| exports | Export job and file generation | Operations | Export files and audit |
| bank-accounts | Member bank account review and duplicate detection | Risk / Finance | Bank account, review status, audit |
| risk-alerts | Risk alerts, watchlist and KYC lifecycle | Risk | RiskAlert, watchlist, KYC case/document |
| admin-access | Roles, permissions, ownership and delegation | Security | Role assignment, sessions, audit |
| admin-audit | Immutable admin audit log access | Security | AdminAuditLog |
| admin-activity | Admin activity timeline and detail read models | Operations | Read-only audit projections |
| game-platform | Provider, game session, transfer and webhook orchestration | Provider | Provider config, transfer, webhook, snapshot |
| money-ops | Manual finance/provider operations | Finance / Provider | Reconcile, retry, fail/reverse actions |
| support | FAQ and support ticket lifecycle | Support | Ticket, reply, attachment metadata |
| promotions | Campaign, claim, bonus and settlement | Growth / Finance | Promotion, claim, turnover, bonus ledger |
| affiliates | Referral, downline and commission | Growth / Finance | Affiliate relation, commission ledger |
| notifications | Member notifications and preferences | Platform | Notification, channel preference |
| health | Liveness/readiness endpoints | Platform | No durable data |

## Ownership rules

- Each module owns its controllers, services, DTOs and persistence orchestration.
- Cross-module calls must use an exported public service or adapter, never a deep import into another module's private file.
- Database access belongs in services/repositories, not controllers.
- Critical mutations must declare authorization, transaction and audit behavior in the route ownership inventory.
