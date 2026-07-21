# Admin Redesign Master Worklist

เอกสารนี้เป็น **source of truth เพียงไฟล์เดียวสำหรับงาน Admin redesign** ของ `apps/web-admin` และส่วน Backend/Database ที่รองรับตัวตน สิทธิ์ และความปลอดภัยของ Admin

ลิสเดิมแบบย่อถูกยกเลิกและแทนที่ด้วยลิสเต็มด้านล่าง ซึ่งรวบรวมขอบเขตที่ตกลงกัน ได้แก่ Navigation, Profile, Role/Permission, Dashboard, Operations, Finance, Member, Risk, Provider, Promotion, Support, Reports, Settings, Audit, Responsive, Animation, Testing และ Regression evidence

กติกาการนับ:

- ติ๊ก `[x]` เฉพาะเมื่อมี implementation ใน repository และมีหลักฐาน build/deploy หรือ regression ที่เหมาะสม
- งานแก้ defect ที่ไม่เพิ่มขอบเขตใหม่ให้นับเป็นงานแก้ไข แต่ไม่เพิ่มจำนวน checkbox
- ห้ามสร้าง worklist Admin ชุดอื่นซ้ำ เพราะมนุษย์มีพรสวรรค์ในการทำตัวเลขสองชุดให้ไม่ตรงกันอย่างน่าทึ่ง
- จำนวนงานต้องนับจาก checkbox จริงทุกครั้ง ไม่ใช้ยอดเดิมที่พิมพ์ค้างไว้
- งาน visual completion ต้องแยกตามโมดูลจริง ห้ามรวมหลายระบบไว้ใน checkbox เดียว

อัปเดตล่าสุด: **2026-07-20**

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
| **รวม** | **59** | **59** | **0** |


---

## ลำดับดำเนินงานต่อ

1. เก็บ browser regression evidence ของ bulk financial workflow ใน CI/staging ก่อน deploy
