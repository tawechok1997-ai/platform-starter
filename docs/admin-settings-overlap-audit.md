# Admin Settings Ownership and Overlap Audit

Branch: `feature/member-branding-foundation`

## เป้าหมาย

ทำให้หน้า Admin ใช้โครง UI และระบบเดิมร่วมกัน โดยไม่สร้างฟอร์ม, uploader, preview, history, audit หรือ permission framework ซ้ำเป็นรายหน้า

## Ownership Matrix

| พื้นที่ | เจ้าของข้อมูล | ขอบเขต |
|---|---|---|
| Website | `/admin/settings/website` | โดเมน ภาษา สกุลเงิน timezone maintenance login/register switches |
| Branding | `/admin/settings/branding` | โลโก้ สี ฟอนต์ radius content width และภาพ placeholder |
| Member Content | Website settings เดิมในระยะเปลี่ยนผ่าน | heading, label, empty message และข้อความทั่วไปของ Member |
| Auth Presentation | Website + Branding | title/subtitle อยู่ Website, logo/color/font อยู่ Branding |
| Icons | `/admin/settings/icons` | เมนู หมวดเกม quick actions และ notification icons |
| Promotions/CMS | Promotion Center และ CMS assets | banner, promotion, announcement, popup และ media ของแคมเปญ |
| Game API | Game API Settings | provider, game, category และ media จาก Game API |
| Asset Transport | `/admin/settings/cms-assets` | upload, validation, checksum และ storage metadata |
| History | `SiteSettingHistory` | version history และ rollback ของ settings |
| Audit | `AdminAuditLog` | actor, action, old/new data, IP และ user agent |
| Permission | permission framework เดิม | view, update และ publish ตาม resource/action |

## จุดซ้ำที่ยืนยันแล้ว

### Form lifecycle

`SettingsSectionPage` และ `WebsiteSettingsPage` ต่างมี load, form state, dirty state, beforeunload, save, reset และ notice ของตัวเอง

สถานะ: 🔄 ต้องรวม logic เป็น hook กลาง โดยยังอนุญาต layout เฉพาะหน้า

### Preview

มี inline preview ใน Settings กลาง, preview เฉพาะ Website และ full-page Branding preview

กติกา:

- Inline preview ใช้ตรวจ field ที่กำลังแก้
- Full-page preview ใช้ตรวจ Member Desktop/Tablet/Mobile
- ห้ามสร้าง full-page preview implementation ใหม่ในแต่ละ settings page

### Asset upload

Branding ต้องใช้ `/admin/settings/cms-assets` เดิมเท่านั้น

สถานะ: ✅ ใช้ transport เดิม ไม่มี uploader backend ชุดใหม่

### Version, rollback และ audit

Branding ใช้ `SiteSettingHistory` และ `AdminAuditLog` เดิม

สถานะ: ✅ ไม่มีตารางหรือ audit subsystem ซ้ำ

## ขอบเขตที่ห้ามทับกัน

- Branding ห้ามเก็บ promotion list, announcement content หรือ game catalog
- Website ห้ามเก็บ logo binary metadata, menu icons หรือ game category icons
- Icons ห้ามสร้าง provider/game catalog สำรอง
- Promotion Center ห้ามสร้าง branding color/font settings ซ้ำ
- Game API Settings ห้ามสร้าง Member navigation labels ซ้ำ

## แผนลดความซ้ำ

1. ✅ ปรับ Branding workflow ให้ใช้ AdminActionStrip, AdminLinkButton และ spacing system เดิม
2. 🔄 แยก ownership test ป้องกัน settings key ข้ามหมวด
3. ⬜ สร้าง `useAdminSettingsForm` สำหรับ load/save/reset/dirty/beforeunload
4. ⬜ ย้าย Website และ SettingsSectionPage มาใช้ hook กลาง
5. ⬜ กำหนด inline preview contract กลาง
6. ⬜ ตรวจ Promotion Center, Icons และ Game API Settings รอบสุดท้าย
7. ⬜ รัน Admin lint/test/typecheck/build และ browser acceptance

## สิ่งที่ยังไม่ย้ายในรอบนี้

ข้อความ Member และ Auth ยังอยู่ใน Website settings เพื่อรักษา API contract เดิม การแยกเป็นหน้า UI ใหม่ทำได้ภายหลังโดยใช้ key และ endpoint เดิม ไม่ต้องย้ายฐานข้อมูลหรือสร้าง settings group ซ้ำ
