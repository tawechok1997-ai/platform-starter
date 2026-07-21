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
- 🧪 รัน Member test
- 🧪 รัน Member typecheck
- 🧪 รัน Member build
- ⬜ เชื่อม Brand runtime config เข้ากับ SiteSettingsProvider
- ⬜ เพิ่ม Brand context/hook สำหรับ consumer

## Workstream B: Auth Branding Foundation

ขอบเขตไฟล์:

- `apps/web-member/app/(auth)/**`
- `apps/web-member/app/components/auth/**`

สถานะ:

- ⬜ ตรวจโครงสร้าง Login/Register ปัจจุบัน
- ⬜ สร้าง Auth shell กลาง
- ⬜ เชื่อม Logo Login/Register จาก Brand config
- ⬜ เชื่อมสีและ Typography จาก Design tokens
- ⬜ รักษา API, Session, Validation และ Redirect เดิม
- ⬜ ตรวจ Mobile/Desktop

## Workstream C: Icon and Asset Mapping

ขอบเขตไฟล์:

- `apps/web-member/app/components/member-icon.tsx`
- `apps/web-member/app/site-settings.ts`
- `apps/web-member/public/assets/**`

สถานะ:

- 🔄 ตรวจ IconKey และระบบ fallback เดิม
- ⬜ ขยาย IconKey โดยไม่ทำให้ consumer เดิมพัง
- ⬜ สร้าง Asset manifest
- ⬜ แยก Logo, Auth, Navigation, Promotion และ Placeholder assets
- ⬜ ตรวจไฟล์ซ้ำและไฟล์เสีย
- ⬜ เพิ่ม fallback ที่ปลอดภัย

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
- ⬜ มีรายการไฟล์เปลี่ยนและ rollback note
- ⬜ เปิด Draft PR เพื่อรีวิวก่อน merge

## งานที่เสร็จแล้วในรอบแรก

1. ✅ สร้าง branch `feature/member-branding-foundation`
2. ✅ เพิ่ม Brand runtime config แบบปลอดภัย
3. ✅ เพิ่ม Brand asset mapping กลาง
4. ✅ เพิ่ม Design token mapping กลาง
5. ✅ เพิ่ม validation ป้องกัน CSS/URL injection เบื้องต้น
6. ✅ เพิ่ม unit tests ของ Brand config
7. ✅ สร้างเอกสารติดตามงานหลายสายพร้อมสถานะ
