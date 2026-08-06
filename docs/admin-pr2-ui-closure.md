# Admin PR-2 — UI Authority & Interaction Closure

## เป้าหมาย

ปิดงาน UI/UX รอบสุดท้ายของ Admin หลัง PR-1 Core Reliability โดยทำให้ Dashboard, Shell, Sidebar, Topbar, Access state, Theme และ Table ใช้พฤติกรรม Responsive และ Accessibility ชุดเดียวกัน โดยไม่สร้าง owner ใหม่ทับระบบ Role, Route, Theme, Table หรือ Settings ที่มีอยู่แล้ว

## ขอบเขตที่ปิดใน PR นี้

### Shell และ Topbar

- ทำให้ Shell, Main shell และ Content shell มี `min-width: 0` และไม่สร้าง Horizontal overflow
- ให้ Content owner รองรับหน้าเต็มความกว้างสูงสุด 1440px
- ทำให้ Topbar context ตัดข้อความยาวอย่างปลอดภัย
- ให้ Topbar actions หดและจัดวางได้โดยไม่ชนกัน
- ลดข้อมูลรองบน Tablet/Mobile โดยยังคง Menu, Search และ Notification actions
- Touch target หลักไม่ต่ำกว่า 44px

### Dashboard และ Metric

- ใช้ Metric grid กลางแบบ Auto-fit บน Desktop
- Tablet และ Mobile ใช้ Density ที่คงลำดับข้อมูล
- Mobile 340–430px แสดง Metric 2 คอลัมน์
- ลดเป็น 1 คอลัมน์เฉพาะจอแคบกว่า 340px
- ตัวเลขใช้ Tabular numerals และไม่ล้น Card
- Compact density ลดความสูงโดยไม่ลด Touch target

### Table และ Data pages

- Table scroll อยู่ใน `.admin-data-table__scroll` เท่านั้น
- Page ไม่รับ Horizontal overflow จากตาราง
- Table กลับเป็น Table layout จริง ไม่ถูก Global rule เปลี่ยนเป็น Block
- Toolbar และ Footer Wrap ได้บน Tablet/Mobile
- ข้อความ, Code และ Action ใน Cell ตัดบรรทัดอย่างปลอดภัย
- รองรับ Touch scrolling และ Stable scrollbar gutter

### Access, Theme และ Accessibility

- Access denied state อยู่กึ่งกลางและมีพื้นที่อ่านเพียงพอทุก Viewport
- Light theme ใช้ Topbar surface ตาม Canvas owner
- High contrast บังคับ Border ที่มองเห็นได้บน Surface สำคัญ
- Focus visible ใช้ Ring กลางกับ Link, Button, Form control และ Tab target
- Disabled control ใช้ Cursor และ State ที่ชัดเจน
- Reduced motion ปิด Animation/Transition ใน Surface ที่เพิ่มใน PR นี้

### Route และ Interaction inventory

- กวาด Route ภายใต้ `app/(admin)` ทั้งหมด
- บังคับ Critical routes: Dashboard, Operations, Access, Accounts, Roles, Finance queues, Risk, Support, Settings, Theme และ Security
- กวาด Button, Link และ Shared Admin action primitives
- ห้าม Placeholder link `href="#"`
- ห้าม `javascript:` URL
- ล็อก Import order ให้ PR-2 authority เป็น Stylesheet ตัวสุดท้าย

## Owner ที่ใช้ต่อจาก `main`

- Route registry และ Direct-route permission guard
- Workspace-aware Sidebar, Favorites, Recent และ Command Palette
- Admin Appearance runtime: Theme, Density, Contrast และ Motion
- Shared Admin Metric, Table, Drawer, Confirm dialog และ Empty state
- Role, Team, Explicit DENY, Scope และ Approval limits จาก Admin Redesign P2 เดิม
- Browser Matrix, Visual Regression และ Full-System workflows

## Safety boundary

- ไม่เปลี่ยน API, Prisma schema หรือ Migration
- ไม่เปลี่ยน Permission code หรือ RBAC resolution
- ไม่เปลี่ยน Wallet, Ledger, Deposit, Withdrawal หรือ Provider mutation
- ไม่เปลี่ยน Settings data keys หรือ CMS payload
- ไม่เพิ่ม Runtime state owner ใหม่
- เป็น CSS authority, interaction inventory และ regression contracts เท่านั้น

## Definition of Done

- Admin tests, Typecheck และ Build ผ่าน
- Required repository workflows ผ่านบน Head เดียวกัน
- Browser Matrix ไม่พบ Horizontal overflow
- Dashboard Metrics ใช้ 2 คอลัมน์บน Mobile 340–430px
- Topbar, Sidebar, Access state และ Data table ใช้งานได้บน Desktop, Tablet และ Mobile
- Light, Dark, High contrast และ Reduced motion contracts ผ่าน
- Route/Interaction inventory ครบ Critical routes
- ไม่มี Placeholder action หรือ Unsafe URL
- PR mergeable และไม่มี Review thread ค้าง

## งานที่ส่งต่อ PR-3

- Authenticated Mutation tests บน Staging
- Persona/RBAC matrix รอบเต็มด้วยบัญชีจริง
- Production deployment identity
- Performance acceptance จาก Deployed bundle/runtime
- Accessibility acceptance ด้วย Authenticated routes และข้อมูลจริง
