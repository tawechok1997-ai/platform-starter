# R-009 Repository Type Boundary Evidence

Status: ENFORCED, awaiting latest quality-workflow confirmation

## Scope

This evidence covers the R-009 checklist item: repository and application contracts must not expose Prisma-specific imports, services, transaction clients, generated model types, JSON types, or Decimal types.

## Guard

- Audit: `tools/audit-r009-repository-boundaries.mjs`
- Strict command: `pnpm audit:r9-repository-boundaries:strict`
- Scanned scope: TypeScript files under domain/application folders plus files named `repository.ts` or `port.ts`
- Forbidden boundary dependencies:
  - `@prisma/client`
  - `PrismaService`
  - `Prisma.*` generated or runtime-specific types

## Closure rule

This checklist item may be marked DONE only when the strict command executes in the required quality workflow and reports zero violations. Any future violation must fail CI.

## Safety

The guard changes no runtime query, transaction, schema, migration, production data, permission, provider setting, or financial behavior.
