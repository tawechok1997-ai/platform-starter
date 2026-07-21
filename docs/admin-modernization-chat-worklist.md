# Admin Modernization Worklist — Chat Baseline

> สร้างจากลิสที่ตกลงกันในแชทเมื่อ 2026-07-21/22
>
> เอกสารนี้ใช้ติดตามงานปรับ Web Admin ชุดนี้โดยเฉพาะ และไม่อ้างอิงสถานะเสร็จจาก worklist เก่าโดยอัตโนมัติ

สถานะเริ่มต้น: ต้อง audit โค้ดจริงก่อนติ๊กแต่ละข้อ

## Phase 0 — ระบบกลางและ Navigation

- [ ] Design System กลาง: สี, ฟอนต์, spacing, radius, shadow, button, badge, table
- [ ] ใช้ฟอนต์ไทย Noto Sans Thai หรือ IBM Plex Sans Thai
- [ ] สีสถานะกลาง success, warning, danger, info
- [x] App Shell เดียวทุกหน้า
- [ ] Responsive สำหรับ PC, tablet, mobile
- [ ] ทุกหน้ามี loading, empty, error, permission state
- [x] Profile อยู่ Sidebar ด้านล่างเป็นจุดหลักจุดเดียว
- [x] เอา Profile trigger/Dropdown ซ้ำออกจาก Topbar
- [x] Sidebar Profile มี avatar, ชื่อ, role, online status, dropdown
- [x] Profile dropdown มี Profile, Security/2FA, Activity Center, Logout
- [x] Favorites, Recently used, badge งานค้างใน Sidebar
- [x] Command Palette Ctrl/Cmd + K
- [x] Notification Center
- [x] Environment badge: Demo / UAT / Production
- [ ] แยกเมนูเป็นงานหลัก, รายงาน, ตั้งค่า, เครื่องมือเทคนิค และ legacy
- [ ] เมนูหลักเหลือเฉพาะงานที่ใช้ประจำ
- [x] Bulk Queue, Statement, Analytics, Export เปิดจากหน้าบริบทหรือ Command Palette
- [x] Credential, Adapter Test, Webhook Test, API Settings, Money Ops ไม่อยู่ Sidebar หลัก
- [ ] รวมเมนูซ้ำ: Activity, KYC, Audit, Ledger, Access, Provider Adapter
- [ ] Route เก่าต้อง redirect ไปหน้าปัจจุบัน ไม่มีลิงก์เสีย
- [ ] ชื่อเมนู ภาษา และลำดับกลุ่มสอดคล้องกัน
- [x] Menu, Command Palette และ deep-link ใช้ permission เดียวกัน
- [ ] Active state/open group ตรงกับ route ปัจจุบัน
- [ ] Badge งานค้างไม่ซ้ำและแสดงเฉพาะจุดที่มี action

## Phase 0.1 — Overlay, ปุ่ม และ Sidebar

- [x] รวม state controller ของ Sidebar drawer, Profile, Notification, Command Palette
- [x] เปิด overlay ได้ทีละชั้น และเปิดเมนูใหม่ต้องปิด surface อื่นอัตโนมัติ
- [ ] Escape ปิด layer บนสุดก่อนและคืน focus จุดเดิม
- [ ] ตรวจ click-outside, backdrop, close button และ navigation transition
- [x] ไม่มี Logout ซ้ำ; footer logout แสดงเฉพาะ mobile เมื่อจำเป็น
- [ ] Action เดียวมีปุ่มหลักเดียว ไม่เกิด Approve/Confirm ซ้อนกัน
- [ ] ปุ่ม disabled มีเหตุผล/helper ชัดเจน
- [ ] ปุ่มแดงใช้เฉพาะ Reject, Delete, Suspend, Logout
- [ ] หนึ่ง section มี primary action เด่นเพียงหนึ่งปุ่ม
- [ ] ป้องกัน double-submit พร้อม loading state
- [ ] Icon button มี tooltip, aria-label, focus state
- [ ] Touch target ขั้นต่ำ 44px บน mobile
- [ ] Desktop Sidebar expanded 272px และ collapsed Icon Rail 72px
- [ ] ปุ่มย่อ/ขยายเป็นปุ่มกลมที่ขอบ Sidebar
- [ ] Rail mode แสดง icon, active state, badge โดยไม่บีบข้อความ
- [ ] Hover/focus icon แสดง tooltip
- [ ] คลิก group ใน rail เปิด flyout menu
- [ ] Rail mode Profile เหลือ avatar + online dot และเปิด account menu ได้
- [ ] Tablet/mobile ใช้ full drawer พร้อม focus trap, backdrop และ Escape

## Phase 1 — Bug และความปลอดภัย

- [ ] แก้ THB NaN ใน /operations
- [ ] แก้ THB NaN ใน /game-transfers
- [ ] แก้ Prisma/UUID error ใน /member-insights
- [ ] ห้ามแสดง raw backend error
- [ ] เอา credential ตัวอย่างออกจาก /provider-credentials
- [ ] แยก Demo/UAT/Production ให้ชัด
- [ ] เพิ่ม 2FA setup และ recovery code warning ใน /security
- [ ] Audit log สำหรับ action สำคัญทั้งหมด
- [ ] Confirmation สำหรับ approve, reject, delete, pay, permission change
- [ ] ป้องกัน action เมื่อไม่มีข้อมูลหรือไม่มีสิทธิ์
- [ ] ทุก action เงินมี idempotency, retry/reversal policy และ audit trace

## Login

- [ ] Validation ใต้ field
- [ ] Error state อ่านง่าย
- [ ] Password toggle มีสถานะซ่อน/แสดงชัด
- [ ] 2FA flow
- [ ] Session timeout notice
- [ ] ปุ่มภาษา 44px
- [ ] Loading state ตอน login
- [ ] ไม่แสดง demo credential ใน Production

## Overview

### /dashboard

- [ ] System status → Urgent queue → KPI → Risk → Finance → Activity
- [ ] ลด KPI/กราฟซ้ำกัน
- [ ] Wallet total ไม่ตัดบรรทัด
- [ ] Recent Ledger แสดง 5 รายการ + ดูทั้งหมด
- [ ] SLA countdown
- [ ] Quick Actions
- [ ] Role-based dashboard

### /operations

- [ ] งานเร่งด่วนก่อน
- [ ] SLA และเวลาค้าง
- [ ] Priority filter
- [ ] ใช้ภาษาธุรกิจ
- [ ] แก้ THB NaN
- [ ] Action drawer ต่อรายการ

### /activity-center

- [ ] Tabs: Activity / Audit / Risk / Finance
- [ ] Timeline
- [ ] Severity filter
- [ ] Detail side drawer
- [ ] Source และ timestamp ชัดเจน

## Finance

### /topups

- [ ] Table เดียวกับ withdrawals
- [ ] Sticky filter
- [ ] Proof drawer
- [ ] สถานะตาม workflow
- [ ] Bulk review พร้อม confirmation

### /withdrawals

- [ ] ยอดรวมและจำนวนรายการ
- [ ] Queue priority
- [ ] Approve/Reject แยกชัด
- [ ] Reject ต้องใส่เหตุผล
- [ ] แสดงหลักฐานก่อนจ่ายเงิน

### /bulk-queue-operations

- [ ] Selected count
- [ ] ปิดปุ่มเมื่อยังไม่เลือก
- [ ] Preview ก่อนยืนยัน
- [ ] Claim / Approve / Reject แยกกัน
- [ ] Audit reason

### /wallets

- [ ] ยอดใช้ได้ / ยอดรวม / ยอดล็อก
- [ ] Member search และ filter
- [ ] Before/after balance
- [ ] Confirmation ก่อนเพิ่ม/ลดเงิน
- [ ] บังคับเหตุผลทุก adjustment

### /wallet-ledgers

- [ ] Filter วันที่และประเภทเงิน
- [ ] Compact table
- [ ] Expandable row
- [ ] จำกัดรายการต่อหน้า
- [ ] Export

### /wallet-statement

- [ ] Filter สมาชิก/วันที่ชัดเจน
- [ ] Running balance
- [ ] Grouping ตามวัน
- [ ] Export CSV/PDF
- [ ] Transaction detail drawer

### /wallet-analytics

- [ ] ช่วงเวลา 7/30/90 วัน
- [ ] Line chart และ bar chart
- [ ] Empty state
- [ ] ลดความสูงกราฟ
- [ ] Tooltip และ legend

### /reconciliation-center

- [ ] แยกยอดตรง/ยอดไม่ตรง
- [ ] Variance เด่น
- [ ] Evidence drawer
- [ ] Status workflow
- [ ] Export รายการผิดปกติ

### /reports

- [ ] Date range picker กลางทั้งระบบ
- [ ] Summary / Trend / Aging tabs
- [ ] Comparison period
- [ ] ลดความยาวหน้า
- [ ] Export progress

### /exports

- [ ] ประเภทไฟล์และช่วงวันที่
- [ ] Progress status
- [ ] Retry
- [ ] Export history pagination
- [ ] แจ้งจำนวนแถวก่อนดาวน์โหลด

## Members

### /members

- [ ] Data table + member drawer
- [ ] ซ่อน PII โดย default
- [ ] Filter status / KYC / bank
- [ ] Quick actions
- [ ] Last activity

### /member-insights

- [ ] แก้ UUID error
- [ ] Trend สมาชิกใหม่/กลับมาใช้งาน
- [ ] Segmentation
- [ ] Date range
- [ ] Data source และ last sync

### /bank-accounts

- [ ] แยกบัญชีรับเงิน/บัญชีถอน
- [ ] Verification status
- [ ] Mask เลขบัญชี
- [ ] Duplicate warning
- [ ] Approval workflow

### /kyc-center

- [ ] KYC checklist
- [ ] Risk reason
- [ ] Document drawer
- [ ] Reject ต้องใส่เหตุผล
- [ ] Status filter

### /support-center

- [ ] Ticket priority
- [ ] SLA
- [ ] Canned response
- [ ] Conversation timeline
- [ ] Open / Pending / Resolved

## Risk

### /risk-alerts

- [ ] Critical อยู่บนสุด
- [ ] Severity filter
- [ ] Evidence
- [ ] Acknowledge workflow
- [ ] Bulk review + confirmation

### /provider-risk

- [ ] Readiness score
- [ ] Blocker ก่อนเปิดเงินจริง
- [ ] Warning/Critical แยกกัน
- [ ] Preflight checklist

### /audit-risk

- [ ] Event timeline
- [ ] Risk type filter
- [ ] Before/after change
- [ ] Export
- [ ] Related record

## Games และ Providers

### /provider-health

- [ ] Status matrix
- [ ] Response time
- [ ] Webhook health
- [ ] Provider ที่ต้องตรวจ
- [ ] Saved views

### /simple-game-settings

- [ ] Setup checklist
- [ ] Completion percentage
- [ ] Basic / Advanced
- [ ] Test connection

### /provider-setup-wizard

- [ ] Step 1–4
- [ ] Progress indicator
- [ ] Validate ทุกขั้น
- [ ] Production readiness gate

### /provider-presets

- [ ] Preset card + search
- [ ] Version
- [ ] Last updated
- [ ] Confirm ก่อนแก้ preset ที่ใช้งานอยู่

### /game-providers

- [ ] Table
- [ ] Status/health filter
- [ ] Credential state
- [ ] Provider detail drawer

### /games

- [ ] Search/filter
- [ ] Provider/status/category
- [ ] Bulk enable/disable
- [ ] Game preview

### /game-sessions

- [ ] Compact session card
- [ ] Timeline
- [ ] Provider/member/game
- [ ] Session detail drawer

### /game-transfers

- [ ] แก้ THB NaN
- [ ] Transfer direction
- [ ] Idempotency key
- [ ] Success/Pending/Failed
- [ ] Retry เฉพาะรายการปลอดภัย

### /webhook-logs

- [ ] Processed/Retry/Failed
- [ ] Payload drawer
- [ ] Signature status
- [ ] Replay เฉพาะ Admin ที่มีสิทธิ์

## Promotion และ Growth

### /growth-center

- [ ] Read-only summary dashboard
- [ ] Queue ทุก feature
- [ ] ลดข้อความซ้ำ
- [ ] Link ไปหน้าปฏิบัติการโดยตรง

### /promotion-operations

- [ ] Campaign status
- [ ] Readiness checklist
- [ ] Request priority
- [ ] Member preview

### /promotion-center

- [ ] Campaign / Banner / Bonus / Coupon tabs
- [ ] Draft/publish state
- [ ] Bulk archive

### /promotion-claims

- [ ] หลักฐานการฝาก
- [ ] Review drawer
- [ ] Reject reason
- [ ] SLA

### /bonus-ledgers

- [ ] Turnover progress
- [ ] Active/Completed/Expired
- [ ] Wallet impact
- [ ] Approval guard ก่อนจ่าย

### /affiliate-center

- [ ] Downline tree
- [ ] Pending review
- [ ] Commission rule
- [ ] Duplicate referral warning

### /commission-ledgers

- [ ] Calculation preview
- [ ] Basis/rate/cap
- [ ] Preview แยกจาก create ledger
- [ ] Confirmation ก่อนสร้างยอดจริง

### /content-center

- [ ] Asset / Banner / Popup / Announcement / FAQ
- [ ] PC/Mobile preview
- [ ] Draft/publish workflow
- [ ] Raw JSON อยู่ใน Advanced
- [ ] Asset validation

## Admin และ Security

### /admin-accounts

- [ ] Role, 2FA, session status
- [ ] Account detail drawer
- [ ] Suspend/reactivate workflow
- [ ] Login history

### /admin-roles

- [ ] Permission ตาม module
- [ ] Search
- [ ] Accordion
- [ ] จำนวน permission/user
- [ ] Permission preview ก่อนบันทึก

### /admin-invitations

- [ ] Pending/Used/Expired
- [ ] Resend/revoke
- [ ] วันหมดอายุ
- [ ] Validate email/role

### /audit

- [ ] Server-side pagination
- [ ] Filter module/action/user/IP
- [ ] Expandable row
- [ ] Before/after
- [ ] Export จำกัดสิทธิ์

### /settings

- [ ] Category index
- [ ] ไม่รวม 24 หน้าในหน้าเดียว
- [ ] Search + quick links
- [ ] Unsaved changes warning
- [ ] Save state ชัดเจน

### /anti-bot

- [ ] Setup wizard
- [ ] Provider status
- [ ] Test/Production mode
- [ ] Route checklist
- [ ] เปิดใช้ไม่ได้หาก key ไม่ครบ

### /security

- [ ] Security Center
- [ ] 2FA status
- [ ] Recovery codes
- [ ] Active sessions
- [ ] Login history
- [ ] ยืนยัน 2FA ก่อน action สำคัญ

### /provider-credentials

- [ ] Demo/UAT/Production
- [ ] Mask secret
- [ ] Key rotation
- [ ] Last changed
- [ ] Test connection โดยไม่เปิดเงินจริง

### /adapter-test

- [ ] Safe Test/Production Test
- [ ] Test history
- [ ] Technical payload ใน drawer
- [ ] Latency และ response status

### /game-api-settings

- [ ] Readiness checklist
- [ ] Basic/Advanced
- [ ] Endpoint completeness
- [ ] Preflight check
- [ ] Real-money gate

## Phase 2 — QA, Monitoring และ Release Control

- [ ] Seeded UAT data และ test account แยกตาม role
- [ ] E2E สำหรับ approve, reject, pay, wallet adjustment, role change
- [ ] E2E ต้องตรวจ audit log และ permission ด้วย
- [ ] Feature Flag สำหรับ Demo/UAT/Production, gradual rollout, rollback
- [ ] Error tracking ของ Admin/API โดย redact PII/secret/payment payload
- [ ] Structured log + trace ID: UI → API → DB → Provider
- [ ] Monitoring/SLO: error rate, latency, queue aging, webhook fail, provider downtime
- [ ] Lighthouse/performance budget ใน CI สำหรับ Admin routes สำคัญ
- [ ] Backup-restore drill อัตโนมัติ พร้อมหลักฐาน restore ได้จริง
- [ ] Authenticated browser/visual regression ด้วย non-production credentials

## Definition of Done

- [ ] ไม่มี NaN
- [ ] ไม่มี raw backend error
- [ ] มี loading/empty/error/permission state
- [ ] ใช้ layout/component กลาง
- [ ] ใช้งาน keyboard ได้
- [ ] Mobile ไม่มีเนื้อหาซ้อนหรือหลุดจอ
- [ ] Action สำคัญมี confirmation และ audit
- [ ] ภาษา วันที่ ตัวเลข และ status เป็นมาตรฐานเดียวกัน
- [ ] ไม่มีเมนู/ปุ่ม/Profile/Logout ซ้ำ
- [ ] Overlay เปิดชนกันไม่ได้
- [ ] ไม่มี route legacy หรือลิงก์เสียใน menu/dropdown/Command Palette
- [ ] Desktop rail, tablet, mobile drawer ผ่าน responsive และ permission check
- [ ] Action เสี่ยงมี automated regression ก่อน deploy
