# Admin Redesign P2: Role, Multi-role, Team และ Effective Access

## Pull request

- PR: `#533`
- Branch: `rebuild/admin-phase-2-governance-20260804`
- Base: `main` หลัง P1, P3 และ P5–P7 Merge
- สถานะ: Draft ระหว่างปิด CI และ Browser verification
- PR เดิม `#477` ถูกแทนด้วย rebuild นี้ เพราะ branch เดิม conflict กับ `main`

## ขอบเขต

P2 เป็น owner ของระบบสิทธิ์ผู้ดูแลระดับข้อมูลและ runtime ได้แก่

- Role template 5 แบบ
- ผู้ดูแลหนึ่งคนมีหลาย Role
- Primary role
- Team hierarchy และ Team lead
- Manager/Subordinate reporting line
- Permission override แบบ `ALLOW` และ `DENY`
- Scope และ Approval limits รายผู้ใช้
- Effective access resolver
- Session invalidation หลัง privilege mutation
- Audit evidence ทุก mutation

## Role templates

Role template ถูกกำหนดแบบ deterministic ใน
`apps/api/src/modules/admin-access/admin-role-templates.ts`

1. `finance`
2. `deposit_withdrawal`
3. `marketing`
4. `manager`
5. `system_admin`

`prisma/seed-access.ts` เป็น owner สำหรับ upsert permission, role และ role-permission mapping โดยตรวจ permission ที่หายก่อนเขียนฐานข้อมูล

## กฎสิทธิ์

- `DENY` ชนะ Role, Delegation, `ALLOW` และ Wildcard
- ผู้จัดการแจก Role หรือ Permission สูงกว่าสิทธิ์ตนเองไม่ได้
- Protected Owner/Super Admin แก้ผ่าน role synchronization ปกติไม่ได้
- ผู้ใช้หนึ่งคนมี Role ได้สูงสุด 8 รายการ
- Primary role ต้องอยู่ใน Role ที่เลือก
- Scope และ Approval limits ต้องเป็น JSON object และมีขนาดจำกัด
- Manager จัดการได้เฉพาะ Team ของตนและ Direct subordinate
- ถ้าโหลด DENY, Scope, Team หรือ Reporting policy ไม่สำเร็จ Admin session ถูกปฏิเสธแบบ fail-closed
- Delegation เป็นสิทธิ์เสริม หาก lookup ล้มเหลวระบบทำงานต่อโดยไม่เพิ่ม Delegated permissions

## Database migration

Migration:

`prisma/migrations/20260803070000_add_admin_team_access_governance/migration.sql`

เพิ่มตาราง:

- `admin_teams`
- `admin_team_members`
- `admin_reporting_lines`
- `admin_permission_overrides`
- `admin_access_profiles`

ข้อจำกัดสำคัญ:

- Team เป็น Parent ของตนเองไม่ได้
- Subordinate มี Direct manager ได้หนึ่งคน
- Reporting line ห้ามอ้างตนเอง
- Permission override ต่อผู้ใช้และ Permission ต้องไม่ซ้ำ
- Override effect รับเฉพาะ `ALLOW` หรือ `DENY`
- Scope และ Approval limits ต้องเป็น JSON object

## API endpoints

### Role และ Invitation

- `POST /admin/access/role-preview`
- `PATCH /admin/access/admin-users/:adminUserId/roles`
- `POST /admin/access/invitations`
  - `roleIds`
  - `primaryRoleId`
  - `department`
  - `expiresInHours`

### Team และ Reporting line

- `GET /admin/access/teams`
- `POST /admin/access/teams`
- `PATCH /admin/access/teams/:teamId`
- `POST /admin/access/teams/:teamId/members`
- `DELETE /admin/access/teams/:teamId/members/:adminUserId`
- `PATCH /admin/access/admin-users/:adminUserId/reporting-line`

### Effective access

- `GET /admin/access/admin-users/:adminUserId/effective-access`
- `PATCH /admin/access/admin-users/:adminUserId/permission-overrides`
- `DELETE /admin/access/admin-users/:adminUserId/permission-overrides/:permissionCode`
- `PATCH /admin/access/admin-users/:adminUserId/access-profile`

## Runtime owners

| ความสามารถ | Owner |
|---|---|
| Effective permission union และ DENY precedence | `admin-effective-access.ts` |
| Role selection และ privilege grant policy | `admin-role-policy.ts` |
| Multi-role synchronization | `admin-role-assignment.service.ts` |
| Team, Reporting, Override และ Profile | `admin-access-governance.service.ts` |
| Session invalidation | `admin-access-session.service.ts` |
| Admin invitation transaction | `admin-invitation-admin.service.ts` |
| Session policy hydration | `admin-auth.guard.ts` |
| Route permission enforcement | `permissions.guard.ts` |

## Admin UI

### Roles & Teams workspace

`apps/web-admin/app/(admin)/admin-roles/page.tsx`

- Multi-role selection สูงสุด 8 Role
- Primary role
- Role preview ก่อนบันทึก
- Team hierarchy
- Team membership และ Team lead
- Reporting line
- Effective allowed/denied access
- Permission override
- Scope และ Approval limits
- Desktop, Tablet, Mobile และ Reduced motion

### Invitations

`apps/web-admin/app/(admin)/access/invite-admin-panel.tsx`

- เลือกหลาย Role
- Primary role
- Department
- Preview ก่อนสร้างคำเชิญ
- Token แสดงครั้งเดียวและถูกล้างจากหน้าจอ

### Admin accounts

`apps/web-admin/app/(admin)/admin-accounts/page.tsx`

- Primary role และ Role ทั้งหมด
- Security และ Effective access โหลดพร้อมกัน
- Teams
- DENY
- Scope และ Approval limits
- Sessions, Login history และ Status timeline

## Tests และ CI gates

- Unit tests สำหรับ Role policy และ DENY precedence
- Permission guard tests
- Fail-closed auth contract
- Admin status contract
- Session invalidation tests
- PostgreSQL governance integration tests
- UI source contracts สำหรับ Roles และ Admin Accounts
- R-009 invitation transaction audit
- Build workflow apply governance migration ก่อน API tests
- R-006 Quality workflow บังคับ invitation transaction audit

## งานก่อน Merge

- ปิด TypeScript, Jest, PostgreSQL และ Admin UI failures จาก CI รอบล่าสุด
- รัน Build, Full-System, Security, Quality และ Query gates ให้ผ่าน
- รัน Admin Browser Matrix บน Desktop, Tablet และ Mobile
- ตรวจ Migration และ `db:seed:access` บนฐานข้อมูล disposable
- เอา PR ออกจาก Draft หลัง required checks ผ่าน
- Merge เข้า `main` และยืนยัน commit หลัง Merge
