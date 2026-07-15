# KYC Module README

## Scope

KYC covers member document submission, private document storage metadata, short-lived access, review lifecycle, retention cleanup, and risk status changes tied to identity verification.

## Primary implementation

- `apps/api/src/modules/risk-alerts/member-kyc.controller.ts` — member KYC upload/API surface.
- `apps/api/src/modules/risk-alerts/admin-kyc.controller.ts` — admin review/API surface.
- `apps/api/src/modules/risk-alerts/kyc-member-command.service.ts` — member KYC command behavior.
- `apps/api/src/modules/risk-alerts/kyc-review-command.service.ts` — admin review transitions.
- `apps/api/src/modules/risk-alerts/kyc-documents.service.ts` and `kyc-documents-query.service.ts` — document metadata, access, and query behavior.
- `apps/api/src/modules/risk-alerts/kyc-access.service.ts` and `kyc-retention.service.ts` — short-lived access and cleanup.

## Safety boundaries

- KYC document payloads must use private storage keys and short-lived access tokens.
- MIME/size/hash metadata must be retained for review and cleanup evidence.
- Review transitions must audit actor, reason, and target case/document.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- kyc-documents.service.spec.ts kyc-review-command.service.spec.ts kyc-access.service.spec.ts kyc-retention.service.spec.ts --runInBand`
- `pnpm --filter @platform/api test -- src/modules/risk-alerts/kyc-concurrency.db.spec.ts --runInBand`
