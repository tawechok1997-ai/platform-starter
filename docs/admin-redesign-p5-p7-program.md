# Admin Redesign P5–P7 Program

PR นี้รวม P5, P6 และ P7 ไว้ในงานเดียวตามคำสั่งล่าสุด และจะ Merge เมื่อทั้งสาม Phase ผ่านเกณฑ์ร่วมครบเท่านั้น

Branch: `agent/admin-phase-5-7-data-settings-design-system`

Base: `main`

## กติกา Merge

- ห้าม Merge หลังจบเพียง P5 หรือ P6
- แยก Commit และ Checklist ตาม Phase เพื่อให้ตรวจย้อนหลังได้
- Shared owner ใหม่ต้องแทนของเดิม ห้ามสร้างระบบซ้อน
- ไม่ลด Route permission guard, Audit หรือการยืนยันการกระทำเสี่ยง
- ทุกความสามารถต้องรองรับ Desktop, Tablet, Mobile, Light/Dark, Compact และ Reduced motion
- Build, Typecheck, Unit, Full-system, Security, UI, Browser Matrix และ Visual Regression ต้องผ่านบน Head เดียวกัน

## P5 — Table, Form และ Detail UX

### เป้าหมาย

- Table owner กลาง รองรับ Server pagination, Filter, Sort และ Search
- Column preference และ Saved views ต่อผู้ใช้
- Mobile card view โดยไม่บังคับเลื่อนตารางแนวนอน
- Detail drawer กลาง พร้อม URL/deep-link state ที่คาดเดาได้
- Form controls และ Validation schema กลาง
- Sticky save bar, Unsaved changes guard และ Before/after diff
- Loading, Empty, Error และ Partial state ครบ

### งานหลัก

1. ขยาย `AdminDataTable` โดยไม่สร้าง Table owner ชุดที่สอง
2. สร้าง query-state contract สำหรับ page, pageSize, sort, filters และ search
3. สร้าง column visibility/order preference contract
4. สร้าง saved-view contract พร้อม versioning และ migration
5. สร้าง Detail drawer owner และ focus management
6. สร้าง form field/error/description owner กลาง
7. สร้าง dirty-state, save bar และ navigation guard
8. ย้ายหน้าตัวอย่างอย่างน้อยหนึ่งหน้าในแต่ละกลุ่ม Finance, Members และ Access มาใช้ระบบกลาง

## P6 — Settings Migration

### Owner ที่อนุญาต

- `/settings`
- `/system-settings`

### เป้าหมาย

- ทำ inventory ของ Settings route เดิมทั้งหมด
- จัดแต่ละ Route เป็น Keep, Merge, Redirect, Deprecated หรือ Remove
- หนึ่งค่าต้องมี Write owner เดียว
- Redirect เก่าต้องรักษา query/hash ที่จำเป็น
- Sensitive settings ต้องมี Permission, Confirm, Reason และ Audit
- Preview/Diff ก่อนบันทึกค่าที่กระทบ Member หรือ Provider

### งานหลัก

1. สร้าง Settings route inventory ที่ตรวจได้ด้วย test
2. สร้าง setting ownership registry และ duplicate-writer audit
3. รวมหมวด Branding, Contact, Legal, Feature, Maintenance, Script/SEO และ Game/Provider settings ตาม owner
4. เพิ่ม redirect/deprecation contracts
5. เพิ่ม change preview และ audit metadata contract
6. ยืนยันว่า Route เก่าไม่เขียนข้อมูลแข่งกับ Owner ใหม่

## P7 — Design System Adoption และ CSS Cleanup

### เป้าหมาย

- ใช้ Shell, Page, Card, Table, Form, Drawer, Modal และ Feedback owner กลาง
- รวม Token authority และลบ hardcoded page colors ที่ถูกแทนแล้ว
- ลบ component/CSS override ที่หมดหน้าที่หลังตรวจผู้ใช้ครบ
- ห้ามเพิ่มชื่อแนว `final`, `final-v2`, `new-new` เพื่อทับของเดิม
- ลด duplicated layout และ interaction logic

### งานหลัก

1. ทำ component ownership inventory
2. ทำ CSS/token ownership inventory
3. เพิ่ม audit ป้องกัน owner ซ้ำและ override รุ่นต่อรุ่น
4. ย้ายหน้า Admin ตามลำดับความถี่ใช้งานและความเสี่ยง
5. ลบ legacy component/CSS หลังไม่มี caller
6. ตรวจ Accessibility, high contrast และ reduced motion
7. เก็บ Browser/Visual evidence ทุก viewport

## ลำดับ Commit

1. `feat(admin-p5): centralize table form and detail UX`
2. `feat(admin-p6): consolidate settings ownership and routes`
3. `refactor(admin-p7): adopt design system and remove legacy owners`
4. `test(admin-p5-p7): close browser visual and migration gates`
5. `docs(admin-p5-p7): record final migration evidence`

## Definition of Done

- P5 checklist ครบและมีหน้าใช้งานจริง
- P6 inventory ไม่มี duplicate writer ค้าง
- P7 ไม่มี owner ซ้ำหรือ CSS override ที่เอกสารระบุให้ลบค้าง
- ไม่มี regression ต่อ P1 Appearance, P2 Access, P3 Navigation และ P4 Widget system
- PR เป็น Ready, mergeable และ CI required ผ่านบน commit ล่าสุด
