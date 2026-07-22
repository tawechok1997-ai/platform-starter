# Member foundation audit — 2026-07-22

Scope: `apps/web-member` and shared frontend contracts consumed by Member.

## Objectives

This audit records the remaining foundation work before route-level visual polish continues. It exists to prevent duplicate components, duplicate state logic, uncontrolled inline styles, and unreviewed runtime dependencies.

## Shared component inventory categories

The following component families must be treated as canonical inventories during implementation and review:

- Navigation: desktop sidebar, Member drawer, mobile bottom navigation, quick actions, category rail
- Controls: button, link-button, input, select, textarea, checkbox, radio, OTP and field wrappers
- Feedback: notice, alert, toast, skeleton, empty, error, success and loading states
- Finance: balance card, amount input, status badge, step indicator, action bar, confirmation dialog and timeline
- Data display: card, badge, tabs, pagination, filter bar, transaction row and information row
- Media: image fallback, game card, promotion card, file preview, carousel and rail controls
- Upload: file input, validation, progress, cancel, retry and secure-download feedback

## Duplication review rules

1. Route code must reuse a canonical component when behavior and semantics match.
2. A new variant must document why props or composition cannot cover the requirement.
3. Visual-only duplication must be solved with semantic classes or tokens, not another component tree.
4. Finance, identity and session state components must preserve API error semantics and idempotency behavior.
5. Desktop and mobile navigation must consume one canonical information architecture model.

## Inline-style migration policy

- Inline styles are allowed only for truly dynamic values that cannot be represented by semantic classes or CSS custom properties.
- Static spacing, color, radius, typography, layout, visibility and alignment values must migrate to shared tokens/classes.
- Selectors coupled to `[style*="..."]` are prohibited in new work and must be replaced with semantic classes during route edits.
- Each migration batch must include visual regression evidence for affected routes.

## Style ownership

- `packages/design-tokens`: shared semantic tokens and cross-app primitives
- `apps/web-member/app/*.css`: Member-wide shell, responsive and route-family contracts
- Route/component CSS: feature-specific presentation only
- React components: semantics, state and interaction behavior
- CMS/public settings: runtime content and approved brand values, never arbitrary CSS injection

## Dependency decisions

No new Member runtime dependency is approved by this audit.

- React Hook Form / Zod: defer until a complete form inventory proves shared adapters replace duplicated validation.
- TanStack Query: defer until query ownership, stale-time, retry, cancellation and auth-refresh boundaries are approved.
- Motion: defer until CSS transitions fail a measured interaction requirement.
- Lucide: defer until icon inventory, CMS icon behavior and migration cost are recorded.
- Carousel, upload, image-compression, drawer, virtualization and table libraries: evaluate only against a measured gap.
- Tailwind, shadcn, Radix, MUI, Ant Design or another design system: do not add while shared CSS contracts remain authoritative.

## Review checklist

- [ ] Inventory concrete component files and owners
- [ ] Record duplicate variants with replacement targets
- [ ] Produce inline-style and `[style*]` occurrence reports
- [ ] Migrate one bounded route family per PR
- [ ] Retain unit, typecheck, build and visual evidence

## Rollback

This document changes governance only. It adds no runtime dependency and no production behavior. Any implementation PR based on this audit must remain independently revertible.
