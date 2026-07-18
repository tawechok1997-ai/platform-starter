# Admin Redesign Master Worklist

เอกสารนี้เป็น **source of truth เพียงไฟล์เดียวสำหรับงาน Admin redesign** ของ `apps/web-admin` และส่วน Backend/Database ที่รองรับตัวตน สิทธิ์ และความปลอดภัยของ Admin

ลิสเดิมแบบย่อ 20 งานถูกยกเลิกและแทนที่ด้วยลิสเต็มด้านล่าง ซึ่งรวบรวมขอบเขตที่ตกลงกันรอบแรก ได้แก่ Navigation, Profile, Role/Permission, Dashboard, Operations, Finance, Member, Risk, Provider, Promotion, Support, Reports, Settings, Audit, Responsive, Animation, Testing และ Regression evidence

กติกาการนับ:

- ติ๊ก `[x]` เฉพาะเมื่อมี implementation ใน repository และมีหลักฐาน build/deploy หรือ regression ที่เหมาะสม
- งานแก้ defect ที่ไม่เพิ่มขอบเขตใหม่ให้นับเป็นงานแก้ไข แต่ไม่เพิ่มจำนวน checkbox
- ห้ามสร้าง worklist Admin ชุดอื่นซ้ำ เพราะมนุษย์มีพรสวรรค์ในการทำตัวเลขสองชุดให้ไม่ตรงกันอย่างน่าทึ่ง

อัปเดตล่าสุด: **2026-07-18**

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

สถานะ: **7 / 20 เสร็จ | เหลือ 13**

### Design foundation

- [x] เพิ่ม Admin enterprise color, surface, shadow, typography และ icon direction ให้ต่างจาก Member ชัดเจน
- [x] เพิ่ม motion, loading, skeleton, dropdown, modal และ reduced-motion baseline
- [x] รองรับ responsive shell, drawer, topbar, profile และ admin directory surfaces

### Dashboard และ operational intelligence

- [x] ปรับ Dashboard เป็น Operations Command Center ที่อ่านสถานะระบบได้ในหน้าจอเดียว
- [x] เพิ่ม KPI การเงิน ได้แก่ยอดฝาก ยอดถอน รายได้สุทธิ รายการค้าง และ Wallet variance
- [x] เพิ่ม KPI Operations ได้แก่ queue, SLA, งานเกินเวลา และรายการที่ต้องอนุมัติ
- [x] เพิ่มกราฟ Deposit/Withdrawal, transaction volume และ net revenue
- [ ] เพิ่มกราฟ Member growth, active members และ usage trend
- [ ] เพิ่มกราฟ Risk alerts แยก severity, status และแนวโน้ม
- [ ] เพิ่ม Provider health, latency, error rate, webhook failure และ wallet mismatch visualization
- [ ] เพิ่ม Recent activity, audit timeline และ critical events panel

### Data table และ workflow standardization

- [ ] สร้างมาตรฐานตาราง Admin กลางสำหรับ sticky header, density, loading, empty และ error states
- [ ] ทำ filter, sort, pagination และ search ให้ใช้พฤติกรรมสอดคล้องกันทุกหน้าหลัก
- [ ] เพิ่ม column visibility, saved views และการจำค่าตาม Admin
- [ ] เพิ่ม bulk action พร้อม confirm dialog, reason field, step-up และผลลัพธ์รายแถว
- [ ] ปรับ Export Center ให้ติดตามสถานะไฟล์ ประวัติการส่งออก และสิทธิ์ข้อมูล

### Module visual completion

- [ ] ตรวจและปรับหน้า Finance ทั้ง Deposit, Withdrawal, Wallet, Ledger และ Reconciliation ให้ใช้ระบบใหม่ครบ
- [ ] ตรวจและปรับหน้า Members, Bank review, KYC และ Risk ให้ใช้ระบบใหม่ครบ
- [ ] ตรวจและปรับหน้า Games, Providers, Sessions, Transfers และ Webhook ให้ใช้ระบบใหม่ครบ
- [ ] ตรวจและปรับหน้า Promotions, Bonus, Content, Support, Reports, Settings และ Audit ให้ใช้ระบบใหม่ครบ

### Verification

- [ ] เพิ่ม automated tests สำหรับ navigation, profile update, data masking, permission rendering และ session refresh flow
- [ ] เพิ่ม visual/browser regression evidence, build evidence และเอกสารสรุป Admin redesign ขั้นสุดท้าย

---

## สรุปสถานะ

| Priority | เสร็จ | ทั้งหมด | เหลือ |
|---|---:|---:|---:|
| P0 | 6 | 7 | 1 |
| P1 | 13 | 13 | 0 |
| P2 | 7 | 20 | 13 |
| **รวม** | **26** | **40** | **14** |

## ลำดับดำเนินงานต่อ

1. ปิด P0 โดย sync Prisma schema และเลิกใช้ raw SQL
2. ทำกราฟ Member, Risk และ Provider health
3. ทำ Recent activity และ critical events
4. ทำ table/workflow standardization
5. ไล่ visual completion รายโมดูล
6. ปิด automated tests และ regression evidence
