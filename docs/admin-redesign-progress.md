# Admin Redesign Progress

เอกสารนี้เป็นแหล่งข้อมูลกลางสำหรับงานยกเครื่อง `apps/web-admin` ทุก Phase

กฎของโครงการ:

- หนึ่ง Phase ใช้หนึ่ง PR
- Merge เมื่อ Build, Typecheck, Tests และการตรวจเฉพาะ Phase ผ่าน
- Phase ถัดไปเริ่มจาก `main` หลัง Phase ก่อนหน้าถูก Merge แล้ว
- ของใหม่ต้องแทน Owner เดิม ไม่สร้างระบบซ้อน
- ทุก PR ต้องอัปเดตเอกสารนี้ก่อน Merge

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

| Phase | ขอบเขต | สถานะ | PR | Merge commit |
|---|---|---|---|---|
| P1 | Appearance foundation และ Theme owner กลาง | กำลังดำเนินการ | รอเปิด PR | - |
| P2 | Role 5 แบบ, Multi-role, Team และหัวหน้าสร้างลูกน้อง | ยังไม่เริ่ม | - | - |
| P3 | Sidebar, Navigation registry และ Dashboard ตามตำแหน่ง | ยังไม่เริ่ม | - | - |
| P4 | Chart system, Widget registry และ Analytics | ยังไม่เริ่ม | - | - |
| P5 | Table, Form และ Detail drawer กลาง | ยังไม่เริ่ม | - | - |
| P6 | Settings migration และ System Settings | ยังไม่เริ่ม | - | - |
| P7 | CSS cleanup และย้ายทุกหน้าเข้า Design System ใหม่ | ยังไม่เริ่ม | - | - |
| P8 | Security, Approval, Session, Accessibility และ Browser Matrix | ยังไม่เริ่ม | - | - |

---

# P1: Appearance Foundation

Branch:

`agent/admin-phase-1-appearance-foundation`

## ทำแล้ว

- เพิ่ม Appearance owner กลาง `AdminAppearanceRuntime`
- ใช้ Storage key เดียว: `admin_appearance_preferences_v1`
- รองรับ Theme: Light, Dark, System
- รองรับ Density: Comfortable, Compact
- รองรับ Contrast: Normal, High
- รองรับ Motion: System, Reduced
- เพิ่ม Theme bootstrap ใน `<head>` เพื่อป้องกันหน้ากะพริบก่อน React hydration
- เพิ่มปุ่มตั้งค่าหน้าตาใน Topbar อัตโนมัติ
- หน้า Login หรือหน้าที่ไม่มี Topbar ใช้ปุ่มลอยจาก Runtime ตัวเดียวกัน
- รองรับภาษาไทยและอังกฤษจาก Locale owner เดิม
- เพิ่ม Light/Dark tokens สำหรับ Admin โดยไม่แก้ Shared Member theme
- เพิ่ม Mobile bottom-sheet layout สำหรับ Appearance panel
- เพิ่ม Contract tests ล็อก Owner และ Data attributes กลาง

## Owner ใหม่

| ความสามารถ | Owner ใหม่ | ของเดิมที่ถูกแทน |
|---|---|---|
| Theme preference | `app/admin-appearance-runtime.tsx` | การล็อก Dark ที่ Root layout |
| Appearance storage | `admin_appearance_preferences_v1` | ค่า Theme แบบกระจัดกระจายหรือ Hardcode |
| Theme tokens | `app/admin-appearance-foundation.css` | สี Dark-only และ Override รายหน้า |
| Pre-hydration theme | `app/layout.tsx` bootstrap | การรอ Client render ก่อนกำหนด Theme |

## ไฟล์ใน P1

- `apps/web-admin/app/admin-appearance-runtime.tsx`
- `apps/web-admin/app/admin-appearance-foundation.css`
- `apps/web-admin/app/admin-appearance-runtime.spec.ts`
- `apps/web-admin/app/layout.tsx`
- `docs/admin-redesign-progress.md`

## ยังเหลือใน P1

- รัน Admin tests
- รัน Typecheck
- รัน Build
- ตรวจ Light/Dark บน Dashboard, Settings, Members และ Login
- ตรวจ 390px, 834px และ 1440px
- แก้ Regression ที่พบ
- เปิด PR
- รอ CI ผ่าน
- Merge เข้า `main`
- อัปเดตเลข PR และ Merge commit ในเอกสารนี้

## สิ่งที่ยังไม่ทำใน P1 โดยตั้งใจ

- ยังไม่สร้าง Role 5 แบบ
- ยังไม่ทำ Multi-role database model
- ยังไม่ทำหน้า Team
- ยังไม่ทำหัวหน้าสร้างลูกน้อง
- ยังไม่ย้าย Navigation ทั้งระบบ
- ยังไม่เพิ่ม Chart engine ใหม่
- ยังไม่ย้าย Table และ Form
- ยังไม่ลบ CSS เก่าจำนวนมาก

รายการเหล่านี้ถูกแยกเป็น Phase ถัดไปเพื่อให้ PR ตรวจสอบและ Merge ได้อย่างปลอดภัย

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

## Migration ที่ต้องตรวจ

- `AdminUser`
- `AdminRole`
- ความสัมพันธ์ User/Role เดิม
- หน้า `admin-accounts`
- หน้า `admin-roles`
- หน้า `admin-invitations`
- API access overview
- Seed permissions
- Permission guard ทุก Route

---

# P3: Navigation และ Role-aware Dashboard

## เป้าหมาย

- Navigation registry กลาง
- เมนูตาม 5 ตำแหน่ง
- Workspace filter สำหรับ User หลายตำแหน่ง
- Dashboard resolver ตามตำแหน่งหลักและตำแหน่งเสริม
- Favorites, Recent และ Command Palette อ่าน Registry เดียวกัน
- Profile แสดงทุกตำแหน่ง
- ไม่มีเมนูเก่าและใหม่ซ้ำกัน

---

# P4: Chart และ Widget System

## เป้าหมาย

- Chart wrapper กลาง
- Widget registry
- Date range และ Compare period
- Drill-down
- Fullscreen
- Export CSV/PNG
- Loading, Empty, Error และ Partial data
- Saved layout ต่อ User
- Drag, Resize, Pin และ Restore default

---

# P5: Table, Form และ Detail UX

## เป้าหมาย

- Table logic กลาง
- Server pagination, Filter และ Sort
- Column preference และ Saved views
- Mobile card view
- Detail drawer กลาง
- Form controls กลาง
- Validation schema กลาง
- Sticky save bar
- Unsaved changes
- Before/after diff

---

# P6: Settings Migration

## เป้าหมาย

ใช้ Owner เพียงสอง Workspace:

- `/settings`
- `/system-settings`

ทุก Settings เดิมต้องถูกจัดเป็น:

- ใช้ต่อ
- รวมเข้า Owner ใหม่
- Redirect
- Deprecated
- ลบ

ห้าม Route เก่าและใหม่บันทึกค่าเดียวกันพร้อมกัน

---

# P7: Design System Adoption และ CSS Cleanup

## เป้าหมาย

- ทุกหน้าใช้ Shell, Page, Card, Form, Table, Drawer และ Modal กลาง
- รวม Token authority
- ลบ Override ที่หมดหน้าที่
- ลบ CSS เก่าหลังตรวจผู้ใช้ครบ
- ไม่มีสี Hardcode ใน Page component
- ไม่มี Component ซ้ำหน้าที่
- ไม่มี `final-v2` หรือ Override ใหม่เพื่อแก้ Override เก่า

---

# P8: Security และ Release Readiness

## เป้าหมาย

- Approval policy
- No self-approval
- Step-up 2FA
- Session และ Device management
- Sensitive reveal audit
- Accessibility WCAG AA
- Reduced motion และ High contrast
- Browser Matrix ทุก Role และ Viewport
- Visual regression
- Performance audit
- Production smoke test

---

# รูปแบบการอัปเดตหลังแต่ละ PR

ทุก Phase ต้องเพิ่มข้อมูลนี้:

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
