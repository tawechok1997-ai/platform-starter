# รายการ Asset ที่ใช้ได้และสิ่งที่ต้องหาเพิ่ม

อัปเดต: 22 กรกฎาคม 2026

ขอบเขต: `asset/catalog` และ `apps/web-member/public/images`

## สรุป

- ✅ มีรูปเกมสำหรับ PC 1,037 ไฟล์ และชุดข้อมูลชื่อเกม/ประเภท/Provider สำหรับทำ mock API
- ✅ มีโลโก้ Provider สำหรับ PC 184 ไฟล์ และ Mobile 83 ไฟล์
- ✅ มีโลโก้ธนาคารไทย 17 ธนาคาร ทั้ง PC และ Mobile
- ✅ มีแบนเนอร์ PC 19 ไฟล์, Mobile 13 ไฟล์ และรูปโปรโมชั่น Mobile 25 ไฟล์
- ✅ มีไอคอนหมวดเกมครบ 7 หมวด, ธงภาษา, UI, อันดับ และ Tournament
- ⚠️ ไฟล์ใน `asset/catalog` ยังไม่ถูกเว็บเรียกตรง ต้องคัดเฉพาะที่เลือกไปไว้ใน `public` หรือทำ asset registry ก่อนใช้
- ⚠️ มี asset ซ้ำระหว่าง PC/Mobile 97 กลุ่ม ไม่ควรคัดลอกซ้ำโดยไม่จำเป็น

เอกสารข้อมูลดิบ:

- `asset/catalog/pc/manifest.json`
- `asset/catalog/mobile/manifest.json`
- `docs/generated/game-asset-duplicates.json`

## Asset ที่ใช้ได้ทันที

### เกมและ Provider

| งาน | ที่อยู่ | หมายเหตุ |
|---|---|---|
| รูปปกเกม PC | `asset/catalog/pc/games/` | ใช้หน้าค้นหาเกม, card เกม, mock API |
| ข้อมูลเกม | `asset/catalog/pc/games/api.noproky.net/lobby/games/min.json` | มีชื่อไทย/อังกฤษ, ประเภท, Provider และรหัสรูป |
| โลโก้ Provider PC | `asset/catalog/pc/providers/` | ใช้หน้า Provider, filter และ game card |
| โลโก้ Provider Mobile | `asset/catalog/mobile/providers/` | มีแบบแนวนอน, แนวตั้ง และ badge |
| Provider ที่มีแล้ว | PGSoft, Pragmatic Play, Evolution, CQ9, Jili, Joker, NetEnt, Nolimit City, Habanero, Red Tiger, SABA และอื่น ๆ | ตรวจสิทธิ์ใช้ก่อนเปิดจริง |

### การเงิน

ใช้กับหน้าฝากเงิน, ถอนเงิน, บัญชีธนาคาร และเลือกธนาคาร:

`baac`, `bay`, `bbl`, `cimbt`, `exim`, `ghb`, `gsb`, `kbank`, `kkp`, `ktb`, `lhfg`, `scb`, `tcd`, `tisco`, `tmn`, `ttb`, `uobt`

ที่อยู่: `asset/catalog/mobile/banks/` และ `asset/catalog/pc/banks/`

### Member lobby และหน้าประเภทเกม

| งาน | ที่อยู่ | สถานะ |
|---|---|---|
| ไอคอนหมวดเกม 7 หมวด | `apps/web-member/public/images/member-lobby/source-icons/category-*.svg` | ✅ ใช้ได้ |
| Sprite ไอคอนหมวดเกม | `apps/web-member/public/images/member-lobby/source-icons/category-icons-final-v4.png` | ✅ ใช้ได้ |
| พื้นหลัง/ชื่อสล็อต | `asset/catalog/pc/games/noah345.shop/images/game/slot/` | ✅ มีพื้นหลัง `1920×600` |
| พื้นหลัง/ชื่อ คาสิโน, ยิงปลา, กีฬา, ไพ่, หวย | `asset/catalog/pc/images/noah345.shop/images/game/` | ✅ ใช้ทำ hero ของแต่ละหมวดได้ |
| ธงภาษา | `asset/catalog/mobile/flags/` และ `asset/catalog/pc/flags/` | ✅ มีไทยและอังกฤษ |
| UI/อันดับ/Tournament | `asset/catalog/mobile/ui/`, `asset/catalog/pc/images/noah345.shop/images/leaderboard/` | ✅ ใช้ได้ |

### Asset ที่เว็บใช้อยู่แล้ว

- พื้นหลังหน้าเข้าสู่ระบบ: `apps/web-member/public/images/auth-luxury-architecture.webp`
- ภาพ hero หน้า Member: `apps/web-member/public/images/member-lobby/battle-arena.png`
- รูปโปรโมชั่น 5 รายการ: `apps/web-member/public/images/member-lobby/promotions/`
- กระเป๋าเงิน, อันดับ, Tournament และโลโก้ fallback: `apps/web-member/public/images/member-lobby/noah345-reference/`

## จุดที่แก้แล้ว ไม่ต้องหาไฟล์เพิ่ม

- [x] ลบ CSS เก่าที่ไม่ได้ถูก import และเรียก `category-*-v2.png` ซึ่งไม่มีอยู่จริง
- [x] Style ที่เว็บใช้งานจริงเรียก SVG ใน `source-icons/category-*.svg` ครบทั้ง 7 หมวดแล้ว
- [ ] ไม่ใช้ `category-home.png.b64` ตอน runtime เพราะเป็นไฟล์ข้อมูล ไม่ใช่รูปที่เว็บแสดงได้
- [ ] ทำ asset registry เดียว เพื่อเลือกไฟล์ PC/Mobile และไม่คัดลอก asset ซ้ำ

## สิ่งที่ต้องหาเพิ่ม

### เร่งด่วน

- [ ] โลโก้แบรนด์ของเรา: SVG พื้นหลังโปร่งใส, สีสว่าง, สีเข้ม, เวอร์ชันย่อสำหรับมือถือ
- [ ] ไอคอนเว็บ: favicon, Apple touch icon, และ PWA icon ขนาด 192px/512px
- [ ] แบนเนอร์ของเราเองอย่างน้อย 5 ชุด: Desktop `1920×600`, Mobile `1200×500`
- [ ] ภาพพื้นหลังหน้าเข้าสู่ระบบของเราเอง: อย่างน้อย `1920×1080`

### ตามความจำเป็น

- [ ] รูปโปรโมชันแบบ card ของเราเอง สำหรับโบนัส, คาสิโน, สล็อต, กีฬา และสมาชิกใหม่
- [ ] ภาพ placeholder avatar ของแบรนด์ สำหรับกรณีสมาชิกหรือแอดมินยังไม่มีรูป
- [ ] ภาพ empty state เฉพาะแบรนด์ 3 แบบ: ไม่พบเกม, ไม่พบรายการ, ยังไม่มีแจ้งเตือน

## สิ่งที่ยังไม่ต้องหา

- ไอคอนเมนูทั่วไป เช่น ค้นหา, แจ้งเตือน, ตั้งค่า, ดูรหัสผ่าน, ปิดหน้าต่าง และ filter ใช้ icon component ในระบบได้ ไม่จำเป็นต้องเป็นรูป
- ไอคอนหมวดเกมทั้ง 7 หมวดมีครบแล้ว
- โลโก้ธนาคารและ Provider มีสำหรับการทำ mockup/ทดสอบแล้ว

## ข้อควรระวังก่อนเปิดใช้งานจริง

- รูปเกม, โลโก้ Provider, โลโก้ธนาคาร และแบนเนอร์ที่มาจาก catalog เป็น asset อ้างอิง/ทดสอบ
- ก่อนเปิดใช้บน production ต้องยืนยันสิทธิ์ใช้ภาพ, เครื่องหมายการค้า และเนื้อหาโปรโมชั่น
- แบนเนอร์และโลโก้แบรนด์ของเราเองควรใช้แทน asset อ้างอิงเป็นลำดับแรก
