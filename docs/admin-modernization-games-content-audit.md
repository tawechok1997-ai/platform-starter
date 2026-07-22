# Admin Modernization — Games, Webhooks, Promotion Claims และ Content Audit

อัปเดต: 2026-07-23

ความหมายสถานะ:

- `[x]` ยืนยันจากโค้ดบน `main`
- `[~]` มี implementation บางส่วน แต่ยังไม่ครบขอบเขต
- `[ ]` ยังไม่พบหลักฐานเพียงพอ

## `/game-transfers`

- [x] แสดงทิศทางรายการผ่าน type label เช่น โยกเข้าเกม โยกกลับกระเป๋า คืนเงิน ซิงก์ยอด และปรับยอด
- [x] แสดง idempotency key และ provider transaction ID
- [x] แยก SUCCESS / PENDING / FAILED / REVERSED พร้อม summary และ filter
- [x] Retry จำกัดเฉพาะรายการ FAILED และใช้ endpoint `retry-dry-run`
- [x] บังคับเหตุผลและ confirmation ก่อน review/retry
- [x] แสดง safe error label แทน raw provider error
- [~] technical payload เปิดดูได้ แต่ยังไม่มี field-level secret/PII redaction evidence
- [~] async mutation บางจุดยังไม่มี `try/finally`
- [~] load และ action error ยังอ่าน backend `message` บางจุด

## `/webhook-logs`

- [x] แยก PROCESSED / RETRY / FAILED / DUPLICATE
- [x] แสดง signature status ชัดเจน
- [x] มี expandable payload viewer สำหรับ raw/normalized payload
- [x] แสดง idempotency key และ provider transaction ID
- [x] ใช้ safe error label ตาม error code
- [x] มี search และ status filter
- [ ] Replay action สำหรับ Admin ที่มีสิทธิ์
- [ ] Server-side pagination
- [~] payload viewer ยังไม่มีหลักฐาน field-level redaction ครบทุก provider

## `/promotion-claims`

- [x] แสดงหลักฐานรายการฝากที่เชื่อมโยง ยอดฝาก สถานะ และ reference
- [x] มี review drawer
- [x] Reject บังคับเหตุผล
- [x] มี SLA label/tone
- [x] แสดง campaign terms, settlement state และ event timeline
- [x] Approve/Reject มี confirmation และ busy guard
- [x] มี loading, empty และ safe network fallback
- [~] API failure บางจุดยังใช้ backend `message`
- [~] drawer เป็น custom overlay ยังไม่มี focus trap/restore evidence

## `/content-center`

- [x] รองรับ Asset / Banner / Popup / Announcement / FAQ
- [x] มี Preview มือถือและ PC
- [x] มี asset validation ตาม MIME type และขนาดไฟล์
- [x] รองรับ private storage upload และ URL asset
- [x] ป้องกันลบ asset ที่ยังถูกใช้งาน
- [x] แสดง storage key, size และ SHA-256 เมื่อมี
- [x] มี broken asset warnings และ URL validation
- [x] มี busy state สำหรับ save/upload
- [~] มี enabled/disabled state แต่ยังไม่พบ lifecycle Draft/Published/Archived แบบชัดเจน
- [~] Raw JSON ไม่ได้เป็นหน้าหลัก แต่ยังไม่พบ Advanced mode contract ที่ระบุชัด
- [ ] Unsaved changes warning ก่อนออกจากหน้า
- [~] save/delete บาง flow ไม่มี `try/finally` ครบ และยังใช้ backend `message` บางจุด

## สรุปสำหรับ worklist หลัก

ควรเปลี่ยน checkbox ต่อไปนี้เป็น `[x]` ตามหลักฐานจากโค้ด:

- `/game-transfers`: Transfer direction, Idempotency key, Success/Pending/Failed, Retry เฉพาะรายการปลอดภัย
- `/webhook-logs`: Processed/Retry/Failed, Payload drawer, Signature status
- `/promotion-claims`: หลักฐานการฝาก, Review drawer, Reject reason, SLA
- `/content-center`: Asset/Banner/Popup/Announcement/FAQ, PC/Mobile preview, Asset validation

ยังไม่ควรติ๊ก:

- `/webhook-logs`: Replay action
- `/content-center`: Draft/publish workflow, Raw JSON ใน Advanced
