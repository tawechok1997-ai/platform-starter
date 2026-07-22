# Admin Modernization — Reports and Members Code Audit

อัปเดต: 2026-07-23

เอกสารนี้ตรวจจากโค้ดบน `main` เพื่อใช้ปรับ checkbox ใน `admin-modernization-chat-worklist.md` โดยไม่ถือข้อความใน worklist เป็นหลักฐานด้วยตัวเอง

## `/reports`

### ยืนยันจากโค้ด

- [x] มี date range สำหรับรายงานสรุปรายวัน พร้อม validation ว่าวันเริ่มไม่เกินวันสิ้นสุด
- [x] มีข้อมูล Summary, Trend และ Queue Aging ในหน้าเดียว
- [x] มีช่วงแนวโน้ม 7, 14, 30 และ 90 วัน
- [x] มีข้อมูล comparison เชิงช่วงเวลาในรูป totals และ daily net flow
- [x] มี export progress state และป้องกันเริ่ม export ซ้ำ
- [x] ดาวน์โหลด CSV สำหรับ trend report
- [x] มี loading, empty และ safe error copy
- [x] มี queue aging และลิงก์กลับไปคิว Topups/Withdrawals

### ยังไม่ครบขอบเขตใน worklist

- [~] Date range ใช้กับ daily report แต่ยังไม่ใช่ date-range component กลางที่พิสูจน์ว่าใช้ร่วมทั้งระบบ
- [~] Summary / Trend / Aging มีเป็น section แต่ยังไม่ใช่ tab navigation ตามข้อความเดิม
- [ ] Comparison period แบบเทียบช่วงก่อนหน้าอย่างชัดเจน
- [~] ลดความยาวหน้า: มีการแบ่ง section แต่หน้ายังรวมข้อมูลจำนวนมาก
- [~] Export progress มีข้อความสถานะ แต่ยังไม่มี progress percentage/job tracking ในหน้านี้

## `/bank-accounts`

### ยืนยันจากโค้ด

- [x] แยกบัญชีรับเงินของระบบกับบัญชีธนาคารสมาชิก
- [x] มี verification/review status ของบัญชีสมาชิก
- [x] Mask เลขบัญชีในการแสดงผล
- [x] โหลด duplicate-account groups จาก KYC summary
- [x] มี approval/rejection workflow พร้อม permission guard
- [x] Reject บังคับเหตุผลอย่างน้อย 5 ตัวอักษร
- [x] ใช้ confirmation dialog ก่อนเปลี่ยนสถานะ review
- [x] มี busy state รายบัญชี

### ยังต้องตรวจ/ปรับ

- [~] หน้าเดียวผสมข้อความไทยและอังกฤษหลายจุด
- [~] Async functions บางส่วนยังไม่มี `try/finally`; หาก request throw อาจค้าง busy/message state
- [ ] ยังไม่มีหลักฐาน automated regression สำหรับ review workflow

## `/kyc-center`

### ยืนยันจากโค้ด

- [x] มี KYC review queue และเปิด checklist/detail ของแต่ละเคส
- [x] แสดง risk level และเหตุผล/review note
- [x] โหลดเอกสารใน case detail
- [x] Reject KYC บังคับเหตุผลอย่างน้อย 5 ตัวอักษร
- [x] มี status filter สำหรับ KYC cases
- [x] มีสถานะ DRAFT, SUBMITTED, REVIEWING, APPROVED, REJECTED และ EXPIRED
- [x] มี duplicate bank account summary และ risky accounts
- [x] มี confirmation dialog สำหรับ review ทั้ง KYC case และ member bank account
- [x] ส่ง `version` ใน KYC review request เพื่อรองรับ conflict/version guard

### ยังต้องตรวจ/ปรับ

- [~] Document detail แสดงผ่าน selected case panel แต่ยังต้องยืนยัน rendered drawer behavior และ focus restoration
- [~] Error copy ปลอดภัย แต่ async flows หลายจุดยังไม่มี `try/finally`
- [ ] ยังไม่มี browser/accessibility evidence ของ document drawer และ confirmation flows

## สถานะ checkbox ที่ควรรวมกลับไฟล์หลัก

### `/reports`

- Date range picker: ทำแล้วในหน้านี้ แต่ยังไม่ใช่ component กลางทั้งระบบ
- Summary / Trend / Aging: ทำแล้วในรูป sections
- ลดความยาวหน้า: ยังไม่ครบ
- Export progress: ทำแล้วบางส่วน

### `/bank-accounts`

- แยกบัญชีรับเงิน/บัญชีถอน: เสร็จ
- Verification status: เสร็จ
- Mask เลขบัญชี: เสร็จ
- Duplicate warning: เสร็จ
- Approval workflow: เสร็จ

### `/kyc-center`

- KYC checklist: เสร็จ
- Risk reason: เสร็จ
- Document drawer/detail: ทำแล้วบางส่วน ต้องมี rendered evidence
- Reject ต้องใส่เหตุผล: เสร็จ
- Status filter: เสร็จ
