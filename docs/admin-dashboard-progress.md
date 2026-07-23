# Admin Dashboard Incremental Progress

> ตรวจจากโค้ดบน `main` วันที่ 2026-07-23
> ทำทีละชิ้นและอัปเดตไฟล์นี้ทุกครั้ง เพื่อลดงานซ้ำและการแก้ทั้งหน้าโดยไม่จำเป็น

## ยืนยันว่ามีแล้ว

- [x] System / operational status
- [x] Urgent priority lanes สำหรับ Risk, Withdrawals และ Top-ups
- [x] Finance KPI
- [x] Operations KPI
- [x] Queue age metrics: overdue, critical และ oldest queue
- [x] Risk pressure section
- [x] Finance flow section
- [x] Quick Actions
- [x] Role / permission-based rendering
- [x] ปุ่มดู Wallet Ledger ทั้งหมด
- [x] จำกัด Recent Ledger บน Dashboard ให้แสดง 5 รายการ
- [x] Wallet total ใช้ช่องว่างแบบไม่ตัดบรรทัด
- [x] SLA countdown แบบเหลือเวลา/เกินเวลา
- [x] ลำดับต้นหน้าเป็น System → Urgent queue → KPI → Risk → Finance

## ยังต้องทำทีละชิ้น

- [ ] ย้าย Activity / Recent Ledger ไปท้ายสุดของ Dashboard
- [ ] ลด KPI / chart ที่ซ้ำกัน

## งานรอบปัจจุบัน

**เป้าหมายถัดไป:** กำหนด `order` ให้กลุ่ม Activity / Recent Ledger อยู่ท้ายสุดผ่านโครงสร้าง CSS Grid ของ `AdminPage` โดยไม่ย้าย JSX ก้อนใหญ่และไม่แตะข้อมูลภายในการ์ด

## หลักฐาน Role-based dashboard

- Finance KPI และ Finance sections แสดงเมื่อมีสิทธิ์ Finance ที่เกี่ยวข้อง
- Risk metrics, priority lane และ Risk section แสดงเมื่อมี `risk.view`
- Top-up และ Withdrawal actions แยกตาม permission ของแต่ละ workflow
- ปุ่มรายงานและ Wallet Ledger แสดงเฉพาะเมื่อมีสิทธิ์ปลายทาง
- เมื่อไม่มีสิทธิ์ Finance และ Risk จะแสดง empty state แทนข้อมูลที่ไม่ควรเห็น

## กติกา

1. หนึ่งรอบแก้หนึ่งประเด็น
2. ไม่สร้าง component หรือระบบใหม่ถ้าของเดิมมีอยู่แล้ว
3. ตรวจ TypeScript / Build ก่อนปิดงาน
4. อัปเดต worklist และไฟล์นี้พร้อมกันหลังยืนยันผล
