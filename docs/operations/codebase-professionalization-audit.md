# Codebase Professionalization Audit

Updated: **2026-07-31**  
Owner: **Platform Engineering**  
Status: **Active**

This is the maintained technical-debt and handoff-readiness register for `platform-starter`. It records issues that are not necessarily functional defects but reduce safety, clarity, maintainability or professional delivery quality.

## Priority model

- **P0**: production correctness, money, identity, authorization, migration or startup risk
- **P1**: high maintainability or regression risk that should be addressed before broad feature work
- **P2**: structural and developer-experience improvement
- **P3**: polish or optional optimization

## Current assessment

| Area | Assessment | Current state |
|---|---|---|
| Production startup | Guarded in CI | API build is started and `/health` plus `/version` commit identity are verified |
| Build reproducibility | Guarded in CI | API generated catalogs and Admin reference assets use check-only builds; tracked diff must remain clean |
| Finance ownership | Improved | Mutation ownership is explicit; dashboard reads moved to a dedicated query owner |
| Backend structure | Mixed | `MoneyOpsService` still owns alert and legacy simulator compatibility behavior |
| Public assets | Quarantined | Legacy executable Member reference files return 404 and are audited; image migration remains |
| Browser security | Improved | Admin and Member security headers and environment-scoped CSP are repository contracts |
| Documentation | Current baseline | README, security, onboarding, troubleshooting and handoff documents updated on 2026-07-31 |
| Verification tooling | Strong | Stable grouped backend, frontend, finance, security, docs and release entry points exist |
| Handoff readiness | Good with external limits | Repository work is documented; production and vendor verification remain P6 |
| Repository size | Operational debt | History cleanup requires the coordinated migration runbook and explicit approval |

## Completed or continuously guarded

### Application startup and release identity

- API production artifact starts in CI against the disposable database.
- `/health` must report `ok`.
- `/version` must report the exact checked-out commit.
- Build success alone is not release evidence.

### Build purity

- generated catalog and reference-asset writes require explicit commands
- normal lint, typecheck, test and build paths are check-only
- Build workflow runs `git diff --exit-code`
- `audit:build-purity` protects the package scripts

### Public asset and browser boundary

- legacy executable reference assets are quarantined with 404 responses
- malformed `undefined`/`null` filenames are blocked
- copied HTML entrypoints are removed
- Admin and Member security headers are audited
- approved API origin is included in CSP without breaking HTTP test environments

### Environment and handoff documentation

- `.env.example` matches Redis, local/S3 storage, simulator and rate-limit runtime contracts
- canonical security, onboarding, troubleshooting and engineering-handoff documents have owners and status
- grouped verification commands are available
- documentation metadata and index links are checked automatically

### Shared API response cache

- authenticated caching requires an actor/session namespace
- GET/HEAD are the only cacheable methods
- token refresh, mutations and session reset clear cached data

## P1 remaining maintainability work

### 1. Complete `MoneyOpsService` decomposition

The control-center dashboard query now belongs to `MoneyOpsDashboardQueryService`. Remaining extraction targets:

- `MoneyOpsAlertScanService`
- `ProviderSimulatorCompatibilityService`
- `ProviderWebhookTestService`
- risk lifecycle delegation to the risk owner module

Preserve existing routes through adapters while moving ownership. Do not combine this with provider-specific real-money enablement.

### 2. Remove remaining dense one-line methods

Rules:

- one statement or logical operation per line
- named input/output types for public service methods
- no `any` at controller/service boundaries without a tracked compatibility exception
- extract repeated formatting and query-normalization helpers

### 3. Reduce `AppModule` composition risk

Introduce domain composition modules only where they make ownership clearer without hiding routes:

- identity/access
- money operations
- content/support
- provider/game platform

Do not create a generic shared dumping ground.

### 4. Finish compatibility contract coverage

Add contract tests for legacy finance/provider routes retained during ownership moves, including response shape, permission metadata and audit behavior.

## P2 operational and developer-experience work

### 5. Complete legacy image migration

Move referenced images from legacy `asset-pc`/`asset-mobile` roots into semantic owned folders, update references, then delete unused current-tree files.

### 6. Execute repository history size migration

Use `docs/operations/repository-size-migration.md`. This requires backup verification, a merge freeze, coordinated force update and re-clone. It is intentionally not executed by a normal feature PR.

### 7. Add generated architecture views

Generate route ownership, module imports and provider exports in CI. Human-maintained maps should link to generated evidence rather than duplicate it.

### 8. Normalize terminology

Use consistent internal terms for deposit/top-up, withdrawal/payout, member/user and Admin actor while preserving external API compatibility.

## Current verification entry points

```bash
pnpm check:backend
pnpm check:frontend
pnpm check:finance
pnpm check:security
pnpm check:docs
pnpm check:release
```

Targeted hardening checks:

```bash
pnpm audit:build-purity
pnpm audit:public-assets
pnpm audit:document-metadata
pnpm verify:api-startup
```

## Definition of professional handoff

A handoff is accepted only when:

- current commit and deployment identity are recorded
- relevant checks have actual results
- builds leave tracked files unchanged
- startup and health/version identity are verified
- migration and environment impacts are stated
- owners and boundaries are documented
- public asset and browser-security impacts are stated
- remaining risks are explicit
- rollback path is executable
- canonical documentation is updated in the same change
