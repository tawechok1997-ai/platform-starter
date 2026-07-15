# R-012 Progress — Frontend feature architecture and large-page decomposition

Source of truth: `docs/master-project-worklist.md` → P4 → R-012

## Status

- DONE: 7/18
- IN PROGRESS: register and withdrawal page decomposition
- Remaining: 11

## Checklist

- [x] จัด Admin folders ตาม feature/domain
- [x] จัด Member folders ตาม feature/domain
- [x] กำหนด public exports ของแต่ละ feature
- [x] แยก page container ออกจาก presentation components
- [ ] แยก register page
- [x] แยก deposit page
- [ ] แยก withdrawal page
- [ ] แยก provider page
- [ ] แยก content/CMS page
- [ ] แยก promotion page
- [ ] แยก security/admin lifecycle page
- [ ] แยก KYC admin/member pages
- [ ] แยก support page/thread components
- [x] แยก form schemas/defaults/serialization/error mapping
- [ ] แยก server state จาก UI state
- [x] ทำ query-key factories และ invalidation rules
- [ ] เพิ่ม component/unit tests สำหรับส่วนที่แยก
- [ ] เพิ่ม unsaved-change และ optimistic rollback regression

## Closed outcomes

- Admin and Member expose matching feature domains: auth, finance, KYC, support and CMS.
- Every feature has a public `index.ts`; private implementation files remain behind that boundary.
- Static audit prevents accidental deletion or omission of a feature public entry.
- The member deposit route keeps API calls, state and derived workflow data in `deposit-client.tsx` while `DepositView` owns rendering and interaction wiring.
- `DepositView` is exported through the Member finance public boundary instead of being imported through a private deep path.
- Deposit defaults, validation, request serialization and API error extraction live in a dedicated finance form contract.
- Finance query keys and mutation invalidation rules are declared centrally and used by the deposit container.
- Static audit prevents the deposit container from bypassing presentation, form or query public contracts.

## Verification

```bash
node tools/audit-r012-feature-boundaries.mjs
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-member build
```
