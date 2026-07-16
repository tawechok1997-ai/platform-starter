# Member UI Product Brief

Updated: 2026-07-16  
Scope: Member only. Admin is out of scope for the current implementation phase.

Typography source of truth: [`MEMBER_TYPOGRAPHY_CONTRACT.md`](./MEMBER_TYPOGRAPHY_CONTRACT.md).

This brief is the practical product target for the Member redesign. It combines the supplied reference boards with the current product requirements: entertainment quality with financial clarity, premium without clutter, useful motion without visual noise.

## Product feeling

- [ ] Easy first: the user understands the next useful action immediately.
- [ ] Premium: consistent typography, imagery, spacing, iconography, and restrained surfaces.
- [ ] Alive: hero, cards, image loading, and status feedback have purposeful motion.
- [ ] Calm: no glow on every element, no excessive gradients, no flashing countdowns, no decorative noise.
- [ ] Trustworthy: balance, transaction status, privacy, and errors are readable before promotional content competes for attention.
- [ ] Mobile-first: thumb-reachable actions, safe areas, keyboard-safe forms, and no horizontal overflow.

## Page shell and hierarchy

### Desktop

- Sidebar: 240–260px expanded, 72–80px collapsed.
- Topbar: 64–72px high; page title/breadcrumb left, search/notification/compact balance/avatar right.
- Content max-width: 1440px; page padding 24–32px.
- Main order: announcement (when relevant) → promotion hero → wallet summary/quick actions → games/service content → recent activity → support/footer.
- Sidebar is fixed to the shell; content scroll does not move the brand/navigation out of context.

### Mobile

- Page padding: 16px; section gap 28–36px; card gap 12px; card padding 16px.
- Topbar stays compact and readable; search opens an overlay instead of consuming permanent width.
- Bottom navigation has five primary destinations: `หน้าแรก`, `เกม`, `ฝากเงิน`, `โปรโมชัน`, `โปรไฟล์`.
- `ฝากเงิน` may be visually emphasized slightly, but must remain a normal touch target—not a floating neon orb.
- Secondary destinations (`กระเป๋าเงิน/รายการ`, `ถอนเงิน`, `โบนัส`, `แจ้งเตือน`, `ช่วยเหลือ`, `บัญชีธนาคาร`, `ตัวแทน`, `คู่มือ`, `ติดต่อเรา`) live in More/Drawer or the relevant page context.
- Bottom navigation never overlaps a sticky action, support button, keyboard, or safe-area inset.

## Canonical Member navigation

The source of truth is `UI_MENU_INFORMATION_ARCHITECTURE.md`; this is the visual priority for the current phase.

1. หน้าแรก — `/`
2. เกม — `/games`
3. ฝากเงิน — `/deposit`
4. โปรโมชัน — `/promotions`
5. โปรไฟล์ — `/profile`

Financial details remain reachable without competing with the entertainment navigation:

- กระเป๋าเงิน/รายการ — `/transactions`
- ถอนเงิน — `/withdraw`
- โบนัส — `/bonus`
- บัญชีธนาคาร — `/bank-accounts`
- แจ้งเตือน — `/notifications`
- ช่วยเหลือ — `/support`

- [ ] Derive Desktop, Mobile, Drawer, Home quick actions, and category tabs from one menu model.
- [ ] Use one title per route: do not mix `ฝาก`/`ฝากเงิน`, `โปร`/`โปรโมชัน`, or `สถานะรายการ`/`ประวัติ`.
- [ ] Keep the active menu state correct for nested routes, detail pages, query filters, feature flags, and session expiry.

## Home composition

The Home page is not an Admin KPI dashboard. It should prioritize the member’s next action and current balance.

1. Announcement bar (only when there is a relevant announcement)
2. One promotion hero
3. Wallet summary + quick actions
4. Recently played / recently used service
5. Game categories and game grid
6. Tournament card (when active)
7. Secondary promotion cards
8. Recent transactions (maximum five preview items)
9. Support/help card

- [ ] Never stack multiple hero/promotion banners before the wallet summary.
- [ ] Never render more than one primary CTA for the same destination in the same viewport.
- [ ] Do not show eight KPI tiles; use one readable wallet summary with at most four quick actions.
- [ ] Use partial failure per section so games or promotions cannot hide balance/finance content.

## Component and layout rules

### Promotion hero

- Desktop: 16:5–16:6, approximately 300–380px high, radius 20–24px.
- Tablet: approximately 240–300px high.
- Mobile: 16:9, approximately 180–220px high, radius 16px.
- One image, one directional text overlay, one primary CTA, optional secondary CTA, and indicators centered at the bottom.
- Use a dark gradient only behind text; never cover the entire image with opaque black.
- Preserve the image ratio; use stable dimensions and fallback media to prevent layout shift.
- Carousel: 300–450ms transition, 5–7s autoplay only when allowed, pause on hover/focus, swipe on mobile, preload next image, and stop autoplay for reduced motion.

### Wallet summary

- One primary balance card with available/locked/bonus context, masking affordance, and last-updated behavior.
- Quick actions maximum four: ฝากเงิน (primary), ถอนเงิน (secondary), ประวัติ (ghost), รับโบนัส (soft accent).
- Desktop may place summary and actions side-by-side; mobile uses a stacked card plus four-column action grid.
- Money uses one formatter and tabular figures; decimal/currency treatment is consistent everywhere.

### Games and recently played

- Category tabs: ทั้งหมด, สล็อต, คาสิโน, กีฬา, เกมใหม่, แนะนำ; horizontal scroll on mobile.
- Game grid: 5–6 columns desktop, 3–4 tablet, 2 mobile; gap 12–20px; radius 14–18px.
- Game card: image, provider badge only when meaningful, title, status/popularity, and play action.
- Hover: image scale about 1.03, subtle overlay, play action reveal, lift 1–2px; never scale enough to clip or shift layout.
- Recently played is a horizontal rail with thumbnail, title, last-played time, and continue action.

### Tournament and promotion cards

- Tournament is visually clear but less dominant than the hero; preserve the approved image size and ratio.
- Show time remaining, reward pool, rank/participation, and one CTA. Countdown must not flash or pulse.
- Secondary promotion cards show image, type, title, short condition, expiry, and CTA. Full terms belong on detail/modal, not inside a dense card.

### Transactions, notifications, and support

- Recent transactions show five items maximum: type, date, amount, status.
- Money direction uses signed formatting; red means failure/problem, not a normal withdrawal.
- Notifications use four categories: สำคัญ, การเงิน, โปรโมชั่น, ระบบ. Unread uses a dot or soft background, not a glow frame.
- Support card is visible near the bottom; it must not cover bottom navigation or sticky finance actions.

## Copy and density

- Page title: normally ≤ 32 Thai characters.
- Section title: 1 short noun/verb.
- Card title: ≤ 48 characters.
- Description: one or two lines; explain what to do next.
- Button: 1–4 words and action-first.
- Announcement: one short sentence, maximum 2–3 rotating items.
- Status: short label; details belong in a timeline/detail view.
- [ ] Remove repeated marketing claims and duplicate security/support blocks.

## Member visual system

- [ ] Use one approved Member accent token from branding/site settings. The LUX88 reference uses gold; do not mix gold and purple accent systems on the same surface.
- [ ] Keep background/surface/text/border/status tokens centralized under the existing design-token contract.
- [ ] Use one Thai/Latin font hierarchy: hero 32–44px, page 28–32px, section 20–24px, card 16–18px, body 14–16px, label 13–14px, caption 12px.
- [ ] Apply the Member typography contract by role: LINE Seed Sans TH for Thai/UI, Inter for numeric and English-first data, and Mono only for references.
- [ ] Keep radii consistent: button/input 12px, small card 14px, normal card 16px, hero 22px, modal 22–24px, pill 999px.
- [ ] Use one outline icon set and remove emoji/glyph substitutes from production navigation and actions.

## Motion and loading

- [ ] Follow `UI_MOTION_ANIMATION_CONTRACT.md` and existing tokens: 80ms instant, 160ms fast, 240ms normal, 360ms slow.
- [ ] Use opacity/transform for page/card entry, Drawer/Modal, tabs, and notices; do not replay every card animation on every scroll.
- [ ] Use skeletons with the real shape/aspect ratio for hero, wallet, game grid, and transaction rows.
- [ ] Image loading fades in over approximately 180–250ms with blur/placeholder and safe fallback.
- [ ] Every loading, empty, error, disabled, offline, missing-image, long-text, and reduced-motion state is designed—not left to browser defaults.

## Build order

1. Foundation: tokens, typography, shell, sidebar, topbar, bottom nav, icon map, formatters.
2. Home: announcement, one hero, wallet summary, quick actions, recently played, game lobby.
3. Secondary content: tournament, promotions, recent transactions, notifications preview, support card.
4. States: loading, empty, error, partial, offline, stale, disabled, long copy, missing image, session expiry.
5. Motion/accessibility: focus, keyboard, reduced motion, responsive transitions, visual evidence.
6. Cleanup: remove duplicates, inline-style debt, brittle selectors, unused variants, and unnecessary dependencies.

## Acceptance

- [ ] The first viewport answers what the user can do, how much money is available, and where the primary action is.
- [ ] Desktop and Mobile use the same information priority with intentional layout changes.
- [ ] Cards, buttons, statuses, icons, copy, and motion are consistent across Home, Games, Promotions, Wallet, Transactions, and Finance flows.
- [ ] No section is present only because there was empty space to fill.
- [ ] A visual mismatch ledger, screenshot, accessibility result, and interaction proof are retained before the route is marked complete.
