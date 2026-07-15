# R-014 Progress

Status: ✅ DONE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-014 covers production observability, incident/runbook documentation, and cleanup evidence.

## Definition of done

- [x] Structured logging fields: `requestId`, `actorId`, `actorType`, `module`, `action`, `duration`, and `result`.
- [x] Log redaction tests.
- [x] Request latency/error-rate/DB-query metrics.
- [x] Login/settlement/provider callback failure metrics.
- [x] Slow-query dashboard or report.
- [x] Module README files for finance/auth/KYC/watchlist/support/notifications/CMS.
- [x] State-machine docs for deposit/withdrawal/KYC/support/admin lifecycle/promotion.
- [x] ADRs for module boundaries, transaction, API client, session, storage, audit, and cache.
- [x] Deployment/migration/rollback runbooks.
- [x] Finance/security/provider outage runbooks.
- [x] Inventory unused exports/components/routes/feature flags/helpers/CSS.
- [x] Remove dead code domain-by-domain with regression evidence.
- [x] Archive legacy docs after they are linked back to the master worklist.
- [x] Final documentation-to-implementation audit.

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

### 6. Metrics baseline and slow-query report

- Added `apps/api/src/common/observability/runtime-metrics.ts` for in-process HTTP latency/error-rate, tracked failure, and database performance signal aggregation.
- Wired HTTP request completion logs into the metrics collector.
- Wired Prisma slow-query/N+1 signals into the metrics collector without exporting raw SQL.
- Added `GET /metrics` through the health module as the baseline metrics report.
- Documented the baseline and limitations in `docs/observability/r014-metrics.md`.

### 7. Cleanup inventory

- Added `tools/audit-r014-cleanup-inventory.mjs` and root script `pnpm audit:r14-cleanup-inventory`.
- Generated `docs/evidence/r014-cleanup-inventory.json` as candidate-only evidence for orphan sources, exports, components, routes, feature flags, helpers, and CSS files.
- The report explicitly forbids deletion without owner review and regression evidence because the inventory uses static heuristics and can include false positives.

### 8. Legacy worklist archive

- Added `docs/archive/legacy-worklists/README.md` as the archive index.
- Kept legacy files in place for link stability and added archive banners pointing back to the master worklist.
- Did not move or delete historical docs because that would break older PR links and references.

## Completed cleanup work

### 9. Dead-code removal and final audit

- [x] Review cleanup inventory with retained-artifact reasons.
- [x] Remove dead code one domain at a time with regression evidence.
- [x] Final documentation-to-implementation audit after cleanup decisions.

## Dead-code removal evidence

- Pass 1 removed empty placeholder `users` and unreferenced `wallets` modules.
- Pass 2 removed empty callback/admin-queue/deposits/idempotency/locks/providers placeholders and an unreferenced top-up review DTO.
- Pass 3 tightened the cleanup inventory CSS import detector and removed unreferenced `apps/web-member/app/casino-auth.css` after exact source searches found no references.
- Pass 4 refined cleanup inventory precision without deleting code: framework route files, root tools, and common config files are now treated as entrypoints instead of orphan candidates.
- Pass 5 removed three unreferenced web-admin orphan files after exact source searches and `pnpm typecheck:admin`.
- Pass 6 reviewed the three remaining API/template orphan candidates and moved them to an explicit retained list with reasons; actionable orphan-source candidates were zero at that point.
- Pass 7 reduced observability unused-export noise by making four file-local types internal while keeping public runtime functions exported.
- Pass 8 reduced common query/security unused-export noise by making thirteen file-local types/constants internal while keeping public helper functions exported.
- Pass 9 reduced API unused-export noise in a broad safe batch, making 23 file-local types/classes/constants internal and lowering potentially unused exports to 63.
- Pass 10 completed the actionable cleanup inventory: removed dead system module leftovers, made remaining file-local exports internal across API and frontend surfaces, and regenerated evidence with `potentialOrphanSources: 0`, `potentiallyUnusedExports: 0`, `potentiallyUnusedComponents: 0`, and `potentiallyUnreferencedCssFiles: 0`.
- Pass 11 removed the unregistered `real-provider-adapter.template.ts` documentation-only source file and removed its stale cleanup-audit allowlist entry. Two R-009 repository-boundary adapters remain intentionally retained.
- Recorded evidence in `docs/evidence/r014-dead-code-removal.md`.
- The overall dead-code removal task is closed; final R-014 documentation-to-implementation audit is complete.

## Final audit

- Completed final documentation-to-implementation audit in `docs/evidence/r014-final-documentation-audit.md`.
- R-014 is closed in `docs/master-project-worklist.md`.

## Merge readiness follow-up

- Added `docs/evidence/r014-merge-readiness.md` after the hosted PR was reported as not mergeable; local verification found no conflict markers and the merge-gate checks pass in this checkout.
