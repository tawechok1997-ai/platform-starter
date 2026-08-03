# Admin Redesign Progress

เอกสารนี้เป็นแหล่งข้อมูลกลางสำหรับงานยกเครื่อง `apps/web-admin`

## กฎการทำงาน

- หนึ่ง Phase ใช้หนึ่ง PR
- เริ่ม Phase ถัดไปจาก `main` หลัง Phase ก่อนหน้าถูก Merge
- ของใหม่ต้องแทน Owner เดิม ห้ามสร้างระบบซ้อน
- Merge เมื่อ Build, Typecheck, Tests และการตรวจเฉพาะ Phase ผ่าน
- ทุก Phase ต้องรองรับ Desktop, Tablet และ Mobile
- ทุก PR ต้องอัปเดตเอกสารนี้ก่อน Merge

## เป้าหมายสุดท้าย

Admin ต้องใช้ระบบกลางชุดเดียวกันทุกหน้าและรองรับ:

- Light, Dark และ System theme
- Comfortable และ Compact density
- Normal และ High contrast
- System และ Reduced motion
- ตำแหน่งหลัก 5 แบบ: การเงิน, ฝากถอน, การตลาด, หัวหน้า, คนดูแลระบบ
- ผู้ใช้หนึ่งคนมีหลายตำแหน่ง
- Permission override, scope และวงเงินรายผู้ใช้
- Team hierarchy และหัวหน้าจัดการลูกน้อง
- Dashboard, Chart, Table, Form และ Settings กลาง
- Approval, No self-approval, 2FA และ Audit

## สถานะรวม

| Phase | ขอบเขต | สถานะ | PR |
|---|---|---|---|
| P1 | Appearance foundation และ Theme owner กลาง | Merge แล้ว | #445 |
| P2 | Role 5 แบบ, Multi-role และ Team | กำลังทำในอีก PR | - |
| P3 | Navigation registry และ Dashboard ตามตำแหน่ง | โค้ดครบ รอ CI/Merge | #483 |
| P4 | Chart system และ Widget registry | ยังไม่เริ่ม | - |
| P5 | Table, Form และ Detail drawer กลาง | ยังไม่เริ่ม | - |
| P6 | Settings migration และ System Settings | ยังไม่เริ่ม | - |
| P7 | Design System adoption และ CSS cleanup | ยังไม่เริ่ม | - |
| P8 | Security, Accessibility และ Browser Matrix | ยังไม่เริ่ม | - |

---

# P1: Appearance Foundation

PR: `#445`

Branch: `agent/admin-phase-1-appearance-foundation`

Head commit: `e5c10b9652e9d2be50f171272ddf4b6e99d4fd06`

Merge commit: `fea8afb147c3059166b4036fe3f56bdcdfcd8fff`

Merge method: `squash`

Merged: `2026-08-03`

## ผลการตรวจ

- Required CI workflows ผ่านครบ 18 รายการ
- Build, Typecheck, Unit, Full-system, Security, Accessibility และ Visual Regression ผ่าน
- PR อยู่ในสถานะ mergeable ก่อน Merge

## ทำแล้ว

- เพิ่ม Appearance owner กลาง `AdminAppearanceRuntime`
- ใช้ Storage key เดียว `admin_appearance_preferences_v1`
- รองรับ Theme: Light, Dark, System
- รองรับ Density: Comfortable, Compact
- รองรับ Contrast: Normal, High
- รองรับ Motion: System, Reduced
- เพิ่ม Theme bootstrap ใน `<head>` ก่อน React hydration
- ใช้ปุ่ม Appearance ใน `.admin-topbar-actions`
- ใช้ปุ่มลอยบนหน้า Login หรือหน้าที่ไม่มี Topbar
- รองรับภาษาไทยและอังกฤษจาก Locale owner เดิม
- เพิ่ม Admin-only theme tokens โดยไม่เปลี่ยน Member theme
- เพิ่ม Mobile bottom-sheet layout สำหรับ Appearance panel
- เพิ่ม Contract tests สำหรับ Owner และ data attributes กลาง
- แยก PR ให้เหลือเฉพาะไฟล์ Admin P1 และเอกสารฉบับนี้

## Owner ใหม่

| ความสามารถ | Owner ใหม่ | ของเดิมที่ถูกแทน |
|---|---|---|
| Theme preference | `app/admin-appearance-runtime.tsx` | Root layout ที่ล็อก Dark |
| Appearance storage | `admin_appearance_preferences_v1` | ค่า theme แบบกระจัดกระจาย |
| Theme tokens | `app/admin-appearance-foundation.css` | Dark-only page overrides |
| Pre-hydration theme | `app/layout.tsx` bootstrap | รอ Client render ก่อนกำหนด Theme |

## ไฟล์ใน P1

- `apps/web-admin/app/admin-appearance-runtime.tsx`
- `apps/web-admin/app/admin-appearance-foundation.css`
- `apps/web-admin/app/admin-appearance-runtime.spec.ts`
- `apps/web-admin/app/layout.tsx`
- `docs/admin-redesign-progress.md`

## สิ่งที่ไม่รวมใน P1

- Role 5 แบบและ Multi-role database model
- Team hierarchy และการสร้างลูกน้อง
- Role-aware navigation และ Dashboard resolver
- Chart engine, Table, Form และ Settings migration
- การลบ CSS เดิมจำนวนมาก

---

# P2: Role, Multi-role และ Team

Branch: `agent/admin-phase-2-role-multirole-team`

Base: latest `main` หลัง Merge PR `#445` และอัปเดตเอกสารผล Merge

Status: ทำแบบขนานในอีก PR โดย P2 เป็นเจ้าของ Role, Permission override, Scope, Team และฐานข้อมูล

## เป้าหมาย

- Role template 5 แบบ
- ผู้ใช้มีตำแหน่งหลักหนึ่งตำแหน่งและตำแหน่งเสริมหลายตำแหน่ง
- Deny ชนะ Allow
- Permission override รายผู้ใช้
- Scope และวงเงิน
- Team hierarchy
- หัวหน้าสร้างลูกน้องและแจกสิทธิ์ได้ไม่เกินสิทธิ์ตนเอง
- Preview เมนูและสิทธิ์ก่อนสร้างผู้ใช้
- Audit การสร้างและแก้ไขผู้ใช้

## จุดที่ต้องตรวจ

- `AdminUser`
- `AdminRole`
- หน้า `admin-accounts`
- หน้า `admin-roles`
- หน้า `admin-invitations`
- API access overview
- Seed permissions
- Permission guard ทุก Route

---

# P3: Navigation และ Role-aware Dashboard

PR: `#483`

Branch: `agent/admin-phase-3-navigation-dashboard`

Status: โค้ดครบ รอ CI และ Merge

## ทำแล้ว

- เพิ่ม Workspace registry กลางครบ 5 ตำแหน่ง
- เพิ่มสัญญา `AdminWorkspaceAssignment` สำหรับรับข้อมูลจาก P2
- รองรับ Multi-role, Primary role และตัวเลือกดูทุกตำแหน่ง
- เพิ่ม Workspace switcher ใน Topbar
- ให้ Sidebar, Favorites, Recent และ Command Palette ใช้ selection กลางชุดเดียวกัน
- เพิ่ม Dashboard resolver และทางลัดตามตำแหน่ง
- เพิ่ม Profile workspace list และตัวระบุตำแหน่งหลัก
- รองรับไทย/อังกฤษ, Desktop/Tablet/Mobile และ Reduced motion
- ไม่แตะ Prisma, Team hierarchy หรือ Permission override ของ P2
- ไม่ลด Route permission guard เดิม

## Owner ใหม่

| ความสามารถ | Owner |
|---|---|
| Workspace metadata | `app/(admin)/admin-workspace-registry.ts` |
| P2 mapping/fallback | `inferAdminWorkspaceAssignments()` |
| Workspace selection | `app/admin-workspace-runtime.tsx` |
| Navigation visibility | `resolveVisibleNavGroupIds()` |
| Dashboard composition | `app/(admin)/admin-dashboard-resolver.ts` |
| Storage | `admin_workspace_selection_v1` |
| Runtime event | `admin:workspace-change` |

## Tests

- `app/(admin)/admin-workspace-registry.spec.ts`
- `app/(admin)/admin-dashboard-resolver.spec.ts`
- `app/admin-workspace-runtime.spec.ts`

รายละเอียดเต็มอยู่ที่ `docs/admin-redesign-p3-navigation-dashboard.md`

---

# P4: Chart และ Widget System

- Chart wrapper และ Widget registry กลาง
- Date range และ Compare period
- Drill-down และ Fullscreen
- Export CSV/PNG
- Loading, Empty, Error และ Partial data
- Saved layout ต่อผู้ใช้
- Drag, Resize, Pin และ Restore default

---

# P5: Table, Form และ Detail UX

- Table logic กลางพร้อม Server pagination, Filter และ Sort
- Column preference และ Saved views
- Mobile card view
- Detail drawer กลาง
- Form controls และ Validation schema กลาง
- Sticky save bar และ Unsaved changes
- Before/after diff

---

# P6: Settings Migration

ใช้ Owner สอง Workspace เท่านั้น:

- `/settings`
- `/system-settings`

ทุก Settings เดิมต้องถูกจัดเป็น ใช้ต่อ, รวม, Redirect, Deprecated หรือลบ และห้าม Route เก่ากับใหม่บันทึกค่าเดียวกันพร้อมกัน

---

# P7: Design System Adoption และ CSS Cleanup

- ทุกหน้าใช้ Shell, Page, Card, Form, Table, Drawer และ Modal กลาง
- รวม Token authority
- ลบ override ที่หมดหน้าที่หลังตรวจผู้ใช้ครบ
- ไม่มีสี hardcode ใน page component
- ไม่มี component ซ้ำหน้าที่
- ห้ามเพิ่ม `final-v2` หรือ override ใหม่เพื่อแก้ override เก่า

---

# P8: Security และ Release Readiness

- Approval policy และ No self-approval
- Step-up 2FA
- Session และ Device management
- Sensitive reveal audit
- Accessibility WCAG AA
- Reduced motion และ High contrast
- Browser Matrix ทุก Role และ Viewport
- Visual regression, Performance audit และ Production smoke test

---

# รูปแบบรายงานหลังแต่ละ PR

```text
PR:
Branch:
Head commit:
Merge commit:
Files changed:
Features completed:
Legacy owners replaced:
Routes redirected:
Components removed:
CSS removed:
Tests passed:
Known limitations:
Remaining work:
```
