# Member Branding Progress Round 3

Branch: `feature/member-branding-foundation`

## Completed

- ✅ R009, R012 และ R013 verification ผ่านบน branch
- ✅ ลบ Closure Diagnostics workflow ชั่วคราวแล้ว
- ✅ Sync branch กับ `main` แบบ merge commit โดยไม่ force push
- ✅ นำเข้า `support-headset.webp` เป็น binary จริงและตรวจ Git blob SHA ตรงกับไฟล์ต้นฉบับ
- ✅ ผูก Support asset เข้ากับ Member runtime default
- ✅ เพิ่ม Support asset เข้า reference asset integrity audit
- ✅ เพิ่ม Logo variants และ system image fields ใน Admin Branding Settings
- ✅ เพิ่มข้อความ Home, Promotion, Games, Auth และ action labels ใน Admin Website Settings
- ✅ เพิ่ม unsaved-change guard, Reset และ Member content preview ใน Website Settings

## Remaining

- ⛔ Announcement, Jackpot และ Promotion background ถูกแตกจาก RAR แล้ว แต่การส่ง PNG ผ่าน connector ทำ checksum เปลี่ยน จึงยังไม่ commit ไฟล์เสียเข้า branch
- 🔄 ปรับ Auth และ Member Home ให้ตรงภาพต้นแบบละเอียด
- 🔄 ตรวจ Mobile/Desktop ด้วย browser จริง
- ⬜ Upload/Replace/Disable/Restore สำหรับโลโก้และไอคอน
- ⬜ Full-page Member preview สำหรับ Desktop/Tablet/Mobile
- ⬜ Draft/Publish/Version/Rollback
- ⬜ แยกสิทธิ์ Edit/Publish และเพิ่ม Audit log
- 🧪 Admin Verification, Build และ full clean CI ของฟอร์มรอบล่าสุดกำลังรัน

## Incident note

มีการสร้าง `docs/member-branding-parallel-execution.tmp.md` โดยไม่ตั้งใจหนึ่ง commit และลบทิ้งทันทีใน commit ถัดมา ไม่มีไฟล์ `.tmp` ค้างอยู่ใน branch ปัจจุบัน
