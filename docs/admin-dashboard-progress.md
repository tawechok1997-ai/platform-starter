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

## ยังต้องทำทีละชิ้น

- [ ] จำกัด Recent Ledger บน Dashboard ให้แสดง 5 รายการ
- [ ] ตรวจ Wallet total ไม่ให้ตัดบรรทัดบนทุก viewport
- [ ] ตรวจและจัดลำดับ section ตาม worklist
- [ ] ลด KPI / chart ที่ซ้ำกัน
- [ ] ปรับ SLA ให้แสดง countdown ที่เข้าใจง่าย

## งานรอบปัจจุบัน

**เป้าหมายถัดไป:** จำกัด `summary.recentLedgers` เป็น 5 รายการ โดยไม่แตะ API, Database หรือส่วนอื่นของ Dashboard

## กติกา

1. หนึ่งรอบแก้หนึ่งประเด็น
2. ไม่สร้าง component หรือระบบใหม่ถ้าของเดิมมีอยู่แล้ว
3. ตรวจ TypeScript / Build ก่อนปิดงาน
4. อัปเดต worklist และไฟล์นี้พร้อมกันหลังยืนยันผล
