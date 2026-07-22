# Member Branding Parallel Execution

Branch: `feature/member-branding-foundation`

## สัญลักษณ์สถานะ

- ✅ เสร็จแล้ว
- 🔄 กำลังทำ
- 🧪 ทำเสร็จแล้ว รอตรวจหรือรันชุดทดสอบ
- ⛔ ติดปัญหา
- ⬜ ยังไม่เริ่ม

## กฎความปลอดภัย

- ✅ ไม่ push ตรงเข้า `main`
- ✅ ทำงานบน branch `feature/member-branding-foundation`
- ✅ งาน foundation ไม่แก้ Wallet mutation, Provider หรือ Finance contract
- ✅ โค้ด Branding เป็นแบบ additive และย้อนกลับเป็นรายส่วนได้
- ✅ Route และ Feature flag เดิมของ Member ยังเป็น source of truth
- ✅ ตรวจ Asset URL, CSS value และค่าที่นำไป render ก่อนใช้งาน
- ✅ ยึดเว็บในไฟล์ต้นแบบเป็น Visual source of truth
- ✅ ค่า Admin/Public settings ทับค่าเริ่มต้นจากไฟล์ต้นแบบเสมอ

## Workstream A: Brand Runtime Foundation

- ✅ Brand runtime config และชนิดข้อมูล assets กลาง
- ✅ CSS variable mapping และ validation สี, URL, CSS length, Font family
- ✅ Brand context/hook เชื่อม SiteSettingsProvider โดยไม่โหลดข้อมูลซ้ำ
- ✅ เพิ่ม reference defaults ระหว่าง app defaults กับค่า runtime
- ✅ ค่าเว็บไซต์ โลโก้ ข้อความ และไอคอนหมวดเกมอ่านผ่าน typed settings
- ✅ เพิ่มชนิดข้อมูลรองรับ extended public icon settings
- ✅ ถอด default asset path ที่ไม่มีไฟล์จริงออก ป้องกัน 404
- ✅ เพิ่ม tests ตรวจ reference defaults และ Admin override
- ✅ รัน Member test
- ✅ รัน Member typecheck
- ✅ รัน Member build

## Workstream B: Auth Branding Foundation

- ✅ ตรวจโครงสร้าง Login/Register ปัจจุบัน
- ✅ Auth shell กลางแบบ presentation-only
- ✅ เชื่อมหน้า Login และ Register กับ Brand runtime โดยไม่เปลี่ยน Auth flow
- ✅ นำเข้าโลโก้ต้นแบบและตั้งเป็นค่าเริ่มต้นของ Login/Register
- ✅ สีและ Typography จาก Design tokens
- ✅ รักษา API, Session, Validation, CAPTCHA และ Redirect เดิม
- ✅ Scoped Auth reference layout ผ่าน route-group layout
- ✅ Branding regression tests เข้า Member test suite
- 🔄 ปรับระยะ ขนาด และ responsive ให้ตรงไฟล์ต้นแบบ
- ⬜ ตรวจ Mobile/Desktop เทียบไฟล์ต้นแบบ

## Workstream C: Icon and Asset Mapping

- ✅ Extended brand icon registry โดยไม่แก้ IconKey เดิม
- ✅ fallback และ validation ป้องกัน icon value อันตราย
- ✅ Brand asset manifest และ controlled intake path
- ✅ ไม่รับ JS, API URL, Cookie และ Auth code จาก static package
- ✅ นำเข้าไอคอนเมนูต้นแบบเป็นไฟล์ PNG ชื่อคงที่
- ✅ นำเข้าไอคอน หน้าหลัก/คาสิโน/สล็อต/คาสิโนสด/กีฬา/ยิงปลา/หวย/ไพ่
- ✅ ยืนยัน mapping จากชื่อไทยจริงใน RAR ไปชื่ออังกฤษในโปรเจกต์
- ✅ นำเข้าไอคอน ฝาก/ถอน/โปรโมชั่น/โบนัส/Affiliate/Support/ประวัติ/แจ้งเตือน
- ✅ นำเข้าไอคอน กิจกรรม/ข่าวสาร/แนะนำ สำหรับ fallback ของหมวดเสริม
- ✅ เพิ่ม manifest ระบุ source path, output path และ SHA-256
- ✅ นำเข้าโลโก้เว็บแบบ WebP และธงภาษาไทยแบบ SVG
- ✅ เชื่อม Desktop nav, Drawer, Bottom nav และ Header notification กับ Settings
- ✅ เชื่อม category rail ด้านบนกับ label/icon จาก Settings
- ✅ ค่าไอคอนที่ Admin ตั้งเองมีลำดับสูงกว่าค่าเริ่มต้น
- ✅ เพิ่ม alias mapping สำหรับ category จาก Game API และ fallback สำหรับหมวดที่ไม่รู้จัก
- ✅ เพิ่ม responsive category rail ตั้งแต่ 320px ถึง wide desktop
- ✅ เพิ่มสคริปต์ sync asset ชุดเดียวจาก Member ไป Admin ก่อน dev/build
- ✅ รัน asset audit กับไฟล์ binary ที่นำเข้า
- ✅ ตรวจ Admin asset sync ระหว่าง buildจริง
- 🔄 ย้าย consumer อื่น เช่น Quick actions ให้ใช้ renderer กลางทีละส่วน
- 🔄 นำเข้า asset Home/Promotion ต้นฉบับที่เหลือเป็นไฟล์จริง
- ✅ นำเข้าและผูก `support-headset.webp` กับ runtime default และ asset audit

## Workstream D: Member Home Integration Contract

- ✅ ตรวจจุดเชื่อม Home และยืนยัน Site Settings/Feature flags เดิม
- ✅ Promotion carousel แบบ React
- ✅ ป้องกัน Timer ซ้อน, Index หลุด และ autoplay ขณะซ่อนแท็บ
- ✅ เชื่อม Carousel กับ CMS Banner จาก Admin settings
- ✅ Promotion cards ใช้ CMS/Admin เป็น source of truth โดยไม่ hardcode รายการใน Member
- ✅ กรอง URL, ลิงก์อันตราย และภาพซ้ำก่อน render
- ✅ แยก Tournament, Jackpot และ Leaderboard เป็น Competition Showcase
- ✅ ย้าย Announcement เป็น component แยกและเชื่อม CMS
- ✅ เชื่อม Game category navigation กับ category ที่คืนจาก `/member/games`
- ✅ เกม ชื่อเกม ค่าย ประเภท และ media ยังอ่านจาก Game API
- 🔄 ปรับ CSS ของ Promotion/Tournament/Jackpot/Leaderboard ให้ตรงภาพต้นแบบ
- 🧪 ตรวจ Responsive และ soak test หลังส่วน Home ครบ

## Workstream E: Admin Branding Contract

- ✅ ทำ field inventory สำหรับ Brand asset, menu icon, game category label/icon และข้อความสำคัญ
- ✅ กำหนดค่าเริ่มต้นจากไฟล์ต้นแบบใน public settings normalizer
- ✅ เชื่อมไอคอนเมนูและไอคอนหมวดเกมเข้าฟอร์ม `/settings/icons`
- ✅ แสดงชื่อไฟล์ไทยเดิม ชื่ออังกฤษใหม่ และ path ค่าเริ่มต้นในฟอร์ม
- ✅ ค่าที่บันทึกจาก Admin เชื่อมกลับไปยังตำแหน่งเมนูเดิมผ่าน settings key เดียวกัน
- ✅ แก้คำสั่ง Admin test ให้รวม `app/**/*.spec.ts`
- 🧪 Preview ไอคอนแบบ responsive รอตรวจด้วย browser จริง
- ✅ เชื่อม field กลุ่ม Logo และข้อความสำคัญเข้าฟอร์ม Admin จริง
- ✅ เพิ่ม Upload/Replace/Disable/Restore สำหรับโลโก้และภาพระบบ โดยใช้ CMS binary storage contract เดิม
- 🧪 เพิ่ม Preview Desktop/Tablet/Mobile ของหน้า Member เต็มหน้า พร้อม regression contract แล้ว รอ CI/browser acceptance
- 🔄 เพิ่ม Draft/Publish/Version/Rollback แบบย้อนหลังได้ โดยใช้ `SiteSettingHistory` เดิม
- 🔄 แยกสิทธิ์ Edit และ Publish สำหรับ Branding
- ✅ Settings update มี `SiteSettingHistory` และ `AdminAuditLog` บันทึกค่าเก่า/ใหม่ ผู้แก้ IP และ user-agent อยู่แล้ว
- 🔄 แยก audit action สำหรับ draft/publish/rollback ให้ชัดเจน

## Gate ก่อนเปิด Pull Request

- ✅ Unit tests ผ่าน
- ✅ Typecheck ผ่าน
- ✅ Production build ผ่าน
- 🧪 ไม่มี route เดิมเสีย รอ final browser regression
- ✅ ไม่มี API contract เปลี่ยนโดยไม่ตั้งใจตาม architecture/contract audits
- 🧪 ไม่มี CSS global ทับหน้าอื่น รอ final visual regression รอบสะอาด
- ✅ มี manifest, source mapping และ rollback note ระดับ foundation
- ✅ อัปเดต branchให้ตรงกับ `main`
- ✅ เปิด Draft PR `#105` เพื่อรีวิวก่อน merge

## งานที่เสร็จแล้วล่าสุด

1. ✅ แก้ Admin test script ให้รัน spec ใต้ `app/**`
2. ✅ เพิ่ม `sync-reference-assets.mjs` เพื่อใช้ asset ชุดเดียวกันระหว่าง Member และ Admin
3. ✅ ผูก asset sync เข้ากับ Admin dev, analyze และ build
4. ✅ Member/Admin test, typecheck และ production build ผ่าน
5. ✅ R009, R012 และ R013 audits ผ่านบน branch
6. ✅ Sync branch กับ `main` ด้วย merge commitโดยไม่ force push
7. ✅ เพิ่ม Logo/Text fields, unsaved-change guard และ runtime preview ใน Admin
8. ✅ เพิ่ม Upload/Replace/Disable/Restore พร้อม file validation และ metadata
9. ✅ เพิ่ม Full-page Branding Preview สำหรับ Desktop/Tablet/Mobile และ regression tests
10. ✅ นำเข้า `support-headset.webp`; Announcement/Jackpot/Promotion PNG ยังไม่ commit เพราะ connector ทำ checksum เปลี่ยน
11. 🔄 กำลังทำ Draft/Publish/Version/Rollback, permission split และ audit action เฉพาะ
12. 🔄 เหลือ visual polish, browser comparison, PNG ต้นฉบับ 3 ตัว และ final clean CI
