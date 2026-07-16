# Member Menu and Information Architecture

Updated: 2026-07-16  
Scope: `apps/web-member` only

This is the Member navigation source of truth. Admin routes, permissions, labels, and sidebar rules belong in [`ADMIN_MENU_INFORMATION_ARCHITECTURE.md`](./ADMIN_MENU_INFORMATION_ARCHITECTURE.md) and must not be copied into this document.

## Current repository route inventory

The route audit currently finds 27 `page.tsx` routes under `apps/web-member/app`. The complete API, feature-flag, deep-link, owner, and state mapping remains in [`MEMBER_ROUTE_MATRIX.md`](./MEMBER_ROUTE_MATRIX.md). This document only defines user-facing information architecture and visual priority.

## Canonical authenticated navigation

| Priority | Label                | Route            | Desktop   | Mobile bottom | Drawer/secondary |
| -------: | -------------------- | ---------------- | --------- | ------------- | ---------------- |
|        1 | หน้าแรก              | `/`              | primary   | yes           | yes              |
|        2 | เกม                  | `/games`         | primary   | no            | yes              |
|        3 | กระเป๋าเงิน / รายการ | `/transactions`  | primary   | yes           | yes              |
|        4 | ฝากเงิน              | `/deposit`       | primary   | yes           | yes              |
|        5 | ถอนเงิน              | `/withdraw`      | secondary | no            | yes              |
|        6 | โปรโมชัน             | `/promotions`    | secondary | yes           | yes              |
|        7 | โบนัส                | `/bonus`         | secondary | no            | yes              |
|        8 | บัญชีธนาคาร          | `/bank-accounts` | secondary | no            | yes              |
|        9 | โปรไฟล์              | `/profile`       | secondary | yes           | yes              |
|       10 | แจ้งเตือน            | `/notifications` | utility   | no            | yes              |
|       11 | ช่วยเหลือ            | `/support`       | utility   | no            | yes              |
|       12 | ตัวแทน               | `/affiliate`     | secondary | no            | yes              |

Public/content routes remain outside authenticated primary navigation: `/guide`, `/contact`, `/legal`, `/maintenance`, and `/session-expired`.

## Surface derivation rules

One typed Member menu model must derive:

- Desktop sidebar: หน้าแรก, เกม, กระเป๋าเงิน / รายการ, ฝากเงิน, then secondary finance/account items.
- Mobile bottom navigation: หน้าแรก, กระเป๋าเงิน / รายการ, ฝากเงิน, โปรโมชัน, โปรไฟล์.
- Drawer/More: ถอนเงิน, โบนัส, บัญชีธนาคาร, แจ้งเตือน, ช่วยเหลือ, ตัวแทน, คู่มือ, ติดต่อเรา, and legal links where appropriate.
- Home quick actions: ฝากเงิน (primary), ถอนเงิน (secondary), ประวัติ (ghost), รับโบนัส (soft accent). These are shortcuts, not a second navigation model.
- Game category tabs: content filters only; they must not become route-level navigation or duplicate sidebar labels.

## Label and active-state rules

- Use one canonical label: `ฝากเงิน`, `ถอนเงิน`, `กระเป๋าเงิน / รายการ`, `โปรโมชัน`, `โปรไฟล์`.
- Parent routes stay active for nested pages such as `/games/session`, `/profile/security`, `/profile/password`, and `/profile/sessions`.
- Query filters and deep links must not clear the owning active item.
- Feature-disabled destinations are hidden only when policy allows; direct entry shows a clear unavailable/maintenance state rather than a dead route.
- Bank-account visibility uses a dedicated bank capability contract; it must not accidentally depend on the KYC flag.
- Legacy labels/hrefs redirect to the canonical route instead of rendering duplicate items.

## Implementation files and ownership

- Route model: `apps/web-member/app/member-routes.ts`
- Navigation model: `apps/web-member/app/member-navigation.ts`
- Shell/chrome: `apps/web-member/app/member-chrome.tsx`, `apps/web-member/app/member-shell.css`
- Mobile navigation: `apps/web-member/app/member-bottom-nav.tsx`
- Shared icon adapter: `apps/web-member/app/components/member-icon.tsx`
- Route/state evidence: [`MEMBER_ROUTE_MATRIX.md`](./MEMBER_ROUTE_MATRIX.md)

## Acceptance checklist

- [ ] Desktop, mobile, drawer, quick actions, and game filters derive from one model.
- [ ] No Member menu item points to an Admin route or uses Admin permission terminology.
- [ ] All 27 Member routes have an owner, active-state rule, and direct-link behavior.
- [ ] Six standard viewports show no overflow, hidden active state, or bottom-nav overlap.
- [ ] Keyboard, screen reader, reduced motion, feature-disabled, and session-expired states are verified.
