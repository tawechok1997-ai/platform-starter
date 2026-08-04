# Admin Redesign Progress

เอกสารนี้เป็นสถานะกลางของงานยกเครื่อง `apps/web-admin` หลังปิด Phase P1–P8 แล้ว

## สถานะรวม

| Phase | ขอบเขต | สถานะ | PR | Merge commit |
|---|---|---|---|---|
| P1 | Appearance foundation และ Theme owner กลาง | Merge แล้ว | #445 | `fea8afb147c3059166b4036fe3f56bdcdfcd8fff` |
| P2 | Role 5 แบบ, Multi-role, Team และ Access governance | Merge แล้ว | #533 | `666955e2e509d2f8a0f499153479b3d6aea676af` |
| P3 | Navigation registry และ Dashboard ตามตำแหน่ง | Merge แล้ว | #483 | `5cc3f273622d3110a84470cebd811eb840d2e888` |
| P4 | Chart system และ Widget registry | Merge แล้ว | #552 | `d7fe012d85a772fa78d7b0bc540b7d9a01746850` |
| P5 | Table, Form และ Detail drawer กลาง | Merge แล้วใน P5–P7 program | #492 | `882643c496ffee91d540898a22cbc3951252996e` |
| P6 | Settings migration และ System Settings | Merge แล้วใน P5–P7 program | #492 | `882643c496ffee91d540898a22cbc3951252996e` |
| P7 | Design System adoption และ CSS cleanup | Merge แล้วใน P5–P7 program | #492 | `882643c496ffee91d540898a22cbc3951252996e` |
| P8 | Security, Accessibility และ Release Readiness | Merge แล้ว | #554 | `c6084dc1e24fe36169d393b02b3954cb98ca359f` |

**สถานะโครงการ:** Implementation P1–P8 ปิดครบและอยู่บน `main` แล้ว

## ผลลัพธ์ที่ส่งมอบ

### Appearance และ Design System

- Light, Dark และ System theme
- Comfortable และ Compact density
- Normal และ High contrast
- System และ Reduced motion
- Token, Drawer, Modal, Table, Form และ Feedback owner กลาง
- Responsive Desktop, Tablet และ Mobile

### Role, Team และ Access Governance

- Role template 5 แบบ: Finance, Deposit & Withdrawal, Marketing, Manager และ System Administrator
- Multi-role สูงสุด 8 รายการ พร้อม Primary role
- Team hierarchy, Team lead และ Manager/Subordinate reporting line
- Permission override แบบ `ALLOW` / `DENY`
- Explicit `DENY` ชนะ Role, Delegation, Allow และ Wildcard
- Scope และ Approval limits รายผู้ใช้
- Session revocation และ Audit หลัง mutation สำคัญ

### Navigation และ Dashboard

- Workspace registry กลางตาม Role
- Workspace selection owner เดียวสำหรับ Sidebar, Favorites, Recent และ Command Palette
- Role-aware Dashboard resolver
- Chart และ Widget system กลาง
- Bar, Stacked Bar, Line, Area และ Donut
- Date range, Compare period, Drill-down, Fullscreen และ CSV/PNG export
- Drag, Resize, Pin, Hide/Show และ Restore default

### Table, Form และ Settings

- Server pagination, Search, Filter และ Sort
- Column visibility, Saved views และ Mobile card view
- Detail drawer กลาง พร้อม focus trap และ focus restore
- Form validation, Error summary, Sticky save bar และ Unsaved guard
- Before/after diff พร้อม sensitive-value redaction
- Settings write owner เหลือ `/settings` และ `/system-settings`
- Route/Data-key registry พร้อม Keep, Merge, Redirect, Deprecated และ Remove

### Security และ Release Readiness

- Fail-closed route registry แม้ Admin มี wildcard
- Step-up 2FA ผูกกับ Admin และ Session
- Single/Dual approval และ No self-approval
- Sensitive reveal audit โดยไม่บันทึก secret value
- Retry/timeout policy สำหรับ Admin API
- ConfirmDialog และ Drawer accessibility contracts
- Persona matrix 7 แบบ รวม Multi-role และ Explicit DENY
- Chromium Desktop/Tablet/Mobile และ Firefox/WebKit Desktop
- Route gzip budget 220 KB และ Chunk gzip budget 160 KB

## Validation ที่ผ่านก่อน Merge

Phase สำคัญผ่านชุดตรวจที่เกี่ยวข้องบน Head เดียวกันก่อน Merge ได้แก่:

- Build และ Typecheck API/Admin/Member
- Admin unit/source-contract tests
- Full-System Automated Tests
- PostgreSQL governance และ transaction tests
- P5 Security Audit
- R-006 Quality Baseline
- R012 Frontend Architecture
- R-013 UI System
- R-013 Visual Regression
- Admin Functional Capability Audit
- Admin Verification & Bundle
- Admin Browser Regression Matrix
- Route × Role × Viewport และ cross-browser interaction suites

## เอกสารรายละเอียด

- P2: `docs/admin-redesign-p2-governance.md`
- P3: `docs/admin-redesign-p3-navigation-dashboard.md`
- P4: `docs/admin-redesign-p4-chart-widgets.md`
- P5–P7: `docs/admin-redesign-p5-p7-program.md`
- P5–P7 evidence: `docs/admin-redesign-p5-p7-evidence.md`
- P8: `docs/admin-redesign-p8-security-release-readiness.md`

## งานหลังปิด Phase

งานต่อจากนี้ไม่ถือเป็น Phase รีดีไซน์ใหม่:

1. ตรวจ Deployment identity ว่า Production ใช้ commit จาก `main` ล่าสุด
2. Smoke test Production ด้วยบัญชี Persona จริงอย่างน้อย Finance, Manager, System Admin และ Explicit DENY
3. ตรวจ Dashboard, Roles/Teams, Accounts, Invitations, Settings และ Security บน Desktop/Tablet/Mobile
4. ตรวจ mutation สำคัญด้วยข้อมูลทดสอบ พร้อม Audit และ Session revocation
5. บันทึก UI polish หรือ Production-only defect เป็น Issue/PR แยก ไม่ย้อนเปิด P1–P8

## ข้อจำกัดการตรวจ Production รอบล่าสุด

Environment ที่ใช้ปรับเอกสารนี้ไม่สามารถ resolve โดเมน Railway Production ได้ จึงยังไม่อ้างว่า Production smoke ผ่าน การตรวจ repository, CI และ Browser evidence ผ่านแล้ว แต่ Production deployment identity และ authenticated smoke ต้องยืนยันจาก runner หรือเครื่องที่เข้าถึง Railway ได้จริง
