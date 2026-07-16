# Member Color and Icon Contract

Updated: 2026-07-16  
Scope: Member UI only. Admin visual tokens and icon decisions remain out of scope for the current phase.

The Member visual language is dark, premium, calm, modern, friendly, trusted, and entertainment-oriented. It must not become a neon casino surface: color is semantic, accent is scarce, and depth comes primarily from surface layers rather than glow.

## Color budget and hierarchy

- 75% canvas and surfaces
- 15% text and dividers
- 7% accent
- 3% semantic status and special emphasis

The Member accent is purple-blue. It is reserved for primary CTA, active navigation, selected tabs, focus rings, important links, progress, and a small number of special badges. It must not be used as a universal heading, border, icon, or card color.

## Canonical tokens

```css
:root {
  --member-canvas: #090b10;
  --member-page: #0d1017;
  --member-sidebar: #0b0e14;
  --member-surface-1: #121620;
  --member-surface-2: #171c27;
  --member-surface-3: #1d2330;
  --member-surface-4: #242b3a;
  --member-surface-hover: #202736;
  --member-surface-active: #293143;
  --member-surface-selected: rgba(124, 92, 255, 0.13);

  --member-text-primary: #f4f6fa;
  --member-text-secondary: #b1b8c5;
  --member-text-tertiary: #818a99;
  --member-text-disabled: #59616e;
  --member-text-inverse: #0c0e13;

  --member-border-subtle: rgba(255, 255, 255, 0.055);
  --member-border-default: rgba(255, 255, 255, 0.095);
  --member-border-strong: rgba(255, 255, 255, 0.16);

  --member-accent: #7c5cff;
  --member-accent-hover: #9278ff;
  --member-accent-active: #6948ea;
  --member-accent-soft: rgba(124, 92, 255, 0.13);
  --member-accent-soft-hover: rgba(124, 92, 255, 0.19);

  --member-success: #38c98b;
  --member-success-soft: rgba(56, 201, 139, 0.13);
  --member-warning: #f0b64f;
  --member-warning-soft: rgba(240, 182, 79, 0.14);
  --member-danger: #ef6473;
  --member-danger-soft: rgba(239, 100, 115, 0.13);
  --member-info: #5aa9ff;
  --member-info-soft: rgba(90, 169, 255, 0.13);
}
```

## Surface and depth

| Level     | Use                                       | Rule                                    |
| --------- | ----------------------------------------- | --------------------------------------- |
| Canvas    | outer app background                      | darkest, no card content directly on it |
| Page      | scrollable content                        | slightly lighter than canvas            |
| Surface 1 | normal cards, inputs, rows                | default resting surface                 |
| Surface 2 | important cards, wallet                   | raised by color, not heavy shadow       |
| Surface 3 | hover, selected controls, countdown cells | interactive elevation                   |
| Surface 4 | dropdown, popover, modal content          | highest local surface                   |

Use borders only at subtle/default/strong levels. Use card shadow lightly, dropdown shadow moderately, and modal shadow strongly. Use blur only on floating Topbar, Bottom Navigation, dropdowns, modals, and floating actions; never blur every card.

## Component color rules

- Sidebar: sidebar background; normal labels secondary; active item accent-soft with a 3px left indicator and accent icon/text.
- Topbar: translucent page surface with `backdrop-filter: blur(16px)` only when sticky. Search uses Surface 1; focus uses accent border and soft ring. Notification unread badge uses danger.
- Hero: directional dark overlay behind copy only; white headline; translucent neutral secondary CTA; accent solid primary CTA; white carousel indicators.
- Announcement: Surface 1 with info icon. Warning-soft is for genuinely important maintenance, not every announcement.
- Wallet: Surface 2 → Surface 1 gradient; primary balance text; bonus uses accent-soft; deposit is accent primary; withdrawal is neutral secondary, never danger.
- Quick actions: deposit success-soft, withdrawal info-soft, history neutral Surface 3, bonus accent-soft. Keep icon containers soft and consistent.
- Game cards: Surface 1 with subtle border; hover Surface 2 and lift 1–2px. Image overlay is dark and directional. Favorite uses a pink accent only for the favorite state, never danger red.
- Tournament: restrained accent radial highlight; reward uses warning/gold because it represents a prize; countdown uses neutral Surface 3.
- Promotions: visual color comes from the image. Use the shared accent only for CTA text/soft actions; never invent a new accent per card.
- Transactions: success is for money in; normal withdrawals stay primary text; warning means pending; danger means failed/problem; cancelled is neutral. Do not communicate normal withdrawal as an error.
- Security/profile: success means enabled, warning means incomplete, danger means risk or destructive action. Logout-all-devices may use danger-soft/outline before final confirmation.

## Button, input, and state system

```css
.member-focus-ring:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--member-page),
    0 0 0 4px var(--member-accent-hover);
}
```

- Primary: accent solid; hover accent-hover; active accent-active; one primary CTA per action group.
- Secondary: Surface 3 + default border.
- Ghost: transparent until hover; never invisible when keyboard-focused.
- Danger: solid only for confirmed destructive actions; otherwise danger-soft/outline.
- Disabled: disabled text, low-contrast neutral surface, no shadow or glow.
- Inputs: Surface 1 + default border; hover strong border; focus accent ring; error danger ring; success only after real validation.
- Loading: use muted Surface 2/3 skeletons; never bright white shimmer. Preserve component shape and aspect ratio.
- Empty: tertiary icon, primary title, secondary explanation, accent CTA only when an action exists.
- Error: danger-soft panel with icon and message; retry stays neutral because it fixes the problem.

## Icon system

The target is one Lucide-style outline family with consistent 1.75–2px stroke. The current repository still renders through `apps/web-member/app/components/member-icon.tsx`; keep that adapter as the canonical integration point and do not add `lucide-react` until the icon inventory, CMS icon behavior, bundle impact, and migration ADR are approved. Never mix a second icon family directly into route components.

| Context     |    Size |
| ----------- | ------: |
| Inline      |    16px |
| Button      |    18px |
| Navigation  |    20px |
| Card action |    20px |
| Feature     | 22–24px |
| Empty state | 32–40px |

Canonical mapping:

`House` home · `Gamepad2` games · `Gift` promotions/bonus · `WalletCards` wallet · `ArrowDownToLine` deposit · `ArrowUpFromLine` withdrawal · `History` history · `Trophy` tournament · `Bell` notifications · `UserRound` profile · `ShieldCheck` security · `Settings` settings · `CircleHelp` help · `MessagesSquare` ticket · `Search` search · `SlidersHorizontal` filter · `X` close · `Ellipsis` more · `ChevronLeft` back · `ChevronRight` next · `Heart` favorite · `Play` play · `RefreshCw` retry · `Copy` copy · `ExternalLink` external · `CircleCheck` success · `TriangleAlert` warning · `CircleX` error · `Info` information.

Icons inherit `currentColor`. Navigation follows text hierarchy: secondary → primary on hover → accent when active. Semantic icons use semantic colors. Decorative icons use tertiary text at reduced emphasis.

Icon containers are reserved for feature/quick-action contexts: 40px/20px quick action, 36px/18px notification, 44px/22px feature, 56px/28px empty state. Do not wrap every navigation icon in a container.

Icon-only controls require a minimum 40×40px target, `aria-label`, tooltip where needed, visible hover/focus/active/disabled states, and `aria-hidden="true"` on the decorative icon.

## Responsive and accessibility rules

- Reduce shadow, glow, and decorative background on mobile; preserve surface separation and text contrast.
- Keep text primary around 4.5:1 contrast, large text around 3:1, and essential controls/borders around 3:1 where applicable.
- Never use color alone for status; pair color with text and an icon or shape.
- Selected state must include more than color (background, indicator, or weight); focus must remain visible on every surface.
- Test hover, active, focus-visible, disabled, loading, empty, error, reduced-motion, 200% zoom, long Thai labels, and missing images.

## Prohibited patterns

- Hard-coded component hex colors instead of Member tokens.
- Accent on more than roughly 10% of a surface or purple glow on ordinary cards.
- Mixing outline, filled, emoji, 3D, or unrelated icon families on one Member surface.
- `transition: all`; animate only color, border, shadow, opacity, and transform according to the motion contract.
- Red for normal withdrawals, green/yellow/red dots without labels, or decorative status colors.
