# Engineering Handoff

Updated: **2026-07-31**  
Owner: **Platform Engineering / Release Management**  
Status: **Active**

ใช้เอกสารนี้เมื่อส่งต่องานพัฒนา ดูแล production หรือรับช่วง incident ของ `platform-starter`

## 1. สิ่งที่ผู้รับช่วงต้องรู้ก่อนแก้โค้ด

1. อ่าน `docs/GETTING_STARTED.md`, `AGENTS.md`, `docs/README.md`, `docs/master-project-worklist.md` และ `docs/operations/codebase-professionalization-audit.md`
2. ตรวจ runtime ด้วย `pnpm check:runtime`
3. ดูคำสั่งที่รองรับด้วย `pnpm help:commands`
4. ห้ามเดาสถานะงานจากข้อความแชตหรือเอกสารย่อย ให้ใช้ unchecked boxes ใน master worklist
5. งานการเงิน สิทธิ์ผู้ดูแล KYC provider migration public assets และ module dependency ต้องมีหลักฐานก่อนปิด
6. ห้ามถือว่า build ผ่านเท่ากับ runtime ผ่าน ต้องตรวจ application bootstrap หรือ container startup ด้วย
7. ห้ามส่งมอบ build ที่แก้ tracked files หรือมี generated/reference drift

## 2. ลำดับตรวจขั้นต่ำ

```bash
pnpm check:repository
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node tools/audit-build-purity.mjs
node tools/audit-public-assets.mjs
```

เมื่อแก้ backend structure ให้เพิ่ม:

```bash
pnpm audit:backend-decomposition
pnpm check:architecture
pnpm typecheck:api
pnpm build:api
node tools/verify-api-startup.mjs
```

Startup verifier ต้องมี API build, database ที่ migrate แล้ว และ environment สำหรับการตรวจ

เมื่อแก้ browser/security headers ให้รัน rendered smoke และตรวจ console/network/CSP ที่ viewport สำคัญ

เมื่อทำ repository cleanup ให้เพิ่ม:

```bash
pnpm audit:r14-cleanup-inventory
pnpm audit:unused-exports
pnpm audit:circular-dependencies
pnpm audit:duplicate-structure
node tools/audit-public-assets.mjs
```

การ rewrite Git history ใช้ `docs/operations/repository-size-migration.md` และต้องมี owner approval แยกจาก feature PR

คำสั่ง `pnpm` ที่ระบุในเอกสารต้องมีอยู่จริงใน `package.json`; direct Node checks ต้องชี้ไฟล์ที่มีอยู่จริง

## 3. ข้อมูลที่ต้องส่งมอบทุกครั้ง

- เป้าหมายและขอบเขตที่แก้
- commit SHA และ branch
- คำสั่งที่รันพร้อมผลผ่าน/ไม่ผ่าน
- clean-tree result หลัง build
- application bootstrap/container startup result
- migration หรือ environment variable ที่เกี่ยวข้อง
- security-header/public-asset impact เมื่อเกี่ยวข้อง
- production URL หรือ deployment identity ที่ตรวจแล้ว
- ความเสี่ยงคงเหลือและ rollback path
- เอกสารหรือ evidence ที่อัปเดต
- owner และ next action

## 4. Stop conditions

หยุด deploy และส่งต่อให้เจ้าของระบบเมื่อพบอย่างใดอย่างหนึ่ง:

- migration status ไม่ตรงกับ schema ที่ deploy
- wallet กับ ledger ไม่สมดุล
- permission, cache หรือ session behavior ไม่ตรง contract
- Nest dependency injection/startup ไม่ผ่าน
- `/health` degraded หรือ `/version` ไม่ตรง approved commit
- provider/webhook signature ตรวจไม่ได้
- private storage เปิด public access
- copied executable bundle เปิดผ่าน public route
- build ทำให้ tracked tree เปลี่ยน
- build identity ไม่ตรง commit ที่ตั้งใจปล่อย
- cleanup candidate ยังมี reference หรือไม่มีเจ้าของอนุมัติ
- มีคำสั่ง verification ใน runbook ที่ไม่มีอยู่จริง

## 5. Template สรุปส่งต่องาน

```text
Scope:
Owner:
Commit:
Branch:
Environment:
Checks passed:
Checks failed/blocked:
Build clean tree:
Bootstrap/startup:
Health/version identity:
Migration status:
Deployment identity:
Security/public assets:
Remaining risks:
Rollback:
Evidence/docs:
Next owner/action:
```

## 6. แหล่งข้อมูลหลัก

- `docs/GETTING_STARTED.md`
- `docs/TROUBLESHOOTING.md`
- `docs/operations/support-runbook.md`
- `docs/operations/verification-commands.md`
- `docs/operations/ci-alert-response.md`
- `docs/operations/codebase-professionalization-audit.md`
- `docs/security/public-assets.md`
- `docs/architecture/backend-decomposition-policy.md`
- `docs/maintenance/repository-cleanup-policy.md`
- `docs/operations/repository-size-migration.md`
- `docs/production-runbook.md`
