# R-007 Backend Service Decomposition

Status: **PARTIAL — NOT CLOSABLE YET**

Updated: **2026-07-14**

## Progress accounting

Counting rule: main topics decrease only when every implementation item under that topic is complete. Verification is tracked in topic 5 instead of reopening completed implementation topics.

- Before provider-transfer batch: **5 main topics / 24 remaining subjobs**
- Closed in provider-transfer batch: **1 main topic / 6 subjobs**
- Before provider-reconciliation batch: **4 main topics / 18 remaining subjobs**
- Closed in provider-reconciliation batch: **1 main topic / 4 subjobs**
- Before settlement batch: **3 main topics / 14 remaining subjobs**
- Closed in settlement batch: **1 main topic / 4 subjobs**
- Before legacy-cleanup batch: **2 main topics / 10 remaining subjobs**
- Closed in this legacy-cleanup pass: **0 main topics / 2 subjobs**
- Current remaining: **2 main topics / 8 subjobs**

## Remaining worklist

### 1. Provider transfer and wallet mutation — COMPLETE IN CODE

- [x] 1.1 Extract `ProviderTransferCommandService`.
- [x] 1.2 Extract `WalletMutationService`.
- [x] 1.3 Move transfer-in debit/provider/rollback orchestration.
- [x] 1.4 Move transfer-out provider/credit orchestration.
- [x] 1.5 Add wallet idempotency regression tests.
- [x] 1.6 Add provider failure and rollback regression tests.

Runtime member transfer and Admin retry endpoints now use the focused command service. Workspace verification remains under topic 5.

### 2. Provider reconciliation — COMPLETE IN CODE

- [x] 2.1 Extract reconciliation query service.
- [x] 2.2 Extract reconciliation command service.
- [x] 2.3 Extract `ProviderReconciliationAlertService`.
- [x] 2.4 Add single-session and batch reconciliation tests.

Admin snapshot reads now use the query service. Single-session reconciliation, active-session batches, and manual snapshot review use the command service. Mismatch alert construction is isolated from provider balance orchestration. Workspace verification remains under topic 5.

### 3. Settlement orchestration — COMPLETE IN CODE

- [x] 3.1 Extract `SettlementCommandService` and `PromotionSettlementRepository`.
- [x] 3.2 Use stable settlement and reversal idempotency keys.
- [x] 3.3 Cover failed, reversed, and retry transitions.
- [x] 3.4 Add settlement regression tests.

Release and retry share `bonus:<risk-alert-id>:settlement`, so a repeated request reuses the existing wallet ledger instead of crediting twice. Failed settlement attempts move the risk item to `SETTLEMENT_FAILED` with an audit record and retryable metadata. Reversal uses a separate stable key, debits the previously credited amount inside a serializable transaction, and requires an Admin note. Workspace verification remains under topic 5.

### 4. Legacy cleanup — 2 subjobs remaining

- [x] 4.1 Reduce duplicated `AdminAuthService` to a compatibility facade.
- [x] 4.2 Reduce duplicated `PromotionsService` to a compatibility facade.
- [ ] 4.3 Migrate remaining legacy Admin audit writers reported by the strict inventory.
- [ ] 4.4 Resolve remaining constructor/decomposition inventory violations.

`AdminAuthService` no longer contains password, TOTP, recovery-code, refresh-token, JWT, or session persistence logic. It delegates to focused services and stays at five constructor dependencies. `PromotionsService` now delegates reads, claims, turnover, and lifecycle changes to the focused query/command services. Facade regression tests protect the compatibility method surface. Strict inventory and repository-wide constructor evidence still require a workspace run before the final two cleanup items can be closed.

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
- Extracted provider snapshot reads into `ProviderReconciliationQueryService`.
- Extracted single-session reconciliation, active-session batch execution, manual snapshot review, credential-use tracking, and shared Admin audit writing into `ProviderReconciliationCommandService`.
- Extracted mismatch risk-alert severity and payload construction into `ProviderReconciliationAlertService`.
- Added reconciliation coverage for matched snapshots, mismatch-alert creation, per-session batch failure isolation, batch summaries, and shared audit actions.
- Extracted bonus settlement orchestration into `SettlementCommandService` and atomic wallet-credit/reversal persistence into `PromotionSettlementRepository`.
- Added stable idempotency keys, failed-state persistence, retry guards, settlement reversal balance checks, and shared Admin audit writing.
- Added settlement coverage for release/retry key reuse, failed-state recording, invalid retry rejection, and reversal requirements.
- Reduced `AdminAuthService` and `PromotionsService` from duplicated implementations to compatibility-only delegation facades.
- Searched the repository for concrete CSV consumers; none are currently present, so serializer work remains blocked and is not counted as active implementation work.

## Verification commands

```bash
pnpm audit:backend-decomposition
pnpm audit:admin-audit-writers
pnpm audit:admin-audit-writers:strict
pnpm audit:r7-quality
pnpm audit:r7-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- admin-auth.service.spec.ts --runInBand
pnpm --filter @platform/api test -- promotions.service.spec.ts --runInBand
pnpm --filter @platform/api test -- settlement-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- provider-reconciliation-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- wallet-mutation.service.spec.ts --runInBand
pnpm --filter @platform/api test -- provider-transfer-command.service.spec.ts --runInBand
pnpm --filter @platform/api test -- provider-webhook.service.spec.ts --runInBand
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```

`pnpm audit:r7-closure` is intentionally expected to fail while unchecked worklist items remain. Build, typecheck, tests, and strict inventory still require a workspace run.
