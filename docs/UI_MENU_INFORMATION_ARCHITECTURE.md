# UI Menu and Information Architecture Contract

Updated: 2026-07-16  
Scope: Member and Admin navigation, route naming, feature flags, permissions, and visual menu parity

## Current inconsistencies found in the repository

- Member Desktop navigation is derived from `navigationFor('bottom')`, while the Mobile bottom bar is separately hard-coded as `เมนู`, `ฝาก`, `ถอนเงิน`, and `ติดต่อเรา`.
- Member Desktop, Drawer, Home quick actions, category rail, and Mobile bottom bar do not share one canonical label/order contract.
- The same concept is labelled differently (`สถานะรายการ` vs `ประวัติ`, `โปรโมชัน` vs `โปร`, `ฝาก` vs `ฝากเงิน`).
- `การจัดการบัญชีธนาคาร` is currently gated by the `kyc` feature flag even though bank-account management is a separate finance/account capability.
- The category rail duplicates navigation with a separate icon/label implementation and uses different concepts from the primary navigation.
- Admin navigation contains overlapping destinations and aliases (`/wallets`, `/wallet-ledgers`, `/ledgers`, `/finance`; provider and transfer setup pages; multiple KYC/member detail entries) without a visible canonical destination policy.
- Admin labels mix Thai and English (`Dashboard`, `Support`, `Audit Logs`, `Finance`) without a consistent localization rule.

## Canonical Member information architecture

The route remains the source of truth; labels may be localized, but one route must have one canonical title and one active-state rule.

| Priority | Canonical label      | Route            | Desktop primary | Mobile bottom | Drawer/secondary | Feature gate                                     |
| -------- | -------------------- | ---------------- | --------------- | ------------- | ---------------- | ------------------------------------------------ |
| 1        | หน้าแรก              | `/`              | yes             | yes           | yes              | —                                                |
| 2        | เกม                  | `/games`         | yes             | no            | yes              | `game_lobby_enabled`                             |
| 3        | กระเป๋าเงิน / รายการ | `/transactions`  | yes             | yes           | yes              | —                                                |
| 4        | ฝากเงิน              | `/deposit`       | yes             | yes           | yes              | `deposit_enabled`                                |
| 5        | ถอนเงิน              | `/withdraw`      | no/secondary    | no/secondary  | yes              | `withdraw_enabled`                               |
| 6        | โปรโมชัน             | `/promotions`    | no/secondary    | yes           | yes              | `promotion_enabled`                              |
| 7        | โบนัส                | `/bonus`         | no/secondary    | no            | yes              | `bonus_enabled`                                  |
| 8        | บัญชีธนาคาร          | `/bank-accounts` | no/secondary    | no            | yes              | dedicated bank capability; do not reuse KYC gate |
| 9        | โปรไฟล์              | `/profile`       | no/secondary    | yes           | yes              | `profile_enabled`                                |
| 10       | แจ้งเตือน            | `/notifications` | utility         | no            | yes              | `notification_enabled`                           |
| 11       | ช่วยเหลือ            | `/support`       | utility         | no            | yes              | `support_enabled`                                |
| 12       | ตัวแทน               | `/affiliate`     | no/secondary    | no            | yes              | `affiliate_enabled`                              |
| 13       | คู่มือ               | `/guide`         | no              | no            | yes              | —                                                |
| 14       | ติดต่อเรา            | `/contact`       | footer/utility  | no            | yes              | —                                                |

Required behavior:

- [ ] Define the canonical menu model once and derive Desktop primary, Mobile bottom, Drawer, Home quick actions, and category rail from it.
- [ ] Use the reference order for Mobile: หน้าแรก, กระเป๋าเงิน/รายการ, ฝากเงิน, โปรโมชัน, โปรไฟล์; put ถอนเงิน and other secondary destinations in More/Drawer.
- [ ] Use the reference order for Desktop: หน้าแรก, เกม, ฝากเงิน, กระเป๋าเงิน/รายการ, then secondary finance/account items; keep utility actions in the topbar.
- [ ] Replace hard-coded Mobile bottom entries and duplicated category-rail entries with the canonical model.
- [ ] Choose one user-facing title per route and use it in navigation, breadcrumbs, page headings, notifications, support context, and active-state announcements.
- [ ] Add a dedicated bank-account capability flag or a documented dependency contract; never hide bank management accidentally when KYC is disabled.
- [ ] Define feature-disabled behavior: hide from navigation when appropriate, preserve direct-route explanation, and never leave a dead active item.
- [ ] Define active matching for nested routes, query filters, and detail pages; the parent menu must remain active.
- [ ] Keep external/public links (`/contact`, `/guide`, legal) out of authenticated primary navigation while retaining them in the correct footer/drawer section.
- [ ] Add route redirects/aliases for legacy menu hrefs instead of rendering duplicate menu items.

## Canonical Admin information architecture

Admin sidebar groups should follow the reference boards and business ownership. Each route appears once; aliases and deep links resolve to the canonical destination.

| Group                  | Canonical destinations                                                                                    | Existing areas to normalize                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| ภาพรวม                 | `/dashboard`, `/operations`                                                                               | Dashboard, งานแอดมิน, queue overview                         |
| การเงิน                | `/topups`, `/withdrawals`, `/wallets`, `/ledgers`, `/bank-accounts`, `/reconciliation-center`, `/exports` | `/wallet-ledgers`, `/finance`, and legacy finance aliases    |
| สมาชิกและความเสี่ยง    | `/members`, `/member-detail`, `/kyc`, `/risk-alerts`, `/audit-risk`                                       | KYC Review, member detail, risk/watchlist aliases            |
| การเติบโต              | `/promotion-center`, `/promotion-claims`, `/bonus-ledgers`, `/affiliate-center`, `/commission-ledgers`    | Growth Center and campaign aliases                           |
| ค่ายเกมและการเชื่อมต่อ | `/game-providers`, `/game-transfers`, `/provider-setup-wizard`, `/reconciliation-center`, `/webhook-logs` | provider presets, adapters, API settings, webhook test pages |
| ช่วยเหลือและเนื้อหา    | `/support-center`, `/content-center`                                                                      | Support, CMS, FAQ/content aliases                            |
| ตั้งค่าและความปลอดภัย  | `/settings`, `/security`, `/admin-accounts`, `/admin-roles`, `/admin-invitations`, `/access`, `/audit`    | mixed Thai/English settings/security entries                 |

Required behavior:

- [ ] Remove duplicate sidebar items and show one canonical item per business destination.
- [ ] Add a route-alias registry with redirect target, deprecation note, owner, and permission contract.
- [ ] Normalize Admin labels to Thai-first with English secondary text only where an established technical term is necessary.
- [ ] Keep group titles, icon meanings, active state, badges, permission hiding, collapsed-sidebar tooltips, and mobile navigation identical to the reference.
- [ ] Show queue badges only on the owning canonical item; do not repeat the same pending count across aliases.
- [ ] Ensure permission filtering does not leave empty groups or create a misleading active route.

## Tool and skill matrix

| Work area            | Recommended tools                                                          | Skill/capability                                       | Required evidence                                     |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Route/menu inventory | `rg`, `rg --files`, TypeScript route audit script                          | Repository navigation and architecture review          | canonical route/menu matrix                           |
| Menu model refactor  | `apply_patch`, TypeScript, existing Member/Admin components                | React/Next.js architecture and shared-component design | one source-of-truth menu model and unit tests         |
| Visual parity        | Playwright, screenshot baselines, browser devtools                         | `build-web-apps:frontend-testing-debugging`            | desktop/mobile screenshots and diff review            |
| Browser automation   | Playwright projects or `vercel:agent-browser-verify` where available       | rendered-flow verification                             | active state, keyboard, resize, deep-link evidence    |
| Accessibility        | `@axe-core/playwright`, ESLint JSX a11y rules                              | accessibility review                                   | no critical violations; focus/ARIA evidence           |
| Responsive layout    | six viewport projects, device emulation, safe-area checks                  | responsive web UI implementation                       | 360/390/430/768/1024/1440 evidence                    |
| React performance    | stable menu derivation, memoization, route prefetch review                 | `build-web-apps:react-best-practices`                  | no duplicate menu fetch/render; bundle/LCP check      |
| Tokens and styling   | `packages/design-tokens`, CSS contracts, browser computed-style inspection | frontend design-system implementation                  | token inventory and no ad-hoc palette drift           |
| Icons                | existing `MemberIcon`/`AdminIcon` first; Lucide only after ADR             | icon-system consistency                                | icon map and visual stroke consistency                |
| Visual assets        | existing CMS/storage asset flow; image dimensions and fallback checks      | image/media QA                                         | stable aspect ratio, missing-media, alt text evidence |
| Performance budget   | `@next/bundle-analyzer`, Lighthouse CI only after staging data             | measured performance optimization                      | route JS/CSS/media budget report                      |
| Release safety       | CI, route audit, feature-flag checks, commit SHA evidence                  | release/rollback discipline                            | CI artifact, deployment identity, rollback note       |

## Definition of done for menu redesign

- [ ] Every visible menu item maps to exactly one canonical route and owner.
- [ ] Desktop, Mobile, Drawer, Home quick actions, and category rail agree on labels, icons, active state, and feature availability.
- [ ] Deep links, nested routes, query filters, permission changes, feature flags, session expiry, and disabled features preserve a coherent menu state.
- [ ] The menu matches the relevant LUX88/Gaming Fintech reference board at all six viewports.
- [ ] Unit, typecheck, lint, route audit, accessibility, visual, and browser evidence are retained before marking the menu redesign complete.
