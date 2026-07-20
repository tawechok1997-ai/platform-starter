# Game API Worklist

เอกสารนี้เป็น source of truth สำหรับงาน Game API, Provider Simulator, game catalog และ asset mapping ของ Mobile/PC

อัปเดตล่าสุด: 2026-07-20

## สถานะรวม

- [x] Provider simulator ใช้ wallet หลักของแพลตฟอร์ม
- [x] BET, WIN, REFUND และ ROLLBACK รองรับ idempotency
- [x] HMAC authentication และ timestamp expiry
- [x] Mock launch response พร้อม session expiry
- [x] Game catalog แยก Mobile และ PC
- [x] Provider, platform และ category metadata
- [x] Filter ตาม provider, platform และ category
- [x] Search ตาม code, name, provider และ category
- [x] Pagination จำกัดสูงสุด 100 รายการ
- [x] Sorting ตาม name และ code
- [x] Response รองรับ items, data และ pagination
- [x] SVG icon endpoint พร้อม cache headers
- [x] Regression tests สำหรับ wallet, idempotency และ game transactions
- [x] Regression tests สำหรับ Mobile/PC separation
- [x] Regression tests สำหรับ filtering, search, pagination และ launch metadata

## Asset catalog

- [ ] นำ asset Mobile ชุดจริงเข้า repository
- [ ] นำ asset PC ชุดจริงเข้า repository
- [ ] สร้าง inventory ของ provider logos และ game icons
- [ ] ตรวจ duplicate ด้วย content hash
- [ ] สร้าง rename manifest สำหรับชื่อไฟล์ที่ไม่ตรงรูป
- [ ] เปลี่ยน mock SVG เป็น asset จริงทีละรายการ
- [ ] เพิ่ม fallback image กลางเมื่อ asset โหลดไม่ได้

## Member integration

- [ ] เชื่อมหน้า Member games กับ catalog response รุ่นล่าสุด
- [ ] เพิ่ม platform filter Mobile/PC
- [ ] เพิ่ม provider และ category filter
- [ ] เพิ่ม search และ pagination/infinite loading
- [ ] เพิ่ม loading, empty และ error states
- [ ] ตรวจ responsive mobile/desktop

## Verification

- [ ] รัน provider simulator unit tests ใน CI
- [ ] รัน API typecheck และ build
- [ ] รัน Member typecheck และ build หลังเชื่อมหน้าเกม
- [ ] รัน browser regression สำหรับ filter, launch และ image fallback

## จำนวนงาน

- ปิดแล้ว: 15 รายการ
- คงค้าง: 17 รายการ
- งานคงค้างส่วน asset ต้องใช้ไฟล์ Mobile และ PC ชุดจริงเป็นอินพุต
