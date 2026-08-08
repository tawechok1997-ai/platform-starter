# Admin Redesign P5–P7 Closure

## สถานะปัจจุบัน

- PR: `#492`
- Final branch: `agent/admin-phase-5-7-data-settings-design-system`
- สถานะ: **Merged**
- Main merge commit: `882643c496ffee91d540898a22cbc3951252996e`

P5, P6 และ P7 ถูกปิดเป็น Program เดียว โดยรักษา Contract ของ P1 Appearance, P2 Access, P3 Navigation และ P4 Widget system

## P5 — Table, Form และ Detail UX

สถานะ: **เสร็จและ Merge แล้ว**

- Query-state owner กลางรองรับ Page, Page size, Search, Filter และ Sort
- Shared `AdminDataTable` รองรับ Server pagination, Sorting, Column visibility, Mobile card, Loading และ Empty state
- URL query state โหลดกลับและบันทึก `page`, `take`, `sort`, `direction`
- Saved views แบบ Versioned แยกตามผู้ใช้และ Workspace
- Form owner กลางรองรับ Error normalization, Field description, Sticky save bar และ Unsaved-change guard
- Before/after diff รองรับ Sensitive-value redaction
- Canonical detail drawer มี Focus trap, Escape, Focus restore, Scroll lock, Mobile full viewport และ Reduced motion
- Finance `/exports`, Members `/members`, Access `/admin-invitations`, Activity `/activity` และ `/activity-center` ใช้ Owner กลาง

### Owner

| ความสามารถ | Owner |
|---|---|
| Table query state | `apps/web-admin/src/features/admin-modernization/data-query-state.ts` |
| Saved views/Column preference | `apps/web-admin/src/features/admin-modernization/data-view-preferences.ts` |
| Saved-view UI | `apps/web-admin/src/features/admin-modernization/data-table-view-controls.tsx` |
| Responsive table | `apps/web-admin/src/features/admin-modernization/data-table.tsx` |
| Form state/Diff | `apps/web-admin/src/features/admin-modernization/form-state.ts` |
| Form fields/Save bar | `apps/web-admin/src/features/admin-modernization/admin-form-controls.tsx` |
| Detail drawer | `apps/web-admin/app/(admin)/_components/admin-drawer.tsx` |

## P6 — Settings Migration

สถานะ: **เสร็จและ Merge แล้ว**

- Write owner ที่อนุญาตมีเพียง `/settings` และ `/system-settings`
- Route inventory แบ่ง Keep, Merge, Redirect, Deprecated และ Remove
- Data-key ownership มี Duplicate-writer validation
- Redirect helper รักษา Query และ Hash
- Sensitive change policy บังคับ Permission, Confirmation, Reason และ Audit action
- `/settings` เป็น Owner ของ Website, Contact, SEO, Legal, Branding, Theme, Feature, Activity, Maintenance และ Script settings
- `/system-settings` เป็น Owner ของ Provider, Credential, Preset, Legacy API และ Home-game configuration
- Legacy UI routes เป็น Compatibility delegate ไม่ใช่ Write owner ใหม่
- `adminApiFetch` ใส่ Owner, Source route, Domain และ Impact metadata ให้ Settings mutations จากจุดกลาง
- Mutation registry และ Audit ป้องกัน Owner ซ้ำหรือ Domain ไม่มีเจ้าของ

### Owner

| ความสามารถ | Owner |
|---|---|
| Route/Data-key ownership | `apps/web-admin/src/features/admin-modernization/settings-ownership.ts` |
| Mutation ownership | `apps/web-admin/app/admin-settings-mutation-owner.ts` |
| Website settings workspace | `/settings` |
| Provider/System settings workspace | `/system-settings` |

Member public runtime consumes the canonical site-settings snapshot through `SiteSettingsProvider` and `MemberRuntimeProvider`; route-local duplicate settings writers are not permitted.

## P7 — Design System Adoption และ CSS Cleanup

สถานะ: **เสร็จและ Merge แล้ว**

- Design-system ownership registry ครอบคลุม Shell, Appearance, Page, Card, Feedback, Button, Modal, Drawer, Table, Pagination, Form, Save bar, Diff และ Workspace tabs
- Audit ป้องกัน Capability owner ซ้ำ, Alias ชน และชื่อซ้อนแบบ `final-v2`, `new-new`, `v2`
- `AdminDrawer` เหลือ Implementation เดียวใน `admin-drawer.tsx`
- `admin-ui.tsx` เหลือ Compatibility re-export และลบ Legacy Drawer CSS แล้ว
- Canonical Drawer ใช้ CSS Module และ Theme tokens พร้อม Mobile, Forced colors และ Reduced motion
- Shared Table, Drawer, Form และ Feedback owners ถูกใช้ในเส้นทางใช้งานจริง
- `audit:admin-p5-p7` ตรวจ Owner, Saved-view adoption, URL state, Settings mutation metadata และ Legacy caller

## Verification gates

Final head ของ PR #492 ผ่าน required gates ก่อน merge รวม Build, Full-System, Security, Admin Functional Capability Audit, Admin Verification & Bundle, Browser Matrix, Quality, Frontend Architecture, UI System และ Visual Regression ที่เกี่ยวข้อง

## Definition of Done

- [x] P5 Owner กลางและการใช้งานจริงครบ Finance, Members และ Access
- [x] Saved-view UI และ URL table state อยู่ใน Shared table owner
- [x] P6 มี Write owner เพียงสอง Workspace และมี Mutation metadata จากจุดกลาง
- [x] ไม่มี Duplicate settings writer ตาม Registry
- [x] P7 มี Canonical Drawer Implementation เดียว
- [x] ไม่มี Component owner ชื่อซ้อนหรือ Versioned override ใน Scope ที่ตรวจ
- [x] Admin verify เรียก P5–P7 audit ทุกครั้ง
- [x] Sync `main` บน Final integration head
- [x] Required CI ผ่านบน Final head เดียวกัน
- [x] Merge PR #492 และยืนยัน Main commit `882643c496ffee91d540898a22cbc3951252996e`

Canonical cross-domain handoff: `docs/admin-operations-handoff.md`.
