# Documentation Map

This index connects the repository documentation so implementation work starts from the correct source of truth instead of guessing from an old checklist.

## Start here

1. [`../AGENTS.md`](../AGENTS.md) — operating contract for implementation, verification, animation, evidence, and release.
2. [`AI_RULES.md`](AI_RULES.md) — rules for generated/assisted code.
3. [`PROJECT_RULES.md`](PROJECT_RULES.md) — architecture, finance, audit, and separation rules.
4. [`master-project-worklist.md`](master-project-worklist.md) — project-wide backlog and the only source of truth for remaining checkbox counts.
5. [`MEMBER_UX_UI_TOOLING.md`](MEMBER_UX_UI_TOOLING.md) and [`ADMIN_UX_UI_REDESIGN.md`](ADMIN_UX_UI_REDESIGN.md) — separate Member/Admin UX/UI execution trackers.

## UI/UX source of truth

- [`UI_DESIGN_REFERENCE.md`](UI_DESIGN_REFERENCE.md) — LUX88/Gaming Fintech visual reference and parity gate.
- [`MEMBER_MENU_INFORMATION_ARCHITECTURE.md`](MEMBER_MENU_INFORMATION_ARCHITECTURE.md) — Member-only routes, menu groups, labels, feature flags, active states, and shortcuts.
- [`ADMIN_MENU_INFORMATION_ARCHITECTURE.md`](ADMIN_MENU_INFORMATION_ARCHITECTURE.md) — Admin-only route groups, permissions, queue ownership, aliases, and operational navigation.
- [`UI_MENU_INFORMATION_ARCHITECTURE.md`](UI_MENU_INFORMATION_ARCHITECTURE.md) — legacy cross-surface contract and separation policy; use the Member/Admin documents above for implementation.
- [`UI_CONSISTENCY_COMPLETION_PLAN.md`](UI_CONSISTENCY_COMPLETION_PLAN.md) — cards, components, copy budgets, state consistency, duplicate cleanup, priorities, and tool routing.
- [`UI_MOTION_ANIMATION_CONTRACT.md`](UI_MOTION_ANIMATION_CONTRACT.md) — motion tokens, approved animations, reduced motion, and performance gates.
- [`MEMBER_UI_PRODUCT_BRIEF.md`](MEMBER_UI_PRODUCT_BRIEF.md) — active Member-only product hierarchy, page order, card density, copy, responsive layout, and motion brief.
- [`MEMBER_TYPOGRAPHY_CONTRACT.md`](MEMBER_TYPOGRAPHY_CONTRACT.md) — Member Thai/English font roles, numeric treatment, loading, wrapping, and typography QA.
- [`MEMBER_COLOR_ICON_CONTRACT.md`](MEMBER_COLOR_ICON_CONTRACT.md) — Member dark palette, surface depth, semantic states, borders, shadows, glow, and Lucide icon rules.
- [`MEMBER_UX_UI_TOOLING.md`](MEMBER_UX_UI_TOOLING.md) — Member route/tooling worklist.
- [`ADMIN_UX_UI_REDESIGN.md`](ADMIN_UX_UI_REDESIGN.md) — Admin route/redesign worklist.
- [`MEMBER_ROUTE_MATRIX.md`](MEMBER_ROUTE_MATRIX.md) — Member route ownership, APIs, flags, deep links, and state gaps.
- [`member-ux-qa.md`](member-ux-qa.md), [`mobile-qa-checklist.md`](mobile-qa-checklist.md), and [`mobile-visual-regression-checklist.md`](mobile-visual-regression-checklist.md) — rendered QA checklists.
- [`visual-regression.md`](visual-regression.md) and [`ux-regression-matrix-finance-operations.md`](ux-regression-matrix-finance-operations.md) — visual and finance-operation regression contracts.

## Architecture and API contracts

- [`ARCHITECTURE.md`](ARCHITECTURE.md), [`architecture/module-map.md`](architecture/module-map.md), [`architecture/dependency-map.md`](architecture/dependency-map.md) — module boundaries and dependencies.
- [`architecture/route-ownership.md`](architecture/route-ownership.md), [`architecture/endpoint-ownership-matrix.md`](architecture/endpoint-ownership-matrix.md), [`architecture/mutation-contract-inventory.md`](architecture/mutation-contract-inventory.md) — route/API ownership.
- [`architecture/state-machines.md`](architecture/state-machines.md), [`architecture/error-code-catalog.md`](architecture/error-code-catalog.md), [`architecture/test-inventory.md`](architecture/test-inventory.md) — state, error, and test contracts.
- [`architecture/backend-decomposition-policy.md`](architecture/backend-decomposition-policy.md) and [`architecture/backend-decomposition-baseline.json`](architecture/backend-decomposition-baseline.json) — backend size/coupling policy and ratchet baseline.

## Security, identity, storage, and finance

- [`AUTH.md`](AUTH.md), [`SECURITY.md`](SECURITY.md), [`security-checklist.md`](security-checklist.md), [`admin-access-control.md`](admin-access-control.md) — identity and access.
- [`PRIVATE_MEDIA_STORAGE.md`](PRIVATE_MEDIA_STORAGE.md), [`storage.md`](storage.md), [`anti-bot-status.md`](anti-bot-status.md) — sensitive media and abuse controls.
- [`P2_WALLET_FLOW.md`](P2_WALLET_FLOW.md), [`P3_WALLET_HARDENING.md`](P3_WALLET_HARDENING.md), [`real-money-readiness-checklist.md`](real-money-readiness-checklist.md), [`real-money-preflight-and-retry.md`](real-money-preflight-and-retry.md) — money safety and readiness.
- [`provider-integration-guide.md`](provider-integration-guide.md), [`provider-real-money-gates.md`](provider-real-money-gates.md), [`webhook-security-hardening.md`](webhook-security-hardening.md) — provider and webhook boundaries.

## QA, CI, deployment, and operations

- [`full-system-test-checklist.md`](full-system-test-checklist.md), [`playwright-smoke.md`](playwright-smoke.md), [`smoke-test.md`](smoke-test.md), [`final-qa-checklist.md`](final-qa-checklist.md) — test entry points.
- [`ci-build-checks.md`](ci-build-checks.md), [`github-actions-smoke.md`](github-actions-smoke.md), [`deploy-checklist.md`](deploy-checklist.md) — CI/release checks.
- [`operations/ci-alert-response.md`](operations/ci-alert-response.md) — triage, deduplication, evidence, and closure procedure for `[CI ALERT]` issues.
- [`operations/support-runbook.md`](operations/support-runbook.md), [`operations/verification-commands.md`](operations/verification-commands.md), and [`operations/engineering-handoff.md`](operations/engineering-handoff.md) — support, command selection, and engineering handoff.
- [`operations/p6-external-verification-checklist.md`](operations/p6-external-verification-checklist.md) — canonical execution order, preflight, stop conditions, and closure rules for the 30 external P6 checks.
- [`evidence/p6-verification-run-template.md`](evidence/p6-verification-run-template.md) — sanitized evidence template for each deployed, production, or vendor verification run.
- [`production-verification.md`](production-verification.md), [`production-runbook.md`](production-runbook.md), [`production-migration-verification-runbook.md`](production-migration-verification-runbook.md) — production verification.
- [`backup-automation.md`](backup-automation.md), [`database-backup-restore.md`](database-backup-restore.md), [`monitoring.md`](monitoring.md), [`observability/`](observability/) — recovery and monitoring.
- [`maintenance/repository-cleanup-policy.md`](maintenance/repository-cleanup-policy.md) and [`maintenance/repository-cleanup-baseline.json`](maintenance/repository-cleanup-baseline.json) — cleanup classification, approval, and deletion safeguards.
- [`evidence/`](evidence/) and [`adr/`](adr/) — retained proof and architectural decisions; link new evidence from the owning worklist.

## Documentation maintenance rules

- Update the owning source-of-truth document in the same commit as a behavior or UI contract change.
- Link new documents from this index and from `AGENTS.md` when they govern implementation.
- Do not copy the same checklist into multiple files; link to the canonical section instead.
- Do not derive remaining-work counts from ad-hoc P groups; use unchecked boxes in `master-project-worklist.md` only.
- Mark implementation, evidence, and acceptance separately. A code change without retained verification is not a closed item.
- Record commit SHA, date, owner, remaining risk, and rollback/evidence path for P0/P1 changes.
