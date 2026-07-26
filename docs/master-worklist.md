# Master Worklist

ไฟล์นี้เป็น entry point ที่คงชื่อเดิมไว้สำหรับเครื่องมือและผู้ร่วมงานที่อ้างถึง `docs/master-worklist.md`

เอกสาร source of truth เพียงไฟล์เดียวคือ [`master-project-worklist.md`](./master-project-worklist.md)

ห้ามเพิ่ม checkbox หรือสถานะงานซ้ำในไฟล์นี้ เพราะจะทำให้เกิด worklist สองชุดและตัวเลขคงค้างไม่ตรงกัน การแก้สถานะงานทั้งหมดต้องทำใน `docs/master-project-worklist.md` เท่านั้น

## ข้อกำหนดเฉพาะระบบ

- [`admin-experience-modernization-spec.md`](./admin-experience-modernization-spec.md) - ข้อกำหนดฉบับเต็มสำหรับรวมหน้า Admin, ปรับ Information Architecture, UX/UI, responsive, localization, data density, charts, permissions และเกณฑ์ปิดงาน
- [`admin-complete-route-coverage-spec.md`](./admin-complete-route-coverage-spec.md) - ข้อกำหนดบังคับให้ครอบคลุมทุก Admin route รวมหน้าที่ไม่มีภาพ, dynamic detail, auth/recovery, create/edit, loading/error/permission states, hidden/legacy routes และ route ที่เพิ่มในอนาคต