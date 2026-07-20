# Route Ownership

This inventory records route families instead of duplicating every handler signature. Controller source remains authoritative for exact HTTP methods and paths. The architecture audit discovers every `*.controller.ts`, assigns it to its module folder and requires that owner to appear here.

| Route family | Owning module | Permission / actor | Data / tables | Critical side effects | Audit event |
|---|---|---|---|---|---|
| `/member/auth/*` | auth | Public/member authentication policy | User, member sessions, OTP verification | Create/rotate/revoke sessions, password/phone verification | Registration, login, OTP and password security events |
| `/admin/auth/*` | admin-auth | Admin authentication and 2FA policy | AdminUser, admin sessions, login history | Create/rotate/revoke admin sessions, enforce 2FA | Admin login, refresh, logout and 2FA events |
| `/admin/anti-bot*` | anti-bot | Security anti-bot permission | Anti-bot provider/settings records | Encrypt provider secrets, change adaptive/emergency mode | Anti-bot configuration events |
| `/admin/access/*` | admin-access | `admin.access.*`, owner and step-up rules | AdminUser, Role, Permission, assignments, delegation | Role/ownership change and session revocation | Ownership, role, delegation and lifecycle events |
| `/member/profile*` | auth | Member self | User/member profile and session references | Profile mutation | Member profile events |
| `/admin/members*` | admin-members | `users.*` / administrative member permissions | User/member profile and operational projections | Member status and operational support mutations where exposed | Administrative member-operation events |
| `/admin/member-operations*` | admin-members | Administrative member permissions | User, top-up, withdrawal, ledger and audit projections | Member status and operational support mutations where exposed | Administrative member-operation events |
| `/admin/settings*`, `/public/site-settings`, `/public/cms-assets*` | settings | Settings permissions or public read | Setting groups, AdminAuditLog, storage objects | Persist site configuration, upload/read/delete CMS objects | Settings and CMS asset events |
| `/member/wallet*`, `/admin/wallet*` | wallet | Member or `wallet.*` | Wallet, LedgerEntry, idempotency records | Balance and ledger mutation | Wallet adjustment/settlement events |
| `/member/topups*`, `/admin/topups*` | topups | Member or deposit permissions | TopUp/Deposit request, ledger, storage metadata | Slip lifecycle, approval, idempotent wallet credit | Deposit claim/review/approval/rejection events |
| `/member/withdrawals*`, `/admin/withdrawals*` | withdrawals | Member or withdrawal permissions | Withdrawal, ledger, bank reference, proof metadata | Reserve/debit/reverse balance, proof and completion lifecycle | Withdrawal claim/review/complete/reject/reverse events |
| `/admin/finance*` | finance | Finance/report permissions | Ledger, transaction/idempotency/read models | Reconciliation, lock-protected state transition | Finance reconciliation and mutation events |
| `/admin/queues*` | queues | Finance operations permissions | Deposit/withdrawal queue projections | Queue assignment or review-state orchestration where exposed | Queue claim/release/review events |
| `/admin/activity*` | activity | Operations/activity permissions | Audit and transaction activity projections | Read-only operational activity projection | No business mutation |
| `/admin/risk-summary*` | risk | Risk/finance review permissions | Wallet, deposit, withdrawal and risk projections | Read-only or review-oriented risk projection | Risk review events where mutation is exposed |
| `/admin/reports*` | reports | `reports.*` | Read-only finance/member/risk projections | CSV/read-model generation | Report export/access events where applicable |
| `/admin/exports*` | exports | `reports.export` | Export job/file metadata | Generate and clean export artifacts | Export create/download/cleanup events |
| `/member/bank-accounts*`, `/admin/bank-accounts*` | bank-accounts | Member or users/finance permissions | BankAccount, review and duplicate-match data | Create/update/review bank details, duplicate detection | Bank review and override events |
| `/admin/risk*`, `/admin/kyc*`, `/member/kyc*` | risk-alerts | Risk permissions or member ownership | RiskAlert, WatchlistEntry, KycCase, KycDocument | Watchlist enforcement, private document lifecycle, review/override | Risk, watchlist, KYC upload/review/override events |
| `/admin/audit*` | admin-audit | Admin audit permission | AdminAuditLog | Immutable audit reads only | Audit-log access if required by policy |
| `/admin/admin-activity*` | admin-activity | Admin activity permission | Audit/login/activity projections | Read-only timeline/detail projection | No business mutation |
| `/admin/game-*`, `/member/game-*`, `/provider-webhooks/*` | game-platform | Provider permissions, member or signed webhook | Provider, game/session, transfer, webhook/idempotency records | External provider call, transfer, signed callback and reconcile | Provider config/session/transfer/webhook events |
| `/provider-simulator/*` | provider-simulator | Signed simulator credential and HMAC policy | Existing Wallet and WalletLedger records | Atomic bet, win, refund, rollback and transfer balance mutation | Wallet ledger entries with provider metadata |
| `/admin/money-ops*` | money-ops | Finance/provider management permissions | Transfer, ledger and provider operation records | Retry, fail, reverse and reconcile | Money operation and override events |
| `/member/support*`, `/admin/support*`, `/faq*` | support | Member, public FAQ or support permissions | FAQ, SupportTicket, Reply, Attachment metadata | Ticket/reply/status lifecycle and private attachment handling | Ticket lifecycle and staff-reply events |
| `/storage/signed/*` | storage | Public bearer token validated by short-lived HMAC signature | Private storage object referenced by signed token | Read object, set private/no-store and anti-sniff response headers; no durable mutation | No business mutation; access is bounded by authorization performed before token issuance |
| `/member/promotions*`, `/admin/promotions*` | promotions | Member or promotion permissions | PromotionCampaign, Claim, Turnover, Settlement | Claim/review/settlement and wallet-affecting bonus | Campaign, claim, review and settlement events |
| `/member/affiliate*`, `/admin/affiliate*` | affiliates | Member or affiliate permissions | Affiliate relation, referral and commission ledger | Referral binding and commission settlement | Affiliate and commission events |
| `/member/notifications*`, `/admin/notifications*` | notifications | Member ownership or notification policy | Notification and preference records | Read/archive/preference mutation and delivery request | Notification preference/delivery events where applicable |
| `/health*` | health | Public | No durable business data | Liveness/readiness checks only | None |

## Controller and route ownership rule

- A controller is owned by the module directory containing it.
- Every controller owner must appear in the table above.
- Exact methods and paths remain in controller decorators to avoid maintaining a second stale copy.
- A new controller is incomplete until its owning route family, actor/permission, data, side effects and audit behavior are represented here.
- Public routes must still declare whether they mutate durable data or invoke external systems.
- Transitional controller families composed into another module remain separate owners here until refactored, so inventory never hides their existence.

## Critical-route evidence requirement

For every critical mutation, the controller and application service together must make these visible and testable:

1. Actor and authorization policy.
2. Validated DTO or normalized command input.
3. Tables/data read and mutated.
4. Transaction, lock and idempotency boundary.
5. Durable storage and external-provider side effects.
6. Audit event and failure behavior.

## Owner definitions

| Owner | Scope |
|---|---|
| Identity | Member authentication, profile and security lifecycle |
| Security | Admin authentication, roles, permissions, 2FA, anti-bot and audit policy |
| Finance | Wallet, deposit, withdrawal, settlement and reconciliation |
| Risk | Bank duplication, watchlist, KYC and risk review |
| Provider | Game/provider credentials, callbacks and transfer operations |
| Growth | Promotion, bonus, affiliate and commission |
| Support | FAQ, support ticket, reply and attachment lifecycle |
| Platform | Settings, CMS, notifications, storage and health foundations |
| Operations | Reports, exports and administrative activity projections |
