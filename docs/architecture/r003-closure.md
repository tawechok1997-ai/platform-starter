# R-003 Regression Safety Net Closure Evidence

Status: implementation complete. Final closure requires the branch CI gates to pass on the same commit.

## Requirement mapping

| R-003 requirement | Evidence |
|---|---|
| Test inventory by category | `docs/architecture/test-inventory.md` covers unit, characterization, contract, database, browser, concurrency, rollback and idempotency coverage. |
| Identify uncovered critical flows | The inventory records environment-gated browser, deployed session, provider UAT and production migration gaps explicitly. |
| Characterization tests before refactor | API Jest suite is the baseline gate; the inventory requires new characterization coverage before code movement when a gap is found. |
| State-transition tests | Finance, KYC, watchlist, support and admin lifecycle coverage is mapped to unit/database suites. |
| Permission policy tests | `audit:admin-permissions`, `audit:admin-ui-permissions` and API policy tests are mandatory gates. |
| Error-contract snapshots/contracts | `audit:error-code-catalog` and `audit:critical-error-contracts` are mandatory and inventory-enforced. |
| Database rollback tests | Finance PostgreSQL suite protects transaction rollback and compensation behavior. |
| Duplicate settlement/idempotency regression | Finance and promotions PostgreSQL suites are mandatory, non-skippable CI gates. |
| Block refactor without coverage | `tools/audit-critical-test-safety.mjs` validates suite files, commands, workflow steps, inventory markers and skipped-test violations. |
| CI failure summary | Build workflow writes actionable triage guidance to `$GITHUB_STEP_SUMMARY` whenever a required gate fails. |

## Enforced commands

```bash
pnpm audit:critical-test-safety
pnpm --filter @platform/api test -- --runInBand
pnpm --filter @platform/api test:db:finance -- --runInBand
pnpm --filter @platform/api test:db:promotions -- --runInBand
pnpm --filter @platform/api test:db:phone-otp -- --runInBand
pnpm --filter @platform/api test:db:risk-watchlist -- --runInBand
pnpm --filter @platform/api test:db:kyc -- --runInBand
```

## Refactor policy

Every structural-refactor pull request must name its affected domains and record the relevant before/after commands and results. A missing, skipped or non-CI-executed critical suite blocks the refactor. Deployed/browser gaps remain explicit production-verification blockers and may not be silently reclassified as passing.