# R-009 Controller Persistence Closure

Status: ✅ DONE

Closed: 2026-07-15

## Closed subtasks

- [x] ตรวจ controller ที่เรียก Prisma โดยตรงทั้งหมด
- [x] ย้าย Prisma access ออกจาก controller

## Evidence

- `tools/audit-r009-controller-prisma.mjs` scans every `*.controller.ts` under `apps/api/src`.
- The scan detects Prisma client imports, `PrismaService`, direct `prisma.*` access, `$transaction`, `$queryRaw`, and `$executeRaw` usage.
- `audit:r9-controller-prisma:strict` fails when any controller contains direct persistence access.
- `.github/workflows/r006-quality.yml` runs the strict guard on pull requests and pushes to `main`.
- Repository code search on 2026-07-15 found no controller results for `PrismaService`, `this.prisma`, or `@prisma/client`.
- `tools/audit-r009-controller-closure.mjs` verifies zero offenders and confirms the strict CI wiring remains present.

## Boundary decision

Controllers may validate transport input, resolve the authenticated actor, and delegate to application services. Controllers may not import Prisma types or services, open transactions, execute raw SQL, or access database models directly.

## Regression rule

Any future direct Prisma access introduced into a controller fails the R-009 strict audit and the controller closure audit in CI.
