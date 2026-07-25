# Admin Complete Route Coverage Specification

สถานะเอกสาร: **Mandatory addendum**  
ขอบเขต: `apps/web-admin` ทุก route, layout, state และ interaction  
เอกสารหลักที่ใช้ร่วมกัน: [`admin-experience-modernization-spec.md`](./admin-experience-modernization-spec.md)  

> ภาพ Admin 40 หน้าใช้เป็นหลักฐานสำหรับตรวจปัญหาที่มองเห็นได้เท่านั้น ไม่ใช่ขอบเขตสุดท้ายของงาน ทุกหน้าที่มีอยู่ในโค้ด ทุก route ที่เข้าถึงผ่าน URL ทุก dynamic detail route และทุก system state ต้องผ่านมาตรฐานในเอกสารนี้ แม้ไม่มีภาพอ้างอิง

---

## 1. ขอบเขตที่ถือว่า “ทุกหน้า”

คำว่า **ทุกหน้า** ครอบคลุมทั้งหมดต่อไปนี้:

1. หน้าเมนูหลักที่แสดงใน Sidebar
2. หน้าแท็บย่อยภายใน Workspace
3. Dynamic route เช่น `[memberId]`, `[caseId]`, `[alertId]`, `[providerId]`
4. หน้า Create, Edit, Review, Approve และ Detail
5. หน้า Login, Invitation, Password recovery, 2FA และ Session recovery
6. หน้า Loading, Empty, Error, Offline, Permission denied และ Not found
7. Modal route, Drawer route, Full-screen sheet และ nested flow
8. หน้า Report preview, Export status, Import result และ Download history
9. Route เก่าที่ต้อง Redirect หรือคง Compatibility
10. Route ภายในที่ไม่ได้อยู่ในเมนู แต่เข้าจาก Link, Notification หรือ Deep link
11. หน้า Debug/diagnostic ที่เปิดใน production ตาม permission
12. หน้าใหม่ที่เพิ่มภายหลัง

ไม่มี route ใดได้รับการยกเว้นเพียงเพราะ:

- ไม่มีภาพแคป
- ไม่อยู่ใน Sidebar
- เปิดได้เฉพาะจากปุ่มหรือ notification
- ต้องใช้ permission สูง
- เป็น empty/error/loading page
- เป็น route เก่า
- ใช้งานไม่บ่อย

---

# 2. Route Registry ที่ต้องมี

ต้องมี Route Registry เป็น source of truth ของ `apps/web-admin` และบันทึกอย่างน้อย:

| Field | ความหมาย |
|---|---|
| Route | URL pattern ที่เข้าถึงได้ |
| Route type | Workspace, detail, editor, auth, system state, legacy หรือ utility |
| Workspace owner | Workspace หลักที่รับผิดชอบ |
| Parent route | หน้าหลักที่เชื่อมเข้ามา |
| Permission | สิทธิ์ขั้นต่ำที่ต้องมี |
| Primary task | งานหลักที่ผู้ใช้เข้ามาทำ |
| Data source | API/read model หลัก |
| Desktop pattern | Table, dashboard, editor, split view หรือ detail |
| Mobile pattern | List, full-screen sheet, stacked layout หรือ simplified chart |
| Localization | Namespace ของไทยและอังกฤษ |
| Required states | Loading, empty, error, denied และ stale |
| Test coverage | Unit, interaction, smoke, visual และ permission test |
| Legacy behavior | Redirect หรือ compatibility ที่ต้องรักษา |
| Status | Planned, implementing, verified หรือ blocked |

## กฎบังคับ

- Route ใหม่ห้าม Merge ถ้ายังไม่มีรายการใน Route Registry
- Route ที่ถูกลบต้องมี Redirect หรือเอกสารยืนยันว่าไม่ต้อง Compatibility
- Route ที่ไม่มี Workspace owner ถือว่ายังไม่พร้อม Production
- Route ที่ไม่มี Mobile pattern ถือว่ายังไม่ปิดงาน
- Route ที่ไม่มีภาษาไทยและอังกฤษครบถือว่ายังไม่ปิดงาน
- Dynamic route ต้องทดสอบทั้ง ID ปกติ, ID ไม่พบ, ไม่มีสิทธิ์ และข้อมูลถูกลบระหว่างเปิดหน้า

---

# 3. กลุ่มหน้าที่ไม่มีในภาพแต่ต้องรวมงาน

## 3.1 Authentication และ Account Recovery

ครอบคลุม:

- Login
- 2FA challenge
- Step-up verification
- Forgot password
- Reset password
- Invitation acceptance
- Invitation expired
- Account locked
- Session expired
- Logout completion
- Unauthorized

### UX/UI

- Form อยู่กลางหน้าจอและมีความกว้างอ่านง่าย
- ไม่แสดงคำอธิบายยาวเกินสองบรรทัด
- Error อยู่ใกล้ field และมี error summary เมื่อมีหลายจุด
- Password requirement แสดงแบบ checklist กระชับ
- Loading ไม่ทำให้ปุ่มเปลี่ยนขนาด
- ป้องกัน submit ซ้ำ
- รักษา `next` route หลัง Login สำเร็จ
- Session expired ต้องพากลับงานเดิมหลังยืนยันตัวตน
- 2FA รองรับ paste, autofill และ recovery code
- Invitation expired ต้องบอก action ถัดไป ไม่ปล่อยเป็น dead end
- แยกภาษาไทยและอังกฤษสมบูรณ์

### Mobile

- Form เต็มความกว้างโดยมีขอบ 16px
- Keyboard ไม่บังปุ่มดำเนินการ
- OTP input ใช้งานด้วยนิ้วและ autofill ได้
- Primary action อยู่ในตำแหน่งที่เข้าถึงง่าย

### Tests

- Successful login
- Invalid credential
- Locked account
- Expired session
- 2FA success/failure
- Invitation valid/expired/already used
- Redirect กลับ route เดิม

---

## 3.2 Global System States

ครอบคลุม:

- Global loading
- Route loading
- Error boundary
- Partial widget error
- Empty state
- Empty from filters
- Offline/timeout
- Maintenance
- Permission denied
- Not found
- Unsupported browser หรือ missing capability เมื่อจำเป็น

### มาตรฐาน

- ใช้ Layout ของ Shell เดิมเมื่อปลอดภัย ไม่เปลี่ยนเป็นหน้าขาวลอย ๆ
- ข้อความสั้น บอกสาเหตุและ action ถัดไป
- มี Retry เมื่อทำซ้ำได้
- Permission denied ไม่เปิดเผยข้อมูลที่ผู้ใช้ไม่มีสิทธิ์เห็น
- Not found มีทางกลับ Workspace ที่เหมาะสม
- Partial widget error ไม่ทำให้ทั้ง Dashboard ล่ม
- Error ต้องมี request/reference ID แบบคัดลอกได้เมื่อมี
- Error technical detail ซ่อนจากผู้ใช้ทั่วไป
- Loading skeleton ต้องใกล้เคียง Layout จริง
- ไม่มี empty card สูงเกินความจำเป็น

---

## 3.3 Dynamic Detail Routes

ครอบคลุมอย่างน้อย:

- Member detail
- Wallet/transaction detail
- Top-up detail
- Withdrawal detail
- KYC case detail
- Bank account review detail
- Support ticket detail
- Risk alert/investigation detail
- Provider detail
- Game detail
- Game session detail
- Game transfer detail
- Promotion/campaign detail
- Claim detail
- Affiliate detail
- Commission/settlement detail
- Admin account detail
- Audit event detail
- Report/export detail

### โครงสร้างมาตรฐาน

1. Breadcrumb
2. Entity title และ Status
3. Key summary ไม่เกิน 6 ค่า
4. Primary action ไม่เกินหนึ่งรายการ
5. Tabs สำหรับข้อมูลคนละบริบท
6. Timeline หรือ Audit history
7. Related entities
8. Sticky action bar เฉพาะงานที่ต้องตัดสินใจ

### ข้อมูลยาว

- History ใช้ Pagination หรือ Load more
- JSON/payload โหลดเมื่อเปิดดู
- Related records ใช้ตารางกระชับ
- Timeline collapse event ซ้ำ
- Description ยาวใช้ Expand
- ห้ามแสดงข้อมูลทุกระบบในหน้า Overview เดียว

### Mobile

- Summary อยู่ด้านบน
- Tabs เลื่อนแนวนอนหรือใช้ Section picker
- Detail action ใช้ Sticky bottom bar
- Technical detail เปิด Full-screen sheet
- ตารางรองเปลี่ยนเป็น List

### Edge cases

- Entity not found
- Entity deleted
- Entity changed while page is open
- Permission changed during session
- Stale version before mutation
- Related entity unavailable

---

## 3.4 Create และ Edit Flows

ครอบคลุม:

- Create promotion
- Edit promotion
- Add provider
- Provider configuration
- Create role
- Edit role
- Invite admin
- Manual wallet adjustment
- Policy/settings editors
- Content/CMS editors
- Any future create/edit route

### UX/UI

- Form ยาวแบ่งเป็น Section, Tabs หรือ Stepper
- Primary action ใช้คำที่ตรง เช่น `บันทึก`, `เผยแพร่`, `ส่งตรวจ`
- Disable Save เมื่อไม่มีการเปลี่ยนแปลง
- Autosave ใช้เฉพาะ Draft ที่ปลอดภัย
- แสดง Unsaved changes ก่อนออก
- Validation ชี้ field และ section ที่ผิด
- แสดง Diff ก่อน mutation สำคัญ
- Dangerous action แยกจาก Save ปกติ
- Advanced fields พับไว้และมีคำอธิบาย
- ค่า Default, Environment และ Database แสดงที่มาชัดเจน
- Preview ใช้พื้นที่เหมาะสมและ Sticky เมื่อมีประโยชน์

### Mobile

- หนึ่งคอลัมน์
- Section navigator กระชับ
- Sticky save bar
- Select/advanced filter ใช้ Bottom sheet
- Preview สลับเป็น Full-screen
- Keyboard ไม่บัง field และปุ่ม

---

## 3.5 Review และ Approval Workspaces

ครอบคลุม:

- Deposit review
- Withdrawal processing
- KYC decision
- Bank verification
- Risk investigation
- Promotion claim review
- Support escalation
- Reconciliation resolution

### มาตรฐาน

- ใช้ Exception-first design
- แสดง Pending, Failed, High risk และเกิน SLA ก่อน
- มี Claim owner เมื่อ Admin หลายคนทำงานร่วมกัน
- Approve/Reject/Resolve ต้องตรวจ version ล่าสุด
- ป้องกัน mutation ซ้ำ
- Reject/Reverse/Override ต้องมี reason
- Financial/security action ต้องมี step-up ตามระดับความเสี่ยง
- แสดงผลกระทบก่อนยืนยัน
- บันทึก Audit trail
- Mutation สำเร็จแล้วเลื่อนไปรายการถัดไปได้โดยไม่เสียบริบท

---

## 3.6 Reports, Export และ Import

ครอบคลุม:

- Report catalog
- Report result
- Saved report
- Export job
- Export history
- Import preview
- Import validation result
- Import failure detail

### UX/UI

- Filter สรุปเป็น chips
- Report result ไม่โหลดข้อมูลทั้งหมดพร้อมกัน
- Export ใช้ background job และแสดง Progress
- ดาวน์โหลดซ้ำได้ตาม retention policy
- Import ต้องมี Preview และ Validation ก่อน Commit
- Error รายแถวเปิดดูและดาวน์โหลดได้
- ไม่แสดง sensitive columns หากไม่มี permission
- Export ต้องใช้ filter และ timezone เดียวกับหน้าจอ
- Mobile ให้ดู Summary และสถานะ job ก่อน ตารางรายละเอียดเปิด Full-screen

---

## 3.7 Notifications และ Deep Links

ทุก Notification ต้อง:

- เปิดไปยัง route ที่มีอยู่จริง
- รักษา permission
- แสดง state ที่เหมาะสมเมื่อ resource ถูกลบ
- Mark read โดยไม่ทำ Navigation สะดุด
- มี fallback ไป Workspace หาก deep link ใช้งานไม่ได้
- รองรับภาษาไทยและอังกฤษ
- ไม่เปิดเผยข้อมูล sensitive ในข้อความแจ้งเตือน

Notification center ต้องมี:

- Unread/All
- Filter severity/module
- Pagination
- Mark one/all read
- Link ไป Resource
- Empty/error/loading
- Mobile full-screen sheet

---

## 3.8 Profile, Preferences และ Personal Settings

ครอบคลุม:

- Profile
- Language
- Theme/appearance หากรองรับ
- Notification preferences
- Security preferences
- Active sessions
- Sign out

### มาตรฐาน

- Profile menu ไม่ถูก Sidebar ตัด
- Logout เห็นและกดได้ตลอด
- Setting ที่มีผลทันทีต้องบอกผลชัด
- Language เปลี่ยนทั้งหน้า ไม่มีข้อความเก่าค้าง
- Preference form ไม่ปนกับ System settings
- Mobile ใช้ Full-screen sheet หรือหน้าตั้งค่าเฉพาะ

---

## 3.9 Hidden, Legacy และ Compatibility Routes

ต้องตรวจ Route ที่:

- ไม่มีใน Sidebar
- ถูกเรียกจาก URL เดิม
- ถูกเรียกจากอีเมล
- ถูกเรียกจาก Notification
- ถูกเรียกจาก Bookmark
- เป็น Alias ของหน้าใหม่

### กฎ

- Redirect ต้องรักษา query parameters ที่จำเป็น
- Redirect loop ต้องมี test
- Route เก่าต้องมี owner และวันพิจารณาถอด
- ไม่มี route เก่าที่ render UI คนละ Design System
- Deep link ที่ไม่มีสิทธิ์ต้องไป Permission state ไม่ใช่ 404 ปลอม
- Route ที่เลิกใช้ต้องไม่โผล่ใน Navigation หรือ Search

---

# 4. การรวมหน้าโดยไม่ทำฟังก์ชันหาย

การรวมประมาณ 40 หน้าเป็น 11 Workspace หมายถึง **รวม Navigation และบริบท** ไม่ใช่ลบความสามารถ

## กฎการรวม

1. ฟังก์ชันเดิมทุกตัวต้องมีปลายทางใหม่
2. Action เดิมต้องตรวจ permission เหมือนเดิมหรือเข้มกว่า
3. URL เดิมต้อง Redirect หรือทำ Compatibility
4. Query/filter ที่สำคัญต้องย้ายตามได้
5. Dynamic detail route ต้องยัง bookmark ได้
6. Browser Back/Forward ต้องทำงานถูกต้อง
7. Tab state ต้องอยู่ใน URL
8. Notification และอีเมลต้องเปิด route ใหม่ได้
9. Analytics/Audit reference ต้องไม่เสีย
10. ห้ามรวมหน้าที่มี mental model ต่างกันจนผู้ใช้สับสน

## หน้าที่ควรอยู่เป็น Detail route ไม่ยัดเป็น Tab

- Member 360 detail
- KYC document review
- Support conversation
- Risk investigation
- Provider configuration detail
- Promotion editor
- Audit event diff
- Report result ขนาดใหญ่

---

# 5. Data Density และความยาวหน้า

## เป้าหมาย

- Overview สำคัญอยู่ใน 1–2 viewport แรก
- รายการไม่เกินค่าหน้าปัจจุบัน
- ไม่มีหน้า 3,000–14,000px เพราะ render ข้อมูลทั้งหมด
- ผู้ใช้เห็นสิ่งที่ต้องทำก่อนข้อมูลอ้างอิง

## กฎ

- Table เริ่มต้น 20 หรือ 50 แถว
- รองรับ 20/50/100 ตามความเหมาะสม
- Server-side pagination สำหรับข้อมูลจริง
- Card ใช้กับ Summary ไม่ใช้แทนทุก row
- Detail เปิด Drawer หรือ route
- Timeline ใช้ Pagination/Load more
- Filter หลักไม่เกิน 4 ตัว ที่เหลืออยู่ Advanced filters
- KPI หลักไม่เกิน 6 ค่า
- Chart ต่อ section ไม่เกินจำนวนที่ยังอ่านและเปรียบเทียบได้
- Technical ID แสดงย่อและ Copy ได้
- ข้อความเกิน 2–3 บรรทัดใช้ Expand

---

# 6. Localization ครบทุก Route

ทุก Route และ State ต้องมี namespace ไทยและอังกฤษ

ครอบคลุม:

- Navigation
- Page title/description
- Tabs
- Table columns
- Filters
- Status
- Buttons
- Validation
- Empty/error/loading
- Confirmation
- Toast
- Chart title, axis, legend และ tooltip
- Export/import
- Accessibility labels

## กฎ

- ห้าม hard-codeข้อความ UI ใน component
- ห้ามไทยและอังกฤษปนในหน้าเดียว ยกเว้นชื่อเฉพาะที่ได้รับอนุมัติ
- Missing key ต้องตรวจใน CI
- Date/time/number/currency ใช้ locale ที่เลือก
- ภาษาไทยต้องทดสอบข้อความยาวกว่าอังกฤษ
- เปลี่ยนภาษาแล้ว overlay, toast และ dynamic content ต้องเปลี่ยนตาม

---

# 7. Responsive ครบทุก Route

ต้องตรวจอย่างน้อย:

- 360×800
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1440×900
- 1920×1080

ทุก Route ต้องผ่าน:

- ไม่มี horizontal overflow ทั้งหน้า
- Sidebar/Drawer ใช้งานได้
- Profile/Logout ไม่ถูกซ่อน
- Header/action ไม่ล้น
- Table มี Mobile pattern
- Chart อ่านได้
- Modal/Drawer ไม่เกิน viewport
- Sticky action ไม่ถูก browser chrome/keyboard บัง
- Touch target อย่างน้อย 44px
- Focus และ keyboard navigation ถูกต้อง

---

# 8. Route-level Test Matrix

ทุก Route family ต้องมี:

## Smoke

- Route ตอบสนองหรือ Redirect ถูกต้อง
- Auth guard ทำงาน
- Permission guard ทำงาน
- ไม่มี console error
- ไม่มี failed network ที่ไม่ถูกจัดการ

## Interaction

- Primary task สำเร็จ
- Filter/sort/pagination
- Drawer/modal open-close
- Save/submit
- Retry
- Error recovery
- Browser Back/Forward

## Permission

- Owner/Admin
- Operational role
- Read-only role
- Missing permission
- Permission ถูกลดระหว่าง session

## Localization

- Thai
- English
- Missing-key detection
- Date/number/currency formatting

## Responsive

- Mobile
- Tablet
- Desktop
- Large desktop

## Visual

ต้องเก็บ visual regression สำหรับ:

- Shell และ Sidebar
- Workspace overview ทุก Workspace
- Detail route pattern ทุกประเภท
- Editor pattern
- Table/list pattern
- Mobile pattern
- Loading/empty/error/permission state

---

# 9. Definition of Done สำหรับ “ครบทุกหน้า”

งาน Admin UI/UX ยังไม่ถือว่าเสร็จจนกว่าจะครบทั้งหมด:

- [ ] Route Registry ครอบคลุม route ใน `apps/web-admin` 100%
- [ ] ทุก route มี Workspace owner
- [ ] ทุก route มี Desktop และ Mobile pattern
- [ ] ทุก route มีภาษาไทยและอังกฤษ
- [ ] ทุก route มี loading, empty, error และ permission states
- [ ] Dynamic route ผ่าน not-found, denied และ stale-data cases
- [ ] Route เดิมมี redirect/compatibility ที่ทดสอบแล้ว
- [ ] ไม่มีเมนูหรือ deep link ไป route ที่เสีย
- [ ] ไม่มี route ที่ยังใช้ Layout/Component legacy แยกชุด
- [ ] ไม่มีรายการยาวเพราะไม่มี pagination
- [ ] ไม่มี Card row จำนวนมากแทน DataTable/MobileDataList
- [ ] ไม่มีข้อมูลถูก overflow ตัด
- [ ] ทุก create/edit flow มี validation และ unsaved guard
- [ ] ทุก mutation สำคัญมี permission, confirmation และ audit
- [ ] ทุก auth/recovery flow ใช้งานได้ทั้ง Desktop และ Mobile
- [ ] ทุก error state มีทางออกที่เข้าใจได้
- [ ] Smoke test ครบ route
- [ ] Interaction test ครบ critical route
- [ ] Visual regression ครบ route family และ 7 viewport
- [ ] Lint, typecheck และ production build ผ่าน
- [ ] ไม่มี unresolved route coverage exception

---

# 10. Implementation sequence สำหรับ Route ที่ไม่มีภาพ

1. สร้าง Route Registry จากโค้ดจริง
2. เทียบ Route Registry กับ 11 Workspace เป้าหมาย
3. ระบุ route ที่ไม่มีภาพและจัดเข้ากลุ่ม Auth, Detail, Editor, System หรือ Legacy
4. กำหนด Desktop/Mobile pattern
5. กำหนด locale namespace
6. เพิ่ม states และ permission behavior
7. เพิ่ม redirect/compatibility
8. เพิ่ม smoke test ทุก route
9. เพิ่ม interaction test สำหรับ critical flow
10. เพิ่ม visual regression ตาม route family
11. ตรวจ deep links จาก Notification, Email และ Audit
12. ปิด Route coverage exception ให้เป็นศูนย์

---

## สรุปข้อบังคับ

ภาพหน้าจอเป็นเพียงหนึ่งแหล่งข้อมูลสำหรับ UX audit ส่วนขอบเขตจริงต้องยึด Route Registry ที่สร้างจากโค้ด `apps/web-admin` ดังนั้นหน้าใดที่ไม่ได้แคป, ไม่อยู่ในเมนู, เป็น dynamic route, เป็น system state หรือถูกเปิดผ่าน deep link ยังคงต้องได้รับการปรับ UX/UI, responsive, localization, permission และ test coverage ครบเท่ากัน
