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
| P2 | Role 5 แบบ, Multi-role และ Team | กำลังทำในอีก PR | #477 |
| P3 | Navigation registry และ Dashboard ตามตำแหน่ง | Merge แล้ว | #483 |
| P4 | Chart system และ Widget registry | กำลังทำแบบ Draft | #487 |
| P5 | Table, Form และ Detail drawer กลาง | ยังไม่เริ่ม | - |
| P6 | Settings migration และ System Settings | ยังไม่เริ่ม | - |
| P7 | Design System adoption และ CSS cleanup | ยังไม่เริ่ม | - |
| P8 | Security, Accessibility และ Browser Matrix | ยังไม่เริ่ม | - |

> P4 ถูกเปิดเป็น Draft แยกจาก P2 ตามคำสั่งให้ทำงานรอ CI โดยต้องรักษา Owner ของ P3 และ Sync `main` ก่อน Review สุดท้าย

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

PR: `#477`

Branch: `agent/admin-phase-2-role-multirole-team`

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

Head commit: `c4ae5a9feacbfbbb97308fe79b775c0671da207b`

Merge commit: `5cc3f273622d3110a84470cebd811eb840d2e888`

Merge method: `squash`

Merged: `2026-08-03`

Status: Merge เข้า `main` แล้ว

## ทำแล้ว

- เพิ่ม Workspace registry กลางครบ 5 ตำแหน่ง
- เพิ่มสัญญา `AdminWorkspaceAssignment` สำหรับรับข้อมูลจาก P2
- รองรับ Multi-role, Primary role และตัวเลือกดูทุกตำแหน่ง
- เพิ่ม Workspace switcher ใน Topbar
- บน Mobile ใช้ Workspace chips ใน Profile เพื่อไม่ให้บังปุ่มเปิดเมนู
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

## ผลการตรวจ

- Build, R-006, UI System, Security, Admin Verification, Functional Audit และ Visual Regression ผ่านบน implementation P3 ชุดเต็ม
- Browser Matrix พบ Mobile Topbar pointer interception และแก้ก่อน Merge
- Full-System failure รอบก่อนหน้าอยู่ที่ Member viewport isolation และ Branch ถูกสร้างใหม่บน `main` ที่มี Member fix
- PR อยู่ในสถานะ mergeable ก่อน Squash Merge

รายละเอียดเต็มอยู่ที่ `docs/admin-redesign-p3-navigation-dashboard.md`

---

# P4: Chart และ Widget System

PR: `#487`

Branch: `agent/admin-phase-4-chart-widget-system`

Base ตอนเปิด Phase: `51e455b4f3f2c8ac1a8522c015e68978474a5bc1`

Status: Draft — Batch 1 และ Batch 2 เสร็จ อยู่ระหว่าง Sync P3, CI และเก็บข้อผิดพลาดจริง

## ทำแล้ว

- Chart wrapper กลางรองรับ Bar, Stacked Bar, Line, Area และ Donut
- แยก Domain ของกราฟแบบ Grouped และ Stacked ไม่ให้ค่ารวมบีบสเกลกราฟทั่วไป
- Widget registry แบบ Typed พร้อมตรวจ Widget ID ซ้ำหรือไม่ถูกต้อง
- Permission-aware widget visibility
- โหลดตัวตนและ Effective permissions ก่อน แล้วเรียก Finance/Risk API เฉพาะเมื่อบัญชีมีสิทธิ์
- Dashboard data adapter กรองข้อมูลย่อยในวิดเจ็ตรวมตาม Effective permission อีกชั้น
- Date range: Today, 7, 30, 90 วัน และ Custom
- Compare period: None, Previous period และ Previous year
- Drill-down ผ่านเมาส์และคีย์บอร์ด
- Fullscreen พร้อม Escape และล็อก Body scroll
- Export CSV และ PNG โดยฝัง Computed SVG styles ก่อนวาดลง Canvas
- Loading, Empty, Error และ Partial data state
- Saved layout ต่อผู้ใช้ด้วย Versioned storage key
- Cross-tab layout synchronization
- Drag, Keyboard move, Resize, Pin, Hide/Show และ Restore default
- Dashboard `/dashboard` ใช้ Widget Workspace กลางแทนกราฟเฉพาะหน้าเดิม
- วิดเจ็ต Dashboard 6 รายการ: งานเร่งด่วน, กระแสเงิน, ยอดกระเป๋า, ความเสี่ยง, คิวการเงิน และกิจกรรมล่าสุด
- ภาษาไทยและอังกฤษ รวมคำว่า Total และ Legend ในกราฟ
- Desktop, Tablet, Mobile, Compact density, High contrast และ Reduced motion
- Unit/Contract tests สำหรับ Registry, Layout, Date range, Export และ Dashboard owner
- Browser interaction tests สำหรับ Date range, CSV, PNG, Fullscreen, Hide/Restore, Persistence, Overflow และ RBAC
- ปรับ TypeScript ให้ผ่าน `noUncheckedIndexedAccess` และ `exactOptionalPropertyTypes`

## การเชื่อมกับ P3

- รักษา `AdminWorkspaceRuntime` เป็น Owner ของ Workspace selection
- P4 ต้องอ่าน Event `admin:workspace-change` และกรองชุด Widget ตาม Workspace ที่ P3 เลือก
- ห้ามสร้าง Workspace storage หรือ switcher ซ้ำ
- Layout storage ของ P4 ต้องเก็บรายการครบ แม้บาง Widget ถูกซ่อนชั่วคราวจาก Workspace filter

## Owner ใหม่

| ความสามารถ | Owner ใหม่ | ของเดิมที่ถูกแทน |
|---|---|---|
| Chart rendering | `src/features/admin-modernization/admin-chart.tsx` | กราฟเฉพาะหน้าใน Dashboard |
| Widget shell/state/actions | `src/features/admin-modernization/admin-widget.tsx` | Card และ state ที่ประกอบแยกกัน |
| Widget layout | `src/features/admin-modernization/admin-widget-workspace.tsx` | Layout คงที่ที่ผู้ใช้ปรับไม่ได้ |
| Registry | `src/features/admin-modernization/chart-widget-contracts.ts` | รายการ Widget แบบกระจัดกระจาย |
| Dashboard adoption | `app/(admin)/dashboard/dashboard-widgetized.tsx` | `dashboard-professional.tsx` ใน Route owner |

## ข้อจำกัดที่ทราบ

- Finance API ปัจจุบันส่ง Snapshot ล่าสุด ไม่ใช่ Time-series เต็มช่วงวันที่ จึงแสดง Partial state เมื่อเลือกช่วงมากกว่าวันนี้
- Saved layout อยู่ใน Browser storage ต่อผู้ใช้ ยังไม่ได้ Sync ข้ามอุปกรณ์ผ่าน Backend
- P2 ยังอยู่คนละ PR และ P4 ต้อง Sync `main` อีกครั้งหลัง P2 Merge

## งานที่เหลือ

- Sync P3 และ `main` ล่าสุดเข้า Branch P4
- เชื่อม Widget visibility กับ `admin:workspace-change`
- อ่านและแก้ CI ของ Head ล่าสุด
- ตรวจหลักฐาน Browser Matrix และ Visual Regression
- Sync `main` หลัง P2 Merge
- ยืนยัน Build/Typecheck/Tests หลัง Sync
- Mark ready และ Merge เมื่อเงื่อนไขทั้งหมดผ่าน

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
