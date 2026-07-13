# Member UX/UI Tooling Worklist

Updated: 2026-07-14  
Scope: `apps/web-member` only  
Source of truth for Member UX/UI work: this file

> This worklist is aligned with the current repository. Existing foundations are Next.js 14, React 18, TypeScript, custom Member primitives, global CSS/custom properties, `packages/api-client`, and Playwright. Tools not installed in the repository are planned decisions, not completed capabilities.

## Status

- ✅ Done and verified
- 🧪 Implemented, regression evidence still required
- 🚧 In progress
- ⏳ Planned
- ⛔ Blocked
- 🧊 Deferred

## Member Definition of Done

- Mobile-first and usable at 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900.
- Uses the real API, authentication, settings, finance, KYC, notifications, support, and provider behavior.
- Handles loading, empty, error, offline, stale, permission, maintenance, success, retry, and session-expired states.
- Primary action remains reachable above the safe area and mobile keyboard.
- Keyboard, visible focus, 200% zoom, screen-reader labels, and reduced motion work.
- Long Thai text, money, IDs, filenames, and missing media do not overflow.
- Mutations prevent double submit and preserve idempotency/error semantics.
- Relevant Member build, Playwright, accessibility, and visual checks pass.

# M0: Current foundation and debt inventory

## MEMBER-FOUNDATION-001 Current tooling

- [x] Next.js 14, React 18, TypeScript
- [x] Custom Member UI primitives
- [x] CSS custom properties, responsive CSS, animation, transitions
- [x] `prefers-reduced-motion`
- [x] Shared `packages/api-client`
- [x] Playwright smoke and visual commands
- [ ] Inventory every Member/Public/Auth route and page owner
- [ ] Inventory shared components and duplicate variants
- [ ] Inventory inline-style debt in auth, finance, KYC, games, profile, notifications, and support
- [ ] Replace selectors coupled to `[style*="..."]` with semantic classes
- [ ] Define ownership for global CSS, component styles, tokens, and layout utilities

## MEMBER-FOUNDATION-002 Tooling decisions

- [ ] Evaluate and add `react-hook-form` plus `zod` for forms
- [ ] Evaluate and add `@tanstack/react-query` for server state
- [ ] Evaluate and add `motion` for mount/unmount and state transitions
- [ ] Evaluate and add `@axe-core/playwright` and JSX accessibility lint rules
- [ ] Evaluate and add `lucide-react` as the single icon library
- [ ] Evaluate carousel, upload, image-compression, drawer, virtualization, and table libraries only for routes that require them
- [ ] Record an ADR for each accepted dependency
- [ ] Record bundle impact, migration scope, owner, and rollback plan
- [ ] Do not add shadcn, Radix, Tailwind, GSAP, Rive, Lottie, MUI, Ant Design, or another state/form layer without an approved ADR and demonstrated need

# M1: Shared Member systems

## MEMBER-SYSTEM-001 Design tokens and primitives

- [ ] Consolidate color, spacing, radius, shadow, typography, motion, breakpoint, and z-index tokens
- [ ] Consolidate Button, Input, Select, TextArea, Checkbox, Radio, OTP, and Field primitives
- [ ] Consolidate Card, BalanceCard, StatusBadge, Notice, Toast, Skeleton, Empty, Error, and Success states
- [ ] Consolidate Modal, Drawer, BottomSheet, ConfirmDialog, Tabs, Stepper, Timeline, Pagination, and StickyActionBar
- [ ] Create FileUpload, FilePreview, Progress, and secure-download feedback primitives
- [ ] Create responsive carousel/rail primitives with swipe and keyboard support
- [ ] Remove duplicate Member primitive implementations
- [ ] Add component tests for critical primitives

## MEMBER-SYSTEM-002 Motion and interaction

- [ ] Create motion duration, easing, distance, and reduced-motion tokens
- [ ] Keep CSS for hover, focus, press, skeleton, shimmer, and simple drawer transitions
- [ ] Use `motion` only for modal, toast, list, step, upload, KYC, finance, and carousel enter/exit
- [ ] Avoid bounce/pulse on money, security, KYC rejection, or destructive actions
- [ ] Prevent layout shift during content and status transitions
- [ ] Restore focus after modal/drawer close
- [ ] Test reduced motion and keyboard-only interactions
- [ ] Verify animation performance on iPhone-class mobile viewports

## MEMBER-SYSTEM-003 Forms and validation

- [ ] Create shared RHF/Zod field adapters if the tooling decision is approved
- [ ] Create server-error-code mapping without parsing raw messages
- [ ] Create focus-first-error and validation-summary behavior
- [ ] Create dirty-state and unsaved-change behavior
- [ ] Create password strength and OTP countdown patterns
- [ ] Create upload validation, preview, progress, cancel, and retry patterns
- [ ] Prevent duplicate submit and show mutation progress
- [ ] Add form component and browser regression tests

## MEMBER-SYSTEM-004 Server state

- [ ] Create a Member QueryClient and auth-aware provider if TanStack Query is approved
- [ ] Define query-key factories by domain
- [ ] Define stale time, retry, cancellation, invalidation, and polling policies
- [ ] Handle offline, session expiry, and auth refresh centrally
- [ ] Handle optimistic rollback and version conflicts centrally
- [ ] Migrate page-level `useEffect + useState + fetch` orchestration by domain

# M2: Public/Auth worklist

## MEMBER-AUTH-001 Login, register, and password recovery

- [ ] Autofill, password manager, show/hide password, Caps Lock, and keyboard behavior
- [ ] Inline validation, focus-first-error, loading, lockout, anti-bot, and server-error states
- [ ] Registration step progress, contact verification, terms, and success states
- [ ] Forgot/reset password expired-token, used-token, retry, and session-revoke behavior
- [ ] Restore intended destination after login
- [ ] Six-viewport, 200% zoom, long Thai text, and accessibility regression

## MEMBER-AUTH-002 Public content and maintenance

- [ ] Legal, privacy, contact, maintenance, and session-expired layouts
- [ ] CMS content, broken media, long content, and fallback states
- [ ] Safe-area and mobile keyboard behavior
- [ ] Visual and accessibility regression

# M3: Member route worklist

## MEMBER-ROUTE-001 Home and navigation

- [ ] Bottom navigation, drawer, active route, deep link, and scroll restoration
- [ ] Wallet summary, quick actions, promotions, announcements, and recent activity hierarchy
- [ ] Loading skeleton, partial failure, stale timestamp, and retry
- [ ] Safe-area, landscape, and notification badge behavior
- [ ] Six-viewport visual regression

## MEMBER-ROUTE-002 Games lobby and launch

- [ ] Search debounce, provider/category filters, favorites, recent, and featured sections
- [ ] Stable media ratio, lazy loading, fallback, and no layout shift
- [ ] Swipe and keyboard carousel/rail behavior
- [ ] Empty, no-result, provider-down, maintenance, unavailable, and popup-blocked states
- [ ] Favorite optimistic rollback and duplicate-launch guard
- [ ] Large-catalog virtualization only if measured need is proven
- [ ] Authenticated browser and performance regression

## MEMBER-ROUTE-003 Deposit

- [ ] Amount min/max and currency formatting
- [ ] Destination account, copy feedback, expiry, and staged flow
- [ ] Slip upload type/size validation, preview, progress, cancel, and retry
- [ ] Review before submit and idempotent submit feedback
- [ ] Pending, approved, rejected, expired, retry, and duplicate states
- [ ] Mobile sticky action and keyboard overlap handling
- [ ] Responsive finance regression

## MEMBER-ROUTE-004 Withdrawal

- [ ] Available/locked balance, bank account, fee, net amount, and min/max validation
- [ ] Review, confirmation, duplicate-submit protection, and step-up/OTP states
- [ ] KYC-required, watchlist-blocked, session-expired, and insufficient-balance states
- [ ] Pending, processing, completed, rejected, cancel, and retry states
- [ ] Mobile sticky action and responsive regression

## MEMBER-ROUTE-005 Transactions, wallet, and bank accounts

- [ ] Transaction filters, URL/deep-link state, pagination, and detail view
- [ ] Mobile card list and optional desktop table only if product value is proven
- [ ] Before/after balance, fee, reference, status, and masked account details
- [ ] Wallet available, locked, bonus, total, and movement summaries
- [ ] Add/verify/default/disable bank account flows with re-auth/cooling policy
- [ ] Long-value, empty, error, and accessibility regression

## MEMBER-ROUTE-006 Profile and security

- [ ] Profile sections with independent save and dirty-state handling
- [ ] Phone/email verification, OTP resend, attempt exhaustion, and duplicate-value errors
- [ ] Password requirements, current-password errors, and success feedback
- [ ] Session list, current-device marker, revoke one, revoke all, and login history
- [ ] KYC status card and privacy-safe blocked states
- [ ] Keyboard, zoom, and authenticated regression

## MEMBER-ROUTE-007 KYC

- [ ] Split status summary, requirement checklist, upload form, document list, and submission panel
- [ ] File type/size validation, image/PDF preview, progress, cancel, and retry
- [ ] Prevent navigation during upload
- [ ] Submit confirmation and lock state after submit
- [ ] Pending, approved, rejected, expired, and resubmit flows
- [ ] Highlight rejected documents and review notes clearly
- [ ] Explain privacy, retention, and secure access
- [ ] Accessible file input and authenticated browser regression

## MEMBER-ROUTE-008 Promotions and bonus

- [ ] Available, claimed, active, expired, and ineligible states
- [ ] Eligibility, progress, expiry, terms summary, and claim confirmation
- [ ] Bonus balance, wager progress, expiry, and history
- [ ] Optimistic claim feedback and rollback
- [ ] Responsive and authenticated regression

## MEMBER-ROUTE-009 Notifications

- [ ] Grouped-by-date hierarchy and unread state
- [ ] Mark one/read all/archive feedback and rollback
- [ ] Deep-link target missing or expired state
- [ ] Preference update, channel unavailable, and session-expired states
- [ ] Pagination/infinite loading only if API behavior supports it
- [ ] Badge consistency and screen-reader announcements

## MEMBER-ROUTE-010 Support and FAQ

- [ ] FAQ search, category, no-result, and fallback behavior
- [ ] Ticket create validation, draft restore, preview, and submit feedback
- [ ] Attachment type/size/progress/cancel/retry states
- [ ] Conversation timeline, reply pending/sent/failed, polling reconnect, and closed/reopened states
- [ ] Linked finance/provider context
- [ ] Long-thread performance, mobile composer, and keyboard overlap

# M4: Accessibility and QA

## MEMBER-QA-001 Accessibility automation

- [ ] Add `@axe-core/playwright` if approved
- [ ] Fail CI on critical accessibility violations
- [ ] Verify headings, labels, ARIA live regions, dialogs, drawers, bottom sheets, file inputs, and icon-only buttons
- [ ] Verify keyboard navigation, focus trap, focus restore, zoom, reflow, contrast, and reduced motion

## MEMBER-QA-002 Visual and interaction evidence

- [ ] Add authenticated Member fixtures with non-production credentials
- [ ] Cover all six standard viewports
- [ ] Cover loading, empty, error, offline, stale, permission, maintenance, success, and session-expired states
- [ ] Store screenshot, trace, console, and network artifacts in CI
- [ ] Fail on browser console and unexpected network errors

# Execution order

1. MEMBER-FOUNDATION-001 debt inventory
2. MEMBER-SYSTEM-001 primitives and tokens
3. MEMBER-SYSTEM-003 forms plus MEMBER-SYSTEM-004 server state
4. Auth, Deposit, Withdrawal, Profile/Security, and KYC
5. Home/Games, Transactions/Wallet/Bank, Promotions, Notifications, Support
6. Motion polish after behavior and layout are stable
7. Accessibility, visual regression, bundle review, and cleanup

# Evidence log

- Commit/PR:
- Build:
- Visual artifact:
- Accessibility artifact:
- Bundle report:
- Remaining blockers:
