# Isolated UI Reference Kit

ชุดนี้สร้างจากไฟล์ `s.zip` เพื่อใช้เป็นวัตถุดิบสำหรับเขียน UI ของโปรเจกต์ใหม่ โดยยังไม่เชื่อมเข้ากับ Member, Admin หรือ API ใด ๆ

## Inventory

- Total files: 211
- JavaScript bundles: 126
- CSS bundles: 3
- Images: 55
- SVG icons: 26
- Network captures: 1
- Catalogued UI component groups: 64

## Isolation rules

1. ห้าม import production bundle เดิมเข้า frontend ของโปรเจกต์โดยตรง
2. รูปและ SVG ต้องผ่านการตั้งชื่อใหม่ ตรวจไฟล์ซ้ำ และจัดหมวดก่อนนำไปใช้
3. Component ต้องเขียนใหม่เป็น React + TypeScript ของโปรเจกต์
4. CSS เดิมใช้วิเคราะห์ token, layout, responsive และ animation เท่านั้น
5. HAR ใช้ตรวจลำดับ request และโครงสร้างข้อมูล ห้ามผูกกับ API production ของเว็บต้นทาง
6. โฟลเดอร์นี้ต้องแยกจาก `apps/web-member`, `apps/web-admin` และ `api` จนกว่าจะผ่าน review

## Local package

แพ็กเกจตรวจสอบฉบับเต็มชื่อ `noah-reference-kit.zip` มี snapshot เดิม, asset ที่ตั้งชื่อใหม่, manifest และรายงาน audit แยกไว้แล้ว
