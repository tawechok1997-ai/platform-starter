# Member Branding Worklist

Source of truth: `main`

Merged delivery:

- PR #105 merged into `main` at `1ece28bcb57caeed4143d4311905907eabbe0af1`
- PR #123 closed because its menu/category scope was already included in PR #105
- PR #139 merged into `main` at `7c63926b91594404e97eb349650606664657ba99`
- PR #144 merged into `main` at `7ada12fb1c9e36002658fa2e0a034b6ad9ea5768`
- Current `main` deployment status: Member and API succeeded; Admin deployment follows the latest Admin-only commits independently

เอกสารนี้นับเฉพาะสถานะที่ตรวจจากโค้ด หลักฐาน CI และระบบที่ deploy แล้ว ไม่ใช้สถานะจาก branch, Draft PR หรือเอกสารความคืบหน้ารุ่นเก่า

## สัญลักษณ์

- ✅ มีโค้ดบน `main` และมีชุดตรวจหรือ production evidence รองรับ
- 🧪 ต้องยืนยันด้วย session จริงหรือเทียบต้นแบบด้วยคน
- ⛔ ติด asset หรือข้อจำกัดภายนอก

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
- ✅ Unsaved-change regression test ตรวจ owner กลาง `useAdminUnsavedChanges` แทนการยึด implementation รุ่นเก่า
- ✅ Admin safe-error fallback ไม่คืนข้อความว่างเมื่อ backend message ถูกกรองออก

### Member Runtime และ Navigation

- ✅ Brand context และ typed settings
- ✅ Desktop navigation, drawer, bottom navigation, notification และ Quick Actions ใช้ `BrandIcon` renderer กลาง
- ✅ Reference menu/category defaults ถูก merge ใน normalized settings จุดเดียว
- ✅ Game category navigation อ่าน category จาก `/member/games`
- ✅ Home เหลือ category navigation owner เดียว และ `show_game_categories` ยังควบคุมการแสดงผลจริง
- ✅ Quick Actions ใช้ `navigationFor('home', features)` เป็น source of truth
- ✅ Route, title และ description มาจาก navigation contract เดิม
- ✅ ลบ hardcoded icon URL และ CSS `nth-child` / `nth-of-type` ที่ผูก icon กับลำดับเมนู
- ✅ Bottom navigation จัด layout ตามจำนวนเมนูจริง ไม่พังเมื่อ feature flag เปลี่ยนจำนวนรายการ
- ✅ มี regression tests ล็อก navigation, feature flags, shared renderer และ fallback

### Auth Login และ Register

- ✅ Login/Register ใช้ branding runtime และ settings ชุดเดียว
- ✅ Register adapter delegate ไป Auth runtime กลาง ไม่ทำ mapping ซ้ำ
- ✅ Auth เหลือ stylesheet contract ปัจจุบันไฟล์เดียว
- ✅ ลบ Auth CSS/test layers รุ่นเก่าที่แข่งกันด้วย import order และ `!important`
- ✅ ไม่เปลี่ยน Auth, Session, CAPTCHA หรือ Redirect contract
- ✅ Login legal footer แยกข้อความไทยและอังกฤษ
- ✅ ปุ่มแสดง/ซ่อนรหัสผ่านใช้ locale copy
- ✅ หน้าไทยใช้ `เข้าสู่ระบบสมาชิก`, `สร้างบัญชีสมาชิก`, `การเชื่อมต่อปลอดภัย` และ `การสมัครที่ปลอดภัย` โดยไม่มีข้อความอังกฤษเดิมปน
- ✅ ชื่อแบรนด์ใน Auth header ไม่ถูกตัดบน viewport มือถือ 390px
- ✅ Regression tests ครอบคลุม locale purity, runtime branding, responsive contract และ visible copy
- ✅ Production acceptance ผ่าน Login/Register บน 390×844 และ 1440×900
- ✅ Production evidence ไม่มี horizontal overflow, page error, HTTP 4xx/5xx, critical static-request failure หรือ broken rendered image

### Member Home และ CMS Contract

- ✅ Promotion carousel พร้อม autoplay และ reduced-motion safeguards
- ✅ Promotion cards และ carousel ใช้ CMS promotion normalizer กลาง
- ✅ URL safety, text cleanup, internal href และ image dedupe อยู่ใน contract เดียว
- ✅ Announcement อ่านจาก CMS component แยก
- ✅ Tournament / Jackpot / Leaderboard แยกเป็น Competition Showcase
- ✅ Games, provider, category และ media อ่านจาก Game API
- ✅ ลบ Home implementation รุ่นเก่าที่ถูกแทนแล้วออกจาก `member-home-sections.tsx`
- ✅ ลบ category navigation component/CSS ชุดซ้ำ
- ✅ Game image fallback browser test โหลด lazy image เข้า viewport ก่อนตรวจ `onError`
- ✅ Support headset WebP ถูกนำเข้าและเชื่อมแล้ว
- ✅ Public production probe ยืนยันว่า `/` redirect ไป `/login?next=%2F` เมื่อไม่มี session ตาม contract

### Member CSS และ Theme Ownership

- ✅ แทน CSS patch/fix/final/balance หลายชั้นด้วย theme ปัจจุบันและ geometry contract ที่แยกหน้าที่
- ✅ ลบ header, rail, hero, tournament, bottom-nav และ asset override รุ่นเก่าที่ไม่ได้ import แล้ว
- ✅ Home market stylesheet เหลือเฉพาะ Quick Actions, Game Rail, Skeleton และ Wallet surfaces ที่ยังใช้จริง
- ✅ Visual regression ผ่าน 6 viewport พร้อม screenshot, trace, console และ network evidence
- ✅ เพิ่ม production acceptance workflow ที่เก็บ full-page screenshot, audit JSON, console, network, overflow และ broken-image evidence

### Dependency และ CI

- ✅ Upgrade Next.js จาก `15.5.18` เป็น `15.5.21`
- ✅ Upgrade PostCSS override เป็น `8.5.12`
- ✅ Regenerate `pnpm-lock.yaml` และยืนยันด้วย frozen install
- ✅ Production dependency audit ผ่าน ไม่มี advisory ระดับ High/Critical ค้าง
- ✅ ลด CI command ซ้ำโดยคง owner ของ test, typecheck, build และ bundle ชัดเจน
- ✅ Admin finance queue regression test ตรงกับ ownership ใหม่ของ `AdminFinanceQueueFrame`
- ✅ PR #144 ผ่าน Build, Full-System, Security, Admin, Member, Visual และ architecture checks ครบก่อน merge

## Asset ที่มีใน repository แล้ว

- ✅ Header logo WebP
- ✅ Thai language SVG
- ✅ Support headset WebP
- ✅ Reference menu PNG และ manifest

## งานที่เหลือจริง

1. 🧪 Authenticated production smoke และ Home acceptance: ใช้บัญชีจริงตรวจ login/session/redirect, Home route, settings override, feature flags, `show_game_categories`, fallback assets, Promotion, Tournament, Jackpot, Leaderboard และ console/network
2. ⛔ Exact visual comparison กับต้นแบบภายนอกยังทำอัตโนมัติไม่ได้ เพราะ `noah345.shop` ตอบ Cloudflare 403 ต่อ GitHub runner และระบบค้นไฟล์ภาพต้นแบบเก่าตอบผิดพลาด ต้องมี reference screenshot/source capture ที่เปิดอ่านได้อย่างคงที่
3. ⛔ นำเข้า Announcement, Jackpot และ Promotion PNG ต้นฉบับอีก 3 ไฟล์ เมื่อได้รับ binary ที่ checksum คงที่

ไม่มี code, typecheck, test, security, build, public Auth browser regression หรือ Member deployment blocker ที่ทราบอยู่ใน workstream นี้ ณ สถานะปัจจุบัน

## งานที่ปิดและต้องไม่ใส่กลับในรายการค้าง

- ✅ Sync `main` และแก้ PR conflict
- ✅ Merge PR #105, PR #139 และ PR #144
- ✅ ปิด PR #123 ที่ซ้ำกับ PR #105
- ✅ ย้าย Member icon ทุก surface ไป renderer กลาง
- ✅ ปิด category navigation ซ้ำ
- ✅ ปิด promotion normalizer ซ้ำ
- ✅ ปิด Auth runtime/CSS/test ซ้ำ
- ✅ ปิด Home legacy implementation ซ้ำ
- ✅ ปิด Member theme/patch/final CSS ซ้ำ
- ✅ ปิด Admin settings overlap และ ownership audit
- ✅ ปิด Next.js/PostCSS security advisories
- ✅ ปิด Game API lazy-image fallback regression
- ✅ ปิด Login/Register public production visual acceptance บน Mobile/Desktop
- ✅ ปิดปัญหาข้อความอังกฤษปนในหน้า Auth ภาษาไทย
- ✅ ปิดปัญหาชื่อแบรนด์ถูกตัดบน Auth มือถือ
- ✅ ปิด Admin safe-error empty fallback ที่ค้นพบระหว่าง full CI
- ✅ รัน repository-wide CI และยืนยัน Member deployment หลัง merge

## ชุดตรวจที่ผ่านบน PR #144

- ✅ Admin Verification & Bundle
- ✅ P5 Web Unit Tests
- ✅ Member UI Quality
- ✅ Build
- ✅ Quality Gate
- ✅ R-013 Visual Regression
- ✅ Architecture Contracts
- ✅ Member Production Acceptance
- ✅ P5 Security Audit
- ✅ Full-System Automated Tests
- ✅ P1-P4 Repository Verification
- ✅ R005 Shared API Client
- ✅ R012 Frontend Architecture
- ✅ R-006 Quality Baseline
- ✅ R-009 Critical Repository Ports
- ✅ R-009 Withdrawal Completion Closure

## กติกาสำหรับงานต่อ

- ทำงานใหม่ผ่าน branch และ PR ไม่ push feature code ตรง `main`
- ตรวจ worklist และ ownership contract ก่อนสร้าง component, workflow, stylesheet หรือ normalizer ใหม่
- ไม่เปลี่ยน Wallet, Finance, Provider credential, Session, CAPTCHA หรือ Redirect contract โดยไม่แยก scope
- ไม่ hardcode รายการเกม โปรโมชัน หรือ icon ตามตำแหน่ง DOM
- Admin/CMS และ Game API ต้องเป็น source of truth
- หน้าไทยต้องมีเฉพาะภาษาไทย และหน้าอังกฤษต้องมีเฉพาะภาษาอังกฤษ ยกเว้นชื่อแบรนด์หรือคำเฉพาะ
- Member ใช้ visual language เดียวกับต้นแบบ ส่วน Admin ใช้ design system เดิมของ Admin
