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
- ✅ งาน foundation ไม่แก้ API, Prisma, Wallet mutation, Provider หรือ Finance contract
- ✅ โค้ด Branding ใหม่เป็นแบบ additive และย้อนกลับเป็นรายส่วนได้
- ✅ Route และ Feature flag เดิมของ Member ยังเป็น source of truth
- ✅ ตรวจ Asset URL, CSS value และค่าที่นำไป render ก่อนใช้งาน
- ✅ ยึดเว็บในไฟล์ต้นแบบเป็น Visual source of truth

## Workstream A: Brand Runtime Foundation

- ✅ Brand runtime config และชนิดข้อมูล assets กลาง
- ✅ CSS variable mapping และ validation สี, URL, CSS length, Font family
- ✅ Brand context/hook เชื่อม SiteSettingsProvider โดยไม่โหลดข้อมูลซ้ำ
- ✅ Auth runtime compatibility bridge
- ✅ Unit tests สำหรับค่าปกติและค่าที่ไม่ปลอดภัย
- 🧪 รัน Member test
- 🧪 รัน Member typecheck
- 🧪 รัน Member build

## Workstream B: Auth Branding Foundation

- ✅ ตรวจโครงสร้าง Login/Register ปัจจุบัน
- ✅ Auth shell กลางแบบ presentation-only
- ✅ Logo Login/Register พร้อม fallback
- ✅ สีและ Typography จาก Design tokens
- ✅ รักษา API, Session, Validation, CAPTCHA และ Redirect เดิม
- ✅ เชื่อมหน้า Login และ Register กับ Brand runtime
- ✅ Scoped Auth reference layout ผ่าน route-group layout
- ✅ Branding regression tests เข้า Member test suite
- 🔄 ปรับระยะ ขนาด และ responsive ให้ตรงไฟล์ต้นแบบ
- ⬜ ตรวจ Mobile/Desktop เทียบไฟล์ต้นแบบ

## Workstream C: Icon and Asset Mapping

- ✅ Extended brand icon registry โดยไม่แก้ IconKey เดิม
- ✅ fallback และ validation ป้องกัน icon value อันตราย
- ✅ Brand asset manifest และ fallback resolution
- ✅ Controlled asset intake path สำหรับไฟล์ต้นแบบ
- ✅ ไม่รับ JS, API URL, Cookie และ Auth code จาก static package
- ✅ `BrandIcon` consumer bridge แบบ fallback-safe
- ✅ Asset audit ตรวจไฟล์ว่าง ไฟล์ใหญ่ ไฟล์ซ้ำ นามสกุล และ SVG อันตราย
- ✅ เพิ่ม `audit:reference-assets` เข้า verify pipeline
- ✅ เพิ่ม settings contract สำหรับไอคอนเมนูหมวดเกมและข้อความกำกับ
- ✅ เชื่อมไอคอน หน้าหลัก/คาสิโน/สล็อต/คาสิโนสด/กีฬา/ยิงปลา/หวย/ไพ่ และหมวดอื่นจาก API เข้าหน้า Home
- ✅ เพิ่ม alias mapping สำหรับ category จาก Game API และ fallback สำหรับหมวดที่ไม่รู้จัก
- ✅ เพิ่ม responsive category rail ตั้งแต่ 320px ถึง wide desktop
- ✅ เพิ่ม regression tests สำหรับ label/icon override, unsafe icon และ category dedupe
- 🔄 นำ asset binary จริงจากไฟล์ต้นแบบเข้า `public/assets/reference-brand/menu/`
- 🧪 รัน asset audit หลังนำไฟล์จริงเข้า
- 🔄 เชื่อม BrandIcon เข้ากับ MemberIcon consumer จุดอื่นทีละส่วน

## Workstream D: Member Home Integration Contract

- ✅ ตรวจจุดเชื่อม Home และยืนยัน Site Settings/Feature flags เดิม
- ✅ Promotion carousel แบบ React
- ✅ ป้องกัน Timer ซ้อน, Index หลุด และ autoplay ขณะซ่อนแท็บ
- ✅ รองรับ dots, previous/next และ accessibility state
- ✅ เชื่อม Carousel กับ CMS Banner จาก Admin settings
- ✅ กรอง URL และลิงก์ไม่ปลอดภัย พร้อมตัดภาพซ้ำ
- ✅ เพิ่ม Carousel regression tests
- ✅ ย้าย Promotion cards เป็น component และ model แยก
- ✅ Promotion cards ใช้ CMS/Admin เป็น source of truth โดยไม่ hardcode รายการใน Member
- ✅ กรองข้อมูลว่าง ลิงก์อันตราย และภาพซ้ำก่อน render
- ✅ แยก Tournament, Jackpot และ Leaderboard เป็น Competition Showcase
- ✅ เพิ่ม normalization สำหรับอันดับ ผู้ใช้ คะแนน รูป และยอด Jackpot
- ✅ เพิ่ม regression tests สำหรับ Promotion และ Competition sections
- ✅ ย้าย Announcement เป็น component แยกและเชื่อม CMS
- ✅ เชื่อม Game category navigation กับ category ที่คืนจาก `/member/games`
- 🔄 ปรับ CSS ของ Promotion/Tournament/Jackpot/Leaderboard ให้ตรงภาพต้นแบบ
- 🧪 ตรวจ Responsive และ soak test หลังส่วน Home ครบ

## Workstream E: Admin Branding Contract

- 🔄 ทำ field inventory สำหรับ Brand asset, menu icon, game category label/icon และข้อความสำคัญ
- ⬜ เชื่อมค่าเริ่มต้นของ asset ต้นแบบเข้าฟอร์ม Admin จริง
- ⬜ เพิ่ม Upload/Replace/Disable/Restore สำหรับโลโก้และไอคอน
- ⬜ เพิ่ม Preview Desktop/Tablet/Mobile
- ⬜ ออกแบบ Draft/Publish/Version/Rollback แบบย้อนหลังได้
- ⬜ แยกสิทธิ์ Edit และ Publish
- ⬜ เพิ่ม Audit log

## Gate ก่อนเปิด Pull Request

- 🧪 Unit tests ผ่าน
- 🧪 Typecheck ผ่าน
- 🧪 Production build ผ่าน
- ⬜ ไม่มี route เดิมเสีย
- ⬜ ไม่มี API contract เปลี่ยนโดยไม่ตั้งใจ
- ⬜ ไม่มี CSS global ทับหน้าอื่น
- ✅ มีรายการไฟล์เปลี่ยนและ rollback note ระดับ foundation
- ⬜ อัปเดต branch ให้ตรงกับ `main`
- ⬜ เปิด Draft PR เพื่อรีวิวก่อน merge

## งานที่เสร็จแล้วล่าสุด

1. ✅ เพิ่ม settings model ของ Game category navigation
2. ✅ เพิ่มไอคอนและข้อความตั้งค่าได้สำหรับ หน้าหลัก คาสิโน สล็อต คาสิโนสด กีฬา ยิงปลา หวย ไพ่ และหมวดเสริม
3. ✅ เชื่อม category ที่มาจาก Game API เข้ากับเมนูดังกล่าว
4. ✅ เพิ่ม safe fallback สำหรับ URL/ข้อความ/หมวดไม่รู้จัก
5. ✅ เพิ่ม responsive rail สำหรับ mobile, tablet, desktop และ ultra-wide
6. ✅ เพิ่ม regression tests และเอกสาร mapping ของ settings keys
