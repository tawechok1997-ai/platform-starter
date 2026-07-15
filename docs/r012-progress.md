# R-012 Progress — Frontend feature architecture and large-page decomposition

Source of truth: `docs/master-project-worklist.md` → P4 → R-012

## Status

- DONE: 3/18
- IN PROGRESS: page container and presentation decomposition
- Remaining: 15

## Checklist

- [x] จัด Admin folders ตาม feature/domain
- [x] จัด Member folders ตาม feature/domain
- [x] กำหนด public exports ของแต่ละ feature
- [ ] แยก page container ออกจาก presentation components
- [ ] แยก register page
- [ ] แยก deposit page
- [ ] แยก withdrawal page
- [ ] แยก provider page
- [ ] แยก content/CMS page
- [ ] แยก promotion page
- [ ] แยก security/admin lifecycle page
- [ ] แยก KYC admin/member pages
- [ ] แยก support page/thread components
- [ ] แยก form schemas/defaults/serialization/error mapping
- [ ] แยก server state จาก UI state
- [ ] ทำ query-key factories และ invalidation rules
- [ ] เพิ่ม component/unit tests สำหรับส่วนที่แยก
- [ ] เพิ่ม unsaved-change และ optimistic rollback regression

## Closed outcomes

- Admin and Member expose matching feature domains: auth, finance, KYC, support and CMS.
- Every feature has a public `index.ts`; private implementation files remain behind that boundary.
- Static audit prevents accidental deletion or omission of a feature public entry.

## Verification

```bash
node tools/audit-r012-feature-boundaries.mjs
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-member build
```
