# R-007 Backend Service Decomposition

Status: **PARTIAL — NOT CLOSABLE YET**

Updated: **2026-07-14**

## Completed evidence

- Added automated inventories for oversized backend services and legacy Admin audit writers.
- Defined controller/service decomposition thresholds and migration rules.
- Split finance, reports, activity, notifications, Admin member lifecycle, risk summary, and support into focused query/command services with compatibility facades where needed.
- Extracted shared finance, report, activity, notification, support, Admin session, KYC, watchlist, Admin two-factor, and promotion response utilities/mappers with focused regression coverage.
- Added shared `admin-audit.builder.ts` and migrated Admin member, support, Admin session, KYC review/download, watchlist, refresh-reuse, Admin two-factor, Admin login/challenge, Admin step-up, promotion claim, and bonus lifecycle audit payloads to it.
- Split Admin session listing and revocation/logout mutations into dedicated query/command services; session mutation and audit share transaction boundaries.
- Split Admin refresh-token rotation and token/session creation into `AdminRefreshSessionService` and `AdminSessionTokenService` with reuse-detection regression coverage.
- Split Admin two-factor setup, enable, disable, and recovery-code regeneration into `AdminTwoFactorCommandService`; controller mutation routes now use the focused command service.
- Extracted TOTP validation, base32 secret generation, and recovery-code normalization/generation into `admin-two-factor.util.ts` with focused utility and transaction tests.
- Split Admin sign-in, two-factor challenge verification, suspicious-device checks, recovery-code consumption, and lockout evaluation into `AdminLoginService`.
- Extracted privileged-action TOTP verification into `AdminStepUpService`, exported it from `AdminAuthModule`, and added inactive/unconfigured plus audit-shape regression coverage.
- `AdminAuthController` routes login/challenge through `AdminLoginService`, refresh through `AdminRefreshSessionService`, session reads/writes through focused query/command services, and 2FA mutations through `AdminTwoFactorCommandService`.
- Added `audit:r7-quality` to combine backend decomposition, strict Admin audit-writer inventory, and API typechecking into one quality command.
- Split KYC reads, member upload/submit commands, Admin review commands, secure access-token/download orchestration, and retention cleanup into dedicated services.
- `KycDocumentsService` is now a compatibility facade; `AdminKycController` routes reads, reviews, secure access, and retention cleanup directly to their focused services.
- KYC secure downloads bind tokens to the issuing Admin, validate HMAC signatures and expiry, and write download audits through the shared builder.
- KYC retention cleanup updates database state only after storage deletion succeeds and reports storage failures without falsely marking documents deleted.
- Split watchlist list/match and create/release operations into dedicated query/command services with optimistic locking, shared audit building, and regression coverage.
- Identified promotions as a CMS/product-content owner and split public campaigns, member claim/bonus reads, and Admin claim/bonus reads into `PromotionsQueryService`.
- Extracted promotion claim and bonus-ledger metadata/response shaping into `promotion.mapper.ts` with status, numeric conversion, lifecycle-priority, and private-field regression coverage.
- Split member promotion-claim creation and Admin claim review into `PromotionClaimCommandService`; the controller now routes claim mutations directly to it.
- Promotion claim creation preserves duplicate/top-up checks and deletes the provisional risk alert if domain claim persistence fails.
- Promotion claim approval owns bonus-ledger creation with duplicate-ledger reuse and rollback of the provisional risk ledger if domain ledger persistence fails.
- Split turnover and bonus release/expire/revoke mutations into `BonusLifecycleCommandService` with shared audit construction and focused lifecycle regression coverage.
- Added promotion claim command coverage for duplicate prevention, domain rollback, rejection-note enforcement, approval behavior, existing-ledger reuse, and shared audit shape.
- `PromotionsService` remains registered only as a compatibility surface until repository-wide consumers can be verified in a workspace.
- Searched the repository for concrete CSV consumers; none are currently present, so serializer work remains blocked on a real endpoint instead of adding unused infrastructure.

## Remaining closure scope

R-007 cannot be marked DONE until the following areas have implementation and regression evidence:

- Remove duplicated legacy login, 2FA, refresh, session, and step-up methods from `AdminAuthService` after all non-controller consumers are verified and migrated.
- Remove duplicated legacy promotion query/claim/bonus methods from `PromotionsService` after non-controller consumers are verified.
- Shared Prisma-to-domain-to-response mappers for remaining critical domains.
- Migrate remaining audit writers identified by `pnpm audit:admin-audit-writers` to the shared builder and extract metadata formatters.
- CSV/report serializer extraction when a concrete CSV endpoint or consumer exists.
- Provider orchestration extraction.
- Settlement orchestration extraction beyond the isolated bonus lifecycle command.
- Constructor dependency reduction for every inventory violation.
- Focused regression tests for each remaining extracted handler/service.

## Verification commands

```bash
pnpm audit:backend-decomposition
pnpm audit:admin-audit-writers
pnpm audit:admin-audit-writers:strict
pnpm audit:r7-quality
pnpm audit:r7-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- promotion-claim-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- bonus-lifecycle-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- promotion.mapper.spec.ts --runInBand
pnpm --filter @platform/api test -- admin-step-up.service.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked R-007 worklist items remain. The strict audit-writer inventory and full typecheck still need to run in a workspace because GitHub code search cannot prove repository-wide absence of legacy writers.
