# Documentation Map

Updated: **2026-07-21**  
Status: **Active**

This index connects the repository documentation so implementation work starts from the correct source of truth instead of guessing from an old checklist.

## Start here

1. [`../AGENTS.md`](../AGENTS.md) — operating contract for implementation, verification, evidence and release.
2. [`AI_RULES.md`](AI_RULES.md) — rules for generated/assisted code.
3. [`PROJECT_RULES.md`](PROJECT_RULES.md) — architecture, finance, audit and separation rules.
4. [`master-project-worklist.md`](master-project-worklist.md) — project-wide backlog and the only source of truth for remaining checkbox counts.
5. [`operations/codebase-professionalization-audit.md`](operations/codebase-professionalization-audit.md) — current technical-debt, maintainability and handoff-readiness register.
6. [`operations/work-status-reporting.md`](operations/work-status-reporting.md) — canonical rules and commands for reporting remaining work.
7. [`operations/engineering-handoff.md`](operations/engineering-handoff.md) — transfer procedure and required evidence.

## UI/UX source of truth

- [`UI_DESIGN_REFERENCE.md`](UI_DESIGN_REFERENCE.md) — visual reference and parity gate.
- [`MEMBER_MENU_INFORMATION_ARCHITECTURE.md`](MEMBER_MENU_INFORMATION_ARCHITECTURE.md) — Member routes, menus, flags and active states.
- [`ADMIN_MENU_INFORMATION_ARCHITECTURE.md`](ADMIN_MENU_INFORMATION_ARCHITECTURE.md) — Admin routes, permissions and operational navigation.
- [`UI_MENU_INFORMATION_ARCHITECTURE.md`](UI_MENU_INFORMATION_ARCHITECTURE.md) — legacy cross-surface contract; use the Member/Admin documents above for implementation.
- [`UI_CONSISTENCY_COMPLETION_PLAN.md`](UI_CONSISTENCY_COMPLETION_PLAN.md) — components, copy, states and duplicate cleanup.
- [`UI_MOTION_ANIMATION_CONTRACT.md`](UI_MOTION_ANIMATION_CONTRACT.md) — motion tokens, reduced motion and performance gates.
- [`MEMBER_UI_PRODUCT_BRIEF.md`](MEMBER_UI_PRODUCT_BRIEF.md) — Member hierarchy and responsive behavior.
- [`MEMBER_TYPOGRAPHY_CONTRACT.md`](MEMBER_TYPOGRAPHY_CONTRACT.md) — font roles and numeric treatment.
- [`MEMBER_COLOR_ICON_CONTRACT.md`](MEMBER_COLOR_ICON_CONTRACT.md) — palette, semantic states and icon rules.
- [`MEMBER_UX_UI_TOOLING.md`](MEMBER_UX_UI_TOOLING.md) — Member route/tooling worklist.
- [`ADMIN_UX_UI_REDESIGN.md`](ADMIN_UX_UI_REDESIGN.md) — Admin redesign worklist.
- [`operations/admin-modernization-batch-1.md`](operations/admin-modernization-batch-1.md) — active Admin-only modernization execution record.
- [`operations/admin-css-ownership-inventory.md`](operations/admin-css-ownership-inventory.md) — ownership and consolidation map for every Admin root stylesheet.
- [`MEMBER_ROUTE_MATRIX.md`](MEMBER_ROUTE_MATRIX.md) — Member route ownership and state gaps.
- [`member-ux-qa.md`](member-ux-qa.md), [`mobile-qa-checklist.md`](mobile-qa-checklist.md), [`mobile-visual-regression-checklist.md`](mobile-visual-regression-checklist.md) — rendered QA checklists.
- [`visual-regression.md`](visual-regression.md), [`ux-regression-matrix-finance-operations.md`](ux-regression-matrix-finance-operations.md) — visual and finance-operation regression contracts.

## Architecture and API contracts

- [`ARCHITECTURE.md`](ARCHITECTURE.md), [`architecture/module-map.md`](architecture/module-map.md), [`architecture/dependency-map.md`](architecture/dependency-map.md) — module boundaries and dependencies.
- [`architecture/route-ownership.md`](architecture/route-ownership.md), [`architecture/endpoint-ownership-matrix.md`](architecture/endpoint-ownership-matrix.md), [`architecture/mutation-contract-inventory.md`](architecture/mutation-contract-inventory.md) — route/API ownership.
- [`architecture/state-machines.md`](architecture/state-machines.md), [`architecture/error-code-catalog.md`](architecture/error-code-catalog.md), [`architecture/test-inventory.md`](architecture/test-inventory.md) — state, error and test contracts.
- [`architecture/admin-server-state-policy.md`](architecture/admin-server-state-policy.md) — Admin query, retry, cancellation, polling, cache and mutation-safety contract.
- [`architecture/backend-decomposition-policy.md`](architecture/backend-decomposition-policy.md), [`architecture/backend-decomposition-baseline.json`](architecture/backend-decomposition-baseline.json), [`architecture/backend-decomposition-review-checklist.md`](architecture/backend-decomposition-review-checklist.md) — backend size/coupling policy and review evidence.
- [`architecture/finance-module-ownership.md`](architecture/finance-module-ownership.md), [`architecture/finance-mutation-ownership.md`](architecture/finance-mutation-ownership.md), [`architecture/risk-ownership.md`](architecture/risk-ownership.md), [`architecture/activity-projection-ownership.md`](architecture/activity-projection-ownership.md), [`architecture/member-query-ownership.md`](architecture/member-query-ownership.md) — current ownership boundaries created by the deduplication work.
- [`architecture/deduplication-targets.md`](architecture/deduplication-targets.md) and [`deduplication-safe-batch-1.md`](deduplication-safe-batch-1.md) — retained closure evidence; not a competing active backlog.

## Security, identity, storage and finance

- [`AUTH.md`](AUTH.md), [`SECURITY.md`](SECURITY.md), [`security-checklist.md`](security-checklist.md), [`admin-access-control.md`](admin-access-control.md) — identity and access.
- [`PRIVATE_MEDIA_STORAGE.md`](PRIVATE_MEDIA_STORAGE.md), [`storage.md`](storage.md), [`anti-bot-status.md`](anti-bot-status.md) — sensitive media and abuse controls.
- [`P2_WALLET_FLOW.md`](P2_WALLET_FLOW.md), [`P3_WALLET_HARDENING.md`](P3_WALLET_HARDENING.md), [`real-money-readiness-checklist.md`](real-money-readiness-checklist.md), [`real-money-preflight-and-retry.md`](real-money-preflight-and-retry.md) — money safety and readiness.
- [`provider-integration-guide.md`](provider-integration-guide.md), [`provider-real-money-gates.md`](provider-real-money-gates.md), [`webhook-security-hardening.md`](webhook-security-hardening.md) — provider and webhook boundaries.

## QA, CI, deployment and operations

- [`full-system-test-checklist.md`](full-system-test-checklist.md), [`playwright-smoke.md`](playwright-smoke.md), [`smoke-test.md`](smoke-test.md), [`final-qa-checklist.md`](final-qa-checklist.md) — test entry points.
- [`ci-build-checks.md`](ci-build-checks.md), [`github-actions-smoke.md`](github-actions-smoke.md), [`deploy-checklist.md`](deploy-checklist.md) — CI/release checks.
- [`operations/ci-alert-response.md`](operations/ci-alert-response.md) — CI alert response.
- [`operations/support-runbook.md`](operations/support-runbook.md), [`operations/verification-commands.md`](operations/verification-commands.md), [`operations/engineering-handoff.md`](operations/engineering-handoff.md), [`operations/handoff-acceptance-checklist.md`](operations/handoff-acceptance-checklist.md) — support and handoff.
- [`operations/repository-maintenance-audit.md`](operations/repository-maintenance-audit.md), [`maintenance/repository-cleanup-policy.md`](maintenance/repository-cleanup-policy.md) — cleanup inventory and safeguards.
- [`operations/p6-external-verification-checklist.md`](operations/p6-external-verification-checklist.md), [`evidence/p6-verification-run-template.md`](evidence/p6-verification-run-template.md) — external verification.
- [`production-verification.md`](production-verification.md), [`production-runbook.md`](production-runbook.md), [`production-migration-verification-runbook.md`](production-migration-verification-runbook.md) — production verification.
- [`backup-automation.md`](backup-automation.md), [`database-backup-restore.md`](database-backup-restore.md), [`monitoring.md`](monitoring.md), [`observability/`](observability/) — recovery and monitoring.
- [`evidence/`](evidence/) and [`adr/`](adr/) — retained proof and architectural decisions.

## Documentation maintenance rules

- Update the owning source-of-truth document in the same commit as behavior or contract changes.
- Link new governing documents from this index and `AGENTS.md`.
- Do not copy the same checklist into multiple files; link to the canonical section.
- Do not derive remaining-work counts from ad-hoc groups; use unchecked boxes in `master-project-worklist.md` only.
- Mark implementation, evidence and acceptance separately.
- Record commit SHA, date, owner, remaining risk and rollback/evidence path for P0/P1 changes.
- Every documented `pnpm` command must exist in `package.json` or be explicitly marked as a proposed command.
- Move superseded plans to archive/evidence only after reference and ownership review; do not silently delete traceability.
