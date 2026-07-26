# Admin Experience Modernization Specification

สถานะเอกสาร: Proposed implementation specification  
ขอบเขต: `apps/web-admin`  
อ้างอิงภาพตรวจสอบ: Admin desktop screenshots 40 หน้าที่ผู้ใช้จัดเตรียม  
เอกสารสถานะโครงการหลัก: [`master-project-worklist.md`](./master-project-worklist.md)

> เอกสารนี้เป็นข้อกำหนดด้าน Information Architecture, UX, UI, responsive behavior, localization, data presentation และ acceptance criteria สำหรับการปรับ Admin ทั้งระบบ ไม่ใช้เป็นสถานะงานซ้ำกับ Master Project Worklist งานที่เริ่มลงมือจริงต้องเพิ่มเป็นกลุ่มงานอ้างอิงเอกสารนี้ใน Master Project Worklist

---

## 1. เป้าหมาย

1. ลดเมนูและหน้าที่กระจัดกระจาย โดยรวมงานที่เกี่ยวข้องเป็น Workspace เดียวกัน
2. ทำให้ Admin ค้นหางานสำคัญและลงมือทำได้ภายในไม่เกิน 2-3 interaction
3. ลดหน้าที่ยาวจากการแสดงข้อมูลทั้งหมด โดยใช้ pagination, tabs, drawer และ detail route
4. ทำให้ข้อมูลการเงิน ความเสี่ยง ผู้ให้บริการ และการตั้งค่าอ่านได้เร็วและไม่กำกวม
5. แยกภาษาไทยและอังกฤษอย่างสมบูรณ์ ไม่มีข้อความสองภาษาปะปนในหน้าเดียว
6. ทำให้ Desktop, Tablet และ Mobile ใช้งานได้จริงโดยไม่สูญเสียฟังก์ชันสำคัญ
7. ใช้กราฟและ motion เฉพาะจุดที่ช่วยตัดสินใจ ไม่ใช้เพื่อการตกแต่งอย่างเดียว
8. ทำให้การแก้ข้อมูลสำคัญปลอดภัย มี permission, confirmation, step-up verification และ audit trail
9. ลด CSS และ component ที่ทำหน้าที่ซ้ำกัน
10. กำหนดเกณฑ์ปิดงานที่ตรวจสอบได้ด้วย lint, typecheck, build, unit test, browser test และ visual regression

## 2. สิ่งที่ไม่ควรเกิดขึ้นหลังปรับ

- ไม่มี top-level menu 30-40 รายการ
- ไม่มีหน้ารายการสูงหลายพันพิกเซลเพราะโหลดข้อมูลทั้งหมดพร้อมกัน
- ไม่มีการใช้ Card แบบเดียวครอบทุกประเภทข้อมูล
- ไม่มี dropdown, popover, modal หรือปุ่ม Logout ถูกตัดด้วย overflow
- ไม่มีข้อความภาษาไทยและอังกฤษปะปนโดยไม่มีเหตุผล
- ไม่มี primary action มากกว่าหนึ่งรายการใน Page Header
- ไม่มีตารางบังคับเลื่อนทั้งหน้าใน Mobile
- ไม่มีกราฟที่ไม่มีคำอธิบายหน่วย ช่วงเวลา หรือ empty state
- ไม่มี mutation สำคัญที่กดซ้ำได้หรือไม่มี confirmation
- ไม่มี route ใหม่ที่ทำให้ bookmark และ deep link เดิมเสียโดยไม่มี redirect

---

# 3. หลักการออกแบบ

## 3.1 Shared system 70% และ page identity 30%

ทุกหน้าต้องใช้ Shell, Navigation, Typography, Spacing, Button, Form, Table, Filter, Drawer, Modal, Toast และ Status system ร่วมกัน แต่แต่ละ Workspace ต้องมีองค์ประกอบเฉพาะตามงาน เช่น:

- Finance ใช้ ledger table, reconciliation comparison และ money-flow chart
- KYC ใช้ document viewer และ decision workspace
- Risk ใช้ investigation queue, evidence timeline และ severity trend
- Provider ใช้ uptime, latency, error rate และ health matrix
- Promotion ใช้ campaign builder, preview และ eligibility simulation
- Security ใช้ session table, login anomaly และ policy configuration

## 3.2 Progressive disclosure

แสดงเฉพาะข้อมูลที่ใช้ตัดสินใจในระดับปัจจุบัน รายละเอียดรองเปิดผ่าน:

1. Tooltip สำหรับคำอธิบายสั้น
2. Expand สำหรับข้อความยาว
3. Drawer สำหรับรายละเอียดรายการ
4. Modal สำหรับ action ที่ต้องยืนยัน
5. Detail route สำหรับงานซับซ้อนที่ต้องแชร์ URL หรือกลับมาทำต่อ

## 3.3 Exception-first design

หน้า Admin ต้องนำรายการที่ต้องจัดการขึ้นก่อน เช่น:

- Pending หรือเกิน SLA
- Failed หรือ Reversed
- Risk สูง
- Provider degraded/down
- KYC mismatch
- Duplicate bank/proof/claim
- Permission หรือ security anomaly

ข้อมูลปกติอยู่ในตารางหรือรายงาน ไม่ควรแย่งพื้นที่กับงานเร่งด่วน

## 3.4 One clear primary action

แต่ละหน้ามี Primary action ไม่เกินหนึ่งรายการ เช่น `สร้างโปรโมชั่น`, `เชิญผู้ดูแล`, `เพิ่มผู้ให้บริการ` ส่วน action รองเข้า More menu หรืออยู่ในบริบทของแถว/Drawer

## 3.5 Compact by default

- หัวข้อหน้าหนึ่งบรรทัด
- คำอธิบายหน้าสูงสุดสองบรรทัด
- KPI หลักไม่เกิน 6 ใบ
- Filter หลักแสดงไม่เกิน 4 ตัว ที่เหลืออยู่ใน Advanced filters
- Table เริ่มต้น 20 หรือ 50 แถวตามประเภทข้อมูล
- Card หลีกเลี่ยงข้อความอธิบายที่ซ้ำกับ label

---

# 4. Information Architecture ใหม่

จากหน้าปัจจุบันประมาณ 40 หน้า ให้ลดเหลือ 11 Workspace หลักใน Sidebar โดยฟังก์ชันเดิมยังอยู่ครบผ่าน tabs, sub-navigation และ detail routes

| Workspace ใหม่ | รวมหน้าปัจจุบัน | รูปแบบหลัก |
|---|---|---|
| 1. Command Center | Dashboard, Operations, Activity Center | Executive overview + operations queue + activity feed |
| 2. Finance | Topups, Withdrawals, Wallets, Wallet Ledgers, Reconciliation, Reports | Finance workspace ที่มี tabs และ shared date/filter context |
| 3. Members | Member Insights, Bank Accounts, KYC, Support | Member 360, verification และ support workspace |
| 4. Risk & Compliance | Risk Alerts, Provider Risk, Audit Risk | Investigation queue, provider risk และ risk audit |
| 5. Provider Operations | Simple Game Settings, Setup Wizard, Provider Presets, Game Providers, Provider Health, Webhook Logs | Provider setup, configuration, health และ technical logs |
| 6. Games | Games, Game Sessions, Game Transfers | Catalog, live sessions และ transfer ledger |
| 7. Growth & Promotions | Growth Center, Promotion Operations, Promotion Center, Promotion Claims, Bonus Ledgers | Marketing analytics, campaign builder และ claim operations |
| 8. Affiliate & Commission | Affiliate, Commission Ledgers | Affiliate performance และ settlement |
| 9. Content | Content Center | CMS, asset library และ responsive preview |
| 10. Access & Security | Admin Accounts, Roles, Invitations, Audit, Security, Anti-bot | Admin identity, permissions, audit และ defense |
| 11. Settings | Settings และ configuration ที่กระจายอยู่ในหลายหน้า | Searchable settings workspace |

## 4.1 เมนู Sidebar เป้าหมาย

### Overview
- Command Center

### Operations
- Finance
- Members
- Risk & Compliance
- Provider Operations
- Games

### Growth
- Growth & Promotions
- Affiliate & Commission
- Content

### Administration
- Access & Security
- Settings

Top-level menu ต้องไม่เกิน 11 รายการ และไม่แสดงทุก subpage พร้อมกันใน Sidebar

## 4.2 รูปแบบ URL

ใช้ route คงที่และสามารถ bookmark ได้ เช่น:

- `/dashboard?tab=overview`
- `/dashboard?tab=operations`
- `/finance?tab=deposits`
- `/finance?tab=withdrawals`
- `/finance?tab=wallets`
- `/members?tab=kyc`
- `/risk?tab=alerts`
- `/providers?tab=health`
- `/games?tab=sessions`
- `/growth?tab=promotions`
- `/access?tab=roles`
- `/settings?section=security`

Detail route ใช้กับงานที่มีบริบทมาก:

- `/members/:memberId`
- `/kyc/:caseId`
- `/risk/alerts/:alertId`
- `/providers/:providerId`
- `/promotions/:promotionId`
- `/support/:ticketId`

Route เดิมต้องมี redirect หรือ compatibility layer จนกว่าจะยืนยันว่าไม่มี bookmark/integration ใช้งานอยู่

---

# 5. Admin Shell และ Navigation

## 5.1 Sidebar

- Expanded width: 248px
- Collapsed width: 72px
- Mobile drawer: 86% ของ viewport และไม่เกิน 360px
- เมนูส่วนกลาง scroll แยกจาก profile/footer
- Profile, environment และ Logout อยู่ด้านล่างเสมอ
- Collapsed state แสดง tooltip ชื่อเมนู
- Active state มี icon, text weight และ left indicator
- จำสถานะ expanded/collapsed ต่อผู้ใช้
- Badge ใช้เฉพาะจำนวนที่ต้องจัดการ เช่น pending/critical และจำกัดที่ `99+`
- รองรับ keyboard, focus, Escape และ click outside

## 5.2 Topbar

- Desktop สูง 64px และ sticky
- ประกอบด้วย mobile menu, breadcrumb, command search, notification, language, environment และ profile
- Global command search รองรับค้นหา member, transaction, provider, promotion, ticket และ route
- Secondary actions ที่ไม่ใช้บ่อยอยู่ใน command palette หรือ More menu

## 5.3 Profile menu

- Render ผ่าน portal หรือวางนอก clipping boundary
- Desktop กว้างประมาณ 320-360px
- Mobile ใช้ bottom sheet
- แสดงชื่อ, email, role, environment และ session status
- Logout ต้องมองเห็นโดยไม่ต้อง scroll แนวนอน
- รองรับ session-expiry warning และ unsaved-change guard

## 5.4 Page header

Desktop:

- Breadcrumb
- Page title
- คำอธิบายสั้น
- Last updated หรือ environment เมื่อเกี่ยวข้อง
- Primary action ด้านขวา
- Secondary actions ใน More menu

Mobile:

- คำอธิบายย่อหรือซ่อนได้
- Primary action เต็มความกว้างเมื่อเป็นงานหลัก
- Action มากกว่าสองรายการย้ายเข้า bottom sheet

---

# 6. Layout, spacing และ responsive

## 6.1 Breakpoints กลาง

- Mobile: `< 640px`
- Large mobile: `640-767px`
- Tablet: `768-1099px`
- Desktop: `1100-1439px`
- Large desktop: `1440px+`

ทุก CSS layer และ component ต้องอ้าง breakpoint ชุดเดียว ห้ามมี shell breakpoint หลายชุดที่ขัดกัน

## 6.2 Content width

- Data workspace และ dashboard ใช้ความกว้างเต็มพื้นที่
- Form ธรรมดาจำกัดความกว้าง 720-880px
- Builder/preview ใช้ split layout แบบ responsive
- Large desktop ใช้ 12-column grid
- Grid child ทุกตัวใช้ `min-width: 0`
- หลีกเลี่ยง nested max-width ที่ทำให้เหลือพื้นที่ว่างด้านขวา

## 6.3 Spacing scale

ใช้เฉพาะ 4, 8, 12, 16, 20, 24, 32 และ 40px

- Desktop page padding: 24-32px
- Tablet: 20-24px
- Mobile: 16px
- Card gap: 16-20px
- Card padding: 16-24px

---

# 7. Typography และภาษา

## 7.1 Typography

| องค์ประกอบ | ขนาดเป้าหมาย |
|---|---:|
| Page title | 24-30px |
| Section title | 18-22px |
| Card title | 15-17px |
| Body | 14-15px |
| Table | 13-14px |
| Label | 12-14px |
| Metadata | 12-13px |
| KPI | 28-40px |

- ตัวเลขการเงินและเวลาใช้ tabular numbers
- ภาษาไทยใช้ line-height อย่างน้อย 1.5
- ไม่ใช้ font-weight สูงกับทุกข้อความ
- ID และ reference ใช้ monospace เฉพาะจุด

## 7.2 แยกภาษาไทยและอังกฤษ

- UI text ทุกข้อความต้องมาจาก translation key
- แยก dictionary อย่างน้อย `th` และ `en`
- ห้าม hard-codeคำแปลใน page component
- ภาษาไทยแสดงข้อความไทยทั้งหมด ยกเว้นชื่อผลิตภัณฑ์, protocol, ID และคำเทคนิคที่แปลแล้วกำกวม
- ภาษาอังกฤษแสดงอังกฤษทั้งหมด
- Date, time, number, currency และ relative time ใช้ locale ปัจจุบัน
- Validation, empty state, error, toast, modal และ tooltip ต้องแปลครบ
- CI ตรวจ missing key, unused key และ key ที่มีเฉพาะภาษาเดียว
- ห้าม concatenate ประโยคจากหลาย key เพราะลำดับคำต่างกันตามภาษา

## 7.3 กฎข้อความ

- Page description ไม่เกิน 120 ตัวอักษรโดยประมาณ
- Button ใช้คำกริยาสั้น เช่น `บันทึก`, `อนุมัติ`, `ส่งออก`
- Status ใช้คำเดียวกันทั่วระบบ
- Error บอกสิ่งที่เกิดขึ้นและ action ถัดไป
- Technical error อยู่ใน expandable detail ไม่แสดง stack/raw payload เป็นข้อความหลัก

---

# 8. Card และข้อมูลสรุป

## 8.1 Card types

### Metric card
- สูง 104-136px
- Label, value, comparison และ sparkline เท่านั้น
- ไม่เกิน 6 ใบต่อหน้า

### Standard card
- สูงตามข้อมูล
- เป้าหมาย 160-260px
- Header, body และ optional footer แยกชัด

### Chart card
- Desktop สูง 320-400px
- Mobile สูง 280-340px
- มี title, range, chart, legend และ summary

### Action card
- ใช้เฉพาะ action ที่เป็น workflow จริง
- ไม่ใช้แทนเมนูหลักจำนวนมาก

### Detail card
- ใช้ใน detail route หรือ drawer
- ห้ามซ้อน card เกินหนึ่งระดับ

## 8.2 Card rules

- Border radius 14-18px
- Shadow บางและไม่ใช้ทุก state
- Hover เฉพาะ card ที่กดได้
- Empty card ไม่สูงเกิน 160px เว้นแต่เป็น chart placeholder
- Card ใน grid แถวเดียวกันมี visual rhythm เดียวกัน แต่ไม่บังคับ fixed height กับ dynamic content
- ห้ามยัดรายการจำนวนมากลง card แยกทีละรายการเมื่อ table/list เหมาะกว่า

---

# 9. Table, list และ pagination

## 9.1 Data table กลาง

ต้องรองรับ:

- Server-side pagination
- Search แบบ debounce
- Sort
- Basic filters
- Advanced filter drawer
- Filter chips
- Clear filters
- Column visibility
- Row selection เมื่อมี bulk action ที่ปลอดภัย
- Export ตาม filter และ permission
- Sticky header
- Loading, empty, filtered-empty, error และ permission states
- URL persistence สำหรับ page, sort, filter และ selected tab

## 9.2 Pagination

- Default 20 แถวสำหรับงาน review
- Default 50 แถวสำหรับ audit/ledger/log
- ตัวเลือก 20, 50, 100
- แสดงจำนวนทั้งหมดและช่วงรายการที่กำลังดู
- มี first, previous, numbered pages, next และ last
- ไม่โหลดข้อมูลทั้งหมดแล้ว paginate ฝั่ง client

## 9.3 Row behavior

- Desktop row height 48-56px
- Compact log/ledger 44-48px
- ตัวเลขชิดขวา
- Status ใช้ badge กลาง
- Primary identifier อยู่คอลัมน์แรก
- Action มากกว่าสองรายการเข้า kebab menu
- คลิกแถวเปิด drawer หรือ detail route
- Technical payload โหลดเมื่อเปิดรายละเอียดเท่านั้น

## 9.4 Mobile list

- ใช้ priority fields ไม่ย่อตารางทุกคอลัมน์
- Row เปลี่ยนเป็น compact list item หรือ card row
- Tap เปิด full-screen detail sheet
- Horizontal table scroll ใช้เฉพาะข้อมูลที่ต้องเปรียบเทียบคอลัมน์จริง ๆ เช่น permission matrix หรือ ledger

---

# 10. Chart system

## 10.1 Chart ที่อนุญาต

- Line/area สำหรับ trend ตามเวลา
- Bar/stacked bar สำหรับเปรียบเทียบ
- Donut สำหรับสัดส่วนไม่เกิน 5-6 กลุ่ม
- Funnel สำหรับ conversion
- Heatmap สำหรับช่วงเวลา, activity หรือ provider health
- Timeline สำหรับ incident และ workflow
- Gauge ใช้เฉพาะ health/risk score ที่มีเกณฑ์ชัด
- Sparkline ใช้ใน metric card

## 10.2 Chart rules

- ทุกกราฟระบุช่วงเวลาและหน่วย
- Tooltip แสดงค่าเต็มและเวลาเต็ม
- Legend กดเปิด/ปิด series ได้เมื่อมีหลาย series
- มี textual summary สำหรับ accessibility
- มี loading, empty และ error states
- Date range sync ภายใน Workspace เดียวกัน
- ไม่ใช้กราฟ 3D
- ไม่ใช้สีเกิน 5-6 สี
- Mobile ลดจำนวน tick แต่ไม่ลดความสูงจนอ่านไม่ได้
- Animation ใช้เฉพาะ initial load หรือ data transition 300-500ms

---

# 11. Motion และ interaction

- Hover: 120-160ms
- Sidebar: 200-240ms
- Drawer: 220-280ms
- Modal: 180-240ms
- Tab indicator: 160-200ms
- Toast: 180-220ms

ใช้ได้:

- KPI count-up ครั้งแรก
- Chart reveal
- Drawer slide
- Modal fade/scale เล็กน้อย
- Skeleton shimmer แบบเบา
- Filter chip transition
- Success check
- Critical live pulse เฉพาะสถานะจริง

ห้าม:

- Animate ทุก table row
- Card เด้งทุกครั้งที่ hover
- Autoplay motion ซ้ำเมื่อกลับ tab
- Motion ที่บังการอ่านข้อมูล
- Motion ที่ไม่รองรับ `prefers-reduced-motion`

---

# 12. Workspace specifications

## 12.1 Command Center

รวม Dashboard, Operations และ Activity Center

Tabs:

1. Overview
2. Operations
3. Activity

Overview:

- KPI หลักไม่เกิน 6 ใบ
- Money flow area chart
- Deposit vs withdrawal stacked bar
- Risk distribution
- Provider health matrix
- Pending work summary
- Critical activity

Operations:

- Queue summary
- SLA breach
- Claimed work
- Failed jobs
- Workload by admin
- Auto-refresh เปิด/ปิดได้

Activity:

- Compact timeline
- Group ตามวัน
- Collapse event ซ้ำ
- Pagination 30-50 รายการ
- Filter module/severity/actor
- Drawer แสดงรายละเอียดและ resource link

ห้ามโหลด Activity ทั้งหมดเป็น timeline ยาวต่อเนื่อง

## 12.2 Finance

Tabs:

1. Overview
2. Deposits
3. Withdrawals
4. Wallets
5. Ledger
6. Reconciliation
7. Reports

Shared context:

- Date range
- Currency
- Status
- Provider/bank
- Saved filter view

Overview:

- Finance KPI
- Net flow chart
- Approval/processing SLA
- Failure/reversal trend
- Reconciliation accuracy

Deposits:

- Verification queue table
- Slip preview ใน secure drawer/full-screen viewer
- Duplicate proof warning
- Claim owner
- Approve/reject พร้อม reason
- Link member/wallet/ledger

Withdrawals:

- Risk-aware queue
- Bank verification
- Available/locked balance
- SLA timer
- Provider status
- Retry/reversal history

Wallets:

- Search member/wallet
- Available, locked และ total balance
- Balance history
- Recent ledger
- Manual adjustment ผ่าน protected modal, reason และ step-up

Ledger:

- Compact accounting table
- Debit, credit, running balance, reference และ reconciliation status
- Default 50 rows
- Drawer แสดง transaction chain

Reconciliation:

- Matched, unmatched, discrepancy และ aging
- Internal vs provider side-by-side
- Manual resolve มี reason และ audit

Reports:

- Report catalog
- Filter builder
- Result preview
- Async export progress/history
- Shareable URL

## 12.3 Members

Tabs:

1. Directory/Insights
2. Bank Accounts
3. KYC
4. Support

Member detail route มี tabs:

- Overview
- Finance
- Risk
- KYC
- Sessions
- Activity
- Support

Bank Accounts:

- Mask account number
- Duplicate detection
- Name mismatch
- Related member links
- Verify/reject พร้อม reason

KYC:

Desktop ใช้ review workspace:

- Queue 28-32%
- Document viewer 42-48%
- Decision panel 24-28%

Mobile:

- Queue page
- Full-screen document viewer
- Sticky decision bar

ต้องรองรับ zoom, rotate, extracted-field comparison, mismatch highlight, checklist, claim owner และ duplicate-decision protection

Support:

- Inbox/status tabs
- Ticket list
- Conversation
- Member context
- Sticky composer
- Internal note
- Attachment preview
- SLA และ assignment

## 12.4 Risk & Compliance

Tabs:

1. Alerts
2. Provider Risk
3. Audit Risk

Alerts:

- Investigation queue table
- Severity, rule, member, owner, status และ age
- Evidence drawer
- Timeline notes
- Assign, escalate, resolve และ false-positive feedback
- Duplicate alert grouping

Provider Risk:

- Provider comparison
- Risk score reason
- Error rate
- Timeout
- Reconciliation gap
- Health timeline
- Drill-down ไป provider/session/transfer/webhook

Audit Risk:

- Risk-focused audit table
- Triggered rule
- Confidence
- Evidence
- Reviewer
- Group event ซ้ำ
- Export เฉพาะข้อมูล redact แล้ว

## 12.5 Provider Operations

Tabs:

1. Providers
2. Setup
3. Presets
4. Health
5. Webhooks
6. Configuration

Providers:

- Provider table
- Status, latency, game count, last sync และ credential health
- Test connection
- Enable/disable
- Sync now

Setup:

- Stepper: provider, credential, endpoint, games, webhook, test, summary
- Auto-save draft
- Validate ต่อขั้น
- Configuration diff ก่อน apply

Presets:

- Searchable preset library
- Compare, clone, version และ compatibility
- ไม่แสดง secret

Health:

- Uptime
- Latency p50/p95/p99
- Error rate
- Request volume
- Endpoint health matrix
- Incident timeline

Webhooks:

- Compact technical table
- Failed, duplicate, invalid signature และ retry filters
- Payload drawer ที่ redact secret
- Replay มี permission, confirmation และ duplicate protection

Configuration:

- รวม Simple Game Settings และ provider settings ที่ซ้ำกัน
- Basic/Advanced sections
- Validation, diff, reset และ unsaved warning

## 12.6 Games

Tabs:

1. Catalog
2. Sessions
3. Transfers

Catalog:

- Grid/list toggle
- Search/filter provider, platform, category และ active state
- Mobile/PC badge
- Missing asset/fallback logo
- Member lobby preview
- Bulk enable/disable ตาม permission

Sessions:

- Active/stuck session summary
- Session table
- Member, game, provider, duration, wager และ result
- Link transfers/member

Transfers:

- Transfer ledger table แทน card ยาว
- Direction, amount, before/after balance, retry, provider reference และ reconciliation
- Failure/reversal trend
- Detail drawer

## 12.7 Growth & Promotions

Tabs:

1. Overview
2. Promotions
3. Operations
4. Claims
5. Bonus Ledger

Overview:

- Conversion funnel
- Registration/first-deposit trend
- Retention
- Campaign comparison

Promotions:

- List + builder + sticky responsive preview
- Builder sections: Basic, Banner, Eligibility, Reward, Schedule, Terms, Localization, Preview
- Draft autosave
- Version history
- Validation ก่อน publish

Operations:

- Promotion work queue
- Eligibility breakdown
- Duplicate claim warning
- Reward calculation drawer

Claims:

- Claim review table
- Eligibility result
- Reward ledger link
- Manual review

Bonus Ledger:

- Compact accounting table
- Credit/debit/expired
- Wagering requirement
- Campaign source

## 12.8 Affiliate & Commission

Tabs:

1. Overview
2. Affiliates
3. Commission Ledger
4. Settlements

Overview:

- Referral growth
- Conversion
- Revenue by affiliate
- Commission trend
- Fraud alerts

Affiliates:

- Searchable affiliate table
- Hierarchy เปิดผ่าน drawer
- Member/referral details

Commission Ledger:

- Period, source, amount, status และ adjustment
- Calculation breakdown
- Settlement link

Settlements:

- Pending/paid/reversed
- Batch action เฉพาะที่ปลอดภัย
- Export และ audit trail

## 12.9 Content

Tabs:

1. Content
2. Assets
3. Preview
4. Versions

- Asset grid ใช้ lazy loading
- Upload progress
- MIME/size validation
- Duplicate detection
- Usage references ก่อนลบ
- Locale tabs แยกไทย/อังกฤษ
- Desktop/mobile preview
- Draft/publish/version history
- URL ยาวย้ายเข้า technical detail

## 12.10 Access & Security

Tabs:

1. Admins
2. Roles
3. Invitations
4. Audit Logs
5. Sessions & Devices
6. Security Policies
7. Anti-bot

Admins:

- Admin directory table
- Role, status, 2FA, last login และ active session
- Last-owner protection
- Suspend/revoke ผ่าน protected action

Roles:

- Permission matrix แทน card ยาว
- Group ตาม domain
- Search permission
- CRUD/action filter
- Select all ต่อ group
- Compare/clone role
- Sticky save bar
- Diff preview และ unsaved warning

Invitations:

- Status, role, sent, expiry
- Resend/revoke
- Rate limit feedback

Audit Logs:

- Compact table
- Time, actor, action, resource, result, IP, request ID และ risk
- Before/after diff ใน drawer
- Lazy payload loading

Sessions & Devices:

- Current session
- Active sessions table
- Login history
- Trusted devices
- Impossible-travel/risky-login indicators
- Revoke one/all other sessions

Security Policies:

- Password/session/2FA policies
- Dangerous actions ใน Danger Zone
- Step-up verification

Anti-bot:

- Challenge volume/success/failure
- Provider configuration
- Adaptive mode
- Fallback chain
- Emergency bypass ต้องมี expiry
- Secret masking และ test configuration

## 12.11 Settings

Sections:

1. General
2. Branding
3. Finance
4. Security
5. Providers
6. Notifications
7. Storage
8. Integrations
9. Advanced

หลักการ:

- Search settings
- Settings sidebar ย่อย
- Deep link ต่อ section
- Save เฉพาะ section ที่แก้
- Sticky save bar
- Unsaved badge
- Reset section
- Diff ก่อน save
- แสดง source ของค่า: Default, Environment, Database
- Sensitive setting ต้อง step-up
- แสดง restart-required warning
- Basic settings แสดงก่อน Advanced
- ไม่โหลด editor ทุก section พร้อมกัน

ภาษาที่ใช้ในคำอธิบาย setting ต้องเป็นภาษาคนใช้งาน ไม่คัดชื่อ environment variable มาเป็น label โดยตรง

---

# 13. Workflow และความถูกต้องของระบบ

## 13.1 Mutation safety

ทุก action ที่เปลี่ยนข้อมูลต้องมี:

- Loading state
- Disable duplicate submit
- Idempotency หรือ server guard เมื่อเกี่ยวข้อง
- Success/error toast
- Optimistic rollback เมื่อใช้ optimistic update
- Permission check ฝั่ง UI และ API
- Confirmation สำหรับ destructive/high-risk action
- Reason สำหรับ reject, reverse, manual adjust, permission change และ security action
- Audit metadata

## 13.2 Concurrency

Queue ที่มีหลาย Admin ทำงานพร้อมกันต้องแสดง:

- Claimed by
- Claimed at
- Lock/lease expiry
- Conflict feedback
- Refresh state หลัง mutation
- ป้องกัน approve/complete/resolve ซ้ำ

## 13.3 Unsaved changes

Form, builder และ settings ต้อง:

- ตรวจ dirty state
- เตือนก่อนเปลี่ยน route/ปิด tab
- มี autosave เฉพาะ draft ที่ปลอดภัย
- แสดงเวลาบันทึกล่าสุด
- ไม่สูญเสียข้อมูลเมื่อ session refresh สำเร็จ

## 13.4 Permission model

- Read-only role ไม่เห็นหรือกด mutation ไม่ได้
- UI ห้ามเป็น security boundary เพียงชั้นเดียว
- Action ที่ถูกบล็อกอธิบายเหตุผลได้
- Sensitive data mask ตาม permission
- Copy sensitive data เป็น action ที่ audit ได้เมื่อจำเป็น

---

# 14. Mobile-first requirements

## 14.1 Navigation

- Sidebar เป็น drawer
- Topbar เหลือ menu, title, notification และ profile
- Breadcrumb ย่อเป็น back navigation เมื่อพื้นที่ไม่พอ
- More actions ใช้ bottom sheet

## 14.2 Tables

- ใช้ priority columns
- เปลี่ยนเป็น list/card row เมื่อข้อมูลไม่ต้องเทียบหลายคอลัมน์
- Tap เปิด detail sheet
- Ledger/permission matrix ที่ต้องเทียบคอลัมน์ใช้ controlled horizontal scroll ภายใน card เท่านั้น

## 14.3 Forms

- Input เต็มความกว้าง
- Label อยู่เหนือ field
- Sticky save/action bar
- Select และ advanced filters ใช้ bottom sheet
- Modal ซับซ้อนใช้ full-screen sheet
- Keyboard ต้องไม่บัง action bar

## 14.4 Charts

- หนึ่ง chart ต่อแถว
- สูงอย่างน้อย 280px
- Legend พับได้
- Tooltip รองรับ tap
- Summary text อยู่ใต้ chart

## 14.5 Touch

- Touch target อย่างน้อย 44px
- ระยะระหว่าง action อย่างน้อย 8px
- Danger ไม่อยู่ชิด Primary
- Swipe ต้องมีปุ่มทางเลือกเสมอ

---

# 15. Loading, empty, error และ permission states

ทุก data surface ต้องมี:

1. Initial loading
2. Filter/refresh loading
3. Layout-matched skeleton
4. Empty data
5. Empty from filter
6. API error
7. Partial error
8. Timeout/offline
9. Retry
10. Permission denied
11. Mutation pending
12. Mutation success
13. Mutation failure
14. Optimistic rollback
15. Stale-data warning
16. Last-updated timestamp

Empty state ต้องไม่เป็นกล่องสูงโดยไม่มีข้อมูล ต้องบอกสาเหตุและ action ถัดไปแบบสั้น

---

# 16. Accessibility

- Keyboard ใช้ navigation และ action สำคัญได้
- Focus ring ชัด
- Modal/Drawer trap focus และคืน focus หลังปิด
- Escape ปิด overlay ได้เมื่อปลอดภัย
- Icon-only button มี accessible name
- Table header และ sort state ถูกต้อง
- Error summary เชื่อมไป field
- สีผ่าน contrast
- Status ไม่พึ่งสีอย่างเดียว
- รองรับ reduced motion
- มี skip-to-content
- Chart มี textual summary
- Toast สำคัญอยู่พอนานและประกาศผ่าน live region

---

# 17. Performance

- Server-side pagination
- Debounced search
- Cancel stale requests
- Route-level code splitting
- Lazy load charts, editors, document viewer และ payload viewer
- Virtualize log/list ขนาดใหญ่เมื่อ pagination ไม่เหมาะ
- Lazy load asset thumbnails
- Cache lookup data เช่น roles/providers/categories
- Dashboard widgets fetch แยกและล้มเหลวแยกกัน
- Memoize table columns และ expensive calculations
- หลีกเลี่ยง chart rerender จาก form keystroke
- ตรวจ bundle size, layout shift, memory growth และ long task

---

# 18. Shared component inventory

ต้องรวมเป็น component กลางแทนการทำซ้ำรายหน้า:

- `AdminShell`
- `AdminSidebar`
- `AdminTopbar`
- `PageHeader`
- `WorkspaceTabs`
- `MetricCard`
- `ChartCard`
- `StatusBadge`
- `DataTable`
- `MobileDataList`
- `FilterBar`
- `AdvancedFilterDrawer`
- `DetailDrawer`
- `FullScreenDetailSheet`
- `ConfirmActionDialog`
- `StepUpActionDialog`
- `StickyActionBar`
- `EmptyState`
- `ErrorState`
- `PermissionState`
- `SkeletonState`
- `DateRangeControl`
- `ExportJobStatus`
- `LocaleTextField`
- `UnsavedChangesGuard`
- `JsonPayloadViewer`
- `BeforeAfterDiff`

Component กลางต้องเปิด extension points ให้แต่ละ Workspace มี identity ของตัวเอง ไม่สร้าง page-specific CSS ทับหลายชั้น

---

# 19. Implementation sequence

## Phase A: Foundation

- Shell, Sidebar, Topbar และ Profile
- Unified breakpoints และ content width
- Typography, spacing, color และ motion tokens
- PageHeader, WorkspaceTabs, Card, Status และ Button
- DataTable, FilterBar, Drawer, Modal และ state components
- Localization foundation และ key audit

## Phase B: Route consolidation

- สร้าง 11 Workspace routes
- ย้ายหน้าเดิมเป็น tabs/subroutes
- เพิ่ม redirect/compatibility routes
- คง permission และ deep-link behavior

## Phase C: High-impact pages

- Roles
- Audit Logs
- Security Sessions
- Wallet Ledger
- Game Transfers
- Activity Center
- Dashboard

## Phase D: Finance, Member และ Risk

- Deposits
- Withdrawals
- Wallets
- Reconciliation
- Member detail
- KYC
- Bank accounts
- Support
- Risk alerts/provider risk/audit risk

## Phase E: Provider, Games และ Growth

- Provider setup/config/health/webhooks
- Game catalog/sessions/transfers
- Growth analytics
- Promotion builder/operations/claims/bonus
- Affiliate/commission
- Content

## Phase F: Settings และ production quality

- Searchable Settings
- Complete localization
- Mobile/tablet audit
- Accessibility
- Performance
- Permission regression
- Visual and interaction regression

---

# 20. Test matrix

## 20.1 Viewports

- 360x800
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1440x900
- 1920x1080

## 20.2 Required interaction tests

- Sidebar open/collapse/drawer
- Profile menu and logout
- Workspace tab and URL persistence
- Search, filter, sort and pagination
- Row to drawer/detail route
- Modal and bottom sheet
- Form save and unsaved guard
- Permission denied/read-only role
- Step-up action
- Optimistic rollback
- Session expiration and recovery
- Export progress
- Loading, empty, error and retry
- Language switch without mixed text

## 20.3 Required quality gates

- Lint
- Typecheck
- Production build
- Unit/component tests
- Route contract tests
- Permission tests
- Responsive browser tests
- Visual regression
- Accessibility checks
- Bundle/performance budget

---

# 21. Definition of Done

Admin modernization ถือว่าเสร็จเมื่อ:

- Sidebar เหลือไม่เกิน 11 Workspace หลัก
- ฟังก์ชันเดิมทุกหน้าถูก map และเข้าถึงได้
- Route เดิม redirect หรือมี compatibility plan
- ไม่มีหน้ารายการยาวเพราะโหลดข้อมูลทั้งหมด
- ทุก list/log/ledger มี server-side pagination หรือ virtualization ที่เหมาะสม
- ไม่มี content, dropdown, profile หรือ logout ถูกตัด
- ไม่มี whole-page horizontal overflow
- Card ทุกประเภทเป็นมาตรฐานและข้อมูลกระชับ
- ทุก Workspace มี layout/visualization เหมาะกับลักษณะงาน ไม่ใช่ template เดียวกันทั้งหมด
- ภาษาไทยและอังกฤษแยกสมบูรณ์
- Mobile ใช้งาน workflow สำคัญได้จริง
- Loading, empty, error และ permission states ครบ
- Read-only role ทำ mutation ไม่ได้
- Dangerous action มี confirmation, permission, step-up และ audit ตามระดับความเสี่ยง
- ระบบป้องกัน duplicate mutation และ concurrency conflict ทำงาน
- Visual regression ผ่านทุก viewport ที่กำหนด
- Interaction regression หลัง login ผ่าน
- Lint, typecheck, production build และ tests ผ่าน
- CSS layer เก่าที่ซ้ำหรือขัดกันถูกลบ
- เอกสาร route, component และ localization ได้รับการปรับตาม implementation จริง

---

# 22. Review checklist ต่อหน้า

ก่อนปิดแต่ละ Workspace ต้องตอบได้ว่า:

1. ผู้ใช้รู้ทันทีหรือไม่ว่าหน้านี้ใช้ทำอะไร
2. งานเร่งด่วนอยู่เหนือข้อมูลทั่วไปหรือไม่
3. ข้อมูลหลักเห็นได้ใน 1-2 viewport แรกหรือไม่
4. รายการยาวมี pagination/filter หรือไม่
5. Detail ถูกย้ายออกจากรายการหลักหรือไม่
6. Primary action มีเพียงหนึ่งรายการหรือไม่
7. ภาษาไม่ปนกันหรือไม่
8. Mobile ทำงานหลักได้ครบหรือไม่
9. Permission และ dangerous action ปลอดภัยหรือไม่
10. Loading, empty, error และ retry ครบหรือไม่
11. URL สามารถ bookmark/share/back ได้หรือไม่
12. Page-specific UI ใช้ shared components โดยไม่เพิ่ม CSS override ซ้ำหรือไม่

เอกสารนี้ต้องได้รับการอัปเดตเมื่อ Information Architecture หรือ acceptance criteria เปลี่ยน และต้องอ้างอิงจาก Master Project Worklist เมื่อเริ่ม implementation จริง
