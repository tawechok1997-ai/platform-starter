# R-014 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-014 covers production observability, incident/runbook documentation, and cleanup evidence.

## Definition of done

- [x] Structured logging fields: `requestId`, `actorId`, `actorType`, `module`, `action`, `duration`, and `result`.
- [x] Log redaction tests.
- [x] Inventory unused exports/components/routes/feature flags/helpers/CSS.
- [x] Archive legacy docs after they are linked back to the master worklist.
### 7. Cleanup inventory

- Added `tools/audit-r014-cleanup-inventory.mjs` and root script `pnpm audit:r14-cleanup-inventory`.
- Generated `docs/evidence/r014-cleanup-inventory.json` as candidate-only evidence for orphan sources, exports, components, routes, feature flags, helpers, and CSS files.
- The report explicitly forbids deletion without owner review and regression evidence because the inventory uses static heuristics and can include false positives.

### 8. Legacy worklist archive

- Added `docs/archive/legacy-worklists/README.md` as the archive index.
- Kept legacy files in place for link stability and added archive banners pointing back to the master worklist.
- Did not move or delete historical docs because that would break older PR links and references.

### 9. Dead-code removal planning
- [ ] Review cleanup inventory with module owners.
- [ ] Remove dead code one domain at a time only after regression evidence.
- [ ] Final documentation-to-implementation audit after cleanup decisions.
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


## Partial dead-code removal evidence

- Pass 1 removed empty placeholder `users` and unreferenced `wallets` modules.
- Pass 2 removed empty callback/admin-queue/deposits/idempotency/locks/providers placeholders and an unreferenced top-up review DTO.
- Pass 3 tightened the cleanup inventory CSS import detector and removed unreferenced `apps/web-member/app/casino-auth.css` after exact source searches found no references.
- Pass 4 refined cleanup inventory precision without deleting code: framework route files, root tools, and common config files are now treated as entrypoints instead of orphan candidates.
- Pass 5 removed three unreferenced web-admin orphan files after exact source searches and `pnpm typecheck:admin`.
- Pass 6 reviewed the three remaining API/template orphan candidates and moved them to an explicit retained list with reasons; actionable orphan-source candidates are now zero.
- Recorded evidence in `docs/evidence/r014-dead-code-removal.md`.
- The overall dead-code removal task remains open until the broader cleanup inventory is reviewed domain-by-domain.
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
