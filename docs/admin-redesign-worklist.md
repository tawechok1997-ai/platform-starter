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

สถานะ: **6 / 7 เสร็จ | เหลือ 1**

- [x] เพิ่ม migration สำหรับข้อมูลโปรไฟล์ Admin ได้แก่ชื่อ ตำแหน่ง แผนก และรูปโปรไฟล์
- [x] เพิ่ม API อ่านโปรไฟล์ Admin จากข้อมูลฐานจริง
- [x] เพิ่ม API แก้ไขโปรไฟล์ พร้อม DTO validation
- [x] บันทึก audit log เมื่อแก้ไขโปรไฟล์ พร้อมข้อมูลก่อน/หลัง IP และ user agent
- [x] ป้องกัน refresh 401 ที่หน้า Login และจัดการ session hint โดยไม่เก็บ token ฝั่ง client
- [x] บังคับ authentication, route permission และ API permission โดยไม่พึ่งการซ่อนเมนูเพียงอย่างเดียว
- [ ] ทำให้ `prisma/schema.prisma` ตรงกับคอลัมน์โปรไฟล์ใน migration และเปลี่ยน Profile query/update จาก raw SQL เป็น Prisma Client พร้อม regression test
  - แก้ defect Login loop และ `/admin/auth/me` 500 แล้ว โดยใช้ HttpOnly access cookie ผ่าน Next.js proxy และเปลี่ยน Profile query ฝั่งอ่านเป็น Prisma Client
  - ยืนยันใช้งาน Login → Dashboard ได้จริง และ Railway build ของ API, Web Admin และ Web Member ผ่านทั้งหมดที่ commit `f8e6cbd8`
  - คงเหลือ: sync profile fields เข้า Prisma schema และปรับ Profile update ให้ใช้ Prisma Client

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

สถานะ: **36 / 39 เสร็จ | เหลือ 3**

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
- [ ] เพิ่ม bulk action พร้อม confirm dialog, reason field, step-up และผลลัพธ์รายแถว
  - ความคืบหน้า: มี reusable component, เลือกหลายรายการ, reason, confirmation phrase, retry และผลลัพธ์รายแถวแล้ว
  - ใช้งานจริงที่ `/bulk-queue-operations` สำหรับ Claim/Release ซึ่งไม่เปลี่ยนยอดเงินจริง
  - คงเหลือ: batch API และ step-up authentication สำหรับ Approve, Reject, Confirm credit/payment ก่อนปิดงาน
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
- [ ] ตรวจและปรับหน้า Content ให้ใช้ระบบใหม่ครบ
  - Legal และ Contact/Social settings ปรับแล้ว แต่ยังต้องตรวจ content surface ที่เหลือ
- [x] ตรวจและปรับหน้า Support ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Reports ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Settings ให้ใช้ระบบใหม่ครบ
- [x] ตรวจและปรับหน้า Audit ให้ใช้ระบบใหม่ครบ

### Verification

- [x] เพิ่ม automated tests สำหรับ navigation, profile update, data masking, permission rendering และ session refresh flow
  - ครอบคลุม navigation permission, route guard, data masking, session refresh/2FA/privilege reduction, profile normalization, payload trimming และ API error parsing
  - ผูก regression tests เข้ากับ `web-admin build` และ Railway build ของ API, Web Admin และ Web Member ผ่านครบที่ commit `f43c0ad4`
- [ ] เพิ่ม visual/browser regression evidence, build evidence และเอกสารสรุป Admin redesign ขั้นสุดท้าย

---

## สรุปสถานะ

| Priority | เสร็จ | ทั้งหมด | เหลือ |
|---|---:|---:|---:|
| P0 | 6 | 7 | 1 |
| P1 | 13 | 13 | 0 |
| P2 | 36 | 39 | 3 |
| **รวม** | **55** | **59** | **4** |

## ลำดับดำเนินงานต่อ

1. ปิด P0 โดย sync Prisma schema และเปลี่ยน Profile update เป็น Prisma Client
2. เพิ่ม batch API และ step-up สำหรับ bulk financial actions
3. ปิด Content surface ที่เหลือ
4. ปิด visual/browser regression evidence และเอกสารสรุปขั้นสุดท้าย
