# State Machine Notes

This document summarizes the critical lifecycle state machines referenced by R-014. It is intentionally implementation-linked and should be updated whenever command services or workflow services change.

## Deposit

Implementation owner: `apps/api/src/modules/topups/deposit-workflow.service.ts`.

Typical path:

1. Member submits a top-up request and evidence.
2. Duplicate slip/reference checks run before review can proceed.
3. Admin reviews the slip and either rejects it or approves it for credit.
4. Credit confirmation runs in a transaction, writes an idempotent ledger entry, updates wallet balance, and audits the transition.

Do not add direct money-changing controller paths that bypass this workflow service.

## Withdrawal

Implementation owner: `apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts`.

Typical path:

1. Member creates a withdrawal request.
2. Risk/watchlist enforcement runs before payment approval.
3. Admin approves for payment, uploads proof, and verifies completion.
4. Completion uses an idempotency key and transaction boundary around wallet/ledger/request updates.

Legacy direct-complete behavior must remain removed.

## KYC

Implementation owners: `apps/api/src/modules/risk-alerts/kyc-member-command.service.ts`, `kyc-review-command.service.ts`, `kyc-documents.service.ts`, `kyc-access.service.ts`, and `kyc-retention.service.ts`.

Typical path:

1. Member submits document metadata and private storage reference.
2. The system validates MIME/size/hash metadata and creates or updates the KYC case.
3. Admin reviews with a reasoned approve/reject/request-more-info decision.
4. Document access uses short-lived tokens; retention cleanup removes expired private material according to policy.

## Support

Implementation owners: `apps/api/src/modules/support/support-command.service.ts`, `support-query.service.ts`, and `support-attachments.service.ts`.

Typical path:

1. Member opens a ticket, optionally with policy-validated attachment metadata.
2. Member/admin replies append to the timeline.
3. Ticket may close/reopen while preserving actor and timestamp history.
4. Query paths return paginated lists/details without leaking private attachment storage keys.

## Admin lifecycle

Implementation owners: `apps/api/src/modules/admin-access` and `apps/api/src/modules/admin-auth`.

Typical path:

1. Admin identity is invited/created and assigned roles.
2. High-risk roles require 2FA/step-up policy where enabled.
3. Ownership transfer and account lifecycle changes require reason, audit, and last-owner protection.
4. Session revocation follows lifecycle or explicit logout commands.

## Promotion

Implementation owners: `apps/api/src/modules/promotions` and wallet/settlement support modules.

Typical path:

1. Campaign is configured and validated.
2. Member claim enters review/turnover tracking.
3. Settlement runs through dedicated command paths with idempotency and concurrency coverage.
4. Real-money payout remains disabled until provider-specific UAT is complete.
