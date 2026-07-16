# UI Motion and Animation Contract

Updated: 2026-07-16  
Scope: Member UI motion, transitions, feedback, performance, and accessibility. Admin motion is documented for a future phase and must not be changed during the current Member phase.

Motion should clarify change, hierarchy, and feedback. It must never delay a money, identity, security, or navigation action, hide content, or make the interface feel like a game advertisement.

## Existing foundation

The repository already provides motion tokens in `packages/design-tokens/type-motion-layout.css`:

- `instant`: 80ms
- `fast`: 160ms
- `normal`: 240ms
- `slow`: 360ms
- standard easing: `cubic-bezier(0.2, 0, 0, 1)`
- enter easing: `cubic-bezier(0, 0, 0.2, 1)`
- exit easing: `cubic-bezier(0.4, 0, 1, 1)`

New animations must use these tokens or add a documented token first. Do not add one-off durations in route CSS.

## Motion principles

- [ ] Use motion to show cause and effect: pressed, opened, selected, loaded, completed, failed, or changed.
- [ ] Keep interactive feedback fast: hover/focus/press ≤ `fast`; do not animate a primary action longer than `normal`.
- [ ] Use opacity and transform for enter/exit where possible; avoid animating layout-heavy properties such as width, height, top, left, and box-shadow on large surfaces.
- [ ] Do not animate money values, security warnings, legal text, or critical error messages in a way that delays reading.
- [ ] Do not use continuous decorative motion except a restrained background accent; never pulse the entire page.
- [ ] Stagger only short lists and only when it improves scanning; cap the delay and disable it for long lists.
- [ ] Respect `prefers-reduced-motion: reduce`: remove travel, parallax, looping shimmer, and non-essential transforms while keeping state changes visible.
- [ ] Keep focus visible during and after transitions; focus must not move because of animation.
- [ ] Avoid motion that causes vestibular discomfort, scroll hijacking, flashing, or unexpected navigation.

## Approved motion map

| Surface              | Motion                                     | Token/limit                                         | Reduced-motion behavior   |
| -------------------- | ------------------------------------------ | --------------------------------------------------- | ------------------------- |
| Button/link          | color, border, opacity, subtle press scale | `fast`, scale ≤ 0.98                                | color/border only         |
| Input/focus          | border and focus ring                      | `fast`                                              | immediate ring            |
| Card hover           | translate Y ≤ 3px and border/shadow        | `fast`                                              | no translate; border only |
| Page content         | fade/short upward reveal                   | `normal`                                            | immediate render          |
| Drawer/sidebar       | translate on/off-canvas                    | `normal`                                            | immediate open/close      |
| Modal/confirm dialog | opacity + scale ≤ 0.98–1                   | `normal`                                            | opacity or immediate      |
| Tabs/filter          | active indicator and content opacity       | `fast`–`normal`                                     | immediate active state    |
| Skeleton             | low-contrast shimmer                       | `slow`, capped runtime                              | static muted placeholder  |
| Upload/progress      | determinate progress only                  | data-driven                                         | static progress value     |
| Success/error notice | enter + dismiss                            | `fast`–`normal`                                     | immediate notice          |
| Finance timeline     | state marker/highlight once                | `normal`                                            | static status and text    |
| Carousel/hero        | user-controlled slide transition           | `slow` max; no forced autoplay for critical content | first/selected slide only |
| Admin live alert     | one restrained highlight                   | `normal`, no infinite pulse                         | status color/icon only    |

## Route-specific requirements

### Member

- [ ] Auth: form focus, validation, password visibility, and submit feedback must be immediate and calm; no animated hero that competes with the form.
- [ ] Home: hero/card entrance may be staged once; quick-action and game cards use the same hover/press motion; promotion carousel must expose pause/previous/next and respect reduced motion.
- [ ] Deposit/Withdrawal: step changes use a short directional transition that preserves context; upload progress is real/determinate; confirmation and success states never depend on animation finishing.
- [ ] Transactions/Wallet: filter and list changes use stable layout with no jump; balance refresh may highlight the changed tile once, without counting or flashing large numbers.
- [ ] Games/Promotions: media may lazy-load with a static placeholder; no auto-playing video or aggressive flashing; card hover must not change layout or cover neighboring actions.
- [ ] Profile/Security/Support: drawers, accordions, and notices restore focus and remain usable with keyboard and mobile keyboard open.

### Admin

- [ ] Sidebar collapse and mobile drawer preserve active context and do not reflow the table unexpectedly.
- [ ] Dashboard widgets load independently; one failed widget must not animate or shift the whole dashboard.
- [ ] Queue/detail panels use a predictable enter/exit and preserve selected row, scroll position, and focus.
- [ ] Approve/reject/hold/override actions show immediate busy state, prevent duplicate submit, and show final status without relying on color or animation alone.
- [ ] Risk/incident alerts use a single highlight on arrival; infinite pulse is reserved for explicitly live, high-risk conditions and must be disabled by reduced motion.
- [ ] Charts animate only on first render or user filter change, provide text summaries, and never delay table data or export actions.

## Performance and QA gates

- [ ] Keep animation on compositor-friendly `transform` and `opacity` when possible; investigate layout shifts and long tasks.
- [ ] No animation may cause CLS, horizontal overflow, clipped focus, or touch-target movement.
- [ ] Test 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900.
- [ ] Test keyboard-only, screen reader announcement timing, touch, slow CPU, reduced motion, and 200% zoom.
- [ ] Capture before/after screenshots and a mismatch note for every new route animation.
- [ ] Inspect console and network for animation-triggered duplicate requests or repeated event listeners.
- [ ] Use `build-web-apps:react-best-practices` for render/re-render and bundle review; use `build-web-apps:frontend-testing-debugging` for rendered interaction and visual evidence.
- [ ] Add Motion/Framer Motion only after CSS tokens cannot satisfy a measured interaction; record ADR, bundle impact, owner, and rollback.

## Completion gate

- [ ] Every motion has a purpose, token, reduced-motion fallback, and owner.
- [ ] Every interactive state remains understandable when motion is disabled.
- [ ] No route introduces a competing animation language, custom duration, or infinite loop without an approved exception.
- [ ] Visual, accessibility, performance, and browser evidence is retained with the commit SHA.
