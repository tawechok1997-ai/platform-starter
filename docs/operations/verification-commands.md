# Verification Commands

This guide separates commands used during normal development from historical closure and environment-specific verification. Run the smallest relevant gate first, then expand only when the affected scope requires it.

## Daily development gates

| Purpose | Command | When to run |
|---|---|---|
| Runtime, lint, and TypeScript | `pnpm check:quick` | Before committing ordinary code changes |
| Repository-wide validation | `pnpm check:full` | Before merging broad or cross-workspace changes |
| Changed-file formatting | `pnpm format:check` | Before committing formatting-sensitive changes |
| Full-system automatic profile | `pnpm test:full-system:auto` | When the affected scope spans multiple applications |

## Scope-specific gates

| Scope | Commands |
|---|---|
| API | `pnpm lint:api`, `pnpm typecheck:api`, `pnpm --filter @platform/api test`, `pnpm build:api` |
| Admin Web | `pnpm lint:admin`, `pnpm typecheck:admin`, `pnpm build:web-admin` |
| Member Web | `pnpm lint:member`, `pnpm typecheck:member`, `pnpm build:web-member` |
| Shared packages | `pnpm lint:packages`, `pnpm typecheck:packages` |
| Browser smoke | `pnpm test:e2e:smoke` |
| Accessibility | `pnpm test:e2e:a11y` |
| Visual regression | `pnpm test:e2e:visual` |
| Dependency and secret safety | `pnpm audit:dependency-security` |

## Architecture and financial-safety gates

Run `pnpm check:architecture` when a change affects controllers, repositories, transactions, permissions, or workspace boundaries.

Run the focused finance, authorization, migration, storage, or provider audit documented by the owning module when those areas change. Do not replace a focused safety gate with a generic build.

## Historical closure commands

Commands named `audit:r*-closure`, `audit:p*-closure`, or tied to a completed R/P evidence package are retained for reproducibility. They are not the default development entry point and should not be copied into every workflow.

Use them only when:

- regenerating or validating the corresponding retained evidence;
- changing the contract that the closure audit protects;
- investigating a regression in that completed workstream.

## Environment-specific verification

Commands under `verify:p6:*`, deployed KYC tests, strict production smoke, migration verification, rollback checks, and provider UAT require approved environment access and credentials. A repository-only run must not be reported as production verification.

## Selection rule

1. Start with the affected workspace or domain.
2. Run `pnpm check:quick` for ordinary repository changes.
3. Run `pnpm check:full` for broad changes or before release integration.
4. Add browser, database, finance, security, or P6 checks only when their prerequisites and scope apply.
5. Record blocked checks explicitly instead of silently treating them as passed.
