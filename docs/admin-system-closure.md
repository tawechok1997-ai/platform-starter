# Admin System Closure

## สถานะ

เอกสารนี้เป็น summary ของ Admin หลัง P1–P8, Core Reliability, UI/layout closure, authenticated PR-3 และ Admin closure audit วันที่ 2026-08-08

Canonical cross-domain handoff และ troubleshooting runbook อยู่ที่ `docs/admin-operations-handoff.md`.

## ระบบที่มี owner แล้ว

- Appearance, theme, light/dark, density และ responsive shell
- Navigation, dashboard, widgets, charts และ command surfaces
- RBAC, multi-role, team access, explicit ALLOW/DENY และ delegated access
- Member profile, wallet, transactions, bank masking, KYC, risk, sessions, login history และ audit history
- Finance operations: wallet, ledger, deposit/top-up, withdrawal, provider transfer และ reconciliation
- Provider/game administration, maintenance, category, PC/Mobile/Both platform, tags, assets และ operational controls
- CMS/media/site settings, branding, feature visibility และ content operations
- Reports, analytics, security, risk, operations และ release-readiness surfaces

### Explicit unresolved owner

Member **VIP** ยังไม่มี persistent backend source of truth/business rule ที่พิสูจน์ได้บน current `main`. ห้ามถือ UI fallback เป็น authority หรือสร้าง tier/threshold เอง. ติดตามที่ Issue #625.

ห้ามสร้าง owner ใหม่ซ้ำกับระบบที่ปิดแล้วโดยไม่มีการย้าย ownership ที่ชัดเจน

## Authenticated acceptance

PR #608 เป็น stale Draft ที่ถูก supersede และปิดโดยไม่ merge. Canonical acceptance คือ PR #622 ซึ่ง merge แล้วและครอบคลุม:

- 7 Admin personas
- 15 Tier-0 routes
- 225 Route × Persona × Browser × Viewport cases
- explicit DENY fail-closed
- real login + `/admin/auth/me` effective permissions
- Axe Serious/Critical gate
- runtime performance budgets
- reversible non-production preference mutation

## Release gates

การเปลี่ยน Admin ต้องผ่าน gate ที่เกี่ยวข้องบน commit เดียวกัน:

1. Build, typecheck และ Admin unit/source contracts
2. R-006 Quality Baseline และ P5 Security Audit
3. Admin Functional Capability Audit
4. Admin Verification & Bundle
5. Admin Browser Regression Matrix
6. R-013 UI/Visual gates เมื่อกระทบ presentation
7. Full-System Automated Tests เมื่อกระทบ runtime/API/shared contracts
8. Admin PR-3 Staging Acceptance เมื่อกระทบ auth, permissions, Admin routes, API, Prisma, preferences หรือ release matrix

ผลจาก commit เก่า, run cancelled หรือ branch superseded ไม่นับเป็น release evidence

## Permission authority

- API guard เป็น authority ของ effective permissions หลัง role, delegation, ALLOW และ DENY resolution
- `/admin/auth/me` ต้องสะท้อน effective session permissions ตามที่ guard ส่งมา
- explicit empty permission set หลัง wildcard DENY ต้องคงเป็น empty set
- UI navigation/action visibility เป็น UX เท่านั้น ไม่ใช่ authorization
- Risk/KYC ยังคงใช้ `risk.view`; ห้ามย้ายข้อมูลเหล่านี้ไปอยู่หลัง permission ที่อ่อนกว่าเพียงเพื่อทำหน้า Member detail ให้ดูครบ

## Money and mutation safety

- Production verification เป็น read-only เว้นแต่มี workflow mutation ที่ออกแบบเฉพาะ
- Acceptance mutation ใช้ disposable environment และ restore baseline ใน `finally`
- PR-3 ห้ามทำเงินจริง, wallet transfer, ledger, deposit/withdrawal หรือ provider transfer mutation
- Provider failed-transfer retry เป็น **real mutation** ที่ endpoint `/admin/game-transfers/:id/retry`; ต้องมี `game.providers.manage`, authenticated session context และ auditable reason
- deprecated `retry-dry-run` ต้องไม่ mutateเงินจริง
- wallet/provider mutation ต้องคง idempotency, row/state safety, reconciliation และ audit owner เดิม

## Evidence and secrets

- Artifact ห้ามบันทึก password, JWT, bearer token, secret หรือ production credentials
- Runtime logs ที่อัปโหลดต้อง redact ก่อน
- Sensitive account numbers ใน general Member detail ใช้ masked representation
- Health/version evidence ต้องยืนยัน commit identity ของ build ที่กำลังตรวจ

## Maintenance

เมื่อพบ CI alert บน branch Admin เก่าที่ถูกแทนด้วยงานบน `main` แล้ว ให้เทียบ head/CI ก่อนและปิดเป็น obsolete/superseded เฉพาะเมื่อพิสูจน์ได้ เช่น CI Alert #617 ที่ถูกแทนด้วย PR #615/#622/#624. ห้าม mass-close alert ของ Member หรือ current `main` เพียงเพราะชื่อคล้ายกัน
