# P2 Closure Report

วันที่ปิด implementation lane: 2026-07-14

## สรุป

P2 Product Completion ปิดในขอบเขต repository implementation และ CI evidence แล้ว ระบบหลักของ Member, Admin, CMS, Promotion และ KYC มี implementation อยู่ใน `main` และมีคำสั่งรวมสำหรับตรวจซ้ำด้วย `pnpm verify:p2`.

งานที่ต้องใช้บัญชีทดสอบจริง, browser executable, deployed URL หรือ provider environment ไม่ถูกนับเป็น implementation gap และยังคงเป็น external verification backlog.

## สถานะรายงาน

- M-011 Member home/game discovery: implementation complete; เหลือ authenticated visual และ provider-down/game-launch regression ใน environment จริง
- M-012 Deposit/withdraw member UI: implementation complete; เหลือ responsive money-flow และ retry/error browser regression
- M-013 Member profile/security: implementation complete; เหลือ authenticated accessibility/visual regression
- M-014 Notifications: implementation complete; เหลือ optimistic rollback browser regression
- M-015 Support/FAQ: feature, attachment metadata lifecycle, ownership, MIME/size policy และ tests มีแล้ว; การอัปโหลด binary โดยตรงใน support UI ถูกย้ายไป P5 storage hardening เพื่อใช้ storage contract กลางแทนการสร้างระบบไฟล์ซ้ำ
- M-016 Admin settings/CMS: binary upload, storage lifecycle, safe delete, public asset delivery และ Admin UI มีแล้ว; เหลือ authenticated CMS browser regression
- M-017 Reports/activity/risk/security admin: implementation complete; เหลือ seeded-data correctness และ authenticated visual regression
- M-018 Promotion/bonus/affiliate/commission: DONE; real-money enablement ยังติด provider-specific UAT
- M-019 CMS/member content: binary asset lifecycle และ Member URL resolution มีแล้ว; เหลือ visual regression
- M-020 KYC/risk: watchlist/KYC PostgreSQL suites, Admin review UI, Member upload/submission UI และ responsive browser workflow มีแล้ว; เหลือ deployed authenticated regression

## หลักฐานสำคัญ

- CMS binary lifecycle และ tests
- Admin CMS upload/safe-delete UI
- Member CMS asset resolution ผ่าน API origin
- KYC Admin review queue/document workflow UI
- KYC Member upload/submission UI
- PostgreSQL risk-watchlist และ KYC concurrency suites ใน Build workflow
- Promotion settlement concurrency suite
- API, Admin และ Member builds

## คำสั่งตรวจ

```bash
pnpm verify:p2
```

คำสั่งนี้รัน permission audits, API tests, promotion/risk/KYC PostgreSQL suites และ build ทั้งสามแอป.

## External verification backlog

รายการต่อไปนี้ต้องมี environment ที่อนุมัติและไม่ควรถูกปลอมเป็นผลผ่านจาก source code เพียงอย่างเดียว:

- authenticated six-viewport visual regression
- credentialed deposit/withdraw browser regression
- notification optimistic rollback regression
- support/CMS authenticated thread regression
- reports/risk seeded-data correctness regression
- deployed KYC/risk regression
- provider-down/game-launch regression
- provider-specific promotion UAT

## ข้อกำหนดหลังปิด

P2 ไม่ควรถูกเปิดใหม่เพราะงาน storage hardening, browser evidence หรือ provider UAT เพียงอย่างเดียว งานเหล่านั้นให้ติดตามใน P5 หรือ external verification backlog ตามประเภทของงาน.
