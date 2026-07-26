# Admin Modernization Implementation Progress

สถานะเอกสาร: **Implementation complete — ready for review**  
Branch: `fix/admin-shell-responsive-layout`

เอกสารอ้างอิง:

- [`admin-experience-modernization-spec.md`](./admin-experience-modernization-spec.md)
- [`admin-complete-route-coverage-spec.md`](./admin-complete-route-coverage-spec.md)

> เอกสารนี้สรุป implementation บน branch ปัจจุบัน ไม่แทนที่ Master Project Worklist

## Foundation ที่เสร็จแล้ว

- [x] รวม Admin shell breakpoint เป็น contract เดียวที่ 1100px
- [x] แก้ sidebar offset ซ้ำ, content width, overflow และ card clipping
- [x] แก้ Profile popover และ Logout ให้อยู่ใน viewport
- [x] แยก mobile drawer semantics ออกจาก desktop collapse semantics
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

### Admin Security

- [x] แยก Overview, Sessions, 2FA และ Owner recovery เป็น URL-backed tabs
- [x] เปลี่ยน session cards เป็น responsive table/mobile list พร้อม pagination 10/20/50
- [x] คง confirmation สำหรับ revoke, logout, disable 2FA และ regenerate codes
- [x] คง sensitive-data TTL 5 นาทีและ local-session cleanup
- [x] แยกภาษาไทยและอังกฤษ

### Settings

- [x] รวมหน้า Settings เป็น 6 หมวดผ่าน URL section tabs
- [x] เพิ่ม search ข้ามหมวด
- [x] แยกปลายทางทั่วไป, ปฏิบัติการ และข้อมูลสำคัญ
- [x] เพิ่ม responsive card grid และ reduced-motion behavior
- [x] แยกภาษาไทยและอังกฤษ

### Detailed Activity Timeline

- [x] เปลี่ยน stacked rows และ JSON ต่อแถวเป็น server-paginated table
- [x] เพิ่ม mobile list, filters, page size 20/50/100 และ detail drawer
- [x] เปิด payload รายละเอียดเมื่อผู้ใช้เลือกดู ไม่ render JSON ทุกแถว
- [x] คง member, top-up, withdrawal, ledger และ audit deep links
- [x] แยกภาษาไทยและอังกฤษ

## Safety และ CI ที่เสร็จแล้ว

- [x] แก้ Admin tests เดิม 5 จุด
- [x] ย้าย Admin safety tests ที่เหลือจาก `vitest` เป็น `node:test`
- [x] Admin lint ผ่าน
- [x] Admin tests ผ่าน
- [x] Admin production bundle analysis ผ่าน
- [x] Admin และ Member typecheck ผ่าน
- [x] Architecture boundaries ผ่าน
- [x] Admin API permission audit ผ่าน
- [x] Admin UI permission audit ผ่าน
- [x] Route inventory ผ่าน 88/88 routes
- [x] R-013 visual regression 6 viewports ผ่าน
- [x] Route × Role × Viewport browser matrix ผ่านบน production build ของ branch
- [x] Browser matrix ใช้ 5 role profiles, 9 representative routes และ 3 viewports
- [x] Browser matrix ตรวจ mobile drawer, Escape, permission denied และ horizontal overflow
- [x] แก้ mobile menu accessible name และ `aria-expanded` ให้ตรงสถานะ Drawer
- [x] อัปเดต PostCSS override เป็น `8.5.23`
- [x] Regenerate `pnpm-lock.yaml` ด้วย pnpm จริง
- [x] Dependency audit, committed-secret scan และ runtime environment tests ผ่าน
- [x] คืน Security workflow เป็น `contents: read`
- [x] ลบ temporary write workflow/permission หลังใช้งาน
- [x] เก็บ Architecture, Security, Route, Visual และ Browser evidence เป็น CI artifacts

## Deployment evidence ที่ต้องใช้ environment จริง

Authenticated deployed workspace smoke ถูกสร้างและผ่าน static workflow audit แล้ว แต่การรันต้องมี seeded Admin identity/password และ deployed URL ใน GitHub Secrets/Variables การตรวจนี้เป็น deployment credential gate ไม่ใช่งาน implementation ที่ค้างใน source code และ workflow มี mutation guard บล็อก request หลัง login ทุก method ยกเว้น GET, HEAD และ OPTIONS

## สถานะภายนอกขอบเขต Admin

Repository-wide Build/Quality Gate ยังแดงเฉพาะ API test suite ซึ่ง branch นี้ไม่ได้แก้ไฟล์ใน `apps/api/src` เลย ฝั่ง `web-admin` และ `web-member` build/typecheck ผ่าน ส่วน Admin lint, tests, bundle, architecture, permissions, route inventory, security, visual และ browser matrix ผ่านครบแล้ว

## Safety rules ที่คงบังคับ

1. ไม่เปลี่ยน finance state transitions พร้อมงาน UI
2. ไม่ลด API permission policy เพื่อให้ UI ผ่าน
3. Mutation สำคัญต้องคง confirmation, step-up และ audit trail
4. Route เดิมต้องยังใช้ได้หรือมี compatibility redirect
5. ใช้ shared components ก่อนเพิ่ม page-specific CSS
6. ทำเป็น commit ย่อยที่ย้อนกลับได้
7. ต้องผ่าน route inventory, lint, tests, bundle, architecture, security และ visual/browser gates ก่อน merge
