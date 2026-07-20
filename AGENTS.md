# Platform Starter Agent Operating Contract

Updated: **2026-07-21**  
Status: **Active**

This file governs implementation work in this repository. It is the short operational entry point; linked documents are the detailed source of truth.

## Current execution scope

The repository does not have a permanent Member-only, Admin-only or backend-only scope. Every task must declare its scope before editing:

- `apps/web-member`
- `apps/web-admin`
- `apps/api`
- `packages/*`
- `prisma`
- documentation/operations

Do not expand scope implicitly. Cross-surface or cross-domain changes require an explicit ownership and regression review.

Full documentation map: [`docs/README.md`](docs/README.md).

## Read before changing code

1. [`docs/AI_RULES.md`](docs/AI_RULES.md) and [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md)
2. [`docs/master-project-worklist.md`](docs/master-project-worklist.md)
3. [`docs/operations/codebase-professionalization-audit.md`](docs/operations/codebase-professionalization-audit.md)
4. Relevant architecture ownership documents under [`docs/architecture/`](docs/architecture/)
5. Relevant UI, finance, security, storage or provider contract for the affected scope

For Member UI work, also read the Member product, typography, color/icon, menu and route documents. For Admin UI work, read the Admin redesign and menu architecture documents. Do not treat a historical phase restriction as a repository-wide rule.

When documents conflict, preserve financial, security and architecture contracts first. Update the canonical source of truth when resolving conflict; do not silently create another rule.

## Working rules

- Keep Member, Admin, API, database and shared packages separated by ownership and contracts.
- Inspect routes, components, tokens, providers, API contracts and tests before editing.
- Reuse canonical primitives and owners. Add a variant before creating a duplicate component or service.
- Never duplicate route definitions, API mappings, status labels, mutation logic, query ownership or feature-flag logic.
- Financial, identity, session, permission, storage, migration and audit changes require tests plus rollback/evidence notes.
- Public service/controller boundaries must use named types; avoid `any` and dense single-line methods.
- A Nest module using a guard must import an approved module that exports every guard dependency. Do not assume transitive providers are visible.
- Preserve unrelated user changes and avoid destructive reset commands.

## Implementation loop

1. Define scope, owner, priority, contracts and risk.
2. Identify duplicate logic and the intended canonical owner.
3. Make the smallest coherent change.
4. Preserve compatibility routes/contracts during ownership moves.
5. Implement relevant loading/error/permission/conflict/retry and failure states.
6. Run targeted checks, then repository checks appropriate to the risk.
7. For API/module changes, verify Nest application bootstrap or deployed startup, not only compilation.
8. Retain evidence for rendered, deployed, migration, finance or security behavior where relevant.
9. Update canonical worklist, architecture and handoff documents in the same change.
10. Commit intentionally and publish only after actual verification results are known.

## Required verification by scope

### Repository baseline

```bash
pnpm check:repository
pnpm lint
pnpm typecheck
```

### Backend structure

```bash
pnpm audit:backend-decomposition
pnpm check:architecture
pnpm typecheck:api
pnpm build:api
```

Also run an application bootstrap/startup check for dependency-injection changes.

### Finance/security

Run the relevant finance, permission, secret, dependency and workflow audits plus targeted tests. Never report a money/security path as verified from typecheck alone.

### UI

Run package lint, typecheck, tests, production build and rendered browser/Playwright evidence at required viewports.

### Release

Verify container startup, health/version endpoint and deployment commit identity before declaring success.

## Tool and skill routing

| Need | Required route |
|---|---|
| Repository inventory and duplicate search | `rg`, audit scripts, TypeScript inspection |
| React/Next implementation or refactor | React best-practice workflow |
| Rendered UI debugging | Browser/Playwright verification |
| Accessibility | axe, JSX a11y, keyboard/focus checks |
| Architecture/backend refactor | ownership maps, boundary audits, bootstrap test |
| Source publication | repository GitHub workflow; verify current `main` |

## Definition of done

A task is complete only when:

- scope and canonical ownership are clear
- no duplicate or dead path remains unintentionally
- compatibility, permission and audit behavior are preserved
- relevant checks actually ran and results are recorded
- startup/rendered/deployed behavior is verified where required
- documentation and evidence are current
- remaining risk and rollback path are explicit

## Stop conditions

Stop and escalate when a change requires production credentials, destructive data operations, an unapproved dependency, an ownerless finance/security contract, unverifiable migration state, wallet/ledger inconsistency, or a material contract deviation without approval.
