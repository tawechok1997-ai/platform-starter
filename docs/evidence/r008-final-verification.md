# R-008 Final Verification

Verified commit: `4fbd1bf03f13a64b74ceae32792e7d92a9c8478e`

- Closure audit: failure
- API typecheck: success
- Full API tests: success
- API build: success

## Failure tails

### Closure audit
```

> platform-starter@ audit:r8-closure /home/runner/work/platform-starter/platform-starter
> node tools/audit-r008-closure.mjs && pnpm --filter @platform/api test -- r008-domain-policies.spec.ts --runInBand

R-008 domain policy audit: 11 required files
  integrations: 7
  failures: 2

R-008 closure violations:
  - apps/api/src/modules/topups/topups.service.ts: missing integration marker DepositPolicy.canBeClaimed
  - apps/api/src/modules/risk-alerts/kyc-review-command.service.ts: missing integration marker KycReviewPolicy.assertReviewable
 ELIFECYCLE  Command failed with exit code 1.
```

### API typecheck
```

> platform-starter@ typecheck:api /home/runner/work/platform-starter/platform-starter
> pnpm db:generate && pnpm --filter @platform/api typecheck


> platform-starter@ db:generate /home/runner/work/platform-starter/platform-starter
> prisma generate --schema prisma/schema.prisma

Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.14.0) to ./node_modules/.pnpm/@prisma+client@6.14.0_prisma@6.14.0_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client in 217ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate


> @platform/api@ typecheck /home/runner/work/platform-starter/platform-starter/apps/api
> tsc --noEmit -p tsconfig.json
```

### Full API tests
```

PASS src/modules/admin-access/admin-access.service.spec.ts (6.755 s)
PASS src/modules/auth/auth.service.spec.ts
PASS src/common/domain/r008-domain-policies.spec.ts
PASS src/modules/anti-bot/anti-bot.service.spec.ts
PASS src/modules/risk-alerts/risk-alerts.service.spec.ts
PASS src/modules/admin-access/admin-account-lifecycle.service.spec.ts
PASS src/modules/promotions/promotion-claim-command.service.spec.ts
PASS src/modules/game-platform/provider-reconciliation-command.service.spec.ts
PASS src/modules/support/support-command.service.spec.ts
PASS src/modules/game-platform/provider-transfer-command.service.spec.ts
PASS src/modules/admin-auth/admin-login-defense.service.spec.ts
PASS src/modules/game-platform/provider-webhook.service.spec.ts
PASS src/common/guards/admin-auth.guard.spec.ts
PASS src/modules/admin-access/admin-invitation-admin.service.spec.ts
PASS src/modules/game-platform/adapters/demo-provider.adapter.spec.ts
PASS src/modules/admin-access/admin-invitation.service.spec.ts
PASS src/modules/promotions/settlement-command.service.spec.ts
PASS src/modules/settings/cms-assets.service.spec.ts
PASS src/modules/risk-alerts/kyc-review-command.service.spec.ts
PASS src/modules/promotions/bonus-lifecycle-command.service.spec.ts
PASS src/modules/topups/deposit-workflow.service.spec.ts
PASS src/common/guards/admin-auth.guard.2fa.spec.ts
PASS src/modules/risk-alerts/risk-watchlist.service.spec.ts
PASS src/modules/promotions/promotion-domain.repository.spec.ts
PASS src/modules/admin-auth/admin-login.service.spec.ts
PASS src/modules/game-platform/wallet-mutation.service.spec.ts
PASS src/modules/withdrawals/withdrawal-workflow.service.spec.ts
PASS src/modules/admin-access/admin-ownership-command.service.spec.ts
PASS src/modules/admin-access/admin-access-session.service.spec.ts
PASS src/modules/risk-alerts/risk-watchlist-command.service.spec.ts
PASS src/modules/admin-auth/admin-refresh-session.service.spec.ts
PASS src/modules/admin-auth/admin-session-command.service.spec.ts
PASS src/modules/admin-access/admin-delegation.service.spec.ts
PASS src/modules/game-platform/adapters/generic-transfer-provider.adapter.spec.ts
PASS src/modules/risk-alerts/risk-enforcement.service.spec.ts
PASS src/modules/finance/finance-concurrency.spec.ts
PASS src/modules/finance/finance-workflow-integrity.spec.ts
PASS src/modules/auth/member-risk-enforcement.service.spec.ts
PASS src/modules/risk-alerts/kyc-documents.service.spec.ts
PASS src/modules/admin-auth/admin-two-factor-command.service.spec.ts
PASS src/modules/admin-audit/admin-audit.service.spec.ts
PASS src/modules/support/support-ticket.mapper.spec.ts
PASS src/modules/promotions/promotions.service.spec.ts
PASS src/modules/support/support.service.spec.ts
PASS src/modules/risk-alerts/kyc-access.service.spec.ts
PASS src/modules/withdrawals/withdrawal-risk-enforcement.service.spec.ts
PASS src/modules/storage/storage.service.spec.ts
PASS src/modules/admin-auth/admin-auth.service.spec.ts
PASS src/common/guards/permissions.guard.spec.ts
PASS src/modules/risk-alerts/kyc-retention.service.spec.ts
PASS src/modules/notifications/notifications-command.service.spec.ts
PASS src/modules/admin-members/admin-members-command.service.spec.ts
PASS src/modules/game-platform/provider-preset.service.spec.ts
PASS src/modules/notifications/notifications.service.spec.ts
PASS src/common/errors/error-code-resolver.spec.ts
PASS src/modules/finance/deposit-slip-risk.policy.spec.ts
PASS src/modules/reports/report.mapper.spec.ts
PASS src/modules/risk-alerts/kyc-member-command.service.spec.ts
PASS src/modules/finance/deposit-migration.spec.ts
PASS src/modules/admin-auth/admin-step-up.service.spec.ts
PASS src/modules/admin-auth/admin-auth.controller.spec.ts
PASS src/modules/finance/finance-report.mapper.spec.ts
PASS src/modules/game-platform/adapters/provider-adapter.registry.spec.ts
PASS src/modules/risk/risk-summary-query.service.spec.ts
PASS src/modules/risk-alerts/kyc.mapper.spec.ts
PASS src/modules/notifications/notification.mapper.spec.ts
PASS src/modules/risk-alerts/risk-watchlist.mapper.spec.ts
PASS src/common/interceptors/sensitive-response.interceptor.spec.ts
PASS src/modules/promotions/promotion.mapper.spec.ts
PASS src/modules/admin-auth/admin-session.mapper.spec.ts
PASS src/common/audit/admin-audit.builder.spec.ts
PASS src/modules/admin-auth/admin-two-factor.util.spec.ts
PASS src/modules/activity/activity.mapper.spec.ts

Test Suites: 6 skipped, 73 passed, 73 of 79 total
Tests:       12 skipped, 260 passed, 272 total
Snapshots:   0 total
Time:        150.637 s
Ran all test suites.
```

### API build
```

> platform-starter@ build:api /home/runner/work/platform-starter/platform-starter
> pnpm db:generate && pnpm --filter @platform/api build


> platform-starter@ db:generate /home/runner/work/platform-starter/platform-starter
> prisma generate --schema prisma/schema.prisma

Prisma schema loaded from prisma/schema.prisma
┌─────────────────────────────────────────────────────────┐
│  Update available 6.14.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

✔ Generated Prisma Client (v6.14.0) to ./node_modules/.pnpm/@prisma+client@6.14.0_prisma@6.14.0_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client in 287ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints


> @platform/api@ prebuild /home/runner/work/platform-starter/platform-starter/apps/api
> prisma generate --schema ../../prisma/schema.prisma

Prisma schema loaded from ../../prisma/schema.prisma

✔ Generated Prisma Client (v6.14.0) to ./../../node_modules/.pnpm/@prisma+client@6.14.0_prisma@6.14.0_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client in 301ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate


> @platform/api@ build /home/runner/work/platform-starter/platform-starter/apps/api
> nest build
```
