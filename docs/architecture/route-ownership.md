# Route Ownership

This inventory records route families rather than duplicating every handler signature. The controller source remains authoritative for exact methods and paths.

| Route family | Owning module | Permission / actor | Critical side effects |
|---|---|---|---|
| `/member/auth/*` | auth | Member/public auth policy | Session, OTP, password, audit |
| `/admin/auth/*` | admin-auth | Admin auth / 2FA | Admin session, login history, audit |
| `/admin/access/*` | admin-access | `admin.access.*` | Role, ownership, delegation, session revoke |
| `/member/profile*`, `/admin/members*` | users | Member self / `users.*` | Profile, status and security changes |
| `/member/wallet*`, `/admin/wallet*` | wallet | Member / `wallet.*` | Ledger and balance mutation |
| `/member/topups*`, `/admin/topups*` | topups | Member / deposit permissions | Deposit lifecycle, slip storage, wallet credit |
| `/member/withdrawals*`, `/admin/withdrawals*` | withdrawals | Member / withdrawal permissions | Withdrawal lifecycle, proof, settlement |
| `/admin/finance*` | finance | Finance/report permissions | Reconciliation, locks, idempotency |
| `/admin/reports*` | reports | `reports.*` | Read models and CSV generation |
| `/admin/exports*` | exports | `reports.export` | Export artifact generation |
| `/member/bank-accounts*`, `/admin/bank-accounts*` | bank-accounts | Member / users+finance permissions | Bank review, duplicate detection, audit |
| `/admin/risk*`, `/admin/kyc*`, `/member/kyc*` | risk-alerts | Risk permissions / member | Watchlist, KYC document and review lifecycle |
| `/admin/audit*` | admin-audit | Admin audit permission | Read-only immutable audit access |
| `/admin/activity*` | admin-activity | Admin activity permission | Read-only activity projections |
| `/admin/game-*`, `/member/game-*`, `/provider-webhooks/*` | game-platform | Provider permissions / member / signed webhook | Provider config, transfer, reconciliation, webhook |
| `/admin/money-ops*` | money-ops | Finance/provider manage | Retry, fail, reverse and reconcile |
| `/member/support*`, `/admin/support*`, `/faq*` | support | Member / support permissions | Ticket, reply, attachment metadata |
| `/member/promotions*`, `/admin/promotions*` | promotions | Member / promotion permissions | Claim, turnover, settlement, bonus ledger |
| `/member/affiliate*`, `/admin/affiliate*` | affiliates | Member / affiliate permissions | Referral and commission ledger |
| `/member/notifications*`, `/admin/notifications*` | notifications | Member / notification policy | Read/archive/preferences/delivery |
| `/admin/settings*`, `/public/settings*`, `/public/cms-assets*` | settings | Settings permissions / public read | Settings persistence, CMS asset lifecycle, audit |
| `/admin/anti-bot*` | anti-bot | Security anti-bot permission | Provider configuration and emergency mode |
| `/health*` | health | Public | Liveness/readiness only |

## Critical-route evidence requirement

For each critical mutation, the controller and service together must make these visible and testable:

1. Actor and authorization policy.
2. Validated DTO or normalized command input.
3. Transaction and idempotency boundary.
4. Durable side effects and external calls.
5. Audit event and failure behavior.

New route families must be added here in the same change that registers their module/controller.
