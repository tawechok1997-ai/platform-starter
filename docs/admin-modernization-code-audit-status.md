# Admin Modernization — Code-Audited Status

อัปเดต: 2026-07-23

เอกสารนี้เป็นสถานะที่ตรวจจากโค้ดบน `main` และ PR ที่ merge แล้ว ไม่ใช้ checkbox เดิมเป็นหลักฐานโดยลำพัง

## ความหมายสถานะ

- `[x]` ยืนยันจากโค้ดหรือไฟล์ที่ merge อยู่บน `main`
- `[~]` มี implementation บางส่วน แต่ยังไม่ครบขอบเขตทั้งระบบ
- `[ ]` ยังไม่พบหลักฐานเพียงพอจากโค้ด

## Phase 0 — ระบบกลางและ Navigation

- [~] Design System กลาง: มี design tokens, Admin primitives และ contract tests แต่ยังมี compatibility CSS และ ownership ที่ต้องรวมต่อ
- [ ] ยืนยันฟอนต์ไทย Noto Sans Thai หรือ IBM Plex Sans Thai ครบทั้ง Admin
- [~] สีสถานะกลาง success, warning, danger, info มีใน primitives แต่ยังไม่ได้ audit ครบทุกหน้า
- [x] App Shell กลางถูกใช้งานใน Admin routes
- [x] Root metadata, no-index/no-follow, dark color scheme และ theme color
- [x] Root loading state พร้อม `aria-busy` และ live-region
- [x] Root recoverable error state พร้อม retry และกลับ Dashboard
- [x] Root not-found state
- [~] Responsive สำหรับ PC, tablet, mobile: shell และ shared primitives รองรับหลาย breakpoint แต่ยังไม่มีหลักฐานครบทุก route/viewport
- [~] Loading, empty, error, permission state: มี root states และบางหน้า แต่ยังไม่ครบทุก route
- [x] Profile อยู่ Sidebar ด้านล่างเป็นจุดหลัก
- [x] เอา Profile trigger ซ้ำออกจาก Topbar
- [x] Sidebar Profile มี avatar, ชื่อ, role, online status และเมนูบัญชี
- [x] Favorites, Recently used และ badge ใน Sidebar
- [x] Command Palette `Ctrl/Cmd + K`
- [x] Notification Center
- [x] Environment badge
- [~] การจัดกลุ่ม Navigation และการรวมเมนูซ้ำยังต้อง audit route ต่อ route
- [~] Legacy redirects และลิงก์เสียยังไม่มีหลักฐานครบทุก route
- [x] Menu, Command Palette และ deep-link ใช้ permission model ร่วมกัน
- [x] Active state/open group รองรับ route, Favorites และ Recently used
- [ ] ยืนยันว่า badge งานค้างไม่ซ้ำครบทุกจุด

## Phase 0.1 — Overlay, ปุ่ม และ Sidebar

- [x] รวม controller ของ Sidebar drawer, Profile, Notification และ Command Palette
- [x] เปิด overlay ได้ทีละชั้น
- [x] Escape ปิด layer บนสุดและคืน focus
- [x] รองรับ click-outside, backdrop, close button และ navigation transition
- [x] ไม่มี Logout ซ้ำใน desktop shell
- [~] Action hierarchy ยังไม่ได้ audit ครบทุกหน้า
- [~] Disabled reason/helper มีบางหน้า แต่ยังไม่ครบทุก action
- [~] Double-submit protection และ loading state มีใน Topups และบาง workflow แต่ยังไม่ครบทุก mutation
- [~] Icon button accessibility มีใน shared shell บางส่วน แต่ยังไม่ครบทุกหน้า
- [~] Touch target 44px ยืนยันได้ใน shell/mobile controls บางส่วน ยังไม่ครบทุก interactive element
- [~] Sidebar rail มี tooltip และ responsive drawer แต่ขนาด 272/72, flyout และ profile rail mode ยังไม่ยืนยันครบ
- [x] Tablet/mobile drawer มี focus trap, backdrop และ Escape
- [x] Confirmation dialog เริ่ม focus ที่ Cancel, trap focus, Escape/backdrop และ mobile bottom sheet

## Phase 1 — Bug และความปลอดภัย

- [x] แก้ THB NaN ใน `/operations`
- [x] แก้ THB NaN ใน `/game-transfers`
- [x] Harden money formatting ไม่ให้ค่าที่ไม่ finite แสดงเป็น `NaN`
- [x] แก้ Prisma/UUID error ใน `/member-insights`
- [~] Raw backend error: ปิดแล้วใน Operations, Game Transfers, Member Insights, Topups และหน้าที่ปรับภาษาแล้วบางส่วน แต่ยังไม่ยืนยันครบทั้ง Admin
- [x] เอา credential ตัวอย่างออกจาก seed และไม่สร้าง placeholder credential ใน preset ใหม่
- [~] Demo/UAT/Production มี badge และ credential environment แต่ยังไม่ยืนยัน isolation ครบทุก workflow
- [ ] 2FA setup และ recovery code warning ใน `/security`
- [~] Audit log มีในระบบหลาย action แต่ยังไม่ยืนยันครบทุก action สำคัญ
- [~] Confirmation มี shared dialog และใช้ในบาง flow แต่ยังไม่ครบ approve, reject, delete, pay และ permission change ทุกหน้า
- [~] Permission/empty-data guards มีบางหน้า แต่ยังไม่ครบทุก action
- [~] Idempotency, retry/reversal และ audit trace มีในระบบเงินจริงบางส่วน แต่ยังไม่ยืนยันครบทุก action เงิน

## หน้าที่ตรวจยืนยันแล้วบางส่วน

### `/topups`

- [x] Loading state และ skeleton
- [x] Busy/disabled state ระหว่างโหลดและ mutation
- [x] Filter และ pagination มี accessibility label/live update
- [x] Error handling ใช้ `try/catch/finally`
- [x] Slip preview failure ไม่ทำให้ queue ใช้งานไม่ได้
- [x] Confirmation flow สำหรับ action สำคัญของรายการ
- [~] ยังไม่ใช่ table contract เดียวกับ Withdrawals
- [ ] Sticky filter
- [ ] Proof drawer
- [ ] Bulk review

### `/operations`

- [x] Money formatting ไม่แสดง `NaN`
- [x] ข้อความผิดพลาดผ่าน safe copy
- [ ] งานเร่งด่วนก่อน
- [ ] SLA/เวลาค้าง
- [ ] Priority filter
- [ ] Action drawer ต่อรายการ

### `/game-transfers`

- [x] Money formatting ไม่แสดง `NaN`
- [x] ไม่ render raw provider payload/error ให้ผู้ใช้
- [ ] Transfer direction audit
- [ ] แสดง idempotency key
- [ ] Success/Pending/Failed audit
- [ ] Retry เฉพาะรายการปลอดภัย

### `/member-insights`

- [x] แก้ UUID/Prisma input error
- [x] ใช้ safe error และ network fallback
- [x] Trend, segmentation, date range, data source และ last sync มี implementation

### `/exports`

- [x] Validate ประวัติจาก localStorage ก่อนใช้
- [x] จำกัดประวัติใน state/storage 100 รายการ
- [x] ป้องกันสร้าง export ชนิดเดิมซ้ำระหว่างกำลังทำ
- [x] Busy state สำหรับ create/retry
- [x] Shared empty state และ pagination
- [ ] ยืนยันประเภทไฟล์/ช่วงวันที่ครบทุก export
- [ ] แจ้งจำนวนแถวก่อนดาวน์โหลด

## Quality และ Release Evidence

- [x] มี machine-readable Admin performance budget
- [x] มี Admin primitive contract tests
- [x] มี CI acceptance matrix
- [ ] Final bundle baseline จาก head ปัจจุบัน
- [ ] Browser evidence สำหรับ loading/error/not-found
- [ ] Visual evidence ครบ 6 viewport
- [ ] Keyboard, focus restoration, 200% zoom, reduced-motion และ axe evidence
- [ ] Authenticated console/network-failure evidence
- [ ] E2E ครบ approve, reject, pay, wallet adjustment และ role change

## Definition of Done — สถานะจริง

- [~] ไม่มี `NaN`: จุดที่พบถูกแก้แล้ว แต่ยังไม่ผ่าน audit ทุกหน้า
- [~] ไม่มี raw backend error: ผ่านบางหน้าหลัก ยังไม่ครบทั้ง Admin
- [~] มี loading/empty/error/permission state: มี root และบางหน้า ยังไม่ครบทุก route
- [~] ใช้ layout/component กลาง: ใช้แล้วมาก แต่ยังมี compatibility layer
- [~] Keyboard accessibility: shell/dialog รองรับ แต่ยังไม่มีหลักฐานครบทุกหน้า
- [ ] Mobile ไม่มีเนื้อหาซ้อนหรือหลุดจอครบทุก route
- [~] Action สำคัญมี confirmation และ audit: มีบาง workflow ยังไม่ครบ
- [~] ภาษา วันที่ ตัวเลข และ status เป็นมาตรฐานเดียวกัน: ปรับหลายหน้าแล้ว ยังไม่ครบ
- [~] ไม่มีเมนู/ปุ่ม/Profile/Logout ซ้ำ: shell หลักผ่าน แต่ route-level action ยังต้อง audit
- [x] Overlay หลักเปิดชนกันไม่ได้
- [ ] ไม่มี route legacy หรือลิงก์เสียครบทั้งระบบ
- [~] Desktop rail, tablet และ mobile drawer: implementation มี แต่หลักฐาน responsive/permission ยังไม่ครบ
- [ ] Action เสี่ยงมี automated regression ครบก่อน deploy

## ข้อที่ต้องแก้ใน Chat Baseline

ไฟล์ `docs/admin-modernization-chat-worklist.md` มีสถานะซ้ำที่ขัดกันและต้องอ้างเอกสารนี้จนกว่าจะรวมสถานะกลับเข้าไฟล์หลัก เช่น:

- Phase 1 ติ๊ก NaN ของ `/operations` และ `/game-transfers` แล้ว แต่หัวข้อย่อยของสองหน้ายังไม่ติ๊ก
- Global raw-error ยังไม่ควรติ๊ก แม้บางหน้าปิดปัญหาแล้ว
- Global responsive/loading/permission ยังไม่ควรติ๊กจากหลักฐานเฉพาะ shell หรือหน้า Topups
- Definition of Done ยังไม่ผ่านทั้งระบบ แม้ foundation หลายรายการเสร็จแล้ว
