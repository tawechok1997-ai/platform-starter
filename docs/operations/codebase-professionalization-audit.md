# Codebase Professionalization Audit

Updated: **2026-07-21**

This document is the maintained technical-debt and handoff-readiness register for `platform-starter`. It records issues that are not necessarily functional defects but reduce safety, clarity, maintainability or professional delivery quality.

## Priority model

- **P0**: production correctness, money, identity, authorization, migration or startup risk
- **P1**: high maintainability or regression risk that should be addressed before broad feature work
- **P2**: structural and developer-experience improvement
- **P3**: polish or optional optimization

## Current assessment

| Area | Assessment | Main concern |
|---|---|---|
| Production startup | Needs stronger automated coverage | A Nest module-scope dependency regression reached deployment after the deduplication merge |
| Finance ownership | Improved | Mutation ownership is now explicit, but contract tests must protect compatibility adapters |
| Backend structure | Mixed | Several services/controllers still combine unrelated operational responsibilities |
| Documentation | Being normalized | Canonical files existed but dates, scope statements and command references drifted |
| Verification tooling | Strong but fragmented | Many audit commands exist; discoverability and grouping need improvement |
| Handoff readiness | Moderate | Good runbooks exist, but some commands and active-scope statements were stale |

## P0 — fix or continuously guard

### 1. Add application bootstrap dependency-resolution test

**Problem:** Typecheck and build can pass while Nest dependency injection fails only at application startup.

**Required change:**

- Add a test that compiles `AppModule` with a safe test configuration.
- Resolve every controller guard/provider at least once.
- Add this test to API verification and deployment build gates.
- Explicitly cover compatibility modules such as `RiskModule`.

**Acceptance:** a missing `JwtService`, `ConfigService`, `PrismaService` or exported provider fails before deployment.

### 2. Add deployed API startup/health gate before promotion

**Problem:** deployment status can remain pending or fail after a merge reaches `main`.

**Required change:**

- Require container startup success.
- Poll the health/version endpoint.
- Verify deployment commit identity.
- Do not promote or report success from build status alone.

### 3. Protect finance compatibility contracts

Add contract tests for legacy routes retained during ownership moves, including response shape, permission metadata and audit behavior.

## P1 — high-value maintainability work

### 4. Decompose `MoneyOpsService`

The service currently mixes control-center reads, ledger operations, alert scanning, provider simulator behavior, webhook-log test generation and risk-alert lifecycle actions.

Split by responsibility:

- `MoneyOpsDashboardQueryService`
- `MoneyOpsAlertScanService`
- `ProviderSimulatorService`
- `ProviderWebhookTestService`
- risk lifecycle delegation to the risk owner module

Keep controllers thin and preserve routes through adapters during migration.

### 5. Remove dense one-line methods

Several backend files use long single-line methods. This makes review, blame, debugging and conflict resolution unnecessarily difficult.

Rules:

- one statement or logical operation per line
- named input/output types for public service methods
- no `any` in controller/service boundaries unless accompanied by a tracked exception
- extract repeated formatting and query-normalization helpers

### 6. Make security infrastructure ownership explicit

`JwtAuthModule` centralizes empty JWT registration, while Admin and Member authentication policy remain separate. Add a module dependency test ensuring every module using `AdminAuthGuard` or member guards imports an approved authentication infrastructure module.

### 7. Reduce `AppModule` composition risk

`AppModule` directly imports many feature modules. Introduce domain composition modules only where they improve ownership without hiding routes:

- identity/access
- money operations
- content/support
- provider/game platform

Do not create generic “shared” dumping-ground modules.

### 8. Standardize service contracts

Replace public method parameters such as `adminUser: any`, `meta: any` and loose query objects with shared actor, request metadata and typed query contracts.

### 9. Separate query and command services consistently

The repository has started this pattern for members, activity, finance and wallet mutations. Apply it consistently to modules that still mix reads and writes.

## P2 — documentation and developer experience

### 10. Maintain one active-scope statement

`AGENTS.md` must describe how to declare a task scope, not permanently lock the entire repository to one historical UI phase.

### 11. Maintain command registry integrity

Every command documented in README/runbooks must exist in `package.json`. Extend `audit:tool-registry` to parse canonical documentation and fail on unknown `pnpm` commands.

### 12. Group root scripts

The root package contains many individual audit commands. Keep them, but add stable grouped entry points:

- `check:backend`
- `check:frontend`
- `check:finance`
- `check:security`
- `check:docs`
- `check:release`

### 13. Archive superseded evidence safely

Historical evidence is useful, but active instructions and historical proof must be separated. Use:

- `docs/` for current contracts/runbooks
- `docs/evidence/` for retained run results
- `docs/archive/` for superseded planning documents that must remain for traceability

Delete only after reference audit and owner approval.

### 14. Add documentation metadata

Canonical operational documents should include:

- last updated date
- owner
- status: active/superseded/archive
- replaces / replaced-by links
- verification command where applicable

### 15. Add architecture decision records for future boundary changes

Any new dependency, cross-domain provider export, storage driver, queue system or real-provider integration should have an ADR before implementation.

## P3 — polish

### 16. Normalize file naming and terminology

Use consistent terms for top-up/deposit, withdrawal/payout, member/user and admin actor. Preserve API compatibility, but document one canonical internal term.

### 17. Add generated architecture views

Generate route ownership, module imports and provider exports from source during CI. Human-maintained maps should link to generated evidence rather than duplicate it.

### 18. Add repository newcomer path

Provide a concise 30-minute onboarding sequence with architecture, local startup, test data, safe commands and first-change checklist.

## Document cleanup decisions

### Keep as canonical

- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/master-project-worklist.md`
- `docs/operations/engineering-handoff.md`
- architecture ownership and policy documents

### Keep as evidence or historical context

- closure reports under `docs/evidence/`
- completed `r0xx-*` progress/closure documents
- deduplication batch evidence

### Merge when content overlaps

- duplicated command lists into `docs/operations/verification-commands.md`
- duplicated work-status rules into `docs/operations/work-status-reporting.md`
- overlapping route ownership tables into the canonical architecture ownership matrix

### Delete only after automated reference audit

- superseded worklists explicitly replaced by `master-project-worklist.md`
- obsolete screenshots/artifacts not referenced by an evidence record
- dead generated files that are reproducible and not release inputs

## Recommended execution order

1. Bootstrap dependency-resolution test
2. Documentation command-reference audit
3. `MoneyOpsService` decomposition
4. typed actor/request/query contracts
5. module dependency graph and guard-import audit
6. grouped verification commands
7. controlled archive/delete pass

## Definition of professional handoff

A handoff is accepted only when:

- current `main` commit and deployment identity are recorded
- relevant checks have actual results
- startup and health are verified
- migration and environment impacts are stated
- owners and boundaries are documented
- remaining risks are explicit
- rollback path is executable
- canonical documentation is updated in the same change
