# Admin Modernization — Admin & Security Code Audit

อัปเดต: 2026-07-23

ตรวจจากโค้ดบน `main` โดยใช้ `[x]` สำหรับสิ่งที่มี implementation ชัดเจน, `[~]` สำหรับสิ่งที่มีบางส่วน และ `[ ]` สำหรับสิ่งที่ยังไม่พบหลักฐานครบ

## `/admin-accounts`

- [x] แสดง Role, 2FA status และ account status
- [x] แสดง last login
- [x] เปิด security detail ต่อบัญชี พร้อม sessions, login history และ status timeline
- [x] Suspend, lock และ reactivate workflow
- [x] บังคับเหตุผลอย่างน้อย 5 ตัวอักษรก่อนเปลี่ยนสถานะ
- [x] ป้องกันแก้บัญชีตัวเองและ protected account
- [x] ยกเลิก session พร้อมเหตุผลและ audit message
- [~] Detail ใช้ inline expandable panel ไม่ใช่ drawer แยก
- [~] ยังใช้ `window.confirm` และ `window.prompt` ใน action สำคัญ
- [~] บาง error path ยังแสดง backend `message` ตรง ๆ

## `/admin-roles`

- [x] แสดง Permission แยกตาม module
- [x] แสดงจำนวน permission และจำนวนผู้ใช้ต่อ Role
- [x] กรอง Permission ตาม module
- [x] แสดง wildcard และ role level
- [ ] Search
- [ ] Accordion ต่อ module/role
- [ ] Permission preview ก่อนบันทึก
- [ ] Role editor หรือ save workflow

หน้าปัจจุบันเป็น read-only viewer จึงยังไม่ควรติ๊กงานแก้ไขสิทธิ์ว่าเสร็จ

## `/admin-invitations`

- [x] แสดง invitation status และ account status
- [x] แสดงวันหมดอายุ
- [x] Reissue/resend link และ revoke
- [x] Token แสดงเพียงครั้งเดียว พร้อม copy link
- [x] ตรวจ permission `admin.create` ก่อนแสดงฟอร์ม
- [x] Validate ว่าต้องมี email และ role
- [x] ใช้ input `type=email`
- [x] ไม่อนุญาตเชิญ wildcard, owner หรือ super_admin role
- [x] เลือกอายุคำเชิญได้ 1 ชั่วโมงถึง 7 วัน
- [~] สถานะใน UI ใช้ค่าจาก API เช่น ACTIVE/EXPIRED แทนคำ Pending/Used/Expired แบบ normalized เดียวกัน
- [~] Reissue/revoke ยังใช้ `window.confirm`
- [~] บาง backend error message ยังแสดงตรง

## `/audit`

- [x] Server-side pagination 20 รายการต่อหน้า
- [x] Filter search, module, action, admin, target และ date range
- [x] แสดง IP address และ user agent
- [x] Expandable before/after data
- [x] Deep link ไป Topups, Withdrawals, Members, Ledgers, Risk, Access, Anti-bot และ Security
- [x] Read-only mode
- [ ] Export จำกัดสิทธิ์
- [~] ยัง render before/after เป็น JSON โดยไม่มี field-level secret/PII masking ที่พิสูจน์ได้ในหน้านี้
- [~] Error path ยังอ่าน backend `message` ตรง

## `/settings`

- [x] Category index แยกเว็บไซต์, การเงิน, เกม และความปลอดภัย
- [x] ไม่รวม editor 24 หน้าไว้ในหน้าเดียว แต่ใช้ hub links ไปหน้ารายละเอียด
- [x] Search
- [x] Quick links สำหรับหน้าสำคัญ
- [x] Empty state เมื่อค้นหาไม่พบ
- [ ] Unsaved changes warning ระดับ settings editors ทั้งระบบ
- [ ] Save state กลาง เพราะหน้า index เป็น read-only navigation hub

## `/anti-bot`

- [x] Provider status
- [x] รองรับ Turnstile, reCAPTCHA และ hCaptcha
- [x] Site key และ secret configured state
- [x] Route checklist สำหรับ Admin Login, Member Login และ Member Register
- [x] Provider test ก่อนเปิด route
- [x] Adaptive mode และ emergency mode
- [~] มี guided sections แต่ยังไม่ใช่ setup wizard แบบ step-by-step
- [~] ไม่มี Test/Production mode แยกชัดใน UI
- [~] UI ระบุว่าควรเปิดเมื่อ key พร้อม แต่ client ยังไม่ block checkbox `enabled` เมื่อ key ไม่ครบ
- [~] ใช้ custom button styles แทน shared AdminButton ใน test/save actions
- [~] Provider test อาจแสดง provider error codes ตรงให้ผู้ใช้

## `/security`

- [x] Security Center
- [x] 2FA setup ด้วย TOTP secret และ QR code
- [x] เปิดและปิด 2FA
- [x] Recovery codes แสดงครั้งเดียวหลังเปิดใช้งาน
- [x] Regenerate recovery codes โดยบังคับ 2FA/recovery code ปัจจุบัน
- [x] Owner recovery readiness และจำนวน recovery codes ที่เหลือ
- [x] Active sessions
- [x] Revoke ราย session
- [x] Logout other devices และ logout all
- [~] มี session history แต่ยังไม่พบ login history ของบัญชีปัจจุบันในหน้านี้
- [~] Action สำคัญในหน้านี้บังคับรหัส 2FA บาง action แต่ยังไม่พิสูจน์ global step-up contract ครบทั้ง Admin
- [~] หลาย action ยังใช้ `window.confirm`
- [~] async หลายฟังก์ชันใช้ `setLoading(false)` โดยไม่มี `try/finally`
- [~] ข้อความไทย/อังกฤษยังปนกัน
- [~] บาง backend error message ยังแสดงตรง

## ผลต่อ Worklist

ข้อที่มีหลักฐานเพียงพอให้ติ๊กในลิสต์หลัก:

- Admin Accounts: Role/2FA/status, suspend/reactivate, login history
- Admin Roles: Permission ตาม module, จำนวน permission/user
- Admin Invitations: resend/revoke, expiry, email/role validation
- Audit: server pagination, filters, expandable before/after
- Settings: category index, แยก editor ออกจาก hub, search + quick links
- Anti-bot: provider status, route checklist
- Security: Security Center, 2FA status/setup, recovery codes, active sessions

ข้อที่ยังไม่ควรติ๊ก:

- Admin Accounts detail drawer
- Admin Roles search, accordion และ permission preview/save
- Audit export
- Settings unsaved warning และ save-state contract
- Anti-bot wizard, Test/Production mode และ client-side key-completeness gate
- Security login history ในหน้าปัจจุบัน และ global 2FA step-up ครบทุก action สำคัญ
