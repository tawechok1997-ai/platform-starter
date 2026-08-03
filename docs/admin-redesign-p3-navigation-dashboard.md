# Admin Redesign P3: Navigation และ Role-aware Dashboard

PR: `#483`

Branch: `agent/admin-phase-3-navigation-dashboard`

Base: latest `main`

Status: โค้ด P3 ครบแล้ว รอ CI และ Merge

## ผลลัพธ์

- Workspace registry กลางครบ 5 แบบ: การเงิน, ฝากถอน, การตลาด, หัวหน้า และคนดูแลระบบ
- รองรับข้อมูล Assignment จาก P2 ผ่านสัญญา `AdminWorkspaceAssignment`
- รองรับผู้ใช้หลายตำแหน่งและตำแหน่งหลัก
- มี Workspace switcher พร้อมตัวเลือกดูทุกตำแหน่ง
- Sidebar, Favorites, Recent และ Command Palette ใช้ Workspace selection เดียวกัน
- Dashboard resolver เลือกบริบทและทางลัดตาม Workspace
- Profile แสดง Workspace ทุกตำแหน่งและระบุตำแหน่งหลัก
- รองรับภาษาไทยและอังกฤษ
- รองรับ Desktop, Tablet, Mobile, Reduced motion และ Theme owner จาก P1
- Permission guard เดิมยังเป็นด่านสุดท้าย ไม่มีการลดสิทธิ์ Route

## Owner ใหม่

| ความสามารถ | Owner |
|---|---|
| Workspace metadata | `apps/web-admin/app/(admin)/admin-workspace-registry.ts` |
| Role/permission fallback mapping | `inferAdminWorkspaceAssignments()` |
| Workspace selection | `AdminWorkspaceRuntime` |
| Navigation visibility | `resolveVisibleNavGroupIds()` |
| Dashboard composition | `admin-dashboard-resolver.ts` |
| Runtime storage | `admin_workspace_selection_v1` |
| Runtime event | `admin:workspace-change` |

## สัญญากับ P2

P2 ส่งข้อมูลได้โดยไม่ต้องให้ P3 import Prisma หรือ Role database model:

```ts
type AdminWorkspaceAssignment = {
  workspaceId: 'finance' | 'payments' | 'growth' | 'manager' | 'system';
  primary?: boolean;
  enabled?: boolean;
};
```

P3 รองรับทั้ง:

- `workspaceAssignments`
- `workspaces`
- Role object ที่มี `workspaceId`
- Role code/name แบบเดิม
- Permission fallback ระหว่างรอ P2 เชื่อมข้อมูลจริง

Deny และ Permission override ยังคงเป็นหน้าที่ของ P2/API permission authority ส่วน P3 ใช้ข้อมูลที่ผ่านการอนุญาตเพื่อจัด Navigation และ Dashboard เท่านั้น

## พฤติกรรม Multi-role

- ค่าเริ่มต้นใช้ตำแหน่งหลัก
- ผู้ใช้สลับ Workspace ได้จาก Topbar
- ผู้ใช้หลายตำแหน่งเลือก `ทุกตำแหน่งที่ได้รับ` เพื่อดูเมนูรวมได้
- Favorites และ Recent ที่อยู่นอก Workspace ปัจจุบันถูกซ่อน แต่ข้อมูลเดิมไม่ถูกลบ
- Route permission guard เดิมยังตรวจซ้ำก่อนแสดงเนื้อหา

## Dashboard resolver

แต่ละ Workspace มีทางลัดเฉพาะ:

- Finance: Reports, Wallet analytics, Reconciliation
- Payments: Review queue, Deposits, Withdrawals
- Growth: Growth overview, Promotion operations, Affiliate
- Manager: Review queue, Risk alerts, Admin team
- System: Provider health, Security, Settings
- All roles: รวมทางลัดแบบไม่ซ้ำจากทุก Workspace

## Profile

หน้า Profile แสดง:

- Role เดิมทั้งหมด
- Workspace ที่ได้รับทั้งหมด
- ตำแหน่งหลัก
- คำอธิบายขอบเขตของแต่ละ Workspace

## Tests

- `admin-workspace-registry.spec.ts`
- `admin-dashboard-resolver.spec.ts`
- `admin-workspace-runtime.spec.ts`

ครอบคลุม:

- Workspace ครบ 5 แบบ
- Multi-role และ Primary role
- P2 contract mapping
- Permission fallback
- Navigation union/filter
- Dashboard resolver
- Root owner เพียงชุดเดียว
- Sidebar/Favorites/Recent/Command Palette
- Profile และ Responsive contract
- ไม่แทนที่ Route permission guard

## ไฟล์ P3

- `apps/web-admin/app/(admin)/admin-workspace-registry.ts`
- `apps/web-admin/app/(admin)/admin-workspace-registry.spec.ts`
- `apps/web-admin/app/(admin)/admin-dashboard-resolver.ts`
- `apps/web-admin/app/(admin)/admin-dashboard-resolver.spec.ts`
- `apps/web-admin/app/admin-workspace-runtime.tsx`
- `apps/web-admin/app/admin-workspace-runtime.spec.ts`
- `apps/web-admin/app/admin-workspace-runtime.css`
- `apps/web-admin/app/layout.tsx`
- `apps/web-admin/app/(admin)/profile/page.tsx`

## เงื่อนไข Merge

- Branch ตาม `main` ทัน
- Build และ Typecheck ผ่าน
- Admin unit tests ผ่าน
- Full-system, Security, UI และ Browser regression ผ่าน
- PR เป็น mergeable
