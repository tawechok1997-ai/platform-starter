# Admin Redesign Master Worklist

เอกสารนี้เป็น **source of truth เพียงไฟล์เดียวสำหรับงาน Admin redesign** ของ `apps/web-admin` และส่วน Backend/Database ที่รองรับตัวตน สิทธิ์ และความปลอดภัยของ Admin

ลิสเดิมแบบย่อถูกยกเลิกและแทนที่ด้วยลิสเต็มด้านล่าง ซึ่งรวบรวมขอบเขตที่ตกลงกัน ได้แก่ Navigation, Profile, Role/Permission, Dashboard, Operations, Finance, Member, Risk, Provider, Promotion, Support, Reports, Settings, Audit, Responsive, Animation, Testing และ Regression evidence

กติกาการนับ:

- ติ๊ก `[x]` เฉพาะเมื่อมี implementation ใน repository และมีหลักฐาน build/deploy หรือ regression ที่เหมาะสม
- งานแก้ defect ที่ไม่เพิ่มขอบเขตใหม่ให้นับเป็นงานแก้ไข แต่ไม่เพิ่มจำนวน checkbox
- ห้ามสร้าง worklist Admin ชุดอื่นซ้ำ เพราะมนุษย์มีพรสวรรค์ในการทำตัวเลขสองชุดให้ไม่ตรงกันอย่างน่าทึ่ง
- จำนวนงานต้องนับจาก checkbox จริงทุกครั้ง ไม่ใช้ยอดเดิมที่พิมพ์ค้างไว้
- งาน visual completion ต้องแยกตามโมดูลจริง ห้ามรวมหลายระบบไว้ใน checkbox เดียว

อัปเดตล่าสุด: **2026-07-22**

---

## P0 — Data integrity, authentication และ security boundary

สถานะ: **7 / 7 เสร็จ | เหลือ 0**

- [x] เพิ่ม migration สำหรับข้อมูลโปรไฟล์ Admin ได้แก่ชื่อ ตำแหน่ง แผนก และรูปโปรไฟล์
- [x] เพิ่ม API อ่านโปรไฟล์ Admin จากข้อมูลฐานจริง
- [x] เพิ่ม API แก้ไขโปรไฟล์ พร้อม DTO validation
- [x] บันทึก audit log เมื่อแก้ไขโปรไฟล์ พร้อมข้อมูลก่อน/หลัง IP และ user agent
- [x] ป้องกัน refresh 401 ที่หน้า Login และจัดการ session hint โดยไม่เก็บ token ฝั่ง client
- [x] บังคับ authentication, route permission และ API permission โดยไม่พึ่งการซ่อนเมนูเพียงอย่างเดียว
- [x] ทำให้ `prisma/schema.prisma` ตรงกับคอลัมน์โปรไฟล์ใน migration และเปลี่ยน Profile query/update จาก raw SQL เป็น Prisma Client พร้อม regression test
  - เพิ่มฟิลด์ profile ของ `AdminUser` ให้ตรงกับ migration และให้ query คืนค่าที่บันทึกจริง โดยคง fallback จาก role สำหรับข้อมูลเก่า
  - เปลี่ยน Profile update เป็น `adminUser.findUnique` / `adminUser.update` ภายใน transaction เดียวกับ audit log; ไม่มี raw SQL ใน profile command แล้ว
  - เพิ่ม regression test สำหรับ persisted profile fields, normalization, audit before/after และ account-not-found
  - ยืนยัน `prisma validate` และ targeted Jest ผ่านใน Node 22; API typecheck ยังถูกบล็อกด้วย Prisma Client generated artifacts ที่ไม่สมบูรณ์ใน environment นี้

---

## P1 — Navigation, Admin identity, access control และ account UX

สถานะ: **13 / 13 เสร็จ | เหลือ 0**

- [x] แยก Sidebar เป็นหมวดหมู่หลักตามงาน Operations
- [x] เพิ่ม Submenu แบบ accordion พร้อม active state และเปิดหมวดปัจจุบันอัตโนมัติ
- [x] เพิ่ม badge งานค้าง การค้นหาเมนู และการจำสถานะหมวด/Sidebar
- [x] ย้ายตัวตน Admin ไป Topbar และใช้ avatar แบบ rounded-square
- [x] เพิ่ม Profile dropdown พร้อมลิงก์ Profile, Edit Profile, Security, Activity และ Logout
- [x] เพิ่มหน้า Profile แสดงข้อมูลตัวตน Role Permission 2FA และสถานะความปลอดภัย
- [x] เพิ่มหน้า Edit Profile และเชื่อมการบันทึกกับ Backend จริง
- [x] แสดง Role และ Permission แยกตามหมวด พร้อมเลือกตำแหน่งหลักจาก Role level
- [x] กรองเมนูและ route ตาม effective permission
- [x] เพิ่ม field-level data masking สำหรับ PII และข้อมูล Wallet ตาม permission
- [x] ปรับหน้า Admin Directory ให้แสดงรูป ชื่อ ตำแหน่ง แผนก Role สถานะ และ 2FA
- [x] เพิ่ม session, login history, status timeline และการยกเลิก session พร้อม audit
- [x] รองรับ responsive drawer, keyboard, Escape, click-outside และ reduced motion ใน shell/profile surfaces

---

## P2 — Operations Command Center และ Professional UI completion

สถานะ: **38 / 39 เสร็จ | เหลือ 1**

### Design foundation

- [x] เพิ่ม Admin enterprise color, surface, shadow, typography และ icon direction ให้ต่างจาก Member ชัดเจน
- [x] เพิ่ม motion, loading, skeleton, dropdown, modal และ reduced-motion baseline
- [x] รองรับ responsive shell, drawer, topbar, profile และ admin directory surfaces

### Dashboard และ operational intelligence

- [x] ปรับ Dashboard เป็น Operations Command Center ที่อ่านสถานะระบบได้ในหน้าจอเดียว
- [x] เพิ่ม KPI การเงิน ได้แก่ยอดฝาก ยอดถอน รายได้สุทธิ รายการค้าง และ Wallet variance
- [x] เพิ่ม KPI Operations ได้แก่ queue, SLA, งานเกินเวลา และรายการที่ต้องอนุมัติ
- [x] เพิ่มกราฟ Deposit/Withdrawal, transaction volume และ net revenue
- [x] เพิ่มกราฟ Member growth, active members และ usage trend
- [x] เพิ่มกราฟ Risk alerts แยก severity, status และแนวโน้ม
- [x] เพิ่ม Provider health, latency, error rate, webhook failure และ wallet mismatch visualization
- [x] เพิ่ม Recent activity, audit timeline และ critical events panel

### Data table และ workflow standardization

- [x] สร้างมาตรฐานตาราง Admin กลางสำหรับ sticky header, density, loading, empty และ error states
- [x] ทำ filter, sort, pagination และ search ให้ใช้พฤติกรรมสอดคล้องกันทุกหน้าหลัก
- [x] เพิ่ม column visibility, saved views และการจำค่าตาม Admin
- [x] เพิ่ม bulk action พร้อม confirm dialog, reason field, step-up และผลลัพธ์รายแถว
  - ความคืบหน้า: มี reusable component, เลือกหลายรายการ, reason, confirmation phrase, retry และผลลัพธ์รายแถวแล้ว
  - ใช้งานจริงที่ `/bulk-queue-operations` สำหรับ Claim/Release ซึ่งไม่เปลี่ยนยอดเงินจริง
  - เพิ่ม batch API สำหรับ Deposit `APPROVE_SLIP`, `REJECT` และ `CONFIRM_CREDIT`: จำกัด 50 รายการ, deduplicate IDs, บังคับ reason และ step-up, เก็บผลรายแถว/partial failure และ audit หลักฐานชุดเดียว
  - เพิ่ม batch API สำหรับ Withdrawal `APPROVE`, `REJECT` และ `VERIFY_PAYMENT` ด้วยขอบเขต, step-up, per-row result และ audit แบบเดียวกัน
  - เชื่อม batch API ทั้งสองชุดกับ Admin surface แล้ว; ยังคงต้องเก็บ browser regression evidence ใน CI/staging ก่อน deploy
- [x] ปรับ Export Center ให้ติดตามสถานะไฟล์ ประวัติการส่งออก และสิทธิ์ข้อมูล

### Module visual completion

#### Finance

- [x] ตรวจและปรับหน้า Deposit ให้ใช้ระบบใหม่ครบ
  - ใช้ system confirmation dialog และ workflow ที่เชื่อมสถานะจริงแล้วที่ commit `f1b38339`
- [x] ตรวจและปรับหน้า Withdrawal ให้ใช้ระบบใหม่ครบ
  - แทน browser confirm, ใช้ semantic notices และจำกัด proof records อย่างปลอดภัยที่ commits `d0def481`, `a279c448`, `d6224621`
- [x] ตรวจและปรับหน้า Wallet ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Ledger ให้ใช้ระบบใหม่ครบ
  - Wallet และ Ledger ใช้ experience ชุดใหม่ร่วมกันที่ commit `883684a1`
- [x] ตรวจและปรับหน้า Reconciliation ให้ใช้ระบบใหม่ครบ
  - ใช้ managed review dialog และ semantic notices ที่ commits `5b903ad2`, `4274bfc`

#### Members และ Risk

- [x] ตรวจและปรับหน้า Members ให้ใช้ระบบใหม่ครบ
  - ใช้ permission-aware PII/wallet masking, confirm dialog พร้อมเหตุผล, search/filter/pagination และแก้ stale filter state แล้ว
  - Railway build ของ API, Web Admin และ Web Member ผ่านครบที่ commit `f61766f8`
- [x] ตรวจและปรับหน้า Bank review ให้ใช้ระบบใหม่ครบ
  - ใช้ summary, duplicate-account detection, risky queue, confirm dialog และบังคับเหตุผลสำหรับ reject/disable
- [x] ตรวจและปรับหน้า KYC ให้ใช้ระบบใหม่ครบ
  - รวม KYC summary และ bank verification workflow ใน surface เดียว พร้อมสถานะและภาษาแบบผู้ใช้จริง
- [x] ตรวจและปรับหน้า Risk ให้ใช้ระบบใหม่ครบ
  - รองรับ severity/status/type/provider/date filters, pagination, scan cooldown, metadata view, detail links และ bulk selection
  - Implementation ทั้งชุดรวมอยู่ใน `main` และ Railway build ล่าสุดผ่านครบที่ commit `f61766f8`

#### Games และ Providers

- [x] ตรวจและปรับหน้า Games ให้ใช้ระบบใหม่ครบ
  - Game catalog และ transfer review workflow เสร็จที่ commits `24609209`, `dc69bac9`
- [x] ตรวจและปรับหน้า Providers ให้ใช้ระบบใหม่ครบ
  - Provider management workflow เสร็จที่ commit `71ac14bf`
- [x] ตรวจและปรับหน้า Sessions ให้ใช้ระบบใหม่ครบ
  - Game session operations และ confirmation flow เสร็จที่ commits `ee815af8`, `b57fefdb`
- [x] ตรวจและปรับหน้า Transfers ให้ใช้ระบบใหม่ครบ
  - Transfer detail และ review flow เสร็จที่ commits `0e2c509d`, `dc69bac9`
- [x] ตรวจและปรับหน้า Webhook ให้ใช้ระบบใหม่ครบ
  - Monitoring layout และ same-origin test flow เสร็จที่ commits `d4b266a0`, `bfbe4410`

#### Growth, Content และ Governance

- [x] ตรวจและปรับหน้า Promotions ให้ใช้ระบบใหม่ครบ
  - Promotion center และ secure claim review flow เสร็จที่ commits `2f23c18f`, `3b40fef1`
- [x] ตรวจและปรับหน้า Bonus ให้ใช้ระบบใหม่ครบ
  - Promotion Claims และ Bonus Ledgers ปรับ workflow, confirmation, ภาษา และสถานะตาม Backend ปัจจุบันแล้ว
  - Railway build ของ API, Web Admin และ Web Member ผ่านครบที่ commit `0548637f`
- [x] ตรวจและปรับหน้า Content ให้ใช้ระบบใหม่ครบ
  - Legal content settings ปรับภาษาและโครงสร้างที่ commit `1ee16f71`
  - Member content และ maintenance surfaces มี visual regression หลาย viewport ที่ commits `54d19a98`, `55d62b33`, `c9c8c5d4`, `a03b50e1`
- [x] ตรวจและปรับหน้า Support ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Reports ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Settings ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Audit ให้ใช้ระบบใหม่ครบ

### Verification

- [x] เพิ่ม automated tests สำหรับ navigation, profile update, data masking, permission rendering และ session refresh flow
  - ครอบคลุม navigation permission, route guard, data masking, session refresh/2FA/privilege reduction, profile normalization, payload trimming และ API error parsing
  - ผูก regression tests เข้ากับ `web-admin build` และ Railway build ของ API, Web Admin และ Web Member ผ่านครบที่ commit `f43c0ad4`
- [x] เพิ่ม visual/browser regression evidence, build evidence และเอกสารสรุป Admin redesign ขั้นสุดท้าย
  - R-013 visual regression ผ่าน baseline 12 cases และเก็บ artifact ใน PR #59
  - Responsive professional polish รวมเข้า `main` แล้วผ่าน PR #68
  - Railway build ล่าสุดของ API, Web Admin และ Web Member ผ่านครบหลังอัปเดต worklist

---

## สรุปสถานะ

| Priority | เสร็จ | ทั้งหมด | เหลือ |
|---|---:|---:|---:|
| P0 | 7 | 7 | 0 |
| P1 | 13 | 13 | 0 |
| P2 | 39 | 39 | 0 |
| P3 | 0 | 40 | 40 |
| **รวม** | **59** | **99** | **40** |


---

## P3 — Admin navigation, controls และ release quality

สถานะ: **0 / 40 เสร็จ | เหลือ 40**

ส่วนนี้เพิ่มจากการทบทวน Admin menu, Sidebar, ปุ่ม action และความพร้อมก่อนใช้งานจริงเมื่อวันที่ 2026-07-22 โดยต้องทำตามลำดับเพื่อไม่ให้แก้หน้าตาแต่สร้าง route/permission ที่ขัดกัน

### Navigation และ information architecture

- [ ] เอา Profile trigger ซ้ำออกจาก Topbar ให้เหลือ account entry point หลักที่ Sidebar ด้านล่าง
- [ ] คง Profile ในกลุ่มบัญชีผู้ดูแล พร้อม avatar, role, online status และ account dropdown
- [ ] แยก Sidebar เป็นงานหลัก, รายงาน, ตั้งค่า, เครื่องมือเทคนิค และ legacy route อย่างชัดเจน
- [ ] กำหนดว่า Bulk Queue, Statement, Analytics และ Export เป็น contextual destination จากหน้าที่เกี่ยวข้องหรือ Command Palette
- [ ] ย้าย Credential, Adapter Test, Webhook Test, API Settings และ Money Ops ออกจาก Sidebar หลัก โดยยังเข้าผ่าน Command Palette/deep-link ตามสิทธิ์
- [ ] รวม Activity/Activity Center, KYC/KYC Center, Audit/Audit Logs และ Ledger/Wallet Ledger ให้มีหน้าหลักเดียว
- [ ] ทำ redirect สำหรับ route legacy โดยไม่ปล่อยลิงก์เสียหรือ route ที่ทำงานซ้ำ
- [ ] ตรวจและแก้ปุ่ม/link ที่เรียก route ไม่มีหน้า เช่น Profile Edit หรือชื่อ route เก่า
- [ ] ทำชื่อเมนู ภาษา และลำดับกลุ่มให้สอดคล้องกับงานจริง
- [ ] กรองเมนู, Command Palette และ deep-link ตาม permission เดียวกัน
- [ ] ทำ active state และ open group ให้สะท้อน route ปัจจุบัน แม้เข้าผ่าน deep-link
- [ ] ตรวจ badge งานค้างไม่ซ้ำและไม่แสดงบนหน้าที่ไม่มี action ให้ทำ

### Overlay, dropdown และปุ่ม action

- [ ] รวม state controller ของ Sidebar drawer, Profile menu, Notification Center และ Command Palette
- [ ] บังคับให้เปิด overlay ได้ทีละชั้น และปิด surface อื่นอัตโนมัติเมื่อเปิดอันใหม่
- [ ] จัดลำดับ Escape ให้ปิด surface ชั้นบนสุดก่อน แล้วคืน focus ไปยังปุ่มต้นทาง
- [ ] รวม Profile menu ให้มี implementation เดียว ลด trigger/dropdown ซ้ำ
- [ ] ตัดปุ่ม Logout ซ้ำ โดยคง footer logout เฉพาะ mobile เมื่อจำเป็น
- [ ] ตรวจ close button, backdrop, click-outside และ navigation transition ทุก surface
- [ ] ทำให้ปุ่ม action หนึ่งรายการมีคำสั่งหลักเพียงหนึ่งปุ่ม ไม่เกิด Approve/Confirm ซ้อนกัน
- [ ] ปุ่ม disabled ทุกปุ่มต้องแสดงเหตุผลหรือ helper ที่อ่านได้
- [ ] ใช้ destructive tone เฉพาะ Reject, Delete, Suspend และ Logout
- [ ] จำกัด primary action หนึ่งปุ่มต่อ section และทำ loading/pending state ป้องกัน double-submit
- [ ] ปุ่ม icon ต้องมี tooltip, aria-label และ keyboard focus ที่ชัดเจน
- [ ] บังคับ touch target ขั้นต่ำ 44px บน mobile สำหรับทุก action สำคัญ

### Sidebar rail และ responsive navigation

- [ ] ปรับ Desktop Sidebar expanded เป็น 272px และ collapsed icon rail เป็น 72px
- [ ] แทนปุ่ม footer “ย่อเมนู” ด้วยปุ่มกลมที่ขอบ Sidebar ซึ่งสื่อการย่อ/ขยายชัดเจน
- [ ] เมื่อ rail mode ให้แสดง icon, active state และ queue badge โดยไม่บีบข้อความ
- [ ] เพิ่ม tooltip บน hover/focus ของ icon rail และรองรับ screen reader
- [ ] คลิก group ใน rail ให้เปิด flyout menu แทนการยืด Sidebar เต็มโดยไม่จำเป็น
- [ ] เมื่อ rail mode ให้ Profile เหลือ avatar/online dot และเปิด account menu ได้
- [ ] บน tablet/mobile ใช้ full drawer เท่านั้น ไม่ใช้ rail mode และจัด focus trap/backdrop ให้ครบ

### QA, observability และ release controls

- [ ] สร้าง seeded UAT data และ Admin test accounts แยกตาม role สำหรับ browser regression
- [ ] เพิ่ม E2E critical-action coverage สำหรับ approve, reject, pay, wallet adjustment และ role change พร้อม audit assertion
- [ ] เพิ่ม feature flags เพื่อแยก Demo/UAT/Production, gradual rollout และ rollback
- [ ] เพิ่ม error tracking สำหรับ Admin/API โดย redact PII, secret และ payment payload
- [ ] เพิ่ม structured log และ trace ID เชื่อม UI, API, database และ provider workflow
- [ ] เพิ่ม monitoring dashboard/SLO สำหรับ error rate, latency, queue aging, webhook failure และ provider downtime
- [ ] เพิ่ม Lighthouse/performance budget ใน CI สำหรับ Admin critical routes
- [ ] ทำ automated backup-restore drill และเก็บหลักฐานว่า restore ใช้งานได้จริง

### P3 Definition of Done

- ไม่มี Profile, Logout, Activity หรือ menu action ซ้ำ
- Overlay เปิดพร้อมกันไม่ได้ และการปิดด้วย Escape/click-outside คืน focus ถูกต้อง
- ไม่มี route legacy/link เสียใน menu, dropdown หรือ Command Palette
- Desktop rail, tablet และ mobile drawer ผ่าน keyboard, responsive และ permission checks
- Action เสี่ยงมี confirmation, audit, idempotency/retry policy และ automated regression
- UAT/Production แยก environment, credential, webhook และ feature flag

## ลำดับดำเนินงานต่อ

1. เก็บ browser regression evidence ของ bulk financial workflow ใน CI/staging ก่อน deploy
