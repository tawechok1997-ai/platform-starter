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
- [x] Finance comparison section
- [x] Quick Actions
- [x] Role / permission-based rendering
- [x] ปุ่มดู Wallet Ledger ทั้งหมด
- [x] จำกัด Recent Ledger บน Dashboard ให้แสดง 5 รายการ
- [x] Wallet total ใช้ช่องว่างแบบไม่ตัดบรรทัด
- [x] SLA countdown แบบเหลือเวลา/เกินเวลา
- [x] ลำดับหน้าเป็น System → Urgent queue → KPI → Risk → Finance → Queue → Activity
- [x] ลดข้อมูลซ้ำโดยลบ Finance flow และเก็บ Finance comparison

## งานค้างของ Dashboard ชุดนี้

ไม่มี

## ผลการลดข้อมูลซ้ำ

- ลบการ์ด `Finance flow` ซึ่งแสดงยอดฝาก ยอดถอน และ net flow ซ้ำ
- ลบ `financeFlow useMemo` ที่ไม่ถูกใช้งานแล้ว
- ลบ permission helper `canViewReports` ที่ใช้เฉพาะการ์ดเดิม
- คง `Finance comparison` ไว้ เพราะแสดงมูลค่า จำนวนรายการ และ net flow ครบกว่า
- ไม่แตะ API, Database, permission contract หรือ KPI อื่น

## หลักฐาน Role-based dashboard

- Finance KPI และ Finance sections แสดงเมื่อมีสิทธิ์ Finance ที่เกี่ยวข้อง
- Risk metrics, priority lane และ Risk section แสดงเมื่อมี `risk.view`
- Top-up และ Withdrawal actions แยกตาม permission ของแต่ละ workflow
- ปุ่ม Wallet Ledger แสดงเฉพาะเมื่อมีสิทธิ์ปลายทาง
- เมื่อไม่มีสิทธิ์ Finance และ Risk จะแสดง empty state แทนข้อมูลที่ไม่ควรเห็น

## กติกา

1. หนึ่งรอบแก้หนึ่งประเด็น
2. ไม่สร้าง component หรือระบบใหม่ถ้าของเดิมมีอยู่แล้ว
3. ตรวจ TypeScript / Build ก่อนปิดงาน
4. อัปเดตสถานะตามโค้ดจริง ไม่ติ๊กจากแผนอย่างเดียว
