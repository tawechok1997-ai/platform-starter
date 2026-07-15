# R-014 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-014 covers production observability, incident/runbook documentation, and cleanup evidence.

## Definition of done

- [x] Structured logging fields: `requestId`, `actorId`, `actorType`, `module`, `action`, `duration`, and `result`.
- [x] Log redaction tests.
- [ ] Request latency/error-rate/DB-query metrics.
- [ ] Login/settlement/provider callback failure metrics.
- [ ] Slow-query dashboard or report.
- [x] Module README files for finance/auth/KYC/watchlist/support/notifications/CMS.
- [x] State-machine docs for deposit/withdrawal/KYC/support/admin lifecycle/promotion.
- [x] ADRs for module boundaries, transaction, API client, session, storage, audit, and cache.
- [x] Deployment/migration/rollback runbooks.
- [x] Finance/security/provider outage runbooks.
- [ ] Inventory unused exports/components/routes/feature flags/helpers/CSS.
- [ ] Remove dead code domain-by-domain with regression evidence.
- [ ] Archive legacy docs after they are linked back to the master worklist.
- [ ] Final documentation-to-implementation audit.

## Closed outcomes

### 1. Structured HTTP log contract

- Added `apps/api/src/common/observability/structured-log.ts` as the shared structured log builder.
- Request and server-exception logs now emit `requestId`, `actorId`, `actorType`, `module`, `action`, `durationMs`, and `result` through one redacted helper.
- The helper infers module/action from the route path and classifies results as `success`, `client_error`, or `server_error`.

### 2. Log redaction regression

- Existing `sensitive-log-redactor` tests cover sensitive query parameters, nested sensitive fields, Error messages, and circular objects.
- Added `structured-log` tests covering R-014 required fields, anonymous client errors, route module/action inference, and sensitive URL redaction inside structured request logs.


### 3. Module README set

- Added module READMEs for finance, auth, KYC, watchlist, support, notifications, and CMS under `docs/modules/*/README.md`.
- Each README names the current implementation owners, safety boundaries, and regression evidence that must stay current.

### 4. State-machine documentation

- Added `docs/architecture/state-machines.md` for deposit, withdrawal, KYC, support, admin lifecycle, and promotion lifecycles.
- The document intentionally references command/workflow services rather than inventing new lifecycle states.

### 5. Operational ADR and runbooks

- Added `docs/adr/0001-r014-operational-boundaries.md` for module boundaries, transaction ownership, API client, session, storage, audit, and cache decisions.
- Added `docs/runbooks/deployment-migration-rollback.md`.
- Added `docs/runbooks/finance-security-provider-outages.md`.

## Active work

### 6. Metrics baseline

- [ ] Define request latency and error-rate metric names and labels.
- [ ] Define DB query duration metric buckets and slow-query thresholds.
- [ ] Decide metrics sink/exporter for deployed environments.
