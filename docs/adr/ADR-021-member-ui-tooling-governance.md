# ADR-021: Member UI tooling governance

Date: 2026-07-22
Status: Accepted
Scope: `apps/web-member`

## Context

The Member application already uses Next.js, React, TypeScript, shared CSS contracts, Playwright, JSX accessibility linting and axe browser scans. The remaining UX/UI work includes forms, server state, motion, icons, uploads, carousels, long lists and reusable primitives. Adding libraries before ownership and migration boundaries are defined would create parallel systems and increase bundle, testing and rollback cost.

## Decision

Keep the existing React, shared CSS contract and Playwright stack as the authoritative foundation. Do not add a new design system, form layer, server-state layer, motion runtime or icon family without a separate ADR containing measured need, bundle impact, migration scope, owner, rollout and rollback.

### React Hook Form and Zod

Deferred. Re-evaluate after form inventory identifies repeated field adapters, validation schemas and error mapping that can replace existing implementations rather than coexist with them.

### TanStack Query

Deferred. Re-evaluate after shared stale-time, retry, cancellation, polling, invalidation, optimistic rollback and auth-refresh boundaries are approved.

### Motion

Deferred. CSS remains the default. Re-evaluate only when a required mount/unmount or gesture interaction cannot meet accessibility and performance requirements with CSS.

### Lucide

Deferred. The current `MemberIcon` and CMS/settings behavior remain authoritative until icon inventory, migration cost and runtime icon-key compatibility are documented.

### Carousel, upload, compression, drawer, virtualization and table libraries

Evaluate individually only after a measured route-level gap exists. No package is approved by category alone.

### Additional design systems

Tailwind, shadcn, Radix, MUI, Ant Design and equivalent design systems are not approved while shared CSS contracts remain authoritative.

### Testing tools

Playwright remains the E2E, browser-quality, accessibility and visual standard. Vitest, Testing Library and MSW may be piloted only in a bounded shared Client Component PR with an explicit comparison against the existing Node test runner and Playwright fixtures.

## Acceptance requirements for a future dependency ADR

Every accepted runtime dependency must record:

1. Measured problem and affected routes
2. Alternatives considered, including no dependency
3. Production bundle and build impact
4. Migration scope and removal of replaced code
5. Ownership and maintenance expectations
6. Accessibility and browser support impact
7. Test strategy
8. Feature-flag or staged rollout plan where relevant
9. Rollback procedure

## Consequences

- Prevents duplicate state, form, icon and design systems.
- Keeps current bundles and runtime behavior unchanged.
- Requires more evidence before convenience-driven package adoption.
- Allows bounded pilots without committing the whole Member application.

## Rollback

Supersede this ADR with a later accepted ADR. No runtime rollback is required because this decision adds no dependency or production code.
