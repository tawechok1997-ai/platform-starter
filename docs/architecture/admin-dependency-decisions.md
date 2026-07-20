# Admin Dependency Decisions

Updated: 2026-07-21  
Status: Accepted for Batch 1  
Scope: `apps/web-admin`

## Decision summary

For Admin Modernization Batch 1, do **not** add TanStack Query, React Hook Form, Zod, or TanStack Table.

This is a deliberate defer decision, not a permanent ban. The current repository evidence does not yet justify the runtime cost, migration surface, duplicate abstractions, or rollback burden.

## Evidence reviewed

- `docs/architecture/admin-request-form-data-view-inventory.md`
- `docs/architecture/admin-server-state-policy.md`
- `docs/architecture/admin-form-mutation-safety.md`
- `docs/architecture/admin-data-view-contract.md`
- representative routes:
  - `apps/web-admin/app/(admin)/topups/page.tsx`
  - `apps/web-admin/app/(admin)/withdrawals/page.tsx`
  - `apps/web-admin/app/(admin)/members/page.tsx`

## ADR-1: TanStack Query

### Decision

Deferred.

### Rationale

The inspected routes do repeat request, loading, error and refresh orchestration, so a shared request-state abstraction is justified. However, the repository has not yet recorded a bundle baseline, route-chunk impact, query-client ownership model, cache-clearing behavior across identity changes, or an incremental migration plan.

Batch 1 should first introduce a small internal request-state adapter with cancellation and central error/session handling. TanStack Query may be reconsidered only after that adapter exposes measured limits.

### Reconsider when

- bundle baseline exists;
- at least three route families require the same cache, invalidation and polling behavior;
- central session/permission cache clearing is implemented and tested;
- migration and rollback can be performed domain by domain.

## ADR-2: React Hook Form and Zod

### Decision

Deferred.

### Rationale

The inspected Admin forms are mostly queue actions, search/filter controls, reason fields and single-step confirmation flows. They use imperative validation and do have consistency gaps, but the inventory did not find nested schemas, reusable field arrays, complex conditional branches, or cross-route schema composition that would currently justify two new runtime dependencies.

Batch 1 should standardize field errors, focus-first-error, validation summaries, dirty-state handling and duplicate-submit protection using the existing Admin primitives. React Hook Form and Zod may be reconsidered when real form complexity exceeds that model.

### Reconsider when

- repeated nested forms or dynamic field arrays exist;
- schemas are reused across multiple Admin routes;
- current form state causes measurable rerender or testability problems;
- bundle impact and adapter design are recorded.

## ADR-3: TanStack Table

### Decision

Deferred.

### Rationale

The representative Admin surfaces are card-based operational queues rather than column-heavy generic tables. Sorting, selection, column visibility and bulk behavior are not yet broadly implemented. Adding a table framework now would create an abstraction before the repository has enough table-shaped work to justify it.

Batch 1 should keep the existing Admin data-view contract, normalize pagination/filter semantics, and measure the remaining dense table routes. TanStack Table may be reconsidered only for route families that genuinely need reusable column, sorting, selection and virtualization behavior.

### Reconsider when

- several column-heavy routes share sorting, filtering and selection behavior;
- server-side pagination and stable column definitions are documented;
- mobile fallback and accessibility adapters are designed;
- bundle and long-table performance budgets are available.

## Safety and rollback

- No package manifest or lockfile changes.
- No runtime behavior changes.
- No API, Prisma, Member, finance or provider changes.
- Reversal requires only a future ADR that records evidence, dependency impact, migration order, tests and rollback path.

## Consequences for Batch 1

1. New Admin work must use the existing primitives and contracts.
2. No page may introduce a competing request, form or table framework locally.
3. Shared internal adapters must remain small, dependency-free and independently revertible.
4. Dependency decisions reopen only after bundle and browser evidence exists.
