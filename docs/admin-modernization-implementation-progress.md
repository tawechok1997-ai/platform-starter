# Admin Modernization Implementation Progress

สถานะเอกสาร: Active implementation tracker  
Branch: `fix/admin-shell-responsive-layout`

เอกสารอ้างอิง:

- [`admin-experience-modernization-spec.md`](./admin-experience-modernization-spec.md)
- [`admin-complete-route-coverage-spec.md`](./admin-complete-route-coverage-spec.md)

> เอกสารนี้ติดตาม implementation บน branch ปัจจุบัน ไม่แทนที่ Master Project Worklist

## Foundation ที่เสร็จแล้ว

- [x] รวม Admin shell breakpoint เป็น contract เดียวที่ 1100px
- [x] แก้ sidebar offset ซ้ำ, content width, overflow และ card clipping
- [x] แก้ Profile popover และ Logout ให้อยู่ใน viewport
- [x] ลด Sidebar ประจำวันเหลือ 11 workspaces
- [x] คง specialist routes ผ่าน Command Palette และ deep links เดิม
- [x] รักษา least-privilege permission ต่อ route
- [x] ทำ route inventory สำหรับ Admin 88 routes
- [x] กำหนด workspace owner ครบ 88/88 routes
- [x] บังคับ route ownership ใน local verify และ GitHub Actions
- [x] สร้าง shared Pagination, DataTable, Mobile list และ WorkspaceTabs
- [x] เพิ่ม reduced-motion และ responsive adoption layer
- [x] เพิ่ม read-only authenticated browser smoke พร้อม mutation guard

## หน้าที่ปรับแล้ว

### Wallet Ledgers

- [x] เปลี่ยน long card feed เป็น responsive accounting table
- [x] ใช้ server pagination และ page-size control
- [x] เพิ่ม compact mobile list
- [x] คง filter, CSV export, references และ money formatting
- [x] แยกภาษาไทยและอังกฤษ

### Audit Logs

- [x] เปลี่ยน long audit cards เป็น compact table
- [x] คง filter, export, related-resource links และ pagination
- [x] แสดง before/after เฉพาะเมื่อเปิดรายละเอียด
- [x] คง payload redaction
- [x] แยกภาษาไทยและอังกฤษ

### Roles & Permissions

- [x] ลด permission catalog ที่ยาวหลายพันพิกเซล
- [x] เพิ่ม Access & Security workspace tabs
- [x] เพิ่ม role summary cards
- [x] แบ่ง permission ตาม module ด้วย collapsible groups
- [x] เพิ่ม search, module filter และ pagination 20/50/100
- [x] เพิ่ม responsive table/mobile list และ detail drawer
- [x] คงหน้าเป็น read-only เพื่อไม่เปลี่ยน access mutation flow
- [x] แยกภาษาไทยและอังกฤษ

## Safety และ CI ที่เสร็จแล้ว

- [x] แก้ Admin tests เดิม 5 จุด
- [x] Admin lint ผ่าน
- [x] Admin tests ผ่าน
- [x] Admin production bundle analysis ผ่าน
- [x] Architecture boundaries ผ่าน
- [x] Admin API permission audit ผ่าน
- [x] Admin UI permission audit ผ่าน
- [x] Route inventory ผ่าน 88/88 routes
- [x] R-013 visual regression 6 viewports ผ่าน
- [x] อัปเดต PostCSS override เป็น `8.5.23`
- [x] Regenerate `pnpm-lock.yaml` ด้วย pnpm จริง
- [x] Dependency audit, committed-secret scan และ runtime environment tests ผ่าน
- [x] คืน Security workflow เป็น `contents: read`
- [x] ลบ temporary lock refresh workflow
- [x] เก็บ Architecture และ Security failure evidence เป็น CI artifacts

## กำลังดำเนินการ

- [ ] Admin Route × Role × Viewport browser matrix บน head ล่าสุด
- [ ] Authenticated deployed workspace smoke ด้วย seeded Admin credentials
- [ ] Security workspace compact session/history layout
- [ ] Settings workspace consolidation
- [ ] Remaining long-list page adoption

## Safety rules สำหรับงานที่เหลือ

1. ไม่เปลี่ยน finance state transitions พร้อมงาน UI
2. ไม่ลด API permission policy เพื่อให้ UI ผ่าน
3. Mutation สำคัญต้องคง confirmation, step-up และ audit trail
4. Route เดิมต้องยังใช้ได้หรือมี compatibility redirect
5. ใช้ shared components ก่อนเพิ่ม page-specific CSS
6. ทำเป็น commit ย่อยที่ย้อนกลับได้
7. ต้องผ่าน route inventory, lint, tests, bundle, architecture, security และ visual gates ก่อน merge
