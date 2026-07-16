# Admin Menu and Information Architecture

Updated: 2026-07-16  
Scope: `apps/web-admin` only

This is the Admin navigation source of truth. It is intentionally separate from Member navigation: Admin density, permissions, queue ownership, and operational language must not leak into Member UI.

## Current Admin route groups

| Group                  | Canonical destinations                                                        | Repository route examples                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ภาพรวม                 | dashboard, operations, activity                                               | `/dashboard`, `/operations`, `/activity`                                                                  |
| การเงิน                | topups, withdrawals, wallets, ledgers, bank accounts, reconciliation, exports | `/topups`, `/withdrawals`, `/wallets`, `/ledgers`, `/bank-accounts`, `/reconciliation-center`, `/exports` |
| สมาชิกและความเสี่ยง    | members, member detail, KYC, risk, audit risk                                 | `/members`, `/member-detail`, `/kyc`, `/risk-alerts`, `/audit-risk`                                       |
| การเติบโต              | promotion center, claims, bonus, affiliate, commission                        | `/promotion-center`, `/promotion-claims`, `/bonus-ledgers`, `/affiliate-center`, `/commission-ledgers`    |
| ค่ายเกมและการเชื่อมต่อ | games, providers, transfers, adapters, webhooks                               | `/games`, `/game-providers`, `/game-transfers`, `/provider-adapters`, `/webhook-logs`                     |
| ช่วยเหลือและเนื้อหา    | support center, content center                                                | `/support-center`, `/content-center`                                                                      |
| ตั้งค่าและความปลอดภัย  | settings, access, roles, security, audit                                      | `/settings`, `/access`, `/admin-roles`, `/security`, `/audit`                                             |

The full Admin visual and route worklist is [`ADMIN_UX_UI_REDESIGN.md`](./ADMIN_UX_UI_REDESIGN.md). This document defines menu ownership only; it does not authorize Admin implementation during the current Member phase.

## Admin-only rules

- Every visible destination has one canonical route and one permission owner.
- `/wallets`, `/wallet-ledgers`, `/ledgers`, and `/finance` require an alias policy; do not expose duplicate sidebar destinations.
- Queue badges appear only on the owning item and are never copied to aliases.
- Permission filtering must remove empty groups and preserve a truthful active route.
- Admin labels are Thai-first; English is secondary only for established technical terms.
- Case detail, review, audit, risk, and approval routes require explicit permission, reason, conflict, and audit feedback.
- Admin tables use dense but readable layouts; they must not be reused as the Member home card pattern.

## Implementation files and ownership

- Navigation model: `apps/web-admin/app/(admin)/admin-nav.ts`
- Admin shell/layout: `apps/web-admin/app/(admin)/layout.tsx`
- Admin icon adapter: `apps/web-admin/app/(admin)/_components/admin-icon.tsx`
- Route worklist: [`ADMIN_UX_UI_REDESIGN.md`](./ADMIN_UX_UI_REDESIGN.md)

## Acceptance checklist

- [ ] Each Admin route has one canonical navigation owner and alias policy.
- [ ] Permission-hidden items do not leave empty groups or stale active state.
- [ ] Queue badges and operational statuses appear only on their owning destinations.
- [ ] Desktop/mobile Admin navigation is verified separately from Member evidence.
