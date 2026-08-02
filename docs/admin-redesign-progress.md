# Admin Redesign Progress

เอกสารนี้เป็นแหล่งข้อมูลกลางสำหรับงานยกเครื่อง `apps/web-admin`

## กฎการดำเนินงาน

- หนึ่ง Phase ใช้หนึ่ง PR
- เริ่มแต่ละ Phase จาก `main` ล่าสุด
- Merge เมื่อ Build, Typecheck, Tests และการตรวจเฉพาะ Phase ผ่าน
- ของใหม่ต้องแทน Owner เดิม ไม่สร้างระบบซ้อน
- ทุก PR ต้องอัปเดตเอกสารนี้ก่อน Merge
- Member และ API ที่ไม่เกี่ยวข้องต้องไม่ปะปนใน PR ฝั่ง Admin

## เป้าหมายสุดท้าย

Admin ต้องใช้หน้าตาและระบบกลางชุดเดียวกันทุกหน้า พร้อมรองรับ:

- Light / Dark / System
- Comfortable / Compact
- High contrast / Reduced motion
- ตำแหน่งหลัก 5 แบบ: การเงิน, ฝากถอน, การตลาด, หัวหน้า, คนดูแลระบบ
- User หนึ่งคนมีหลายตำแหน่ง
- หัวหน้าสร้างและจัดการลูกน้องในทีมได้
- Dashboard และกราฟตามตำแหน่ง
- Settings ทั่วไปและ System Settings แยกกัน
- Desktop, Tablet และ Mobile
- Permission, Approval, 2FA และ Audit ครบ

## สถานะรวม

| Phase | ขอบเขต | สถานะ | PR |
|---|---|---|---|
| P1 | Appearance foundation และ Theme owner กลาง | รอ CI รอบฐานล่าสุด | #474 |
| P2 | Role 5 แบบ, Multi-role, Team และหัวหน้าสร้างลูกน้อง | ยังไม่เริ่ม | - |
| P3 | Sidebar, Navigation registry และ Dashboard ตามตำแหน่ง | ยังไม่เริ่ม | - |
| P4 | Chart system, Widget registry และ Analytics | ยังไม่เริ่ม | - |
| P5 | Table, Form และ Detail drawer กลาง | ยังไม่เริ่ม | - |
| P6 | Settings migration และ System Settings | ยังไม่เริ่ม | - |
| P7 | CSS cleanup และย้ายทุกหน้าเข้า Design System ใหม่ | ยังไม่เริ่ม | - |
| P8 | Security, Approval, Session, Accessibility และ Browser Matrix | ยังไม่เริ่ม | - |

---

# P1: Appearance Foundation

PR: `#474`

Branch: `agent/admin-appearance-foundation-main`

Head commit: อัปเดตตาม commit ล่าสุดของ PR

Baseline CI blocker: Member regex target ถูกแก้และรวมเข้า `main` ผ่าน PR `#475` ที่ commit `e0947a7f79e0b5ab03f149908f48ff9c1bf4778b` แล้ว

## ทำแล้ว

- เพิ่ม Appearance owner กลาง `AdminAppearanceRuntime`
- ใช้ Storage key เดียว `admin_appearance_preferences_v1`
- รองรับ Theme: Light, Dark, System
- รองรับ Density: Comfortable, Compact
- รองรับ Contrast: Normal, High
- รองรับ Motion: System, Reduced
- กำหนด Theme ก่อน React hydration เพื่อลดการกะพริบ
- ติดตั้งปุ่ม Appearance ใน Topbar อัตโนมัติ
- หน้าที่ไม่มี Topbar ใช้ปุ่มลอยจาก Runtime ตัวเดียวกัน
- ใช้ Locale owner เดิมสำหรับภาษาไทยและอังกฤษ
- เพิ่ม Admin-only Light/Dark tokens โดยไม่เปลี่ยน Member theme
- ใช้ Bottom sheet บน Mobile
- เพิ่ม Contract tests สำหรับ Owner, storage key และ data attributes

## Owner ใหม่

| ความสามารถ | Owner ใหม่ | Owner เดิมที่ถูกแทน |
|---|---|---|
| Theme preference | `app/admin-appearance-runtime.tsx` | การล็อก Dark ที่ Root layout |
| Appearance storage | `admin_appearance_preferences_v1` | ค่า Theme แบบกระจัดกระจาย |
| Theme tokens | `app/admin-appearance-foundation.css` | สี Dark-only และ override รายหน้า |
| Pre-hydration theme | `app/layout.tsx` bootstrap | การรอ Client render ก่อนกำหนด Theme |

## ไฟล์ใน P1

- `apps/web-admin/app/admin-appearance-runtime.tsx`
- `apps/web-admin/app/admin-appearance-foundation.css`
- `apps/web-admin/app/admin-appearance-runtime.spec.ts`
- `apps/web-admin/app/layout.tsx`
- `docs/admin-redesign-progress.md`

## การตรวจที่ต้องผ่านก่อน Merge

- Admin unit and contract tests
- Admin Typecheck
- Admin Build
- Light/Dark บน Dashboard, Settings, Members และ Login
- Viewport 390px, 834px และ 1440px
- CI workflows ที่เกี่ยวข้อง

## สิ่งที่ยังไม่ทำใน P1 โดยตั้งใจ

- Role 5 แบบ
- Multi-role database model
- Team hierarchy และหัวหน้าสร้างลูกน้อง
- Role-aware navigation และ dashboard
- Chart engine ใหม่
- Table และ Form migration
- CSS cleanup ครั้งใหญ่

---

# P2: Role, Multi-role และ Team

## เป้าหมาย

- Role Template 5 แบบ
- User มีตำแหน่งหลักหนึ่งตำแหน่งและตำแหน่งเสริมหลายตำแหน่ง
- Deny ชนะ Allow
- Permission override ราย User
- Scope และวงเงิน
- Team hierarchy
- หัวหน้าสร้างลูกน้อง
- หัวหน้าแจกสิทธิ์ได้ไม่เกินสิทธิ์ตัวเอง
- Preview เมนูและสิทธิ์ก่อนสร้าง User
- Audit การสร้างและแก้ User

## พื้นที่ที่ต้องตรวจ

- `AdminUser`
- `AdminRole`
- ความสัมพันธ์ User/Role เดิม
- `admin-accounts`
- `admin-roles`
- `admin-invitations`
- API access overview
- Seed permissions
- Permission guard ทุก Route

---

# P3: Navigation และ Role-aware Dashboard

- Navigation registry กลาง
- เมนูตาม 5 ตำแหน่ง
- Workspace filter สำหรับ User หลายตำแหน่ง
- Dashboard resolver ตามตำแหน่งหลักและตำแหน่งเสริม
- Favorites, Recent และ Command Palette อ่าน Registry เดียวกัน
- Profile แสดงทุกตำแหน่ง
- ไม่มีเมนูเก่าและใหม่ซ้ำกัน

---

# P4: Chart และ Widget System

- Chart wrapper กลาง
- Widget registry
- Date range และ Compare period
- Drill-down และ Fullscreen
- Export CSV/PNG
- Loading, Empty, Error และ Partial data
- Saved layout ต่อ User
- Drag, Resize, Pin และ Restore default

---

# P5: Table, Form และ Detail UX

- Table logic กลาง
- Server pagination, Filter และ Sort
- Column preference และ Saved views
- Mobile card view
- Detail drawer กลาง
- Form controls และ Validation schema กลาง
- Sticky save bar และ Unsaved changes
- Before/after diff

---

# P6: Settings Migration

ใช้ Owner เพียงสอง Workspace:

- `/settings`
- `/system-settings`

ทุก Settings เดิมต้องถูกจัดเป็น ใช้ต่อ, รวมเข้า Owner ใหม่, Redirect, Deprecated หรือ ลบ โดยห้าม Route เก่าและใหม่บันทึกค่าเดียวกันพร้อมกัน

---

# P7: Design System Adoption และ CSS Cleanup

- ทุกหน้าใช้ Shell, Page, Card, Form, Table, Drawer และ Modal กลาง
- รวม Token authority
- ลบ Override ที่หมดหน้าที่
- ไม่มีสี Hardcode ใน Page component
- ไม่มี Component ซ้ำหน้าที่
- ไม่สร้าง override ใหม่เพื่อแก้ override เก่า

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

## รูปแบบบันทึกหลังแต่ละ PR

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
