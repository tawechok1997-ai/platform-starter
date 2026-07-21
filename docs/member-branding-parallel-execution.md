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
- ✅ งาน foundation ชุดแรกไม่แก้ API, Prisma, Wallet mutation, Provider หรือ Finance contract
- ✅ โค้ด Branding ใหม่เป็นแบบ additive ก่อน จนกว่าจะย้าย consumer และตรวจผ่าน
- ✅ Route และ Feature flag เดิมของ Member ยังเป็น source of truth
- ✅ ตรวจ Asset URL, CSS value และค่าที่นำไป render ก่อนใช้งาน
- ✅ แยกงานให้ย้อนกลับได้เป็นรายส่วน
- ✅ ยึดเว็บในไฟล์ต้นแบบเป็น Visual source of truth

## Workstream A: Brand Runtime Foundation

สถานะ:

- ✅ สร้าง branch งานแยกจาก `main`
- ✅ สร้าง `brand-config.ts`
- ✅ สร้างชนิดข้อมูล Brand assets กลาง
- ✅ สร้าง CSS variable mapping กลาง
- ✅ เพิ่มการตรวจสี CSS ก่อนนำไปใช้
- ✅ เพิ่มการตรวจ Asset URL และปิดกั้น `javascript:`
- ✅ เพิ่มการตรวจ CSS length และ Font family
- ✅ สร้าง unit test สำหรับค่าปกติและค่าที่ไม่ปลอดภัย
- ✅ เพิ่ม Brand context/hook สำหรับ consumer
- ✅ เชื่อม Brand runtime config กับ SiteSettingsProvider โดยไม่โหลดข้อมูลซ้ำ
- ✅ เพิ่ม Auth runtime compatibility bridge
- 🧪 รัน Member test
- 🧪 รัน Member typecheck
- 🧪 รัน Member build

## Workstream B: Auth Branding Foundation

สถานะ:

- ✅ ตรวจโครงสร้าง Login/Register ปัจจุบัน
- ✅ สร้าง Auth shell กลางแบบ presentation-only
- ✅ เชื่อม Logo Login/Register จาก Brand config พร้อม fallback
- ✅ เชื่อมสีและ Typography จาก Design tokens
- ✅ สร้าง Auth brand presentation model
- ✅ รักษา API, Session, Validation, CAPTCHA และ Redirect เดิม
- ✅ เชื่อมหน้า Login เข้ากับ Brand runtime โดยไม่เปลี่ยน Auth flow
- ✅ เพิ่ม Register brand adapter สำหรับ contract เดิม
- ✅ เชื่อม Register adapter เข้าหน้า Register จริง
- ✅ เพิ่ม data attributes สำหรับตรวจ Brand state บนหน้า Register
- ✅ เพิ่ม Scoped Auth reference layout ผ่าน route-group layout
- ✅ เพิ่ม Register adapter tests สำหรับ logo fallback, configured mark และ legacy tokens
- ✅ เพิ่ม app branding specs เข้า Member test suite
- 🔄 ปรับระยะ ขนาด และ responsive ให้ตรงไฟล์ต้นแบบ
- ⬜ ตรวจ Mobile/Desktop เทียบไฟล์ต้นแบบ

## Workstream C: Icon and Asset Mapping

สถานะ:

- ✅ ตรวจ IconKey และระบบ fallback เดิม
- ✅ เพิ่ม Extended brand icon registry โดยไม่แก้ IconKey เดิม
- ✅ เพิ่ม fallback สำหรับไอคอนระบบและหมวดเกม
- ✅ เพิ่ม validation ป้องกัน icon value อันตราย
- ✅ สร้าง Brand asset manifest
- ✅ แยกกลุ่ม Brand, Auth, Navigation, Promotion, Placeholder และ Social
- ✅ เพิ่ม fallback resolution สำหรับ Logo/Auth assets
- ✅ สร้าง controlled asset intake path สำหรับไฟล์ต้นแบบ
- ✅ เพิ่มกฎไม่รับ JS, API URL, Cookie และ Auth code จาก Static package
- ✅ เพิ่ม `BrandIcon` consumer bridge แบบ fallback-safe
- ✅ เพิ่ม asset audit ตรวจไฟล์ว่าง ไฟล์ใหญ่ ไฟล์ซ้ำ นามสกุล และ SVG อันตราย
- ✅ เพิ่ม `audit:reference-assets` เข้า verify pipeline
- 🔄 นำ asset จริงจากไฟล์ต้นแบบเข้าโครงสร้างโปรเจกต์
- 🧪 รัน asset audit หลังนำไฟล์จริงเข้า
- 🔄 เชื่อม BrandIcon เข้ากับ MemberIcon consumer ทีละจุด

## Workstream D: Member Home Integration Contract

สถานะ:

- ✅ ตรวจจุดเชื่อม `HomeHero` และ CMS banner เดิม
- ✅ ยืนยันว่า Home ใช้ Site Settings และ Feature flags อยู่แล้ว
- ✅ สร้าง Promotion carousel component แบบ React
- ✅ ป้องกัน Timer ซ้อนด้วย timeout เดียวและ cleanup ทุกครั้ง
- ✅ ป้องกัน Index หลุดด้วย normalized safe index
- ✅ หยุด autoplay เมื่อ hover, focus หรือซ่อนแท็บ
- ✅ รองรับ dots, previous/next และ accessibility state
- 🔄 เชื่อม Banner จาก CMS พร้อม fallback asset
- ⬜ ย้าย Announcement, Promotion cards, Tournament, Jackpot และ Leaderboard
- 🧪 ตรวจ Responsive และ soak test หลังเชื่อมหน้า Home จริง

## Workstream E: Admin Branding Contract

สถานะ:

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

## งานที่เสร็จแล้ว

1. ✅ สร้าง branch `feature/member-branding-foundation`
2. ✅ เพิ่ม Brand runtime config แบบปลอดภัย
3. ✅ เพิ่ม Brand asset mapping กลาง
4. ✅ เพิ่ม Design token mapping กลาง
5. ✅ เพิ่ม validation ป้องกัน CSS/URL injection เบื้องต้น
6. ✅ เพิ่ม unit tests ของ Brand config
7. ✅ เพิ่ม Brand runtime hook
8. ✅ เพิ่ม Auth brand shell
9. ✅ เพิ่ม Auth brand presentation model
10. ✅ เพิ่ม Extended icon registry
11. ✅ เพิ่ม Brand asset manifest และ fallback rules
12. ✅ เพิ่ม Auth runtime compatibility bridge
13. ✅ เชื่อมหน้า Login กับ Branding runtime
14. ✅ เพิ่ม controlled asset intake path
15. ✅ เพิ่ม Auth branding compatibility tests
16. ✅ เพิ่ม Register brand adapter
17. ✅ เชื่อม Register adapter เข้าหน้าจริง
18. ✅ เพิ่ม Auth route-group layout สำหรับ scoped CSS
19. ✅ เพิ่ม Register settings bridge tests
20. ✅ เพิ่ม app branding specs เข้า Member test suite
21. ✅ เพิ่ม Promotion carousel foundation แบบ React
22. ✅ เพิ่ม BrandIcon consumer bridge
23. ✅ เพิ่ม Reference asset audit และ verify gate
