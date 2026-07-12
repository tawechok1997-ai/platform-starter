# Admin UX/UI Redesign Specification

> เป้าหมาย: มืออาชีพ ใช้งานง่าย ข้อมูลครบ ไม่รก และรองรับ Desktop/Mobile

## 1. หลักการกลาง

- แสดงคิว, SLA, Risk และข้อผิดพลาดก่อนข้อมูลทั่วไป
- สรุปก่อนรายละเอียด โดยเปิดรายละเอียดผ่าน Drawer หรือ Detail Page
- หนึ่งหน้ามี Primary Action หลักเพียงหนึ่งรายการ
- ห้ามแสดงตัวเลขเดียวกันซ้ำทั้ง KPI, Card และตาราง
- ทอง = Primary action, เขียว = Success, เหลือง = Warning, แดง = Danger
- Mobile ต้องเป็น Card List ไม่ใช่ตาราง Desktop ที่ย่อแล้วบังคับเลื่อนแนวนอน

### Desktop

- Sidebar 240px, Topbar 64px, Content max-width 1360px
- Grid 12 columns, gap 16-24px, card radius 14-16px

### Mobile

- Topbar 56px, content padding 12-16px, touch target ขั้นต่ำ 44px
- Bottom navigation: Dashboard, Operations, Risk, More
- Filter และเมนูรองใช้ Bottom Sheet หรือ Drawer

## 2. Design System

- UI font: `Noto Sans Thai` หรือ `IBM Plex Sans Thai`
- Number/API font: `IBM Plex Sans` / `IBM Plex Mono`
- Page title: 30-32px Desktop, 23-25px Mobile
- Section title: 18-20px Desktop, 17-18px Mobile
- Body: 14px, line-height 1.5
- KPI: 28-34px พร้อม `font-variant-numeric: tabular-nums`
- Background: `#0B0F14`
- Surface: `#101720`, raised `#151E29`
- Brand: `#F5C542`
- Border: `rgba(148,163,184,.14)`

### Component กลาง

`PageHeader`, `SummaryCard`, `FilterBar`, `DataTable`, `MobileCardList`, `Tabs`, `StatusBadge`, `DetailDrawer`, `Timeline`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `Skeleton`, `StickyActionBar`, `Pagination`

## 3. Tool Stack

- UI: `shadcn/ui`
- Icons: `lucide-react`
- Tables: `@tanstack/react-table`
- Server state: `@tanstack/react-query`
- Forms: `react-hook-form`
- Validation: `zod`
- Charts: `recharts`
- Date/time: `date-fns`
- CSV: `papaparse`
- XLSX: `xlsx` เฉพาะหน้าที่ต้องใช้

### Icon standard

- ใช้ Lucide React ชุดเดียว ห้ามใช้อีโมจิหรือผสม icon library
- Sidebar 18px, Button 16px, KPI 20px, Mobile navigation 21px
- Stroke width 1.8-2
- ปุ่มสำคัญใช้ Icon + Text
- Icon-only ต้องมี Tooltip และ `aria-label`

## 4. งานหลัก

### Dashboard `/dashboard`

- Action Center: ฝากรอตรวจ, ถอนรอตรวจ, Risk Open, Critical
- KPI: Available, Locked, Net Flow, Wallets
- Today Summary: ฝาก, ถอน, จำนวนรายการ
- Risk Alerts 3-5 รายการ
- Queue ฝาก/ถอนแบบ Tabs
- Recent Ledger แสดงเป็น Activity Feed
- Tool: shadcn/ui, Recharts, TanStack Query
- Mobile: Action cards เลื่อนแนวนอน, Hero Balance, Risk/Queue ก่อนข้อมูลรอง

### Operations `/operations`

- KPI: Unassigned, In Progress, Overdue, Critical
- Filter: Type, Priority, SLA, Assignee, Member
- Table: Priority, Type, Member, Amount, Status, Wait, Assignee
- Detail Drawer: Timeline, Notes, Related Member/Transaction
- Actions: Assign to me, Assign, Escalate, Resolve
- Tool: TanStack Table, Sheet/Drawer, TanStack Query
- Mobile: Card List, Filter Bottom Sheet, Sticky action

### Topups `/topups`

- KPI: Pending, Overdue, Pending Amount, Approved Today, Rejected Today
- Table: Member, Bank, Amount, Submitted, Wait, Risk, Assignee
- Detail: Slip Viewer, Duplicate Warning, Member Summary, Related Transactions
- Actions: Approve, Reject, Request Info, Assign, Flag Risk
- Tool: TanStack Table, Dialog, Image Viewer, RHF + Zod
- Mobile: Slip full-screen, Sticky Approve/Reject

### Withdrawals `/withdrawals`

- KPI: Pending, Pending Amount, Overdue, High/Critical, Completed Today
- Table: Member, Bank, Account Masked, Amount, Balance, Risk, Wait
- Detail: KYC, Bank Verification, History, IP/Device, Related Risk
- Actions: Approve, Reject, Hold, Escalate, Request Verification
- Tool: TanStack Table, Alert Dialog, RHF + Zod
- Mobile: Amount/Risk เด่น, Reject/Hold ต้องมีเหตุผล

### Members `/members`

- KPI: Total, Active, Suspended, New Today, KYC Pending
- Search: Member ID, Username, Phone
- Tabs: Overview, Wallet, Transactions, Bank, KYC, Risk, Sessions, Audit
- Actions: Suspend, Force Logout, Lock Wallet, Reset Password, Add Note
- Tool: TanStack Table, Tabs, Drawer
- Mobile: Search Sticky, Member Cards, Tabs เลื่อนแนวนอน

### Bank Accounts `/bank-accounts`

- KPI: Total, Verified, Pending, Duplicate, Recently Changed
- Table: Member, Bank, Account Masked, Account Name, Verification, Last Used
- Detail: Linked Members, History, Verification Evidence, Risk Notes
- Actions: Verify, Reject, Flag Duplicate
- Tool: TanStack Table, Badge, Dialog
- Mobile: Card แสดงบัญชี Masked และ Duplicate Warning

## 5. การเงินและความเสี่ยง

### Wallets `/wallets`

- KPI: Total Balance, Available, Locked, Frozen, Negative Balance
- Table: Member, Available, Locked, Total, Status, Last Movement
- Detail: Ledger, Holds, Adjustments, Audit
- Actions: Lock, Freeze, Adjust, Release Hold
- ทุก action การเงินต้องมี Reason, Before/After, Permission และ Audit
- Tool: TanStack Table, Alert Dialog, RHF + Zod

### Wallet Ledgers `/wallet-ledgers`

- Summary: Credits, Debits, Net, Adjustments, Reversals
- Table: Ledger ID, Member, Type, Direction, Amount, Before, After, Reference
- Filter: Member, Type, Direction, Date, Amount, Actor
- Detail: Source Transaction, Reversal Chain, Audit
- Tool: TanStack Table, date-fns, Export

### Risk Alerts `/risk-alerts`

- KPI: Open, Critical, High, Unassigned, Overdue, Resolved Today
- Table: Severity, Type, Member, Amount, Status, Age, Assignee
- Tabs: Overview, Evidence, Transactions, Member History, Timeline, Notes
- Actions: Acknowledge, Assign, Escalate, Resolve, Reopen, False Positive
- Tool: TanStack Table, Tabs, Drawer, Timeline
- Mobile: Critical ก่อน, Sticky Resolve/Escalate

### Reports `/reports`

- Templates: Deposit, Withdrawal, Wallet, Member, Risk, Provider, Promotion, Affiliate, Audit
- Builder: Date, Filters, Columns, Grouping, Sorting, Timezone, Format
- History: Name, Type, Creator, Status, Size, Expiry, Download
- Tool: RHF + Zod, Recharts, Papa Parse/SheetJS
- Mobile: Template-first, Builder Full Screen

## 6. ค่ายเกม

### Simple Game Settings `/simple-game-settings`

- Enable, Maintenance, Currency, Wallet Mode, Limits, Visibility, Launch Settings
- Validation, Unsaved Changes, Preview, Reset, Save
- Tool: RHF + Zod, Accordion, Sticky Action Bar

### Provider Setup Wizard `/provider-setup-wizard`

- Steps: Info, Credentials, Endpoint, Wallet, Webhook, Test, Review, Activate
- Save Draft, Validation, Test Connection, Progress
- Tool: Stepper, RHF + Zod, TanStack Query

### Provider Presets `/provider-presets`

- Table: Preset, Provider Type, Currency, Wallet Mode, Usage, Updated
- Actions: Create, Clone, Apply, Compare, Archive
- Detail: Config, Diff, Used By, Version History
- Tool: TanStack Table, Diff Viewer, Dialog

### Game Transfers `/game-transfers`

- KPI: Transfer In, Transfer Out, Pending, Failed, Reversed, Net
- Table: Transfer, Member, Provider, Direction, Amount, Status, Duration, Error
- Detail: Request/Response, Wallet Impact, Retry History, Session
- Actions: Retry, Reconcile, Review, Escalate
- Tool: TanStack Table, Drawer, Query Mutation

### Reconciliation `/reconciliation-center`

- KPI: Matched, Mismatch, Missing Local, Missing Provider, Difference
- Batch List + Batch Detail
- Table: Provider, Local Amount, Provider Amount, Difference, Status
- Actions: Re-run, Accept Difference, Adjust, Assign, Export
- Tool: TanStack Table, Tabs, Recharts

## 7. สินค้าและการตลาด

### Growth Center `/growth-center`

- KPI: Active Promotions, Claims, Bonus Issued, Affiliate Revenue, Conversion
- Pending Work และ Performance Summary
- Tool: Recharts, KPI Cards, TanStack Query

### Promotion Center `/promotion-center`

- Table: Promotion, Type, Eligibility, Schedule, Budget, Claims, Status
- Editor: General, Eligibility, Reward, Limits, Schedule, Content, Terms, Review
- Actions: Draft, Preview, Publish, Pause, Clone, Archive
- Tool: RHF + Zod, Tabs, Preview Dialog

### Promotion Claims `/promotion-claims`

- KPI: Pending, Approved, Rejected, Fraud Flagged, Bonus Value
- Table: Member, Promotion, Reward, Eligibility, Risk, Status
- Detail: Deposit Condition, Wager, Existing Bonus, Evidence
- Actions: Approve, Reject, Hold, Review
- Tool: TanStack Table, Drawer, Alert Dialog

### Bonus Ledgers `/bonus-ledgers`

- Table: Member, Promotion, Type, Amount, Before/After, Status, Expiry
- Detail: Source Claim, Wager Requirement, Usage, Adjustment, Audit
- Tool: TanStack Table, date-fns

### Affiliate Center `/affiliate-center`

- KPI: Affiliates, Active, Referrals, Revenue, Pending Commission, Fraud Alerts
- Table: Affiliate, Code, Referrals, Revenue, Commission, Status
- Tabs: Overview, Referrals, Revenue, Commission, Payout, Links, Audit
- Tool: TanStack Table, Recharts, Tabs

### Commission Ledgers `/commission-ledgers`

- Table: Affiliate, Period, Revenue, Rate, Commission, Adjustment, Status
- Actions: Approve, Hold, Adjust, Mark Paid, Export
- Adjustment ต้องมี Reason และ Audit
- Tool: TanStack Table, Dialog, Export

### Content Center `/content-center`

- Types: Banner, Announcement, Page, FAQ, Terms, Popup, Footer
- List: Title, Type, Locale, Status, Schedule, Updated
- Editor: Rich Text, Media, Link, SEO, Preview, Version
- Tool: Rich Text Editor, Media Picker, Tabs

### KYC Center `/kyc-center`

- KPI: Pending, Approved, Rejected, Expired, High Risk, Review Time
- Queue: Member, Document, Submitted, Risk, Wait, Assignee
- Detail: Document Viewer, Extracted Data, Comparison, Bank, Risk, History
- Actions: Approve, Reject, Resubmit, Escalate, Assign
- Tool: Document Viewer, TanStack Table, Drawer

### Support Center `/support-center`

- KPI: Open, Unassigned, Overdue, Waiting Member, Resolved Today
- Table: Ticket, Member, Subject, Category, Priority, Status, Assignee
- Detail: Conversation, Member Summary, Transactions, Notes, Attachments
- Actions: Reply, Assign, Priority, Resolve, Reopen
- Tool: Conversation Panel, TanStack Query, Drawer

## 8. ขั้นสูง

### Provider Credentials `/provider-credentials`

- Table: Provider, Environment, Type, Last Rotated, Expires, Status
- Actions: Add, Rotate, Disable, Test, History
- Secret ห้ามแสดงเต็ม; Reveal/Copy ต้อง Re-auth และ Audit
- Tool: Dialog, Re-auth Flow, Masked Fields

### Adapter Test `/adapter-test`

- Input: Provider, Endpoint, Operation, Parameters
- Output: Request, Response, Timing, Error, Parsed Result
- Redact Secret และ PII
- Tool: RHF + Zod, Code/JSON Viewer, Tabs

### Webhook Logs `/webhook-logs`

- KPI: Received, Success, Failed, Retried, Invalid Signature
- Table: Event, Provider, Reference, HTTP Status, Retry, Received
- Detail: Sanitized Headers, Payload, Signature, Processing, Error, Retry History
- Actions: Retry, Ignore, Copy Sanitized, Link Case
- Tool: TanStack Table, JSON Viewer, Retry Mutation

### Provider Risk `/provider-risk`

- KPI: Providers at Risk, Error Rate, Latency, Mismatch, Webhook Failure
- Table: Provider, Risk Score, Error Rate, Latency, Mismatch, Alerts
- Detail: Failures, Reconciliation, Credentials Age, Webhook, Incidents
- Tool: Recharts, TanStack Table, Status Cards

### Legacy API Settings `/game-api-settings`

- แสดง Legacy Banner และ Link ไป Simple Settings
- Diff Before Save, Version History, Warning ก่อนแก้
- Tool: RHF + Zod, Diff Viewer, Warning Banner

### Game Providers `/game-providers`

- Table: Provider, Environment, Currency, Wallet Mode, Games, Health, Status
- Tabs: Overview, Credentials, Endpoints, Games, Transfers, Webhooks, Risk, Audit
- Actions: Enable, Disable, Maintenance, Test, Sync
- Tool: TanStack Table, Tabs, Drawer

### Games `/games`

- List/Grid Toggle
- Filter: Provider, Category, Enabled, Visible, Featured
- Bulk: Enable, Disable, Show, Hide, Feature, Category
- Tool: TanStack Table, Grid/List Toggle, Bulk Actions

### Game Sessions `/game-sessions`

- KPI: Active, Sessions Today, Failed Launches, Abnormal Duration, Orphan
- Table: Session, Member, Game, Provider, Duration, Bet, Win, Status
- Detail: Launch, Wallet Events, IP/Device, Provider References, Errors
- Tool: TanStack Table, Timeline, Drawer

### Audit Risk `/audit-risk`

- Table: Actor, Action, Alert, Member, Before, After, Reason, Time
- Detail: Full Diff, Related Alert/Transaction, IP/Device, Permission
- Read-only
- Tool: TanStack Table, Diff Viewer

### Audit Logs `/audit`

- Table: Time, Admin, Action, Resource, Result, IP, Device
- Detail: Before/After, Request Metadata, Permission, Correlation ID
- Read-only ห้าม Edit/Delete
- Tool: TanStack Table, JSON/Diff Viewer

## 9. ตั้งค่าและความปลอดภัย

### Website Settings `/settings`

- Sections: General, Branding, Finance, Limits, Notifications, Maintenance, Legal, Integrations
- Save per Section, Unsaved Warning, Validation, Diff, Version
- Tool: RHF + Zod, Accordion, Sticky Save

### Anti-bot `/anti-bot`

- KPI: Challenged, Blocked, Passed, False Positive, Suspicious IP
- Settings: Provider, Threshold, Routes, Rate Limit, Country/IP/Device Rules
- Logs: Time, IP, Route, Score, Decision, User
- Tool: RHF + Zod, Recharts, TanStack Table

### Admin Accounts `/admin-accounts`

- Table: Admin, Role, Status, MFA, Last Login, Created
- Tabs: Profile, Roles, Permissions, Sessions, Devices, Activity, Audit
- Actions: Suspend, Activate, Reset MFA, Revoke Sessions, Change Role
- Tool: TanStack Table, Tabs, Alert Dialog

### Roles & Permissions `/admin-roles`

- Role List: Members, Permission Count, Updated, System/Custom
- Permission Matrix แบ่งตาม Domain
- Search, Select Group, Indeterminate Checkbox, Diff, Affected Admins
- ป้องกัน Self-lockout และเตือน High-risk Permissions
- Tool: Permission Matrix, Checkbox Groups, Diff Viewer

### Admin Invitations `/admin-invitations`

- Form: Email, Role, Expiry, Message, Require MFA, Environment
- History: Email, Role, Inviter, Sent, Expiry, Status
- Actions: Resend, Revoke, Copy Link, Extend
- Tool: RHF + Zod, TanStack Table, Dialog

### Security `/security`

- KPI: Admins without MFA, Active Sessions, Failed Logins, Locked Accounts, New Devices
- Sections: MFA, Session Policy, IP Allowlist, Device Trust, Events
- Actions: Enforce MFA, Revoke Sessions, Lock Admin, Add IP Rule, Review Incident
- Tool: Recharts, Status Cards, TanStack Table

## 10. Loading, Empty, Error และ Accessibility

ทุกหน้าต้องมี:

- Skeleton ตามรูปทรงจริง
- Empty State ที่บอกเหตุผลและสิ่งที่ทำต่อได้
- Widget-level Error พร้อม Retry
- เก็บข้อมูลเดิมไว้ระหว่าง Refresh
- Focus State ชัดเจน
- Keyboard Navigation
- Contrast ผ่าน WCAG
- ไม่ใช้สีอย่างเดียวบอกสถานะ
- Icon-only button มี `aria-label`
- รองรับ `prefers-reduced-motion`

## 11. ลำดับการทำงาน

### Phase 1

Dashboard, Operations, Topups, Withdrawals, Members, Risk Alerts, Wallets, Wallet Ledgers, Bank Accounts

### Phase 2

Providers, Transfers, Reconciliation, Webhooks, Provider Risk, Sessions, Reports

### Phase 3

Promotions, Claims, Bonus, Affiliate, Commission, KYC, Support, Content

### Phase 4

Admin Accounts, Roles, Invitations, Security, Anti-bot, Settings, Audit, Credentials, Adapter Test

## 12. เกณฑ์รับงาน

- เปิดหน้าแล้วเข้าใจเป้าหมายภายใน 5 วินาที
- Primary Action มีเพียงหนึ่งรายการ
- ข้อมูลสำคัญอยู่เหนือ fold
- Mobile ไม่มีตารางแนวนอน
- ทุกหน้ามี Loading, Empty และ Error
- Action เสี่ยงมี Confirm, Reason, Permission และ Audit
- สี สถานะ ระยะห่าง และตัวอักษรใช้มาตรฐานเดียวกัน
