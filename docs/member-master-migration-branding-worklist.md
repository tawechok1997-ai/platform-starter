# Member Web Migration & Branding Master Worklist

เอกสารนี้เป็นแผนงานหลักสำหรับย้ายหน้าตาและ UX จากเว็บต้นแบบในไฟล์มาเป็นเว็บหลักของ `apps/web-member` โดยคงระบบจริงของ `platform-starter` ไว้ครบ ทั้ง Login, Register, Session, Wallet, Deposit, Withdraw, Transactions, Games API, Promotions, Profile, Notifications และ Support

> หลักการสำคัญ: ห้ามฝังชื่อเว็บ สี โลโก้ ไอคอน ฟอนต์ หรือข้อความแบรนด์ไว้ตายตัวใน component ทุกหน้าต้องอ่านค่าจาก Brand Config กลาง

---

## 1. เป้าหมายหลัก

- [ ] ใช้หน้าตาและประสบการณ์ใช้งานจากเว็บต้นแบบเป็น UI หลักของ Member
- [ ] คงระบบจริงเดิมไว้ครบ ไม่ใช้ mock flow จาก Static
- [ ] รองรับ Desktop, Tablet และ Mobile
- [ ] รองรับ Preview, Draft, Publish, Version history, Rollback และ Audit log
- [ ] รองรับการเปลี่ยนแบรนด์จาก Admin โดยไม่ต้องแก้โค้ด
- [ ] เตรียมโครงสร้าง Multi-brand / White-label ตาม Domain

---

## 2. Phase 0: สำรอง ตรวจโครงสร้าง และกำหนดขอบเขต

- [ ] สำรองหน้า Member ปัจจุบัน
- [ ] สร้าง branch สำหรับงาน redesign
- [ ] เก็บ screenshot หน้าเดิมทุก breakpoint
- [ ] ตรวจ route เดิมที่ห้ามพัง
- [ ] แยก UI ที่จะยกมาจากไฟล์ต้นแบบออกจาก mock data และ hash router
- [ ] ระบุ component เดิมที่ต้องเก็บ
- [ ] ระบุ API contract ที่ต้องรักษา
- [ ] จัดทำรายการความเสี่ยงและแผน rollback

### Route สำคัญ

```text
/
/login
/register
/forgot-password
/reset-password
/verify-otp
/verify-email
/games
/promotions
/deposit
/withdraw
/transactions
/profile
/notifications
/support
```

---

## 3. Phase 1: Brand Config, Theme และ White-label

### 3.1 Brand Config Schema

- [ ] ออกแบบ `BrandConfig` กลาง
- [ ] รองรับชื่อแบรนด์ โดเมน โลโก้ สี ฟอนต์ ไอคอน Layout, CMS และ Feature flags
- [ ] รองรับ Default brand fallback
- [ ] รองรับหลายแบรนด์ในฐานข้อมูล
- [ ] แยก Brand ID ชัดเจน
- [ ] แยก CMS, Promotions, Provider visibility, Feature flags, SEO และ Support contact ต่อแบรนด์
- [ ] ทำ cache ตาม Domain/Brand
- [ ] ทำ cache invalidation หลัง Publish

### 3.2 ข้อมูลแบรนด์

- [ ] ชื่อเว็บไซต์
- [ ] ชื่อย่อเว็บไซต์
- [ ] คำอธิบายแบรนด์
- [ ] ชื่อบริษัท
- [ ] ข้อมูลลิขสิทธิ์ Footer
- [ ] Domain หลัก
- [ ] Support URL และช่องทางติดต่อ
- [ ] Social links
- [ ] ข้อความ Maintenance
- [ ] ข้อความ Login/Register
- [ ] รองรับหลายภาษา

### 3.3 โลโก้และ Asset แบรนด์

- [ ] โลโก้หลัก
- [ ] โลโก้แนวนอน
- [ ] โลโก้สี่เหลี่ยม
- [ ] โลโก้พื้นมืด/สว่าง
- [ ] โลโก้ Mobile
- [ ] โลโก้ Login
- [ ] โลโก้ Register
- [ ] Favicon
- [ ] Apple Touch Icon
- [ ] PWA Icon
- [ ] Open Graph image
- [ ] Default share image
- [ ] Default avatar
- [ ] Game placeholder
- [ ] Promotion placeholder
- [ ] รองรับ SVG, PNG และ WebP
- [ ] ตรวจชนิดและขนาดไฟล์
- [ ] บีบอัดรูปอัตโนมัติ
- [ ] Preview ก่อนบันทึก
- [ ] เก็บ Asset version เดิมเพื่อ Rollback

### 3.4 สี ธีม และ Typography

- [ ] Primary color
- [ ] Secondary color
- [ ] Accent color
- [ ] Background color
- [ ] Surface/Card color
- [ ] Text/Muted text color
- [ ] Border color
- [ ] Success/Warning/Danger/Info colors
- [ ] Button primary/hover colors
- [ ] Active navigation color
- [ ] Slider dot color
- [ ] Gradient, Shadow และ Overlay colors
- [ ] รองรับ Dark, Light และ Custom theme
- [ ] ตั้ง Card radius, Shadow, Blur และ Content width
- [ ] ตั้ง Animation level
- [ ] เลือกฟอนต์ไทย อังกฤษ และตัวเลข
- [ ] ตั้ง Font weight, Size, Line height และ Letter spacing
- [ ] ใช้ tabular numbers สำหรับยอดเงิน เวลา เปอร์เซ็นต์ และสถิติ
- [ ] ตรวจ Contrast อัตโนมัติ
- [ ] มี Reset เป็นค่าเริ่มต้น

### 3.5 ระบบไอคอน

#### เมนู

- [ ] Home
- [ ] Games
- [ ] Promotions
- [ ] Deposit
- [ ] Withdraw
- [ ] Transactions
- [ ] Bonus
- [ ] Mission
- [ ] Reward
- [ ] Affiliate
- [ ] Profile
- [ ] Security
- [ ] Notifications
- [ ] Support
- [ ] Logout

#### หมวดเกม

- [ ] Casino
- [ ] Slot
- [ ] Fishing
- [ ] Sport
- [ ] Card
- [ ] Lottery
- [ ] Live
- [ ] Arcade
- [ ] Favorite
- [ ] New
- [ ] Popular

#### ไอคอนระบบ

- [ ] Search
- [ ] Close
- [ ] Back/Forward
- [ ] Menu
- [ ] Language
- [ ] Wallet
- [ ] Refresh
- [ ] Show/Hide password
- [ ] Check/Error/Warning
- [ ] Upload/Download/Copy
- [ ] Calendar/Time

#### ความสามารถของระบบไอคอน

- [ ] รองรับ SVG, PNG และ WebP
- [ ] ใช้ Icon library fallback
- [ ] เปลี่ยนสี SVG ตามธีม
- [ ] ตั้งขนาดไอคอน
- [ ] Preview และ Reset
- [ ] Sanitize SVG
- [ ] ป้องกัน Script ใน SVG
- [ ] ใช้ไอคอนชุดเดียวกันทั้ง Desktop และ Mobile
- [ ] มี Asset mapping กลาง

### 3.6 Admin Branding Settings

สร้างหน้า:

```text
/admin/settings/branding
```

แบ่ง Tab:

```text
General
Logo & Assets
Colors
Typography
Icons
Header
Footer
Home
Login
Register
Mobile
SEO
Advanced
```

งานที่ต้องทำ:

- [ ] Live preview
- [ ] Preview Desktop/Tablet/Mobile
- [ ] Save draft
- [ ] Publish
- [ ] Reset section
- [ ] Reset all
- [ ] Version history
- [ ] Rollback
- [ ] Audit log
- [ ] แสดงผู้แก้ล่าสุดและเวลาแก้
- [ ] แยกสิทธิ์ Edit กับ Publish
- [ ] ป้องกัน concurrent edit ทับกัน
- [ ] รองรับ Brand preset
- [ ] Duplicate/Rename/Activate preset
- [ ] Export/Import preset
- [ ] Preview ก่อน Activate

---

## 4. Phase 2: จัดระเบียบ Asset จากไฟล์ต้นแบบ

- [ ] ย้ายโลโก้ Header และ Navigation
- [ ] ย้าย Hero promotions
- [ ] ย้าย Promotions, Activities และ News assets
- [ ] ย้าย Tournament, Jackpot และ Leaderboard assets
- [ ] ย้าย Provider logo และ Game icon
- [ ] ย้าย Footer และ Mobile assets
- [ ] จัดโครงสร้าง `public/assets/<brand-code>/`
- [ ] เปลี่ยนชื่อไฟล์มั่วเป็นชื่อมาตรฐาน
- [ ] สร้าง Asset manifest
- [ ] ตรวจไฟล์ซ้ำด้วย hash
- [ ] ลบสำเนาที่เกิน
- [ ] ตรวจไฟล์ 0 byte และรูปเสีย
- [ ] ตรวจ path ที่ขาด
- [ ] บีบอัดรูปใหญ่เป็น WebP/AVIF
- [ ] สร้าง thumbnail
- [ ] Preload เฉพาะภาพสำคัญ
- [ ] Lazy load ภาพด้านล่าง

โครงสร้างแนะนำ:

```text
apps/web-member/public/assets/<brand-code>/
├── brand/
├── header/
├── navigation/
├── promotions/
├── tournament/
├── jackpot/
├── leaderboard/
├── providers/
├── games/
├── footer/
└── mobile/
```

---

## 5. Phase 3: Login, Register และ Auth Flow

### 5.1 Auth Layout กลาง

- [ ] สร้าง Auth layout ที่ใช้ Brand Config เดียวกับ Member
- [ ] รองรับโลโก้ พื้นหลัง Gradient/รูป และ Brand panel
- [ ] ปรับข้อความต้อนรับ คำอธิบาย สี Form สีปุ่ม และ Footer ได้
- [ ] แยก component ใช้ร่วมกัน
- [ ] ทำ Desktop และ Mobile layout

Component แนะนำ:

```text
apps/web-member/app/components/auth/
├── auth-shell.tsx
├── auth-brand-panel.tsx
├── auth-form-field.tsx
├── password-field.tsx
├── login-form.tsx
├── register-form.tsx
└── auth-error-message.tsx
```

### 5.2 Login

- [ ] Username/Phone/Email ตาม API จริง
- [ ] Password field
- [ ] Show/Hide password
- [ ] Remember me หากระบบรองรับ
- [ ] Forgot password
- [ ] ลิงก์ Register
- [ ] เชื่อม Login API จริง
- [ ] เชื่อม Session/Cookie จริง
- [ ] รองรับ `next` query
- [ ] Loading/Disabled/Error state
- [ ] ป้องกันกดซ้ำ
- [ ] Rate limit และ Anti-bot
- [ ] รองรับ Autofill และ Password manager
- [ ] ตรวจบัญชีถูกระงับ
- [ ] ตรวจรหัสผ่านผิด
- [ ] ตรวจ Session หมดอายุ
- [ ] ป้องกัน Open redirect
- [ ] ห้ามเก็บรหัสผ่านใน Local Storage

### 5.3 Register

- [ ] Username
- [ ] Phone
- [ ] Email
- [ ] Password
- [ ] Confirm Password
- [ ] Referral code ตามการตั้งค่า
- [ ] Terms/Privacy checkbox
- [ ] Consent log
- [ ] Validation เบอร์ไทย
- [ ] Validation Email
- [ ] Password strength
- [ ] Password match
- [ ] ตรวจ Username/Phone/Email ซ้ำ
- [ ] เชื่อม Register API จริง
- [ ] รองรับ OTP และ Verify email
- [ ] Anti-bot
- [ ] Loading/Error/Success state
- [ ] Redirect หลังสมัคร
- [ ] Auto login หรือส่งต่อ KYC ตาม flow จริง

### 5.4 Auth Flow ทั้งระบบ

- [ ] ปุ่ม Login/Register หายเมื่อมี Session
- [ ] แสดงชื่อสมาชิกและยอดเงินแทน
- [ ] Logout กลับ Guest state
- [ ] Protected route redirect ถูกต้อง
- [ ] Guest route redirect ถูกต้อง
- [ ] Refresh หน้าแล้ว Session ยังอยู่
- [ ] หลายแท็บ Sync Session
- [ ] ตรวจ Cookie security
- [ ] ตรวจ CSRF/XSS
- [ ] ตรวจ Session management
- [ ] เก็บ Audit log
- [ ] ทำ Forgot/Reset password ให้เข้าธีม
- [ ] ทำ Verify OTP/Email ให้เข้าธีม

---

## 6. Phase 4: Layout หลักของ Member

- [ ] สร้าง `MemberSiteHeader`
- [ ] สร้าง `MemberDesktopNav`
- [ ] สร้าง `MemberMobileHeader`
- [ ] สร้าง `MemberBottomNav`
- [ ] สร้าง `MemberFooter`
- [ ] สร้าง `MemberShell`
- [ ] เชื่อมโลโก้ ภาษา ค้นหา และภารกิจ
- [ ] เชื่อม Login/Register
- [ ] เชื่อมชื่อสมาชิกและยอดเงิน
- [ ] ทำ Refresh balance
- [ ] เชื่อมเมนูกับ Next.js route จริง
- [ ] ทำ Active state ตาม route
- [ ] รองรับ Feature flags
- [ ] รองรับ Branding settings
- [ ] ตรวจ Sticky header
- [ ] ตรวจ z-index ระหว่าง Header, Modal และ Slider

---

## 7. Phase 5: หน้า Home จากไฟล์ต้นแบบ

### 7.1 Hero Promotion Slider

- [ ] แปลง Slider เป็น React component
- [ ] ไม่ใช้ DOM script จาก Static
- [ ] แสดงภาพกลางและภาพข้าง
- [ ] Infinite loop
- [ ] Auto slide
- [ ] Mouse drag
- [ ] Touch swipe
- [ ] Pagination dots
- [ ] กด dot เปลี่ยนสไลด์ได้
- [ ] Pause เมื่อ Hover/Focus
- [ ] รองรับ `prefers-reduced-motion`
- [ ] หยุด Timer เมื่อซ่อนแท็บ
- [ ] ป้องกัน Timer ซ้อน
- [ ] ป้องกัน index หลุด
- [ ] ป้องกันทุกภาพมืดพร้อมกัน
- [ ] จัดตำแหน่งใหม่เมื่อ Resize
- [ ] ทดสอบเปิดทิ้งไว้นาน
- [ ] เชื่อม Banner จาก CMS/Admin
- [ ] ใช้ fallback asset เมื่อไม่มีข้อมูล
- [ ] ตั้งลำดับ ลิงก์ เวลา Auto slide dots drag และ side dim จาก Admin

### 7.2 แถบประกาศ

- [ ] แถบประกาศใต้ Slider
- [ ] ไอคอนประกาศ
- [ ] ข้อความเลื่อน
- [ ] หยุดเมื่อ Hover
- [ ] รองรับหลายประกาศ
- [ ] ดึงข้อมูลจาก CMS
- [ ] ซ่อนเมื่อไม่มีข้อมูล
- [ ] ตรวจ Mobile ไม่ให้ล้น

### 7.3 การ์ดโปรโมชั่น 3 ใบ

- [ ] โปรโมชั่นพิเศษ
- [ ] กิจกรรม
- [ ] ข่าวสาร
- [ ] ใช้รูปจากไฟล์ต้นแบบ
- [ ] Hover animation
- [ ] เชื่อม route จริง
- [ ] รองรับ CMS และ Feature flag
- [ ] Skeleton/Empty state
- [ ] Responsive Desktop/Mobile

### 7.4 Jackpot, Leaderboard และ Tournament

- [ ] Jackpot card
- [ ] ดึงยอด Jackpot จาก API
- [ ] Animation ตัวเลข
- [ ] API fallback
- [ ] Leaderboard อันดับ 1-10
- [ ] ปิดบังข้อมูลสมาชิก
- [ ] Tournament banner
- [ ] Tournament status
- [ ] Countdown
- [ ] Tournament leaderboard
- [ ] ปุ่มดูทั้งหมด
- [ ] Loading/Empty/Error state
- [ ] เปิด/ปิดและจัดลำดับ section จาก Admin

---

## 8. Phase 6: Game Lobby

- [ ] เปลี่ยน Game Lobby ให้ใช้ธีมจากไฟล์ต้นแบบ
- [ ] คง Search เดิม
- [ ] คง Category filter เดิม
- [ ] คง Provider filter เดิม
- [ ] คง Platform filter เดิม
- [ ] คง Favorite เดิม
- [ ] คง Load more เดิม
- [ ] คง Launch game เดิม
- [ ] แสดง Casino/Slot/Fishing/Sport/Card/Lottery/Live/Arcade
- [ ] ใช้ Provider logo และ Game icon จาก Asset/Brand Config
- [ ] ทำ Hover card
- [ ] ทำ Skeleton/Error/Empty state
- [ ] ทำภาพ fallback
- [ ] รองรับ Mobile/PC
- [ ] ตรวจ Launch session จริง

---

## 9. Phase 7: ระบบสมาชิกและการเงิน

- [ ] เชื่อม Header กับ Session จริง
- [ ] เชื่อม Wallet balance จริง
- [ ] ปรับ Deposit ให้เข้าธีม
- [ ] ปรับ Withdraw ให้เข้าธีม
- [ ] ปรับ Transactions ให้เข้าธีม
- [ ] รักษา Validation/API เดิม
- [ ] รองรับ Pending/Success/Failed/Reversed
- [ ] แสดงหลักฐานการโอน
- [ ] ตรวจยอดหลังทำรายการ
- [ ] ห้ามใช้ Form หรือข้อมูลจำลองจาก Static
- [ ] ปรับ Profile
- [ ] ปรับ Security
- [ ] ปรับ KYC
- [ ] ปรับ Notifications
- [ ] ปรับ Support/FAQ
- [ ] ปรับ Affiliate/Bonus/Mission/Reward

---

## 10. Phase 8: Promotions

- [ ] Promotion list
- [ ] Promotion detail
- [ ] เงื่อนไขโปรโมชั่น
- [ ] วันเริ่ม/สิ้นสุด
- [ ] สถานะโปรโมชั่น
- [ ] ปุ่มรับโปรโมชั่น
- [ ] เชื่อม Promotion API
- [ ] ตรวจสิทธิ์สมาชิก
- [ ] ตรวจเงื่อนไข Wallet
- [ ] Loading/Empty/Expired state
- [ ] แยกโปรโมชั่นตามแบรนด์

---

## 11. Phase 9: CSS Architecture และ Performance

- [ ] ไม่ยก CSS หลายสิบไฟล์เข้ามาทั้งก้อน
- [ ] สร้าง Design tokens กลาง
- [ ] สร้าง Typography tokens กลาง
- [ ] สร้าง Breakpoints กลาง
- [ ] ลด `!important`
- [ ] ลด selector ซ้อน
- [ ] ป้องกัน Global CSS ทับ Form/Admin
- [ ] แยก scope ชัดเจน
- [ ] บีบอัด Hero
- [ ] Preload รูปแรก
- [ ] Prefetch รูปถัดไป
- [ ] Lazy load รูปเกม
- [ ] ลด re-render ไม่จำเป็น
- [ ] ตรวจ Memory leak ของ Timer/Event listener
- [ ] ตรวจ LCP, CLS และ INP
- [ ] ทดสอบเน็ตมือถือช้า

---

## 12. Phase 10: Accessibility และ Security

- [ ] Semantic HTML
- [ ] ใช้ปุ่มจริงแทน div
- [ ] เพิ่ม `aria-label`
- [ ] Keyboard navigation
- [ ] Focus state
- [ ] Modal focus trap
- [ ] ตรวจ Contrast
- [ ] Alt text
- [ ] Screen reader
- [ ] Zoom 200%
- [ ] พื้นที่กดอย่างน้อย 44px
- [ ] จำกัดชนิด/ขนาดไฟล์อัปโหลด
- [ ] Sanitize SVG
- [ ] ป้องกัน Path traversal
- [ ] ป้องกัน CSS injection
- [ ] ป้องกัน JavaScript URL
- [ ] ป้องกัน External asset URL ที่ไม่อนุญาต
- [ ] Audit log ทุกการ Publish
- [ ] แยกสิทธิ์ Edit/Publish

---

## 13. Phase 11: การทดสอบ

### Build

- [ ] `pnpm --filter @platform/web-member lint`
- [ ] `pnpm --filter @platform/web-member typecheck`
- [ ] `pnpm --filter @platform/web-member test`
- [ ] `pnpm --filter @platform/web-member build`

### Functional

- [ ] Login
- [ ] Register
- [ ] Logout
- [ ] Forgot password
- [ ] OTP/Email verification
- [ ] Session refresh
- [ ] Wallet balance
- [ ] Deposit
- [ ] Withdraw
- [ ] Transactions
- [ ] Game search
- [ ] Game filters
- [ ] Favorite games
- [ ] Load more
- [ ] Game launch
- [ ] Promotions
- [ ] Profile
- [ ] Notifications
- [ ] Support
- [ ] Feature flags
- [ ] Branding Preview/Draft/Publish/Rollback
- [ ] Multi-brand domain resolution

### Slider Soak Test

- [ ] เปิดทิ้งไว้ 15 นาที
- [ ] เปิดทิ้งไว้ 1 ชั่วโมง
- [ ] เปิดทิ้งไว้หลายชั่วโมง
- [ ] สลับแท็บ
- [ ] ย่อหน้าต่าง
- [ ] Resize
- [ ] Suspend/Resume เครื่อง
- [ ] ตรวจว่าไม่มืดค้าง
- [ ] ตรวจว่า Timer ไม่ซ้อน
- [ ] ตรวจว่า Active slide ไม่หาย
- [ ] ตรวจว่า index ไม่หลุด

### Responsive

- [ ] 320px
- [ ] 375px
- [ ] 390px
- [ ] 430px
- [ ] 768px
- [ ] 1024px
- [ ] 1280px
- [ ] 1440px
- [ ] 1920px

---

## 14. Phase 12: Deploy และ Rollback

- [ ] Deploy Preview ก่อน Merge
- [ ] ตรวจ Environment variables
- [ ] ตรวจ API URL
- [ ] ตรวจ Asset path
- [ ] ตรวจ Cache headers
- [ ] ตรวจ Login/Register หลัง Deploy
- [ ] ตรวจ Wallet และ Games API จริง
- [ ] ตรวจ Browser console
- [ ] ตรวจ Network errors
- [ ] ตรวจ Railway logs
- [ ] เตรียม rollback commit
- [ ] เตรียม rollback brand version
- [ ] Merge เข้า `main` หลังผ่าน Checklist ทั้งหมด

---

## 15. ลำดับดำเนินงานแนะนำ

1. สำรองและตรวจโครงสร้าง
2. ออกแบบ BrandConfig และ Design tokens
3. จัด Asset, Logo และ Icons
4. สร้าง Admin Branding Settings
5. ทำ Auth Layout, Login และ Register
6. ทำ Header, Navigation และ Footer
7. ย้าย Home และ Hero Slider
8. ทำ Promotions, Activities, Tournament, Jackpot และ Leaderboard
9. ปรับ Game Lobby
10. เชื่อม Session, Wallet และ API จริง
11. ปรับหน้าการเงินและหน้า Member ที่เหลือ
12. ทำ Brand preset และ Multi-brand
13. Cleanup, Performance, Accessibility และ Security
14. Test, Preview, Deploy และ Rollback

---

## 16. Definition of Done

- [ ] Home, Login, Register และทุกหน้า Member ใช้ Brand Config ชุดเดียวกัน
- [ ] เปลี่ยนชื่อ โลโก้ สี ฟอนต์ ไอคอน และข้อความจาก Admin ได้โดยไม่แก้โค้ด
- [ ] ทุกปุ่มเชื่อม route/API จริง
- [ ] ไม่มี mock flow จาก Static
- [ ] Slider เสถียรเมื่อเปิดทิ้งไว้นาน
- [ ] ไม่เกิดอาการมืดค้าง
- [ ] Build, Typecheck, Test และ Responsive audit ผ่าน
- [ ] มี Preview, Publish, Version history, Rollback และ Audit log
- [ ] เพิ่มแบรนด์ใหม่ตาม Domain ได้โดยไม่ต้องคัดลอกโปรเจกต์ทั้งชุด
