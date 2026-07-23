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

### Member Home และ CMS Contract

- ✅ Promotion carousel และ autoplay safeguards
- ✅ Promotion cards อ่านจาก Admin/CMS
- ✅ Announcement แยก component และอ่านจาก CMS
- ✅ Tournament / Jackpot / Leaderboard แยกเป็น Competition Showcase
- ✅ Games, provider, category และ media ยังอ่านจาก Game API
- ✅ Support headset WebP ถูกนำเข้าและเชื่อมแล้ว

## งานที่เหลือ

1. 🔄 Auth Login/Register visual polish ให้ตรงต้นแบบทุก breakpoint
2. 🔄 ตรวจ Auth แบบ Mobile และ Desktop เทียบต้นแบบ
3. 🔄 Home visual polish สำหรับ Promotion, Tournament, Jackpot และ Leaderboard
4. 🔄 Home responsive และ browser soak test
5. ⛔ นำเข้า Announcement, Jackpot และ Promotion PNG อีก 3 ไฟล์ เพราะ binary transport เปลี่ยน checksum
6. ⬜ Sync `main` และแก้ PR conflict โดยรักษางาน Admin ล่าสุดทั้งสองฝั่ง
7. ⬜ Final browser acceptance หลังล็อกอินจริงทุกหน้าที่เกี่ยวข้อง
8. ⬜ Final clean CI และอัปเดต Draft PR #105 ก่อน merge

## CI ล่าสุดของงานชุดนี้

ผ่าน:

- ✅ Admin Verification & Bundle
- ✅ P5 Web Unit Tests
- ✅ Member UI Quality
- ✅ Build
- ✅ Quality Gate
- ✅ Visual Regression
- ✅ Architecture Contracts
- ✅ Game API Verification
- ✅ KYC Browser Regression

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
- งาน Member ทุกหน้าต้องใช้ visual language เดียวกันกับต้นแบบ แต่ Admin ต้องยึด design system เดิมของ Admin
