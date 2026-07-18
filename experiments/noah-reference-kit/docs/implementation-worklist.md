# Reference Kit Implementation Worklist

Branch: `experiment/noah-reference-kit`

กติกา:

- ทำเฉพาะใน `experiments/noah-reference-kit` จนกว่าจะผ่าน review และ verification
- ห้าม import จาก `apps/web-member`, `apps/web-admin` หรือ `apps/api` เข้ามาในชุดทดลอง
- ห้ามเชื่อม route, API, session, wallet, finance หรือ provider จริง
- ใช้ shared contracts/design tokens ของโปรเจกต์เป็นแนวทาง แต่ยังไม่แก้ของ production
- ทุกงานต้องมี implementation evidence และรายการ validation

## สถานะรวม

| กลุ่ม | ทั้งหมด | เสร็จ | เหลือ |
|---|---:|---:|---:|
| A. Audit และ mapping | 5 | 4 | 1 |
| B. Asset normalization | 5 | 0 | 5 |
| C. Component contracts | 8 | 1 | 7 |
| D. Isolated showcase | 6 | 0 | 6 |
| E. Verification | 6 | 0 | 6 |
| **รวม** | **30** | **5** | **25** |

## A. Audit และ mapping

- [x] A01 ตรวจ inventory ของ archive และแยก JS/CSS/image/SVG/HAR
- [x] A02 สร้าง catalog component จาก production chunks
- [x] A03 ทำ dependency map ของ chunk ที่ขาดและ external libraries
- [ ] A04 ทำ mapping จาก component ต้นทางไปยัง feature ของ Member
- [x] A05 ทำรายการสิ่งต้องห้ามนำมาใช้ตรง ๆ เช่น endpoint, credential, domain และ tracking code

## B. Asset normalization

- [ ] B01 ตั้งชื่อ asset เป็นภาษาอังกฤษแบบ semantic
- [ ] B02 แยก icon, navigation, promotion, game, badge และ decorative assets
- [ ] B03 ตรวจ duplicate ด้วย SHA-256 และ dimensions
- [ ] B04 สร้าง typed asset manifest
- [ ] B05 ระบุ license/provenance และ replacement-required assets

## C. Component contracts

- [x] C01 แบ่ง component catalog เป็น domain groups
- [ ] C02 สร้าง contract สำหรับ shell/header/navigation
- [ ] C03 สร้าง contract สำหรับ promotion/highlight/tournament
- [ ] C04 สร้าง contract สำหรับ game discovery/provider/game card
- [ ] C05 สร้าง contract สำหรับ leaderboard/winner/jackpot
- [ ] C06 สร้าง contract สำหรับ privilege/reward/progress
- [ ] C07 สร้าง contract สำหรับ modal/notification/empty state
- [ ] C08 สร้าง mock data contracts ที่ไม่ผูก API จริง

## D. Isolated showcase

- [ ] D01 สร้าง static showcase shell ภายใน experiment เท่านั้น
- [ ] D02 ทำ responsive navigation mock
- [ ] D03 ทำ promotion/highlight mock
- [ ] D04 ทำ game discovery mock
- [ ] D05 ทำ tournament/leaderboard mock
- [ ] D06 ทำ states: loading, empty, error และ locked

## E. Verification

- [ ] E01 TypeScript strict check สำหรับ reference kit
- [ ] E02 ตรวจไม่มี production import
- [ ] E03 ตรวจไม่มี hard-coded external endpoint/domain
- [ ] E04 ตรวจ keyboard/focus/ARIA contracts
- [ ] E05 ตรวจ responsive viewport matrix
- [ ] E06 สรุป migration plan ก่อนเชื่อมเข้าหน้าจริง

## ชุดที่กำลังทำ

Batch 1: A04 และ C02-C03
