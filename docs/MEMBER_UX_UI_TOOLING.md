# Member UX/UI Tooling Worklist

Updated: **2026-07-16**  
Scope: `apps/web-member` only  
Source of truth for Member UX/UI work: this file

> Approved direction: premium dark navy/black Member experience with restrained gold accents, compact desktop information density, mobile-first navigation, clear finance states, and consistent responsive behavior. Reference boards supplied on 2026-07-16 define the target composition and visual hierarchy, but repository branding, content, permissions, API behavior, and accessibility requirements remain authoritative.

## Status

- ✅ Done and verified
- 🧪 Implemented, regression evidence still required
- 🚧 In progress
- ⏳ Planned
- ⛔ Blocked
- 🧊 Deferred

## Visual direction

### Theme

- [ ] Near-black/navy application background with layered dark surfaces
- [ ] Restrained gold accent for primary actions, active navigation, highlights, and key values
- [ ] Green for success, amber for pending/warning, red for failure/destructive actions
- [ ] Thin borders, subtle elevation, controlled gradients, and limited glow
- [ ] Compact desktop density without sacrificing readability
- [ ] Mobile layouts use full-width cards, bottom navigation, safe-area spacing, and reachable primary actions
- [ ] Use project branding and CMS assets; do not copy reference brand names or logos

### Typography and icons

- [ ] Define Thai/Latin typography scale for display, heading, body, label, caption, and numeric values
- [ ] Use tabular numerals for money, balances, references, and transaction values
- [ ] Evaluate `lucide-react` as the single icon library and record the decision in an ADR
- [ ] Icon-only controls require accessible labels and visible focus states

### Layout patterns

- [ ] Desktop application shell with sidebar, top bar, content grid, and optional contextual panel
- [ ] Mobile shell with compact header, bottom navigation, drawer/secondary navigation, and safe areas
- [ ] Auth desktop uses split promotional panel plus form; mobile uses a focused single-column form
- [ ] Finance flows use staged steps, review before submit, status timeline, and persistent action placement
- [ ] Cards, tables, filters, and rails must preserve hierarchy under long Thai content and narrow viewports

## Member Definition of Done

- [ ] Mobile-first and usable at 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900
- [ ] Uses real API, authentication, settings, finance, KYC, notifications, support, and provider behavior
- [ ] Handles loading, empty, error, offline, stale, permission, maintenance, success, retry, and session-expired states
- [ ] Primary action remains reachable above safe area and mobile keyboard
- [ ] Keyboard, visible focus, 200% zoom, screen-reader labels, and reduced motion work
- [ ] Long Thai text, money, IDs, filenames, and missing media do not overflow
- [ ] Mutations prevent double submit and preserve idempotency/error semantics
- [ ] Relevant Member build, unit/component tests, Playwright, accessibility, and visual checks pass

# M0: Foundation and debt inventory

## MEMBER-FOUNDATION-001 Current tooling and ownership

- [x] Next.js, React, TypeScript application foundation
- [x] Custom Member UI primitives
- [x] CSS custom properties, responsive CSS, animation, and transitions
- [x] `prefers-reduced-motion`
- [x] Shared `packages/api-client`
- [x] Playwright smoke and visual commands
- [ ] Inventory every Member/Public/Auth route and page owner
- [ ] Inventory shared components and duplicate variants
- [ ] Inventory inline-style debt in auth, finance, KYC, games, profile, notifications, and support
- [ ] Replace selectors coupled to `[style*="..."]` with semantic classes
- [ ] Define ownership for global CSS, component styles, tokens, and layout utilities
- [ ] Record route-to-reference-board mapping and acceptance criteria

## MEMBER-FOUNDATION-002 Tooling decisions

- [ ] Evaluate `react-hook-form` plus `zod` for forms
- [ ] Evaluate `@tanstack/react-query` for server state
- [ ] Evaluate `motion` only for state transitions requiring mount/unmount coordination
- [ ] Evaluate `@axe-core/playwright` and JSX accessibility lint rules
- [ ] Evaluate `lucide-react` as the single icon library
- [ ] Evaluate carousel, upload, image-compression, drawer, virtualization, and table libraries only where measured need exists
- [ ] Record an ADR for every accepted dependency
- [ ] Record bundle impact, migration scope, owner, and rollback plan
- [ ] Do not add another design system or state/form layer without approved ADR and demonstrated need

# M1: Shared Member systems

## MEMBER-SYSTEM-001 Tokens and primitives

- [ ] Consolidate semantic color tokens for background, surface, elevated surface, border, text, muted text, gold accent, success, warning, danger, and focus
- [ ] Consolidate spacing, radius, shadow, typography, motion, breakpoint, content width, and z-index tokens
- [ ] Consolidate Button, IconButton, Input, Select, TextArea, Checkbox, Radio, OTP, Field, and CurrencyInput
- [ ] Consolidate Card, BalanceCard, MetricCard, StatusBadge, Notice, Toast, Skeleton, Empty, Error, and Success states
- [ ] Consolidate Modal, Drawer, BottomSheet, ConfirmDialog, Tabs, Stepper, Timeline, Pagination, FilterBar, and StickyActionBar
- [ ] Create FileUpload, FilePreview, Progress, and secure-download feedback primitives
- [ ] Create responsive carousel/rail primitives with swipe and keyboard support
- [ ] Create desktop Sidebar, Topbar, mobile Header, and BottomNavigation primitives
- [ ] Remove duplicate Member primitive implementations
- [ ] Add component tests for critical primitives

## MEMBER-SYSTEM-002 Motion and interaction

- [ ] Create motion duration, easing, distance, and reduced-motion tokens
- [ ] Keep CSS for hover, focus, press, skeleton, shimmer, and simple drawer transitions
- [ ] Use motion library only for modal, toast, list, step, upload, KYC, finance, and carousel enter/exit where CSS is insufficient
- [ ] Avoid bounce/pulse on money, security, KYC rejection, or destructive actions
- [ ] Prevent layout shift during content and status transitions
- [ ] Restore focus after modal/drawer close
- [ ] Test reduced motion and keyboard-only interactions
- [ ] Verify animation performance on iPhone-class mobile viewports

## MEMBER-SYSTEM-003 Forms and validation

- [ ] Create shared field adapters if RHF/Zod is approved
- [ ] Create server-error-code mapping without parsing raw messages
- [ ] Create focus-first-error and validation-summary behavior
- [ ] Create dirty-state and unsaved-change behavior
- [ ] Create password strength, Caps Lock, show/hide password, and OTP countdown patterns
- [ ] Create upload validation, preview, progress, cancel, and retry patterns
- [ ] Prevent duplicate submit and show mutation progress
- [ ] Add form component and browser regression tests

## MEMBER-SYSTEM-004 Server state

- [ ] Create Member QueryClient and auth-aware provider if TanStack Query is approved
- [ ] Define query-key factories by domain
- [ ] Define stale time, retry, cancellation, invalidation, and polling policies
- [ ] Handle offline, session expiry, and auth refresh centrally
- [ ] Handle optimistic rollback and version conflicts centrally
- [ ] Migrate page-level `useEffect + useState + fetch` orchestration by domain

# M2: Public and authentication

## MEMBER-AUTH-001 Login

- [ ] Desktop split layout with promotional panel and focused login card
- [ ] Mobile single-column layout with compact branding and safe-area spacing
- [ ] Phone/username input, password manager support, show/hide password, Caps Lock warning, remember-me, and forgot-password entry
- [ ] Inline validation, focus-first-error, loading, lockout, anti-bot, and server-error states
- [ ] Restore intended destination after login
- [ ] Six-viewport, keyboard, 200% zoom, long Thai text, and accessibility regression

## MEMBER-AUTH-002 Registration

- [ ] Desktop split layout and mobile single-column layout matching Login
- [ ] Registration step progress, phone/contact verification, password strength, confirm password, terms, and success states
- [ ] Duplicate phone/username, OTP exhaustion, expired verification, retry, and server-error states
- [ ] Prevent duplicate registration submit
- [ ] Six-viewport and accessibility regression

## MEMBER-AUTH-003 Password recovery and public states

- [ ] Forgot/reset password expired-token, used-token, retry, and session-revoke behavior
- [ ] Legal, privacy, contact, maintenance, and session-expired layouts
- [ ] CMS content, broken media, long content, and fallback states
- [ ] Safe-area and mobile keyboard behavior
- [ ] Visual and accessibility regression

# M3: Application shell, Home, and Wallet

## MEMBER-ROUTE-001 Global shell and navigation

- [ ] Desktop sidebar with active route, grouped navigation, account summary, support entry, and logout
- [ ] Desktop top bar with balance visibility, notifications, locale, and account menu
- [ ] Mobile header, bottom navigation, drawer, notification badge, and account shortcuts
- [ ] Deep links, scroll restoration, route loading, permission state, and session expiry
- [ ] Safe-area and landscape behavior
- [ ] Six-viewport visual regression

## MEMBER-ROUTE-002 Home dashboard

- [ ] Wallet overview with available, locked, and bonus balances
- [ ] Quick actions for deposit, withdrawal, transfer/history, and bank accounts according to enabled features
- [ ] Promotion/bonus panel, announcements, recent transactions, and game recommendations
- [ ] Desktop dashboard grid and mobile stacked hierarchy matching approved reference direction
- [ ] Loading skeleton, partial failure, stale timestamp, retry, and missing-media fallback
- [ ] Six-viewport visual regression

## MEMBER-ROUTE-003 Wallet and transactions

- [ ] Wallet overview screen with totals, balance categories, limits, and latest movement
- [ ] Transaction filters for deposit, withdrawal, transfer, bonus, date range, and status
- [ ] URL/deep-link state, pagination, and transaction detail view
- [ ] Mobile card list and desktop table where useful
- [ ] Before/after balance, fee, reference, status, timeline, and masked account details
- [ ] Long-value, empty, error, loading, and accessibility regression

# M4: Finance flows

## MEMBER-ROUTE-004 Deposit

- [ ] Staged flow: select destination, enter amount, upload slip, review, submit, and status
- [ ] Destination account/QR details, copy feedback, reference, and expiry
- [ ] Amount min/max, presets, and currency formatting
- [ ] Slip type/size/content validation, preview, progress, cancel, and retry
- [ ] Review before submit and idempotent submit feedback
- [ ] Pending, reviewing, approved, rejected, expired, retry, and duplicate states
- [ ] Deposit history and status timeline
- [ ] Mobile sticky action and keyboard overlap handling
- [ ] Responsive finance regression

## MEMBER-ROUTE-005 Withdrawal

- [ ] Available/locked balance, bank account selection, presets, fee, net amount, and min/max validation
- [ ] Review, confirmation, duplicate-submit protection, and step-up/OTP states
- [ ] KYC-required, bonus-turnover-blocked, watchlist-blocked, session-expired, and insufficient-balance states
- [ ] Pending, processing, completed, rejected, cancelled, and retry states
- [ ] Withdrawal history and status timeline
- [ ] Mobile sticky action and responsive regression

## MEMBER-ROUTE-006 Bank accounts

- [ ] Desktop management list and mobile account cards
- [ ] Add, verify, edit, set default, and disable account flows
- [ ] Duplicate-bank detection, re-authentication, cooling policy, and verification states
- [ ] Mask sensitive values and clearly distinguish primary/verified/pending accounts
- [ ] Empty, error, long-value, and accessibility regression

# M5: Games, promotions, and bonus

## MEMBER-ROUTE-007 Games lobby and launch

- [ ] Desktop catalog and mobile lobby layouts matching approved reference hierarchy
- [ ] Search debounce, provider/category filters, favorites, recent, featured, and recommendation sections
- [ ] Stable media ratio, lazy loading, fallback, and no layout shift
- [ ] Swipe and keyboard carousel/rail behavior
- [ ] Empty, no-result, provider-down, maintenance, unavailable, and popup-blocked states
- [ ] Favorite optimistic rollback and duplicate-launch guard
- [ ] Large-catalog virtualization only if measured need is proven
- [ ] Authenticated browser and performance regression

## MEMBER-ROUTE-008 Promotions and bonus

- [ ] Promotion list, categories, details, and claim flow
- [ ] Available, claimed, active, expired, and ineligible states
- [ ] Eligibility, progress, expiry, terms summary, and claim confirmation
- [ ] Bonus balance, wager progress, expiry, and history
- [ ] Optimistic claim feedback and rollback
- [ ] Responsive and authenticated regression

# M6: Account, security, KYC, notifications, and support

## MEMBER-ROUTE-009 Profile and security

- [ ] Profile sections with independent save and dirty-state handling
- [ ] Phone/email verification, OTP resend, attempt exhaustion, and duplicate-value errors
- [ ] Password requirements, current-password errors, and success feedback
- [ ] 2FA setup/manage states
- [ ] Session list, current-device marker, revoke one, revoke all, and login history
- [ ] KYC status card and privacy-safe blocked states
- [ ] Keyboard, zoom, and authenticated regression

## MEMBER-ROUTE-010 KYC

- [ ] Status summary, requirement checklist, upload form, document list, and submission panel
- [ ] File type/size validation, image/PDF preview, progress, cancel, and retry
- [ ] Prevent navigation during upload
- [ ] Submit confirmation and lock state after submit
- [ ] Pending, approved, rejected, expired, and resubmit flows
- [ ] Highlight rejected documents and review notes clearly
- [ ] Explain privacy, retention, and secure access
- [ ] Accessible file input and authenticated browser regression

## MEMBER-ROUTE-011 Notifications

- [ ] Grouped-by-date hierarchy and unread state
- [ ] Mark one/read all/archive feedback and rollback
- [ ] Deep-link target missing or expired state
- [ ] Preference update, channel unavailable, and session-expired states
- [ ] Pagination/infinite loading only if API behavior supports it
- [ ] Badge consistency and screen-reader announcements

## MEMBER-ROUTE-012 Support and FAQ

- [ ] FAQ search, category, no-result, and fallback behavior
- [ ] Ticket create validation, draft restore, preview, and submit feedback
- [ ] Attachment type/size/progress/cancel/retry states
- [ ] Conversation timeline, reply pending/sent/failed, polling reconnect, and closed/reopened states
- [ ] Linked finance/provider context
- [ ] Long-thread performance, mobile composer, and keyboard overlap

# M7: Accessibility, evidence, and cleanup

## MEMBER-QA-001 Accessibility automation

- [ ] Add `@axe-core/playwright` if approved
- [ ] Fail CI on critical accessibility violations
- [ ] Verify headings, labels, ARIA live regions, dialogs, drawers, bottom sheets, file inputs, and icon-only buttons
- [ ] Verify keyboard navigation, focus trap, focus restore, zoom, reflow, contrast, and reduced motion

## MEMBER-QA-002 Visual and interaction evidence

- [ ] Add authenticated Member fixtures with non-production credentials
- [ ] Cover all six standard viewports
- [ ] Cover loading, empty, error, offline, stale, permission, maintenance, success, and session-expired states
- [ ] Store screenshot, trace, console, network, and bundle artifacts in CI
- [ ] Fail on browser console and unexpected network errors
- [ ] Compare implemented pages against approved visual-direction boards without copying external branding

# Execution order

1. `MEMBER-FOUNDATION-001` route/component/style inventory
2. `MEMBER-SYSTEM-001` visual tokens, shell primitives, fields, cards, status, modal/drawer, and navigation
3. Login, Registration, Password Recovery
4. Global Member shell and navigation
5. Home dashboard, Wallet, and Transactions
6. Deposit
7. Withdrawal and Bank Accounts
8. Profile, Security, and KYC
9. Games
10. Promotions and Bonus
11. Notifications
12. Support and FAQ
13. Motion polish after behavior and layout are stable
14. Accessibility, six-viewport visual regression, bundle review, and cleanup

# Current next actions

- [ ] Complete route/component/inline-style inventory
- [ ] Remove remaining `[style*="..."]` selector coupling
- [ ] Create approved dark/gold semantic token set
- [ ] Create shared desktop/mobile application shell primitives
- [ ] Rebuild Login first, then Registration, against the approved reference direction

# Evidence log

- Commit/PR:
- Build:
- Visual artifact:
- Accessibility artifact:
- Bundle report:
- Remaining blockers:
