# Admin Modernization Chat Worklist

> ใช้ `[x]` เมื่อยืนยันจากโค้ดแล้ว
> ใช้ `[~]` เมื่อทำบางส่วนหรือยังขาดหลักฐาน
> ใช้ `[ ]` เมื่อยังไม่ครบ

## Foundation

- [x] Shared admin UI primitives
- [x] Responsive app shell
- [x] Permission-aware navigation
- [x] Shared loading/empty/error states
- [x] Safe money formatting
- [x] Shared confirmation dialog
- [x] Shared drawer focus/Escape/backdrop/scroll-lock contract และ safe error

## Dashboard และ Operations

### `/dashboard`

- [x] เรียง System status → Urgent queue → KPI → Risk → Finance → Activity
- [~] ลด KPI/กราฟซ้ำระหว่าง priority, quick cards และ queue cards
- [x] Loading และ partial API failure
- [x] Permission-aware sections

### `/operations`

- [x] เรียง urgent work ก่อนงานปกติ
- [x] Priority filter แยก critical/member queue
- [x] Queue aging และ detail drawer
- [x] Real-money warning

## Members

- [x] Member directory
- [x] Member detail hierarchy
- [x] Responsive member insights

## Wallet และ Finance

### `/wallets`

- [x] ค้นหา member
- [x] Before/current balance
- [x] Adjustment confirmation
- [x] Idempotency guard
- [x] Safe error

### `/wallet-ledgers`

- [x] Filter ทิศทางและค้นหา member/reference/idempotency
- [x] Compact record cards และ expandable metadata
- [x] Before/after balance และ idempotency key
- [x] Server query รองรับ page/take/filter และ response metadata
- [x] Date filter
- [x] Type filter แยกเฉพาะ
- [x] Server-side pagination
- [~] CSV export เฉพาะหน้าที่โหลดจาก server

### `/wallet-statement`

- [x] Filter สมาชิก/วันที่
- [x] Running balance จาก balanceBefore/balanceAfter
- [x] Grouping ตามวัน
- [x] Export CSV และ Print/PDF
- [x] Transaction detail drawer
- [x] Server pagination และ loading/empty/safe error

### `/wallet-analytics`

- [x] ช่วงเวลา 7/14/30/90 วัน
- [x] Bar chart และตารางรายวัน
- [x] Empty/loading/error state
- [x] กราฟความสูงกระชับและ responsive
- [x] Tooltip/legend พร้อม keyboard focus
- [x] Liquidity health และ pending queue indicators

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
- [~] Export UX และ comparison period ยังต้องตรวจต่อ

## Promotion และ Growth

### `/promotion-operations`

- [x] Campaign readiness checklist
- [x] Request priority
- [x] Member preview
- [x] Draft/Published/Archived visibility

### `/promotion-claims`

- [x] Evidence/SLA/timeline review
- [x] Approve/reject guards
- [x] Shared review drawer contract

### `/bonus-ledgers`

- [x] Async guards และ loading
- [x] Financial confirmation
- [x] Progress accessibility

### `/growth-center`

- [x] Loading และ partial failure
- [x] Read-only boundary
- [x] Status variants

### `/affiliate-center`

- [x] Nested downline tree
- [x] Confirmation และ reject reason
- [x] Duplicate referral guard

### `/commission-ledgers`

- [x] Preview ก่อนสร้าง
- [x] Validation และ reject reason
- [x] Closed-item guards
- [x] Loading/safe error

## Content Center

- [x] MIME/size/URL validation
- [x] Private storage upload และ usage guard ก่อนลบ
- [x] แสดง storage key/size/SHA-256 และ broken asset warning
- [x] Draft/Published/Archived lifecycle ชัดเจนและ backward-compatible
- [x] Editable Raw JSON ใน Advanced mode พร้อม parse/normalize
- [x] Unsaved changes warning ครอบคลุมฟอร์มและ Raw JSON ที่ยังไม่ apply
- [x] Error handling/try-finally ครบ load/save/upload/delete

## Admin และ Security

- [x] Login busy guard
- [x] 2FA/CAPTCHA boundaries
- [x] Permission model
- [x] Confirmation for dangerous actions
- [~] ตรวจ raw backend error ทุก route

## Cross-route Audit

- [ ] Responsive audit ทุก viewport
- [ ] ตรวจภาษาไทย/อังกฤษทุกหน้า
- [ ] ลด inline styles และ compatibility CSS
- [ ] ตรวจ loading/error/permission ทุก route
- [ ] ตรวจ danger buttons, touch target และ disabled reason
- [ ] Browser evidence บน mobile/tablet
- [ ] ตรวจลิงก์เก่าและ redirect
