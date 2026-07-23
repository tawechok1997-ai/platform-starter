# Member Branding Active Worklist

Branch: `feature/member-branding-foundation`

เอกสารนี้เก็บเฉพาะงานที่ทำในชุด Member Branding / Admin Settings / Member Visual Integration ปัจจุบันเท่านั้น

## สัญลักษณ์

- ✅ เสร็จและผ่านชุดตรวจหลักแล้ว
- 🔄 กำลังทำ
- 🧪 ทำเสร็จแล้ว รอตรวจด้วย browser หรือ final acceptance
- ⛔ ติดข้อจำกัด
- ⬜ ยังไม่เริ่ม

## งานที่เสร็จแล้ว

### Admin Settings และ Branding

- ✅ Branding runtime, defaults และ public settings override
- ✅ Logo, color, font, radius และ placeholder fields
- ✅ Upload / Replace / Disable / Restore ผ่าน CMS asset transport เดิม
- ✅ Save Draft / Publish / Version History / Rollback
- ✅ แยกสิทธิ์ Edit และ Publish
- ✅ Audit actions สำหรับ Draft / Publish / Rollback
- ✅ Preview แบบ inline และ full-page Desktop / Tablet / Mobile
- ✅ รวม form lifecycle กลางสำหรับ load, dirty state, before-unload, save, reset และ notice
- ✅ Website Settings และ SettingsSectionPage ใช้ lifecycle กลางโดยไม่เปลี่ยน API contract
- ✅ ปรับ Branding workflow ให้ใช้ Admin design-system เดิม
- ✅ ตรวจ ownership ระหว่าง Website, Branding, Icons, CMS, Promotion Center และ Game API
- ✅ ยืนยันว่า uploader, history, audit และ permission ไม่ได้สร้างระบบซ้ำ
- ✅ เพิ่ม regression tests กัน field ข้ามหมวดและ preview/workflow ซ้ำ
- ✅ Admin lint, tests, typecheck, production build และ bundle analysis ผ่าน

### Member Runtime และ Navigation

- ✅ Brand context และ typed settings
- ✅ Desktop navigation, drawer, bottom navigation และ notification icon อ่านจาก Settings
- ✅ Game category navigation อ่าน category จาก `/member/games`
- ✅ Menu/category icon ใช้ Brand icon registry และ safe fallback
- ✅ Quick Actions ย้ายมาใช้ `BrandIcon` renderer กลาง
- ✅ Quick Actions ยังคงใช้ `navigationFor`, feature flags, route, title และ description เดิม
- ✅ เพิ่ม regression test กัน Quick Actions เขียน URL/text/default-icon renderer ซ้ำ
- ✅ Member UI Quality, P5 Web Unit Tests, Build, Quality Gate และ Visual Regression ผ่านหลัง Quick Actions migration

### Auth Login และ Register

- ✅ Login/Register ใช้ branding runtime และ settings เดิมโดยไม่เปลี่ยน Auth, Session, CAPTCHA หรือ Redirect contract
- ✅ Login legal footer แยกข้อความไทยและอังกฤษครบ
- ✅ ปุ่มแสดง/ซ่อนรหัสผ่านใช้ locale copy โดยตรง
- ✅ ตัดข้อความอังกฤษ `Secure connection` ออกจากโหมดภาษาไทย
- ✅ เพิ่ม regression test ป้องกันข้อความไทย/อังกฤษปนกันใน Login
- 🧪 Login locale purity ทำเสร็จแล้ว รอ final browser comparison

### Member Home และ CMS Contract

- ✅ Promotion carousel และ autoplay safeguards
- ✅ Promotion cards อ่านจาก Admin/CMS
- ✅ Announcement แยก component และอ่านจาก CMS
- ✅ Tournament / Jackpot / Leaderboard แยกเป็น Competition Showcase
- ✅ Games, provider, category และ media ยังอ่านจาก Game API
- ✅ Support headset WebP ถูกนำเข้าและเชื่อมแล้ว

## Commit สำคัญล่าสุด

- `e21c0028254d46a362556042468042ae443b6d99` ปิด Admin overlap refactor และอัปเดต ownership/worklist
- `152691bf78280c3492ff4ea92a2bc320800427a5` ล็อก Quick Actions ให้ใช้ shared `BrandIcon` renderer
- `790ff7a85aa26e7cd8dc0efea995983f405d79d8` แก้ Login legal copy ให้แยก locale ถูกต้อง
- `e86b22ef485d984d01b7c0299c0da265a1631abd` เพิ่ม regression test สำหรับ Auth locale purity

## งานที่เหลือ

1. 🔄 Register locale purity และ visual polish ให้ตรงต้นแบบทุก breakpoint
2. 🔄 ตรวจ Auth Login/Register แบบ Mobile และ Desktop เทียบต้นแบบ
3. 🔄 Home visual polish สำหรับ Promotion, Tournament, Jackpot และ Leaderboard
4. 🔄 Home responsive และ browser soak test
5. ⛔ นำเข้า Announcement, Jackpot และ Promotion PNG อีก 3 ไฟล์ เพราะ binary transport เปลี่ยน checksum
6. ⬜ Sync `main` และแก้ PR conflict โดยรักษางาน Admin ล่าสุดทั้งสองฝั่ง
7. ⬜ Final browser acceptance หลังล็อกอินจริงทุกหน้าที่เกี่ยวข้อง
8. ⬜ Final clean CI และอัปเดต Draft PR #105 ก่อน merge

## CI ล่าสุดของงานชุดนี้

ผ่านจากรอบ Quick Actions:

- ✅ Admin Verification & Bundle
- ✅ P5 Web Unit Tests
- ✅ Member UI Quality
- ✅ Build
- ✅ Quality Gate
- ✅ Visual Regression
- ✅ Architecture Contracts
- ✅ Game API Verification
- ✅ KYC Browser Regression

รอบ Auth locale purity ล่าสุดเริ่มรันบน head ใหม่แล้ว และยังต้องรอผลครบก่อนปิด Auth visual workstream

ยังแดงจาก merge-ref / repository-wide audit เดิม และยังไม่ถือว่าเป็นความล้มเหลวของ Quick Actions หรือ Admin Settings ก้อนนี้:

- ⛔ R-010 Query Ownership
- ⛔ R-010 Query Boundaries
- ⛔ P5 Security Audit
- ⛔ Full-System Automated Tests

## ข้อห้ามระหว่างทำต่อ

- ไม่ push ตรง `main`
- ไม่เปลี่ยน Wallet, Finance, Provider credential, Session, CAPTCHA หรือ Redirect contract
- ไม่ hardcode รายการเกมหรือโปรโมชันใน Member
- Admin/CMS และ Game API ต้องเป็น source of truth
- หน้าไทยต้องมีเฉพาะข้อความไทย และหน้าอังกฤษต้องมีเฉพาะข้อความอังกฤษ ยกเว้นชื่อแบรนด์หรือคำเฉพาะที่จำเป็น
- งาน Member ทุกหน้าต้องใช้ visual language เดียวกันกับต้นแบบ แต่ Admin ต้องยึด design system เดิมของ Admin