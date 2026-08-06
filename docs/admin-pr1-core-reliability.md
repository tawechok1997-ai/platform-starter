# Admin PR-1 — Core Reliability & Production Safety

## เป้าหมาย

ปิดงาน Critical ของ Admin ที่เกี่ยวกับข้อมูลผิดรูปแบบ, ข้อความภายในระบบหลุดสู่ UI, Asset 404, Preview รูป และ Error Boundary โดยไม่เปลี่ยนพฤติกรรมธุรกรรมเงินจริงหรือสิทธิ์ Backend

## ขอบเขตที่ปิดใน PR นี้

### Reconciliation contract

- ตรวจ Payload ก่อน Render
- Normalize ค่าเงินและ Summary
- ไม่แสดง `undefined`, `null`, `NaN` หรือข้อความ Backend ดิบ
- แยก Loading, Empty, Partial และ Error
- ปิด Export เมื่อข้อมูลยังไม่พร้อม
- เพิ่ม Incident ID สำหรับ Request และ Mutation ที่ล้มเหลว
- รองรับภาษาไทยและอังกฤษ

### Dashboard finance contract

- รองรับ Payload ปัจจุบันและ Payload บางส่วนที่ยังใช้ข้อมูลได้
- คำนวณ Totals จากรายการเมื่อ Summary ขาด
- เก็บข้อมูลหลักไว้เมื่อช่วงเปรียบเทียบล้มเหลว
- ใช้ Partial state แทนการทิ้ง Widget ทั้งก้อน
- ไม่แสดงข้อความ `Finance trend response is incomplete`
- เก็บ Raw error และ Contract issues ไว้ใน Log พร้อม Incident ID เท่านั้น

### Error boundaries

- Route Error Boundary มี Incident ID ทุกครั้ง
- เพิ่ม Global Error Boundary สำหรับข้อผิดพลาดระดับทั้งแอป
- ไม่แสดง Stack trace หรือ Raw backend message
- มี Retry, Dashboard และ Full reload actions ตามระดับปัญหา

### Image preview และ Asset ownership

- คืน `/images/close.svg` ที่เคย 404
- ปรับ Close icon ให้ใช้ Shared asset field จึงมี Upload และ Preview ก่อน Save
- นำ Tournament default asset มาไว้ที่ Admin origin สำหรับ Settings preview
- เพิ่ม Contract tests บังคับ Asset field ใช้ Preview owner กลาง
- ตรวจว่า Game/Provider assets มี Effective PC/Mobile preview

## สิ่งที่มีอยู่ใน `main` และใช้ต่อโดยไม่สร้าง Owner ซ้ำ

- Authenticated Admin Production smoke และ deployed commit verification
- Permission-aware navigation และ Direct route guard
- Role-aware Dashboard widgets
- Shared Settings form, Upload validation และ Preview panel
- Effective PC/Mobile preview ในหน้า Game assets
- Read-only Production smoke guard

## Test ที่เพิ่ม

- Finance current payload
- Finance partial/legacy payload
- Finance invalid payload
- Reconciliation missing/invalid values
- Money normalization
- Shared image preview ownership
- Close icon asset existence
- Tournament preview asset existence
- PC/Mobile effective preview contract

## Definition of Done

- Admin test, typecheck และ build ผ่าน
- Repository required checks ผ่านบน Head เดียวกัน
- ไม่มี Asset 404 ที่อยู่ในขอบเขต PR
- ไม่มี Developer error text บน Finance widget
- Reconciliation ไม่ Render `undefined`, `null` หรือ `NaN`
- Error Boundary แสดง Incident ID
- ทุก Image field ในขอบเขตใช้ Preview ก่อน Save
- PR mergeable และไม่มี Review thread ค้าง

## งานที่อยู่ใน PR-2 และ PR-3

- เก็บ Dashboard, Sidebar, Topbar, Access, Theme และ Tables ให้เป็น UI/UX รอบสุดท้าย
- Route/Button inventory ครบทุกหน้า
- Mutation tests บน Staging
- RBAC matrix รอบเต็ม
- Performance และ Accessibility acceptance
