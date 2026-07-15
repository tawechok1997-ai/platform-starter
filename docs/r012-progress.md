# R-012 Progress — Frontend feature architecture and large-page decomposition

Source of truth: `docs/master-project-worklist.md` → P4 → R-012

## Status

- DONE: 18/18
- COMPLETE
- Remaining: 0

## Checklist

- [x] จัด Admin folders ตาม feature/domain
- [x] จัด Member folders ตาม feature/domain
- [x] กำหนด public exports ของแต่ละ feature
- [x] แยก page container ออกจาก presentation components
- [x] แยก register page
- [x] แยก deposit page
- [x] แยก withdrawal page
- [x] แยก provider page
- [x] แยก content/CMS page
- [x] แยก promotion page
- [x] แยก security/admin lifecycle page
- [x] แยก KYC admin/member pages
- [x] แยก support page/thread components
- [x] แยก form schemas/defaults/serialization/error mapping
- [x] แยก server state จาก UI state
- [x] ทำ query-key factories และ invalidation rules
- [x] เพิ่ม component/unit tests สำหรับส่วนที่แยก
- [x] เพิ่ม unsaved-change และ optimistic rollback regression

## Closed outcomes

- Admin and Member expose matching feature domains: auth, finance, KYC, support and CMS.
- Every feature has a public `index.ts`; private implementation files remain behind that boundary.
- Static audit prevents accidental deletion or omission of a feature public entry.
- The member deposit route keeps workflow/UI state in `deposit-client.tsx` while `DepositView` owns rendering and interaction wiring.
- `DepositView` is exported through the Member finance public boundary instead of being imported through a private deep path.
- Deposit defaults, validation, request serialization and API error extraction live in a dedicated finance form contract.
- Finance query keys and mutation invalidation rules are declared centrally and used by the deposit workflow.
- Remote accounts/history/loading/error state now lives in `useDepositServerState`; the container only owns transient workflow and form state.
- The withdrawal route keeps API orchestration, validation and transient state in `app/withdraw/page.tsx`; `WithdrawalView` owns rendering and interaction wiring.
- `WithdrawalView` is exported through the finance public boundary, and static audit prevents direct presentation imports from the route.
- The registration route keeps settings, validation, captcha state, API submission, token storage and referral linking in `app/(auth)/register/page.tsx`; `RegisterView` owns all public-auth rendering and field interaction wiring.
- `RegisterView` is exported through the Member auth public boundary; static audit prevents API calls, route effects and auth form markup from leaking across the boundary.
- The Admin game-provider implementation now lives in `src/features/finance/game-providers-page.tsx`; the App Router page is a thin feature entry point.
- The Admin finance public boundary exports `GameProvidersPage`, and static audit prevents provider API/state logic from returning to the route file.
- The Admin CMS implementation now lives in `src/features/cms/content-center-page.tsx`; the App Router page delegates through a thin entry point.
- The Admin CMS public boundary exports `ContentCenterPage`; static audit prevents CMS API/state logic from returning to the route file.
- The Admin promotion implementation now lives in `src/features/cms/promotion-center-page.tsx`; the App Router route is a thin CMS feature entry point.
- The Admin CMS public boundary exports `PromotionCenterPage`; dedicated static audit prevents promotion API/state logic from returning to the route file.
- The Admin security implementation now lives in `src/features/auth/admin-security-page.tsx`; the App Router route is a thin auth feature entry point.
- The Admin auth public boundary exports `AdminSecurityPage`; dedicated static audit prevents 2FA, session and QR orchestration from returning to the route file.
- Finance now exposes deterministic unsaved-change detection plus isolated optimistic snapshots and rollback helpers through its public boundary.
- Regression tests verify unchanged forms remain clean, changed drafts are detected, optimistic mutation does not alter the snapshot, and rollback restores the original value.
- Member support API orchestration, polling and draft persistence now live in `app/support/support-page-client.tsx`; the App Router page is a thin entry point.
- Support ticket and message-thread rendering now lives in `SupportTicketCard`, exported through the Member support public boundary.
- Dedicated support audit prevents API/effect logic from leaking into the presentation component or returning to the route.
- Admin KYC now delegates from its App Router page through `src/features/kyc/kyc-center-page.tsx` to `kyc-center-client.tsx`.
- Member KYC now delegates from its App Router page through `src/features/kyc/member-kyc-page.tsx` to `kyc-client.tsx`.
- Both KYC public boundaries export their page components, and the dedicated audit prevents API/state orchestration from returning to either route.
- Unit tests cover deposit defaults, amount parsing, validation, request serialization, API error mapping and deterministic finance query/invalidation keys.
- Presentation contract tests prevent `DepositView` and `WithdrawalView` from owning API fetches or route-level effects.
- R-012 CI installs dependencies and runs all feature-boundary audits, Member feature tests, Member typecheck and Admin typecheck.

## Verification

```bash
node tools/audit-r012-feature-boundaries.mjs
node tools/audit-r012-promotion-boundary.mjs
node tools/audit-r012-security-boundary.mjs
node tools/audit-r012-support-boundary.mjs
node tools/audit-r012-kyc-boundary.mjs
pnpm --filter @platform/web-member test
pnpm --filter @platform/web-member typecheck
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-member build
```
