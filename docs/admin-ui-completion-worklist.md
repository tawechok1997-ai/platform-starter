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
| Authenticated mobile runtime verification | ⏸️ External dependency | ต้องใช้ seeded Admin credentials และ deployed environment ที่เข้าถึงข้อมูลจริง |

## Regression gates

- `apps/web-admin/src/features/admin-redesign/admin-foundation.spec.ts`
- `apps/web-admin/src/features/admin-redesign/admin-ui-completion.spec.ts`
- `tests/e2e-smoke/admin-critical-routes.json`
- `tests/e2e-smoke/admin-deployment-matrix.spec.ts`
- `.github/workflows/admin-deployment-browser-qa.yml`

## Critical route coverage

Browser QA ตรวจ 15 protected routes บน viewport 320, 360, 390, 768, 1024 และ 1440 พิกเซล ครอบคลุม Wallet, Top-up, Withdrawal, Ledger, Reconciliation, Reports, Export, Promotion, Risk, AML และ Blacklist

## งานที่ยังเหลือจริง

- [ ] รัน authenticated browser matrix ด้วย seeded Admin credentials
- [ ] ตรวจข้อมูลจริงและ interaction สำคัญบน mobile viewport
- [ ] เก็บ visual evidence จาก deployment และปิดผลต่างที่พบ

งานข้างต้นเป็น runtime verification ไม่ใช่งาน implementation คงค้างใน source code
