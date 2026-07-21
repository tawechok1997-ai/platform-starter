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
- 🔄 นำ asset จริงจากไฟล์ต้นแบบเข้าโครงสร้างโปรเจกต์
- 🧪 รัน asset audit หลังนำไฟล์จริงเข้า
- 🔄 เชื่อม BrandIcon เข้ากับ MemberIcon consumer ทีละจุด

## Workstream D: Member Home Integration Contract

- ✅ ตรวจจุดเชื่อม Home และยืนยัน Site Settings/Feature flags เดิม
- ✅ Promotion carousel แบบ React
- ✅ ป้องกัน Timer ซ้อน, Index หลุด และ autoplay ขณะซ่อนแท็บ
- ✅ รองรับ dots, previous/next และ accessibility state
- ✅ เชื่อม Carousel กับ CMS Banner และ fallback จากไฟล์ต้นแบบ
- ✅ กรอง URL และลิงก์ไม่ปลอดภัย พร้อมตัดภาพซ้ำ
- ✅ เพิ่ม Carousel regression tests
- ✅ ย้าย Promotion cards เป็น component และ model แยก
- ✅ Promotion cards ใช้ CMS จริงพร้อม reference fallback
- ✅ กรองข้อมูลว่าง ลิงก์อันตราย และภาพซ้ำก่อน render
- ✅ แยก Tournament, Jackpot และ Leaderboard เป็น Competition Showcase
- ✅ เพิ่ม normalization สำหรับอันดับ ผู้ใช้ คะแนน รูป และยอด Jackpot
- ✅ เพิ่ม regression tests สำหรับ Promotion และ Competition sections
- ⬜ ย้าย Announcement ให้ตรงไฟล์ต้นแบบ
- 🔄 ปรับ CSS ของ Promotion/Tournament/Jackpot/Leaderboard ให้ตรงภาพต้นแบบ
- 🧪 ตรวจ Responsive และ soak test หลังส่วน Home ครบ

## Workstream E: Admin Branding Contract

- ⬜ ตรวจหน้าตั้งค่า Branding ปัจจุบัน
- ⬜ ทำ field inventory ก่อนเพิ่ม schema
- ⬜ ออกแบบ Draft/Publish/Version/Rollback แบบย้อนหลังได้
- ⬜ เพิ่ม Preview Desktop/Tablet/Mobile
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

1. ✅ เชื่อม Promotion carousel เข้าหน้า Home จริง
2. ✅ เพิ่ม CMS banner model พร้อม fallback และ safety filters
3. ✅ ย้าย Promotion cards เป็น component/model แยก
4. ✅ เพิ่ม Tournament, Jackpot และ Leaderboard showcase
5. ✅ เพิ่มข้อมูล fallback ที่ผ่าน normalization
6. ✅ เพิ่ม regression tests สำหรับ Home reference sections
