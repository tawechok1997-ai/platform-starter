# Admin UI Completion Worklist

เอกสารนี้เป็น source of truth สำหรับงาน UI/UX ฝั่ง Web Admin ที่เคยติดตามแยกเป็น Wallet, Promotion, Risk, Reports และ Mobile Audit

อัปเดตล่าสุด: 2026-07-21

## สถานะรวม

| กลุ่ม | สถานะ | หลักฐาน |
|---|---|---|
| Wallet UI | ✅ Implementation complete | shared metric grid, notice, empty/loading state, confirmation dialog และ finance foundation regression |
| Promotion Module | ✅ Implementation complete | campaign, banner, bonus, coupon, reward, claim summary, search/filter และ validation |
| Risk Module | ✅ Implementation complete | dashboard, AML, blacklist, alerts, timeline, investigation และ standard investigation flow |
| Reports UX | ✅ Implementation complete | date filters, export UX, loading/empty states, accessible trend chart, queue aging และ reconciliation |
| Responsive / Mobile static coverage | ✅ Guarded | six viewport route matrix, horizontal overflow guard, semantic checks และ Axe scan |
| Authenticated runtime acceptance | ⏸️ External dependency | รัน workflow ในโหมด `require_authentication=true` ด้วย seeded Admin credentials เพื่อปิด acceptance ทั้งชุดในครั้งเดียว |

## Regression gates

- `apps/web-admin/src/features/admin-redesign/admin-foundation.spec.ts`
- `apps/web-admin/src/features/admin-redesign/admin-ui-completion.spec.ts`
- `tests/e2e-smoke/admin-critical-routes.json`
- `tests/e2e-smoke/admin-deployment-matrix.spec.ts`
- `.github/workflows/admin-deployment-browser-qa.yml`

## Critical route coverage

Browser QA ตรวจ 15 protected routes บน viewport 320, 360, 390, 768, 1024 และ 1440 พิกเซล ครอบคลุม Wallet, Top-up, Withdrawal, Ledger, Reconciliation, Reports, Export, Promotion, Risk, AML และ Blacklist

## งานที่ยังเหลือจริง

- [ ] รัน **Authenticated Runtime Acceptance** หนึ่งครั้งด้วย seeded Admin credentials

Acceptance gate เดียวนี้รวมงานเดิมทั้งหมด:

- authenticated browser matrix
- ข้อมูลจริงและ interaction สำคัญบน mobile viewport
- full-page visual evidence จาก deployment
- horizontal overflow, title, meaningful content, console/page/request failures
- semantic accessibility และ Axe WCAG checks

เมื่อ workflow สำเร็จในโหมด `require_authentication=true` manifest จะตั้ง `acceptance.complete=true` และระบุสาม work item เดิมเป็นรายการที่ปิดแล้วอัตโนมัติ

งานที่เหลือนี้เป็น runtime verification ที่ต้องใช้ credentials ภายนอก ไม่ใช่งาน implementation คงค้างใน source code
