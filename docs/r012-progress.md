# R-012 Progress — Frontend feature architecture and large-page decomposition

Source of truth: `docs/master-project-worklist.md` → P4 → R-012

## Status

- DONE: 12/18
- IN PROGRESS: CMS and promotion page decomposition
- Remaining: 6

## Checklist

- [x] จัด Admin folders ตาม feature/domain
- [x] จัด Member folders ตาม feature/domain
- [x] กำหนด public exports ของแต่ละ feature
- [x] แยก page container ออกจาก presentation components
- [x] แยก register page
- [x] แยก deposit page
- [x] แยก withdrawal page
- [x] แยก provider page
- [ ] แยก content/CMS page
- [ ] แยก promotion page
- [ ] แยก security/admin lifecycle page
- [ ] แยก KYC admin/member pages
- [ ] แยก support page/thread components
- [x] แยก form schemas/defaults/serialization/error mapping
- [x] แยก server state จาก UI state
- [x] ทำ query-key factories และ invalidation rules
- [x] เพิ่ม component/unit tests สำหรับส่วนที่แยก
- [ ] เพิ่ม unsaved-change และ optimistic rollback regression

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
- Unit tests cover deposit defaults, amount parsing, validation, request serialization, API error mapping and deterministic finance query/invalidation keys.
- Presentation contract tests prevent `DepositView` and `WithdrawalView` from owning API fetches or route-level effects.
- R-012 CI installs dependencies and runs the static audit, Member feature tests, Member typecheck and Admin typecheck.

## Verification

```bash
node tools/audit-r012-feature-boundaries.mjs
pnpm --filter @platform/web-member test
pnpm --filter @platform/web-member typecheck
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-member build
```