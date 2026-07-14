# R-009 Controller Persistence Boundary Evidence

Status: ENFORCEMENT ENABLED / CI VERIFICATION PENDING

Date: 2026-07-15

## Requirement

Controllers must not import Prisma client types, inject or reference `PrismaService`, call `this.prisma.*`, own `$transaction(...)`, or execute raw SQL. Controllers delegate persistence to application services or repository-backed handlers.

## Enforcement

- Audit: `tools/audit-r009-controller-prisma.mjs`
- Human-readable command: `pnpm audit:r9-controller-prisma`
- Machine-readable command: `pnpm audit:r9-controller-prisma:json`
- Blocking command: `pnpm audit:r9-controller-prisma:strict`
- CI workflow: `.github/workflows/r006-quality.yml`

Commit `71ae3ff748aaa04d9c2fb05fffc2213284dd650a` enables the strict controller boundary in CI. Any direct Prisma-related controller usage now fails the quality workflow.

## Current repository inspection

Repository code search did not return controller matches for `PrismaService`, `this.prisma`, Prisma transactions, or raw query ownership. The strict audit remains the authoritative check because it walks every `*.controller.ts` file directly from the checked-out source tree rather than relying on the GitHub search index.

## Closure rule

The following two R-009 checklist items may be marked complete only after the strict quality workflow passes on a commit containing this enforcement:

- inventory every controller that calls Prisma directly;
- move Prisma access out of controllers.

Until that workflow result is verified, both items remain implementation-complete but evidence-pending.
