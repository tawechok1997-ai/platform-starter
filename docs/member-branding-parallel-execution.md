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

ขอบเขตไฟล์:

- `apps/web-member/app/brand/**`
- `apps/web-member/app/site-settings-types.ts`
- `apps/web-member/app/typed-site-settings.ts`

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
- 🧪 รัน Member test
- 🧪 รัน Member typecheck
- 🧪 รัน Member build

## Workstream B: Auth Branding Foundation

ขอบเขตไฟล์:

- `apps/web-member/app/(auth)/**`
- `apps/web-member/app/components/auth/**`

สถานะ:

- ✅ ตรวจโครงสร้าง Login/Register ปัจจุบัน
- ✅ สร้าง Auth shell กลางแบบ presentation-only
- ✅ เชื่อม Logo Login/Register จาก Brand config พร้อม fallback
- ✅ เชื่อมสีและ Typography จาก Design tokens
- ✅ สร้าง Auth brand presentation model
- ✅ รักษา API, Session, Validation, CAPTCHA และ Redirect เดิมโดยยังไม่ย้าย flow
- 🔄 เชื่อม Auth shell เข้าหน้า Login/Register จริงแบบทีละหน้า
- ⬜ ตรวจ Mobile/Desktop เทียบไฟล์ต้นแบบ

## Workstream C: Icon and Asset Mapping

ขอบเขตไฟล์:

- `apps/web-member/app/components/member-icon.tsx`
- `apps/web-member/app/site-settings.ts`
- `apps/web-member/app/brand/**`
- `apps/web-member/public/assets/**`

สถานะ:

- ✅ ตรวจ IconKey และระบบ fallback เดิม
- ✅ เพิ่ม Extended brand icon registry โดยไม่แก้ IconKey เดิม
- ✅ เพิ่ม fallback สำหรับไอคอนระบบและหมวดเกม
- ✅ เพิ่ม validation ป้องกัน icon value อันตราย
- ✅ สร้าง Brand asset manifest
- ✅ แยกกลุ่ม Brand, Auth, Navigation, Promotion, Placeholder และ Social
- ✅ เพิ่ม fallback resolution สำหรับ Logo/Auth assets
- ⬜ นำ asset จริงจากไฟล์ต้นแบบเข้าโครงสร้างโปรเจกต์
- ⬜ ตรวจไฟล์ซ้ำและไฟล์เสีย
- ⬜ เชื่อม Icon registry เข้ากับ MemberIcon consumer

## Workstream D: Member Home Integration Contract

ขอบเขตไฟล์:

- `apps/web-member/app/member-home.tsx`
- `apps/web-member/app/components/member-home/**`
- `apps/web-member/app/components/member-home-sections.tsx`

สถานะ:

- ✅ ตรวจจุดเชื่อม `HomeHero` และ CMS banner เดิม
- ✅ ยืนยันว่า Home ใช้ Site Settings และ Feature flags อยู่แล้ว
- ⬜ สร้าง Promotion carousel component แบบ React
- ⬜ ป้องกัน Timer ซ้อน, Index หลุด และภาพมืดค้าง
- ⬜ เชื่อม Banner จาก CMS พร้อม fallback asset
- ⬜ ย้าย Announcement, Promotion cards, Tournament, Jackpot และ Leaderboard
- ⬜ ตรวจ Responsive และ soak test

## Workstream E: Admin Branding Contract

ขอบเขตไฟล์:

- Admin settings UI
- Public site settings API contract

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
12. ✅ อัปเดตเอกสารติดตามงานหลายสายพร้อมสถานะจริง
