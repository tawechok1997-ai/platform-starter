# Admin Drawer Adoption Matrix

> Source audit on `main` · 2026-07-24
>
> Shared primitive: `apps/web-admin/app/(admin)/_components/admin-drawer.tsx`

## Shared contract

`AdminDrawer` provides one behavior contract for Admin detail drawers:

- Portal rendering above the Admin shell.
- `role="dialog"`, `aria-modal`, labelled title and optional description.
- Initial focus on the close button.
- Tab and Shift+Tab focus containment.
- Escape close when the drawer is not busy.
- Backdrop close when the drawer is not busy.
- Body scroll lock with scroll-position restoration.
- Focus restoration to the element that opened the drawer.
- Compact, medium and wide desktop widths.
- Full-width `100dvh` mobile layout with safe-area padding.
- Optional sticky footer and busy close lock.
- Reduced-motion fallback removes backdrop blur.

## Source-inspected routes

| Route | Drawer purpose | Status | Evidence / remaining work |
|---|---|---|---|
| `/wallet-statement` | Transaction detail and running balance | ✅ Adopted | Uses compact `AdminDrawer`; removed local overlay and drawer styles |
| `/game-sessions` | Session timeline and related transfers | ✅ Adopted | Uses medium `AdminDrawer`; reconcile confirmation remains a separate `AdminConfirmDialog` |
| `/audit-risk` | Before/after payload and related record | ✅ Adopted | Uses wide `AdminDrawer`; read-only behavior unchanged |
| `/admin-roles` | Permission preview | ✅ Adopted | Uses compact `AdminDrawer`; read-only warning unchanged |
| `/operations` | Queue task detail | ⏳ Remaining | Still uses local `drawerLayerStyle` / `drawerStyle`; migrate in the next route adoption pass |

## Worklist candidates requiring source inspection

These are worklist categories, not claims that each route currently has a drawer:

- Top-up proof and withdrawal proof detail.
- KYC / member verification detail.
- Promotion claim detail.
- Provider detail.
- Admin account detail.
- Game transfer / webhook payload detail.

Each candidate must be opened from source before being marked adopted. A route without a real drawer should not receive one merely to satisfy a checkbox.

## Rule for new drawers

1. Use `AdminDrawer`; do not create local fixed overlays or local focus traps.
2. Keep confirmation actions in `AdminConfirmDialog`, not in a detail drawer unless the drawer has an explicit guarded footer.
3. Use `busy` when a close action could interrupt an in-flight mutation.
4. Choose the smallest suitable size: compact for metadata, medium for operational detail, wide for payload/comparison views.
5. Browser evidence for focus order, Escape, backdrop, scroll restoration and mobile safe areas remains part of D-08.

## Commits

- Shared primitive: `3061900d321f2373b406fae06dc8db745aa2d444`
- Stable focus lifecycle: `d23f44323b0b0c3e7ce53a69a0d44fd0257a1c79`
- Admin Roles adoption: `69a89cc1a005ae608ec0d53dcc763358032ea510`
- Wallet Statement adoption: `8c45252765f3b7956be19cbac12a0a6f4f93ff85`
- Game Sessions adoption: `5b5eb0fdfa6b8f91f89d26bdfdfc8f7e600594e5`
- Audit Risk adoption: `551e42782946c9d73ae4716d07fb7056360d73a5`
