# Admin Redesign P5–P7 Program

PR: `#492`

Branch: `agent/admin-phase-5-7-data-settings-design-system`

Base: `main`

PR นี้รวม P5, P6 และ P7 ไว้ในงานเดียว และจะ Merge เมื่อทั้งสาม Phase ผ่านเกณฑ์ร่วมครบเท่านั้น

## กติกา Merge

- ห้าม Merge หลังจบเพียง P5 หรือ P6
- แยก Commit และ Checklist ตาม Phase เพื่อให้ตรวจย้อนหลังได้
- Shared owner ใหม่ต้องแทนของเดิม ห้ามสร้างระบบซ้อน
- ไม่ลด Route permission guard, Audit หรือการยืนยันการกระทำเสี่ยง
- ทุกความสามารถต้องรองรับ Desktop, Tablet, Mobile, Light/Dark, Compact และ Reduced motion
- Build, Typecheck, Unit, Full-system, Security, UI, Browser Matrix และ Visual Regression ต้องผ่านบน Head เดียวกัน

## P5 — Table, Form และ Detail UX

### ทำแล้ว

- เพิ่ม query-state contract กลางสำหรับ page, pageSize, search, sort และ filter
- เพิ่ม serializer ที่ใช้ `take` ตาม API contract และรีเซ็ตหน้าเมื่อ query เปลี่ยน
- เพิ่ม column preference และ saved-view schema แบบ versioned ต่อผู้ใช้/Workspace
- เพิ่ม form error normalization, before/after diff และ sensitive-value redaction
- เพิ่ม `AdminFormField`, Error summary, Sticky save bar, Unsaved changes guard และ Diff list
- ขยาย `AdminDataTable` owner เดิมให้รองรับ Sort, Column visibility และ `aria-sort`
- รักษา Mobile card view, Loading, Empty และ Server pagination ใน owner เดิม
- ย้าย Finance `/exports` จาก table/pagination เฉพาะหน้าไปใช้ `AdminDataTable`
- ย้าย Members `/members` ไปใช้ `AdminDataTable` และ Canonical `AdminDrawer`
- ย้าย Access `/admin-invitations` ไปใช้ `AdminDataTable` และลบ inline layout styles
- ย้าย `/activity-center` ไปใช้ Canonical `AdminDrawer`

### Owner

| ความสามารถ | Owner |
|---|---|
| Table query state | `src/features/admin-modernization/data-query-state.ts` |
| Column/Saved views | `src/features/admin-modernization/data-view-preferences.ts` |
| Responsive table | `src/features/admin-modernization/data-table.tsx` |
| Form state/Diff | `src/features/admin-modernization/form-state.ts` |
| Form fields/Save bar | `src/features/admin-modernization/admin-form-controls.tsx` |
| Detail drawer | `app/(admin)/_components/admin-drawer.tsx` |

### เหลือ

- ต่อ Saved view UI เข้าหน้า Server-table หลัก
- ต่อ URL query-state เข้าหน้า `/activity` และหน้า Queue ที่เหลือ
- ย้าย Detail drawer เฉพาะหน้าอื่นที่ยังเหลือ
- เพิ่ม Browser interaction สำหรับ Sort, Mobile card, Drawer focus และ Unsaved guard

## P6 — Settings Migration

### ทำแล้ว

- ล็อก Write owner ที่อนุญาตไว้เพียง `/settings` และ `/system-settings`
- เพิ่ม Route inventory พร้อมสถานะ Keep, Merge, Redirect, Deprecated และ Remove
- เพิ่ม Data-key ownership และ duplicate-writer validation
- เพิ่ม Redirect helper ที่รักษา query/hash
- เพิ่ม Sensitive change policy: Permission, Confirm, Reason และ Audit action
- เพิ่ม `/system-settings` workspace กลางสำหรับ Provider, Credential และ Game configuration
- เพิ่ม tests ล็อก owner, redirect และ sensitive-change contract

### Owner

| ความสามารถ | Owner |
|---|---|
| Route/Data-key ownership | `src/features/admin-modernization/settings-ownership.ts` |
| Website settings | `/settings` |
| Provider/System settings | `/system-settings` |

### เหลือ

- ย้าย Form และ API write จริงจาก Legacy routes เข้า Owner กลาง
- เพิ่ม Preview/Diff ก่อนบันทึกค่าที่กระทบ Member/Provider
- เปลี่ยน Legacy routes เป็น Redirect หลัง Owner ใหม่มีความสามารถเทียบเท่า
- ยืนยันด้วย audit ว่าไม่มี duplicate writer เหลือจริง

## P7 — Design System Adoption และ CSS Cleanup

### ทำแล้ว

- เพิ่ม Design-system ownership registry สำหรับ Shell, Appearance, Page, Card, Feedback, Button, Modal, Drawer, Table, Pagination, Form, Save bar, Diff และ Workspace tabs
- เพิ่ม audit ป้องกัน capability owner ซ้ำ, alias ชน และชื่อแนว `final-v2`/`new-new`
- เลือก `app/(admin)/_components/admin-drawer.tsx` เป็น Canonical drawer
- ย้าย Canonical drawer จาก inline global CSS ไป CSS module ที่ใช้ Theme tokens
- เพิ่ม forced-colors, Mobile full viewport และ Reduced-motion contract
- ย้าย Finance, Member, Access และ Activity surfaces ชุดแรกไปใช้ owner กลาง
- เพิ่ม `audit:admin-p5-p7` เข้า Admin `verify`

### เหลือ

- ลบ Legacy `AdminDrawer` implementation ที่ฝังใน `admin-ui.tsx` หลังยืนยัน caller ครบ
- ทำ component/CSS caller inventory ทั้ง Admin
- ย้ายหน้าใช้งานที่เหลือและลบ CSS override ที่หมดหน้าที่
- ตรวจ hardcoded color และ local modal/table/form owners ทั้งหมด
- เก็บ Browser/Visual evidence ทุก viewport

## Tests ที่เพิ่ม

- `data-query-state.spec.ts`
- `data-view-preferences.spec.ts`
- `form-state.spec.ts`
- `settings-ownership.spec.ts`
- `design-system-ownership.spec.ts`
- `system-settings-owner.spec.ts`
- `activity-detail-owner.spec.ts`
- `export-history-data-table.spec.ts`
- `admin-invitations-data-table.spec.ts`
- `members-data-ux-owner.spec.ts`
- `audit-admin-p5-p7.mjs`

## สถานะปัจจุบัน

- P5: Owner กลางและ Route adoption ชุดแรกเสร็จแล้ว แต่ Saved view/URL-state/Browser interaction ยังเหลือ
- P6: Ownership และ Policy เสร็จแล้ว แต่การย้าย Write path จริงยังเหลือ
- P7: Registry, Audit, Canonical drawer และ Route adoption ชุดแรกเสร็จแล้ว แต่ Legacy cleanup ทั้งโครงการยังเหลือ
- PR: Draft และยังห้าม Merge

## Definition of Done

- P5 checklist ครบและมีหน้าใช้งานจริงทุกกลุ่ม Finance, Members และ Access
- P6 inventory ไม่มี duplicate writer ค้าง
- P7 ไม่มี owner ซ้ำหรือ CSS override ที่กำหนดให้ลบค้าง
- ไม่มี regression ต่อ P1 Appearance, P2 Access, P3 Navigation และ P4 Widget system
- Branch ตาม `main` ทัน
- PR เป็น Ready, mergeable และ CI required ผ่านบน commit ล่าสุด
