# R-007 Backend Service Decomposition

Status: **PARTIAL — NOT CLOSABLE YET**

Updated: **2026-07-14**

## Progress accounting

Counting rule: main topics decrease only when every implementation item under that topic is complete. Verification is tracked in topic 5 instead of reopening completed implementation topics.

- Before provider-transfer batch: **5 main topics / 24 remaining subjobs**
- Closed in provider-transfer batch: **1 main topic / 6 subjobs**
- Current remaining: **4 main topics / 18 subjobs**

## Remaining worklist

### 1. Provider transfer and wallet mutation — COMPLETE IN CODE

- [x] 1.1 Extract `ProviderTransferCommandService`.
- [x] 1.2 Extract `WalletMutationService`.
- [x] 1.3 Move transfer-in debit/provider/rollback orchestration.
- [x] 1.4 Move transfer-out provider/credit orchestration.
- [x] 1.5 Add wallet idempotency regression tests.
- [x] 1.6 Add provider failure and rollback regression tests.

Runtime member transfer and Admin retry endpoints now use the focused command service. Workspace verification remains under topic 5.

### 2. Provider reconciliation — 4 subjobs remaining

- [ ] 2.1 Extract reconciliation query service.
- [ ] 2.2 Extract reconciliation command service.
- [ ] 2.3 Extract mismatch-alert creation.
- [ ] 2.4 Add single-session and batch reconciliation tests.

### 3. Settlement orchestration — 4 subjobs remaining

- [ ] 3.1 Extract settlement command orchestration.
- [ ] 3.2 Add settlement idempotency guard.
- [ ] 3.3 Cover failed, reversed, and retry transitions.
- [ ] 3.4 Add settlement regression tests.

### 4. Legacy cleanup — 4 subjobs remaining

- [ ] 4.1 Reduce duplicated `AdminAuthService` compatibility logic after consumer verification.
- [ ] 4.2 Reduce duplicated `PromotionsService` compatibility logic after consumer verification.
- [ ] 4.3 Migrate remaining legacy Admin audit writers reported by the strict inventory.
- [ ] 4.4 Resolve remaining constructor/decomposition inventory violations.

### 5. Verification and R-007 closure — 6 subjobs remaining

- [ ] 5.1 Run API typecheck.
- [ ] 5.2 Run focused and full regression tests.
- [ ] 5.3 Run strict Admin audit-writer inventory.
- [ ] 5.4 Run API build.
- [ ] 5.5 Fix every failure found by verification without creating replacement main topics.
- [ ] 5.6 Update closure evidence and mark R-007 done.

## Completed evidence

- Added automated inventories for oversized backend services and legacy Admin audit writers.
- Defined controller/service decomposition thresholds and migration rules.
- Split finance, reports, activity, notifications, Admin member lifecycle, risk summary, support, KYC, watchlist, Admin auth/session/2FA, promotions, bonus lifecycle, and provider webhooks into focused services.
- Added shared response mappers and `admin-audit.builder.ts` across migrated critical paths.
- Extracted provider webhook verification, parsing, credential-use tracking, advisory-lock idempotency, and webhook-log persistence into `ProviderWebhookService`.
- Extracted provider transfer orchestration into `ProviderTransferCommandService` and idempotent wallet-ledger writes into `WalletMutationService`.
- Transfer-in failures now execute an explicit wallet reversal path; failed transfer-out calls do not credit the wallet.
- Member transfer and Admin retry endpoints now route directly through the focused transfer command service.
- Added wallet idempotency, insufficient-balance, transfer-in rollback, transfer-out failure, and transfer-out success regression coverage.
- Searched the repository for concrete CSV consumers; none are currently present, so serializer work remains blocked and is not counted as active implementation work.

## Verification commands

```bash
pnpm audit:backend-decomposition
pnpm audit:admin-audit-writers
pnpm audit:admin-audit-writers:strict
pnpm audit:r7-quality
pnpm audit:r7-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- wallet-mutation.service.spec.ts --runInBand
pnpm --filter @platform/api test -- provider-transfer-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- provider-webhook.service.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked worklist items remain. Build, typecheck, tests, and strict inventory still require a workspace run.
