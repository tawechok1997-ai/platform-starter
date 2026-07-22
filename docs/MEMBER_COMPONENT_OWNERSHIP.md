# Member component and style ownership

Updated: 2026-07-22
Scope: `apps/web-member` and shared frontend contracts used by Member

## Purpose

Define one ownership model for shared React components, semantic tokens, global CSS, feature CSS and route-specific presentation. This prevents new duplicate components and makes route-level refactors independently reviewable.

## Ownership matrix

| Area | Canonical owner | Allowed responsibility | Must not own |
|---|---|---|---|
| Semantic colors, spacing, radius, shadow, typography, motion, breakpoints and z-index | `packages/design-tokens` | Cross-app tokens and primitive CSS contracts | Member route content or API state |
| Member shell and navigation | Member shell/navigation components and Member-wide CSS | Sidebar, drawer, topbar, bottom navigation, safe areas and active state | Route-specific business flows |
| Shared Member React primitives | Member shared component directory | Buttons, cards, notices, empty/error/loading states and accessible interaction wrappers | Route API orchestration |
| Finance shared UI | Finance shared components/contracts | Amount display, balance cards, status badges, steps, action bars, confirmation and timelines | Provider-specific or route-specific API assumptions |
| Feature CSS | Feature or route-family CSS | Presentation unique to a bounded feature | Global token definitions or unrelated route overrides |
| Route components | Route/feature owner | Data orchestration, page composition and route-specific state | Reimplementation of shared controls or shell navigation |
| Public settings/CMS | Settings and CMS contracts | Runtime content, approved brand values and feature visibility | Arbitrary executable CSS, unsafe URLs or component ownership |

## Canonical component families

### Navigation

One canonical information architecture must feed desktop sidebar, Member drawer, mobile bottom navigation, Home quick actions and category navigation. Surface-specific rendering is allowed; separate labels, aliases, permissions and feature-flag rules are not.

### Form controls

Input, Select, TextArea, Checkbox, Radio, OTP and Field wrappers must share label, description, error, disabled, loading, focus and accessibility behavior. Route-specific validation remains outside visual primitives.

### Feedback states

Notice, Alert, Toast, Skeleton, Empty, Error, Success and offline/reconnected feedback must use shared semantics and live-region behavior.

### Finance states

Deposit, Withdrawal, Wallet, Bonus and transaction status presentation must consume one typed state mapping. Route code may choose available actions but must not invent conflicting Thai labels, tones or icons.

### Upload and secure media

File input, validation, preview, progress, cancel, retry, secure download, expired link and revoked file feedback must share one contract across Deposit, KYC and Support.

## Inline-style policy

Inline style is permitted only for validated dynamic values, such as a bounded progress percentage or approved runtime CSS custom property. Static layout, spacing, color, typography, radius, visibility and alignment belong in semantic classes or tokens.

New selectors using `[style*="..."]` are prohibited. Existing selectors must be replaced when their owning route is edited.

## New component review

A new shared or route component must answer:

1. Which canonical family owns this behavior?
2. Why composition or props cannot extend the existing component?
3. What duplicate implementation will be removed?
4. Which unit/browser/visual evidence covers the change?
5. How is the change rolled back independently?

## Migration order

1. Canonical menu and route aliases
2. Shared form and feedback primitives
3. Finance status mapping and shared finance controls
4. Upload/media contract
5. Carousel/rail behavior
6. Route-family inline-style migration
7. Remaining duplicate removal

## Enforcement

- Reviewers reject new duplicate control/state implementations without an ownership note.
- Each migration PR remains bounded to one component family or route family.
- Money, identity and session changes require contract tests and rollback notes.
