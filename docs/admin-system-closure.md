# Admin System Closure

## สถานะ

เอกสารนี้เป็น handoff owner ของ Admin หลังการปิด P1–P8, Core Reliability, PR-2 UI/functional closure, layout integrity และ PR-3 authenticated staging acceptance

## ระบบที่ถือว่ามี owner แล้ว

- Appearance, theme, light/dark, density และ responsive shell
- Navigation, dashboard, widgets, charts และ command surfaces
- RBAC, multi-role, team access, explicit ALLOW/DENY และ delegated access
- Member administration, KYC, VIP, risk, sessions และ audit history
- Finance operations: wallet, ledger, deposit, withdrawal และ reconciliation
- Provider/game administration, maintenance, category/platform visibility และ operational controls
- CMS/media/site settings, branding, feature visibility และ content operations
- Reports, analytics, security, risk, operations และ release-readiness surfaces

ห้ามสร้าง owner ใหม่ซ้ำกับระบบข้างต้นโดยไม่มีการย้าย ownership ที่ชัดเจน

## Release gates

การเปลี่ยน Admin ต้องผ่าน gate ที่เกี่ยวข้องบน commit เดียวกัน:

1. Build, typecheck และ Admin unit/source contracts
2. R-006 Quality Baseline และ P5 Security Audit
3. Admin Verification & Bundle
4. Admin Browser Regression Matrix
5. Full-System Automated Tests เมื่อกระทบ runtime/API/shared contracts
6. Admin PR-3 Staging Acceptance เมื่อกระทบ auth, permissions, Admin routes, API, Prisma, preferences หรือ release matrix

ผลจาก commit เก่า, run ที่ cancelled หรือ branch ที่ถูก supersede ไม่นับเป็น release evidence

## Permission authority

- API guard เป็น authority ของ effective permissions หลัง role, delegation, ALLOW และ DENY resolution
- `/admin/auth/me` ต้องสะท้อน effective session permissions ตามที่ guard ส่งมา
- explicit empty permission set หลัง wildcard DENY ต้องคงเป็น empty set
- role permissions ใช้เป็น fallback ได้เฉพาะ legacy caller ที่ไม่ได้ส่ง session permissions
- UI navigation ใช้ profile/effective permissions เพื่อแสดงผล แต่ API guard ยังเป็น enforcement boundary เสมอ

## Data and mutation safety

- Production verification เป็น read-only เว้นแต่มี workflow ที่ออกแบบ mutation โดยเฉพาะ
- Acceptance mutation ต้องใช้ disposable environment และต้อง restore baseline ใน `finally`
- ห้ามทำเงินจริง, wallet transfer, ledger mutation, deposit/withdrawal mutation หรือ provider transfer ใน browser acceptance
- Seed/test persona ต้อง fail-closed เมื่อชี้ไป production หรือ non-local database

## Evidence and secrets

- Artifact ห้ามบันทึก password, JWT, bearer token, secret หรือ production credentials
- Runtime logs ที่อัปโหลดต้อง redact ก่อน
- Health/version evidence ต้องยืนยัน commit identity ของ build ที่กำลังตรวจ

## Maintenance

เมื่อพบ CI alert บน branch Admin เก่าที่ถูกแทนด้วยงานบน `main` แล้ว ให้ปิดเป็น obsolete/superseded แทนการแก้ branch โบราณแยกกัน การแก้ไขใหม่ต้องเริ่มจาก `main` ปัจจุบันเพื่อไม่สร้าง architecture สองชุด
