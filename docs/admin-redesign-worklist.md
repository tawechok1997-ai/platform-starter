# Admin Redesign Worklist

เอกสารนี้ติดตามงานปรับปรุง `apps/web-admin` ที่เริ่มหลังจากปิด master project worklist เดิมแล้ว โดยใช้สำหรับรายงานจำนวนงานคงเหลือของชุด Admin redesign เท่านั้น

อัปเดตล่าสุด: 2026-07-18

## P0 — Admin identity data integrity

สถานะ: 3 / 4 เสร็จ | เหลือ 1

- [x] เพิ่ม migration สำหรับข้อมูลโปรไฟล์ Admin
- [x] เพิ่ม API อ่านและแก้ไขโปรไฟล์ Admin
- [x] บันทึก audit log เมื่อแก้ไขโปรไฟล์
- [ ] ทำให้ `prisma/schema.prisma` ตรงกับคอลัมน์โปรไฟล์ใน migration และเลิกพึ่ง raw SQL เมื่อ Prisma Client รองรับแล้ว

## P1 — Admin navigation, identity และ access UX

สถานะ: 7 / 8 เสร็จ | เหลือ 1

- [x] แยก Sidebar เป็นหมวดหมู่
- [x] เพิ่ม Submenu แบบ accordion พร้อม active state และ animation
- [x] ย้ายโปรไฟล์ Admin ไป Topbar
- [x] เพิ่ม Profile dropdown และลิงก์ไปหน้าโปรไฟล์ส่วนตัว
- [x] เพิ่มหน้า Profile และหน้าแก้ไข Profile
- [x] กรองเมนูและ route ตาม permission
- [x] เพิ่ม data masking ระดับ field ตามตำแหน่งและ permission
- [ ] ปรับหน้ารายชื่อ Admin ให้แสดงรูป ชื่อ ตำแหน่ง แผนก Role และสถานะอย่างครบถ้วน

## P2 — Professional dashboard และ UI completion

สถานะ: 3 / 8 เสร็จ | เหลือ 5

- [ ] ปรับ Dashboard เป็น Operations Command Center
- [x] เพิ่ม Admin enterprise color, shadow และ surface system
- [x] เพิ่ม motion, reduced-motion และ loading states
- [x] รองรับ responsive shell, drawer และ profile surfaces
- [ ] เพิ่มกราฟการเงิน การดำเนินงาน ความเสี่ยง และ provider health
- [ ] ปรับตารางหลักให้มี filter, sort, pagination, column visibility และ bulk action ที่สอดคล้องกัน
- [ ] เพิ่ม automated tests สำหรับ navigation, profile update และ permission rendering
- [ ] เพิ่ม regression evidence และอัปเดตเอกสารสรุปงาน Admin redesign

## สรุป

| Priority | เสร็จ | ทั้งหมด | เหลือ |
|---|---:|---:|---:|
| P0 | 3 | 4 | 1 |
| P1 | 7 | 8 | 1 |
| P2 | 3 | 8 | 5 |
| **รวม** | **13** | **20** | **7** |
