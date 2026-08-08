# Admin Redesign P2: Role, Multi-role, Team และ Effective Access

## สถานะปัจจุบัน

- PR: `#533`
- Final branch: `rebuild/admin-phase-2-governance-20260804`
- สถานะ: **Merged**
- Main merge commit: `666955e2e509d2f8a0f499153479b3d6aea676af`
- PR เดิม `#477` ถูก supersede เพราะ branch เดิม conflict กับ `main`

P2 เป็น owner ของระบบสิทธิ์ผู้ดูแลระดับข้อมูลและ runtime ได้แก่ Role, Multi-role, Team, Reporting line, Permission override, Scope, Approval limits, Effective access, Session invalidation และ Audit evidence หลัง mutation สำคัญ

## Role templates

Role template ถูกกำหนดแบบ deterministic ใน `apps/api/src/modules/admin-access/admin-role-templates.ts`:

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

Migration: `prisma/migrations/20260803070000_add_admin_team_access_governance/migration.sql`

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
- Team hierarchy และ membership
- Reporting line
- Effective allowed/denied access
- Permission override
- Scope และ Approval limits

### Invitations

`apps/web-admin/app/(admin)/access/invite-admin-panel.tsx`

- เลือกหลาย Role และ Primary role
- Department
- Preview ก่อนสร้างคำเชิญ
- Token แสดงครั้งเดียวและถูกล้างจากหน้าจอ

### Admin accounts

`apps/web-admin/app/(admin)/admin-accounts/page.tsx`

- Primary role และ Role ทั้งหมด
- Security และ Effective access
- Teams และ DENY
- Scope และ Approval limits
- Sessions, Login history และ Status timeline

## Final verification

PR #533 ผ่าน required repository gates ก่อน merge และ implementation อยู่บน `main` แล้ว งานหลัง P2 ต้องเริ่มจาก `main` ปัจจุบัน ไม่ย้อนเปิด branch เก่า

Canonical cross-domain handoff: `docs/admin-operations-handoff.md`.
