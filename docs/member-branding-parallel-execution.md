# Member Branding Worklist

Source of truth: `main`

Merged delivery:

- PR #105 merged into `main` at `1ece28bcb57caeed4143d4311905907eabbe0af1`
- PR #123 closed because its menu/category scope was already included in PR #105
- Open pull requests for this workstream: 0

เอกสารนี้สรุปเฉพาะสถานะที่ตรวจจากโค้ดซึ่งอยู่บน `main` แล้ว ไม่ใช้สถานะจาก branch หรือ Draft PR เก่า

## สัญลักษณ์

- ✅ มีโค้ดบน `main` และมีชุดตรวจรองรับ
- 🧪 มีโค้ดบน `main` แต่ยังต้องตรวจผ่าน browser หรือสภาพแวดล้อมจริง
- ⛔ ติด asset หรือข้อจำกัดภายนอก
- ⬜ ยังไม่มีหลักฐานว่าปิดจากโค้ดปัจจุบัน

## งานที่อยู่บน `main` แล้ว

### Admin Settings และ Branding

- ✅ Branding runtime, defaults และ public settings override
- ✅ Logo, color, font, radius และ placeholder fields
- ✅ Upload / Replace / Disable / Restore ผ่าน CMS asset transport เดิม
- ✅ Save Draft / Publish / Version History / Rollback
- ✅ แยกสิทธิ์ Edit และ Publish
- ✅ Audit actions สำหรับ Draft / Publish / Rollback
- ✅ Preview แบบ inline และ full-page สำหรับ Desktop / Tablet / Mobile
- ✅ Form lifecycle กลางสำหรับ load, dirty state, before-unload, save, reset และ notice
- ✅ Website Settings และ SettingsSectionPage ใช้ lifecycle กลางโดยไม่เปลี่ยน API contract
- ✅ Branding workflow ใช้ Admin design system เดิม
- ✅ แยก ownership ระหว่าง Website, Branding, Icons, CMS, Promotion Center และ Game API
- ✅ Uploader, history, audit และ permission ใช้ระบบกลาง ไม่สร้างระบบซ้ำ
- ✅ Regression tests ป้องกัน field ข้ามหมวดและ workflow/preview ซ้ำ
- ✅ Admin lint, tests, typecheck, production build และ bundle analysis ผ่านบนหัวงานก่อน merge

### Member Runtime และ Navigation

- ✅ Brand context และ typed settings
- ✅ Desktop navigation, drawer, bottom navigation และ notification icon อ่านจาก Settings
- ✅ Game category navigation อ่าน category จาก `/member/games`
- ✅ Menu และ category icon ใช้ Brand icon registry พร้อม safe fallback
- ✅ Quick Actions ใช้ shared `BrandIcon` renderer
- ✅ Quick Actions ใช้ `navigationFor('home', features)` เป็น source of truth
- ✅ Route, title และ description มาจาก navigation เดิม
- ✅ ไม่มี hardcoded URL และไม่มี renderer logic ซ้ำใน Quick Actions
- ✅ มี regression test ล็อก navigation, feature flags และ shared icon renderer

### Auth Login และ Register

- ✅ Login/Register ใช้ branding runtime และ settings เดิม
- ✅ ไม่เปลี่ยน Auth, Session, CAPTCHA หรือ Redirect contract
- ✅ Login legal footer แยกข้อความไทยและอังกฤษ
- ✅ ปุ่มแสดง/ซ่อนรหัสผ่านใช้ locale copy
- ✅ โหมดไทยไม่แสดง `Secure connection`
- ✅ มี regression test ป้องกันข้อความ Login ไทย/อังกฤษปนกัน
- 🧪 Login visual และ responsive implementation อยู่บน `main` แต่ยังไม่มี final browser acceptance
- 🧪 Register flow และ branding implementation อยู่บน `main` แต่ยังไม่มี final browser acceptance ครบทุก breakpoint

### Member Home และ CMS Contract

- ✅ Promotion carousel พร้อม autoplay safeguards
- ✅ Promotion cards อ่านจาก Admin/CMS
- ✅ Announcement แยก component และอ่านจาก CMS
- ✅ Tournament / Jackpot / Leaderboard แยกเป็น Competition Showcase
- ✅ Games, provider, category และ media อ่านจาก Game API
- ✅ Quick Actions เชื่อมผ่าน HomeHighlightsPanel
- ✅ Support headset WebP ถูกนำเข้าและเชื่อมแล้ว
- 🧪 Home presentation และ responsive implementation อยู่บน `main` แต่ยังไม่มี browser soak/acceptance รอบสุดท้าย

## Asset ที่มีใน repository แล้ว

- ✅ Header logo WebP
- ✅ Thai language SVG
- ✅ Support headset WebP
- ✅ Reference menu PNG และ manifest

## งานที่เหลือจริง

1. 🧪 ตรวจ Login และ Register บน Mobile/Desktop ด้วย browser จริง
2. 🧪 ตรวจ Home Promotion, Tournament, Jackpot และ Leaderboard เทียบต้นแบบ
3. 🧪 ทำ Home responsive soak test และตรวจ console/network error
4. ⛔ นำเข้า Announcement, Jackpot และ Promotion PNG ต้นฉบับอีก 3 ไฟล์ เมื่อมี binary ที่ checksum คงที่
5. 🧪 ทดสอบหลังล็อกอินจริง รวม route, settings override, feature flags และ fallback assets
6. ⬜ รัน repository-wide CI บน `main` หลัง merge และแยก failure เดิมออกจาก regression ของ workstream นี้

## งานที่ปิดและต้องไม่ใส่กลับในรายการค้าง

- ✅ Sync `main`
- ✅ แก้ PR conflict
- ✅ อัปเดตและ merge PR #105
- ✅ ปิด PR #123 ที่ซ้ำกับงานใน #105
- ✅ ย้าย Quick Actions ไปใช้ renderer กลาง
- ✅ ปิด Admin overlap และ ownership audit

## CI ที่ผ่านก่อน merge

- ✅ Admin Verification & Bundle
- ✅ P5 Web Unit Tests
- ✅ Member UI Quality
- ✅ Build
- ✅ Quality Gate
- ✅ Visual Regression
- ✅ Architecture Contracts
- ✅ Game API Verification
- ✅ KYC Browser Regression

## Repository-wide checks ที่เคยแดงและยังต้องตรวจใหม่บน `main`

รายการนี้ไม่ควรถูกนับว่าเป็น failure ของ Member Branding โดยอัตโนมัติ จนกว่าจะตรวจ log บน `main` หลัง merge:

- ⬜ R-010 Query Ownership
- ⬜ R-010 Query Boundaries
- ⬜ P5 Security Audit
- ⬜ Full-System Automated Tests

## กติกาสำหรับงานต่อ

- ทำงานใหม่ผ่าน branch และ PR ไม่ push feature code ตรง `main`
- ไม่เปลี่ยน Wallet, Finance, Provider credential, Session, CAPTCHA หรือ Redirect contract โดยไม่แยก scope
- ไม่ hardcode รายการเกมหรือโปรโมชันใน Member
- Admin/CMS และ Game API ต้องเป็น source of truth
- หน้าไทยต้องมีเฉพาะภาษาไทย และหน้าอังกฤษต้องมีเฉพาะภาษาอังกฤษ ยกเว้นชื่อแบรนด์หรือคำเฉพาะ
- Member ใช้ visual language เดียวกับต้นแบบ ส่วน Admin ใช้ design system เดิมของ Admin
