# Admin Professional UX/UI System Pass

## เป้าหมาย

ยกระดับหน้าฝั่ง Admin ทั้งระบบให้มีลำดับข้อมูล น้ำหนักภาพ ระยะห่าง ขนาด Control และพฤติกรรม Responsive ที่สม่ำเสมอ โดยใช้ Owner เดิม `admin-pr2-ui-closure.css` ซึ่งโหลดเป็น Stylesheet ตัวสุดท้าย แทนการเพิ่ม Patch CSS อีกชั้น

งานนี้จำกัดขอบเขตเฉพาะ `apps/web-admin` เท่านั้น ไม่แก้และไม่โหลด Style เข้าฝั่ง Member

## ระบบภาพกลาง

### Geometry และ spacing

- กำหนด Control สูงมาตรฐาน 44px และ Compact 38px
- ใช้ Spacing scale 4, 8, 12, 16, 20, 24 และ 32px
- ใช้ Radius 8, 12, 16 และ 20px ตามระดับ Component
- จำกัด Content สูงสุด 1440px โดยทุก Owner มี `min-width: 0`
- ใช้ Shadow สองระดับสำหรับ Card และ Overlay โดยไม่ให้ทุกส่วนลอยเท่ากัน

### Typography

- ลดหัวหน้า Admin ที่ใหญ่และหนักเกินไปให้ใช้ Scale เดียวกัน
- แยกน้ำหนัก Page title, Card title, Label, Description และ Numeric metric
- ตัวเลขใช้ Tabular numerals
- ข้อความยาวใช้ Ellipsis หรือ Wrap ตามชนิดข้อมูล ไม่ดัน Layout

## Shell, Sidebar และ Topbar

- Shell และ Content ไม่มี Horizontal overflow
- Topbar สูงและ Padding คงที่ พร้อม Context ที่ตัดข้อความยาวได้
- Topbar actions ไม่ชนกันบน Laptop และ Tablet
- Sidebar item ใช้ความสูง ไอคอน Gap และ Active indicator ชุดเดียวกัน
- Sidebar Navigation และ Footer แยก Scroll owner ชัดเจน
- Mobile ซ่อนข้อมูลรอง แต่คง Menu, Command และ Notification actions

## Page hierarchy

- Page header ใช้ Surface เดียวกับระบบ ไม่ใช้ Glow ขนาดใหญ่ที่แย่งสายตา
- Page title, Description และ Actions จัดสมดุลแบบสองคอลัมน์บน Desktop
- Tablet/Mobile เปลี่ยนเป็นหนึ่งคอลัมน์และ Action อยู่ใต้เนื้อหา
- Legacy page title ได้ Scale เดียวกับ `AdminPage`

## Card, Metric และ Chart

- Card ใช้ Border, Radius, Padding และ Shadow มาตรฐานเดียวกัน
- Card header แยก Copy กับ Action อย่างชัดเจน
- Metric grid ใช้ Auto-fit บน Desktop
- Mobile 340–560px คง 2 คอลัมน์ และลดเป็น 1 คอลัมน์เมื่อแคบกว่า 340px
- Metric number ลดขนาดตาม Viewport โดยไม่ล้น Card
- Chart, SVG และ Canvas ถูกจำกัดภายใน Owner ของตน

## Form และ Control

- Button ใช้ความสูง Padding Radius และ Font weight ชุดเดียวกัน
- Primary, Secondary, Ghost และ Danger มี Visual hierarchy ต่างกัน
- Input, Select และ Textarea ใช้ Border, Surface, Focus และ Error state ชุดเดียวกัน
- Label, Help text และ Error text ใช้ Scale สม่ำเสมอ
- Form grid สองคอลัมน์บน Desktop และหนึ่งคอลัมน์บน Mobile
- Form actions Wrap และขยายตามพื้นที่ได้
- Disabled control มี Cursor, Opacity และ Motion ที่ถูกต้อง

## Table และ Data pages

- Toolbar ใช้ Search owner แบบยืดได้และ Action ขนาดคงที่
- Tablet เปลี่ยน Toolbar เป็นสองคอลัมน์ และ Mobile เป็นหนึ่งคอลัมน์
- Horizontal scroll อยู่ใน Table owner เท่านั้น
- Header Sticky มี Surface และ Contrast ที่อ่านง่าย
- Cell spacing, Numeric alignment, Row hover และ Footer ใช้ชุดเดียวกัน
- Footer และ Pagination Wrap ได้โดยไม่ดัน Page กว้างเกิน Viewport

## System states และ Overlay

- Notice, Empty, Loading, Error และ Access denied ใช้ Alignment และพื้นที่ว่างชุดเดียวกัน
- Empty state มีความสูงขั้นต่ำและข้อความอยู่กึ่งกลาง ไม่ดูเหมือน Component หาย
- Confirm dialog, Command dialog, Notification, Profile และ Appearance panel ไม่เกิน Viewport
- Overlay รองรับ Scroll ภายใน, Overscroll containment และ Mobile bottom alignment

## Theme และ Accessibility

- Dark และ Light theme ใช้ Surface กับ Shadow ตาม Theme owner
- High contrast เพิ่ม Border ที่มองเห็นได้บน Surface สำคัญ
- Focus visible ใช้ Ring กลางกับ Link, Button, Form control และ Tab target
- Touch target สำคัญไม่น้อยกว่า 44px
- Reduced motion ปิด Transition และ Animation ของ Admin ทั้งระบบ

## Regression contracts

- `admin-pr2-ui-closure.css` ต้องเป็น Stylesheet ตัวสุดท้าย
- Selector ทั้งหมดต้อง Scope ด้วย `body[data-app-surface='admin']` สำหรับ Runtime surface
- ห้ามมี Selector `member-`, `data-member-` หรือ `#member-`
- ล็อก Shell, Sidebar, Topbar, Page, Card, Metric, Form, Table, State และ Dialog contracts
- ล็อก Responsive breakpoints 1099, 760, 560, 430 และ 339px
- กวาด Critical routes และ Interaction inventory
- ห้าม `href="#"` และ `javascript:` URL

## Safety boundary

- ไม่เปลี่ยน API, Prisma schema หรือ Migration
- ไม่เปลี่ยน Permission/RBAC
- ไม่เปลี่ยน Wallet, Ledger, Deposit, Withdrawal หรือ Provider mutation
- ไม่เปลี่ยน Settings keys หรือ CMS payload
- ไม่เพิ่ม Runtime state owner
- ไม่แตะ `apps/web-member`

## Definition of Done

- Admin source-contract tests ผ่าน
- Typecheck และ Production build ผ่าน
- ไม่มี Horizontal overflow ที่ Shell หรือ Page level
- Dashboard, Form, Table, Settings และ System state สมดุลบน 360, 390, 430, 768, 1024, 1366, 1440 และ 1920px
- Light, Dark, High contrast และ Reduced motion ใช้งานได้
- Keyboard focus และ Touch target ผ่าน
- PR mergeable และไม่มี Review thread ค้าง
