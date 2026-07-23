# Admin Modernization Worklist — Code-Audited Canonical List

> อัปเดตจากโค้ดบน `main` และหลักฐานที่ตรวจถึง 2026-07-23
>
> `[x]` ยืนยันจากโค้ดแล้ว · `[~]` ทำบางส่วน/ยังขาดหลักฐานทั้งระบบ · `[ ]` ยังไม่พบหรือยังไม่ครบ
>
> เอกสาร audit รายหมวดใช้เป็นหลักฐานประกอบ แต่ไฟล์นี้เป็นลิสต์หลักสำหรับทำงานต่อ

## Phase 0 — ระบบกลางและ Navigation

- [~] Design System กลาง: มี tokens และ Admin primitives แต่ยังมี compatibility CSS/inline styles
- [ ] ยืนยันฟอนต์ไทยมาตรฐานครบทุกหน้า
- [~] สีสถานะกลาง success/warning/danger/info มีแล้ว แต่ยังไม่ audit ครบทุก route
- [x] App Shell เดียวสำหรับ Admin routes
- [x] สลับไทย/อังกฤษและจำภาษา
- [x] Profile อยู่ Sidebar จุดหลักเดียว และไม่มี trigger ซ้ำใน Topbar
- [x] Sidebar Profile มี avatar, role, online status และเมนูบัญชี
- [x] Favorites, Recently used และ badge ใน Sidebar
- [x] Command Palette `Ctrl/Cmd + K`
- [x] Notification Center
- [x] Environment badge
- [~] Responsive shell/primitives รองรับหลาย breakpoint แต่ยังไม่มีหลักฐานครบทุกหน้าและ viewport
- [~] Loading/empty/error/permission states มี root และหลายหน้า แต่ยังไม่ครบทุก route
- [~] Navigation grouping และการลดเมนูซ้ำยังต้องตรวจ route ต่อ route
- [~] Legacy redirect และลิงก์เสียยังไม่มีหลักฐานครบ
- [x] Menu, Command Palette และ deep-link ใช้ permission model ร่วมกัน
- [x] Active state/open group รองรับ route, Favorites และ Recently used
- [ ] ยืนยันว่า badge งานค้างไม่ซ้ำทุกจุด

## Phase 0.1 — Overlay, ปุ่ม และ Sidebar

- [x] รวม controller ของ Sidebar drawer, Profile, Notification และ Command Palette
- [x] เปิด overlay ได้ทีละชั้น
- [x] Escape ปิด layer บนสุดและคืน focus
- [x] รองรับ click-outside, backdrop, close button และ navigation transition
- [x] ไม่มี Logout ซ้ำใน desktop shell
- [~] Action hierarchy ยังไม่ได้ audit ครบทุกหน้า
- [~] Disabled reason/helper มีบางหน้า
- [~] ปุ่ม danger ใช้ถูกต้องหลายหน้า แต่ยังไม่ยืนยันทั้งระบบ
- [~] Double-submit protection และ loading state มีใน workflow สำคัญหลายหน้า แต่ยังไม่ครบทุก mutation
- [~] Icon button accessibility และ touch target 44px มีบางส่วน
- [~] Sidebar rail มี tooltip/responsive drawer แต่ขนาด 272/72, flyout และ profile rail mode ยังไม่ยืนยันครบ
- [x] Tablet/mobile drawer มี focus trap, backdrop และ Escape
- [x] Confirmation dialog มี cancel-first focus, focus trap, Escape/backdrop และ mobile bottom sheet

## Phase 1 — Bug และความปลอดภัย

- [x] แก้ THB NaN ใน `/operations`
- [x] แก้ THB NaN ใน `/game-transfers`
- [x] Harden money formatter ไม่ให้ค่าที่ไม่ finite แสดง `NaN`
- [x] แก้ Prisma/UUID error ใน `/member-insights`
- [~] ปิด raw backend error แล้วหลายหน้า แต่ยังไม่ยืนยันครบทั้ง Admin
- [x] เอา credential ตัวอย่างออกจาก seed และไม่สร้าง placeholder credential ใน preset ใหม่
- [~] Demo/UAT/Production มี badge และ credential environment แต่ยังไม่ยืนยัน isolation ครบทุก workflow
- [x] `/security` มี TOTP setup, QR และ recovery codes
- [~] Audit log มีหลาย action แต่ยังไม่ยืนยันครบทุก action สำคัญ
- [~] Confirmation มีใน financial/security workflow หลายหน้า แต่ยังไม่ครบทุก action
- [~] Permission/empty-data guards มีหลายหน้า แต่ยังไม่ครบทุก action
- [~] Idempotency, retry/reversal และ audit trace มีบางส่วน แต่ยังไม่ครบทุก action เงิน

## Login

- [x] Validation ใต้ field และ accessible error binding
- [x] Error state อ่านง่ายและไม่แสดง raw technical error
- [x] Password toggle มีสถานะซ่อน/แสดง
- [x] 2FA challenge รองรับ TOTP และ recovery code
- [x] Timeout handling
- [x] ปุ่มภาษาและการจำภาษา
- [x] Loading/busy state กัน submit ซ้ำ
- [x] CAPTCHA/Anti-bot integration
- [x] ไม่แสดง demo credential
- [~] Branding ยัง hard-code บางส่วน และยังไม่มี browser evidence ครบทุก flow

## Overview

### `/dashboard`

- [ ] เรียง System status → Urgent queue → KPI → Risk → Finance → Activity
- [ ] ลด KPI/กราฟซ้ำ
- [x] Wallet total ไม่ตัดบรรทัด
- [x] Recent Ledger 5 รายการ + ดูทั้งหมด
- [x] SLA countdown
- [x] Quick Actions
- [ ] Role-based dashboard

### `/operations`

- [x] รองรับภาษา สถานะ จำนวน และเงินตาม locale
- [x] Money formatting ไม่แสดง `NaN`
- [x] ข้อความผิดพลาดผ่าน safe copy
- [ ] งานเร่งด่วนก่อน
- [ ] SLA/เวลาค้าง
- [ ] Priority filter
- [ ] Action drawer ต่อรายการ

### `/activity-center`

- [x] Tabs Activity/Audit/Risk/Finance
- [x] Timeline
- [x] Severity filter
- [x] Detail side drawer
- [x] Source และ timestamp ชัดเจน

## Finance

### `/topups`

- [x] Loading/skeleton/busy states
- [x] Filter และ pagination พร้อม accessibility labels
- [x] Error handling แบบ `try/catch/finally`
- [x] Slip preview failure ไม่ทำให้ queue ล้ม
- [x] Confirmation สำหรับ action สำคัญ
- [~] ยังไม่ใช้ table contract เดียวกับ Withdrawals
- [ ] Sticky filter
- [ ] Proof drawer
- [ ] Bulk review

### `/withdrawals`

- [x] ยอดรวมและจำนวนรายการ
- [x] แยกสถานะ workflow
- [x] Approve/Verify payment/Reject แยก action
- [x] Reject บังคับเหตุผล
- [x] แสดงบัญชีแบบ mask และหลักฐานก่อนยืนยันจ่าย
- [x] ตรวจชนิด/ขนาดไฟล์และบังคับเลขอ้างอิง
- [x] Loading/skeleton/empty/pagination/safe error
- [x] Busy guards และ confirmation context
- [~] Queue priority ยังไม่มี score/SLA ordering
- [ ] Proof drawer เฉพาะทาง
- [ ] Bulk review

### `/bulk-queue-operations`

- [x] Selected count และปิดปุ่มเมื่อข้อมูลไม่ครบ
- [x] บังคับเหตุผล, confirmation text และ 2FA สำหรับ financial action
- [x] แยก Claim/Release/Approve/Reject/Verify
- [x] แสดงผลรายรายการและ retry เฉพาะรายการล้มเหลว
- [x] ใช้ batch financial endpoint
- [~] มี confirmation summary แต่ยังไม่มี preview dialog แยก
- [~] ยังมี raw backend message บางจุด

### `/wallets`

- [x] ยอดใช้ได้/ยอดรวม/ยอดล็อก
- [x] Member search และ pagination
- [x] Before/current balance
- [x] Confirmation และบังคับเหตุผลทุก adjustment
- [x] Busy guard และ idempotency key
- [x] Loading/empty/safe error

### `/wallet-ledgers`

- [x] Filter ทิศทางและค้นหา member/reference/idempotency
- [x] Compact record cards และ expandable metadata
- [x] Before/after balance และ idempotency key
- [x] จำกัด API ล่าสุด 100 รายการ
- [ ] Date filter
- [ ] Type filter แยกเฉพาะ
- [ ] Server-side pagination
- [ ] Export

### `/wallet-statement`

- [ ] Filter สมาชิก/วันที่
- [ ] Running balance
- [ ] Grouping ตามวัน
- [ ] Export CSV/PDF
- [ ] Transaction detail drawer

### `/wallet-analytics`

- [ ] ช่วงเวลา 7/30/90 วัน
- [ ] Line/bar chart
- [ ] Empty state
- [ ] ลดความสูงกราฟ
- [ ] Tooltip/legend

### `/reconciliation-center`

- [x] แยก matched/mismatch และแสดง summary
- [x] แสดง variance ต่อรายการและส่วนต่างรวม
- [x] Detail link และ REVIEWING/RESOLVED workflow
- [x] บังคับ review note และ confirmation
- [x] Loading/empty/safe error
- [~] Detail page ใช้แทน evidence drawer ในหน้าเดียว
- [ ] Export รายการผิดปกติ

### `/reports`

- [x] Summary/Trend/Aging sections
- [x] Export progress
- [ ] Date range picker กลางทั้งระบบ
- [ ] Comparison period
- [ ] ลดความยาวหน้า

### `/exports`

- [x] Progress status
- [x] Retry
- [x] Export history pagination
- [ ] ประเภทไฟล์และช่วงวันที่แบบครบ contract
- [ ] แจ้งจำนวนแถวก่อนดาวน์โหลด

## Members

### `/members`

- [x] Data table + member drawer
- [x] ซ่อน PII โดย default
- [x] Filter status/KYC/bank
- [x] Quick actions และ last activity
- [x] Locale และ safe error

### `/member-insights`

- [x] แก้ UUID error
- [x] Trend สมาชิกใหม่/กลับมาใช้งาน
- [x] Segmentation และ date range
- [x] Data source/last sync
- [x] Locale และ safe error

### `/bank-accounts`

- [x] แยกบัญชีรับเงิน/บัญชีสมาชิก
- [x] Verification status และ mask เลขบัญชี
- [x] Duplicate warning
- [x] Approval workflow
- [~] ภาษาและ async guards ยังไม่สม่ำเสมอทุกจุด

### `/kyc-center`

- [x] KYC checklist และ risk reason
- [x] Reject บังคับเหตุผล
- [x] Status filter
- [~] มี detail panel แต่ยังไม่มี browser/focus evidence ว่าเป็น drawer ที่สมบูรณ์

### `/support-center`

- [ ] Ticket priority
- [ ] SLA
- [ ] Canned response
- [ ] Conversation timeline
- [ ] Open/Pending/Resolved

## Risk

### `/risk-alerts`

- [x] Severity/Status/Type/Provider/Member/Date filters
- [x] Summary Open/Critical
- [x] Evidence/metadata และ related links
- [x] OPEN/REVIEWING/RESOLVED/DISMISSED workflow
- [x] Pagination และ bulk dismiss พร้อมเหตุผล/confirmation
- [x] Scan cooldown
- [ ] Critical-first ordering contract
- [~] Safe error ยังไม่ครบทุกจุด

### `/provider-risk`

- [x] Readiness score และสถานะพร้อม/เตือน/อันตราย
- [x] Blocker ก่อนเปิดเงินจริง
- [x] Preflight checklist และ real-money gate
- [x] ตรวจ failed transfers และ unresolved mismatch
- [~] ยังใช้ native confirm และ async guards ไม่ครบ

### `/audit-risk`

- [ ] Event timeline
- [ ] Risk type filter
- [ ] Before/after
- [ ] Export
- [ ] Related record

## Games และ Providers

### `/provider-health`

- [x] Status matrix/response time/webhook health
- [x] Provider ที่ต้องตรวจและ saved views

### `/simple-game-settings`

- [x] Setup checklist/completion percentage
- [x] Basic/Advanced และ test connection

### `/provider-setup-wizard`

- [x] Step 1–4, progress และ validation
- [x] Production readiness gate

### `/provider-presets`

- [x] Preset card/search/version/last updated
- [x] Read-only preset และ confirmation ก่อนสร้าง provider

### `/game-providers`

- [x] Status/health filter และ credential state
- [ ] Table contract
- [ ] Provider detail drawer

### `/games`

- [x] Search/filter และ provider/status/category
- [x] Bulk enable/disable + confirmation
- [x] Game preview

### `/game-sessions`

- [x] Compact session card/timeline/provider/member/game
- [ ] Session detail drawer

### `/game-transfers`

- [x] Direction labels และ safe money formatter
- [x] Idempotency key/provider transaction ID
- [x] Success/Pending/Failed/Reversed summary และ filter
- [x] Failed-only retry dry-run พร้อมเหตุผล/confirmation
- [~] Payload redaction และ async guards ยังไม่ครบ

### `/webhook-logs`

- [x] Processed/Retry/Failed/Duplicate states
- [x] Signature status
- [x] Raw/normalized payload viewer
- [x] Search/status filter และ safe error labels
- [ ] Replay action จำกัดสิทธิ์
- [ ] Server-side pagination
- [~] Payload redaction ยังไม่ยืนยันทุก provider

## Promotion และ Growth

### `/growth-center`

- [x] Read-only summary dashboard
- [x] รวมคิว Promotion/Bonus/Affiliate/Commission/Support/KYC
- [x] Link ไปหน้าปฏิบัติการโดยตรง
- [x] ไม่อนุมัติ ไม่ payout และไม่แก้ wallet
- [~] ภาษาและ shared components ยังไม่สม่ำเสมอ

### `/promotion-operations`

- [ ] Campaign readiness checklist
- [ ] Request priority
- [ ] Member preview
- [~] Campaign status มีผ่าน Promotion Center แต่ยังไม่ยืนยัน route นี้ครบ

### `/promotion-center`

- [x] Campaign/Banner/Bonus/Coupon/Reward tabs
- [x] Draft/Published/Archived lifecycle
- [x] Search/priority/banner preview/validation
- [x] Bulk archive พร้อม confirmation
- [ ] Unsaved changes warning
- [~] Safe error ยังไม่ครบทุกจุด

### `/promotion-claims`

- [x] Linked deposit evidence
- [x] Review drawer
- [x] Reject reason และ SLA
- [x] Timeline และ approve/reject confirmation
- [~] Drawer focus contract และ safe error ยังไม่ครบ

### `/bonus-ledgers`

- [x] Turnover progress/progress bar
- [x] Active/Completed/Expired/Revoked/Settled
- [x] Wallet-credit state และ turnover guard
- [x] Release/Expire/Revoke พร้อมเหตุผล/confirmation
- [x] Timeline
- [~] Async guards และ safe error ยังไม่ครบทุก mutation

### `/affiliate-center`

- [x] First-level downline tree
- [x] Pending/Approved/Rejected review
- [x] Commission rule
- [x] Duplicate referral warning และ block approve
- [x] Auto payout ปิดโดย default
- [~] Nested tree/shared confirmation/error handling ยังไม่ครบ

### `/commission-ledgers`

- [x] Calculation preview
- [x] Basis/rate/cap
- [x] Preview แยกจาก create ledger
- [x] Confirmation ก่อนสร้าง ledger
- [x] Manual override และ review แยกจาก payout
- [x] Payout ยังปิด ไม่แตะ wallet
- [~] Reject reason และ shared confirmation ยังไม่สมบูรณ์

### `/content-center`

- [x] Asset/Banner/Popup/Announcement/FAQ
- [x] Mobile/PC preview
- [x] MIME/size/URL validation
- [x] Private storage upload และ usage guard ก่อนลบ
- [x] แสดง storage key/size/SHA-256 และ broken asset warning
- [ ] Draft/Published lifecycle ชัดเจน
- [ ] Raw JSON ใน Advanced mode
- [ ] Unsaved changes warning
- [~] Error handling/try-finally ยังไม่ครบทุก flow

## Admin และ Security

### `/admin-accounts`

- [x] Role, 2FA, account/session status และ last login
- [x] Sessions/login history/status timeline
- [x] Suspend/Lock/Reactivate พร้อมเหตุผลและ guards
- [x] Revoke session พร้อม audit message
- [~] Detail เป็น inline panel ไม่ใช่ drawer
- [~] Native confirm/prompt และ raw message บางจุด

### `/admin-roles`

- [x] Permission ตาม module
- [x] จำนวน permission/user และ wildcard/level
- [x] Module filter
- [ ] Search
- [ ] Accordion
- [ ] Permission preview
- [ ] Editor/save workflow

### `/admin-invitations`

- [x] Status และวันหมดอายุ
- [x] Reissue/Revoke
- [x] Token แสดงครั้งเดียว
- [x] Permission gating และ email/role validation
- [x] ป้องกัน Owner/Super Admin/Wildcard role
- [~] Status normalization และ shared confirmation ยังไม่ครบ

### `/audit`

- [x] Server-side pagination
- [x] Filter search/module/action/admin/target/date และแสดง IP/user agent
- [x] Expandable before/after
- [x] Deep link ไปข้อมูลที่เกี่ยวข้อง
- [x] Read-only
- [ ] Export จำกัดสิทธิ์
- [~] Field-level masking/redaction ยังไม่ยืนยันครบ

### `/settings`

- [x] Category index
- [x] แยก editor ออกจาก hub ไม่รวม 24 หน้าในหน้าเดียว
- [x] Search + quick links + empty state
- [ ] Unsaved changes warning กลาง
- [ ] Save-state contract กลาง

### `/anti-bot`

- [x] Provider status และ Turnstile/reCAPTCHA/hCaptcha
- [x] Site key/secret state
- [x] Route checklist และ provider test
- [x] Adaptive/emergency mode
- [ ] Setup wizard แบบ step
- [ ] Test/Production mode
- [ ] Client-side block เมื่อ key ไม่ครบ
- [~] Shared components ยังไม่ครบ

### `/security`

- [x] Security Center และ TOTP QR setup
- [x] เปิด/ปิด 2FA
- [x] Recovery codes/regenerate/owner recovery readiness
- [x] Active sessions/revoke/logout others/logout all
- [ ] Login history ของบัญชีปัจจุบันในหน้านี้
- [~] ยังไม่ยืนยันว่า action สำคัญทุกระบบบังคับ 2FA step-up
- [~] Native confirm และ safe error ยังไม่ครบ

### `/provider-credentials`

- [x] Demo/UAT/Production
- [x] Mask secret/key rotation/last changed
- [x] Test connection โดยไม่เปิดเงินจริง

### `/adapter-test`

- [x] Safe Test/Production Test
- [x] Test history/latency/response status
- [x] Technical payload drawer

### `/game-api-settings`

- [x] Readiness checklist และ Basic/Advanced
- [x] Endpoint completeness/preflight/real-money gate

## Phase 2 — QA, Monitoring และ Release Control

- [ ] Seeded UAT data และ test account แยกตาม role พร้อมหลักฐานใช้งาน
- [ ] E2E ครบ approve/reject/pay/wallet adjustment/role change
- [ ] E2E ตรวจ audit log และ permission
- [ ] Feature flag gradual rollout/rollback
- [ ] Error tracking พร้อม redact PII/secret/payment payload
- [ ] Structured log + trace ID UI → API → DB → Provider
- [ ] Monitoring/SLO สำหรับ error, latency, queue aging, webhook และ provider
- [ ] Lighthouse/performance budget ใน CI
- [ ] Backup-restore drill อัตโนมัติพร้อมหลักฐาน restore
- [ ] Authenticated browser/visual regression ด้วย non-production credentials
- [~] Repository มี Build/Quality/Security/Architecture/Full-System workflows แต่ชื่อ workflow ยังไม่ใช่หลักฐาน coverage หรือผลผ่าน

## Definition of Done

- [~] ไม่มี NaN ในหน้าที่ตรวจแล้ว แต่ยังไม่ยืนยันทั้งระบบ
- [~] ไม่มี raw backend error ในหลายหน้า แต่ยังไม่ครบ
- [~] Loading/empty/error/permission states มีหลายหน้า แต่ยังไม่ครบทุก route
- [~] ใช้ layout/component กลางหลายหน้า แต่ยังมี inline/native controls
- [~] Keyboard/focus รองรับ shell/dialog หลัก แต่ยังไม่ audit ทุก custom drawer
- [ ] Mobile ไม่มีเนื้อหาซ้อนหรือหลุดจอครบทุก viewport
- [~] Action สำคัญหลายส่วนมี confirmation/audit แต่ยังไม่ครบทุก action
- [~] ภาษา วันที่ ตัวเลข และ status ดีขึ้นมาก แต่ยังไม่มาตรฐานเดียวกันทั้งหมด
- [~] Profile/Logout ซ้ำถูกแก้แล้ว แต่เมนูและปุ่มซ้ำยังต้อง audit ต่อ
- [x] Overlay เปิดชนกันไม่ได้
- [ ] ไม่มี route legacy หรือลิงก์เสียครบทุก navigation surface
- [~] Desktop rail/tablet/mobile drawer มี implementation แต่ยังไม่มีหลักฐานครบทุก permission/viewport
- [ ] Action เสี่ยงมี automated regression ครบก่อน deploy
