# Engineering Handoff

Updated: **2026-07-21**  
Status: **Active**

ใช้เอกสารนี้เมื่อส่งต่องานพัฒนา ดูแล production หรือรับช่วง incident ของ `platform-starter`

## 1. สิ่งที่ผู้รับช่วงต้องรู้ก่อนแก้โค้ด

1. อ่าน `AGENTS.md`, `docs/README.md`, `docs/master-project-worklist.md` และ `docs/operations/codebase-professionalization-audit.md`
2. ตรวจ runtime ด้วย `pnpm check:runtime`
3. ดูคำสั่งที่รองรับด้วย `pnpm help:commands`
4. ห้ามเดาสถานะงานจากข้อความแชตหรือเอกสารย่อย ให้ใช้ unchecked boxes ใน master worklist
5. งานการเงิน สิทธิ์ผู้ดูแล KYC provider migration และ module dependency ต้องมีหลักฐานก่อนปิด
6. ห้ามถือว่า build ผ่านเท่ากับ runtime ผ่าน ต้องตรวจ application bootstrap หรือ container startup ด้วย

## 2. ลำดับตรวจขั้นต่ำ

```bash
pnpm check:repository
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

เมื่อแก้ backend structure ให้เพิ่ม:

```bash
pnpm audit:backend-decomposition
pnpm check:architecture
pnpm typecheck:api
pnpm build:api
```

เมื่อแก้ Nest module, guard หรือ provider export/import ต้องตรวจ application bootstrap หรือ deployed startup เพิ่มด้วย

เมื่อทำ repository cleanup ให้เพิ่ม:

```bash
pnpm audit:r14-cleanup-inventory
pnpm audit:unused-exports
pnpm audit:circular-dependencies
pnpm audit:duplicate-structure
```

คำสั่งที่ระบุในเอกสารต้องมีอยู่จริงใน `package.json`; หากไม่พบให้แก้เอกสารหรือ command registry ก่อนส่งต่อ

## 3. ข้อมูลที่ต้องส่งมอบทุกครั้ง

- เป้าหมายและขอบเขตที่แก้
- commit SHA และ branch
- คำสั่งที่รันพร้อมผลผ่าน/ไม่ผ่าน
- application bootstrap/container startup result
- migration หรือ environment variable ที่เกี่ยวข้อง
- production URL หรือ deployment identity ที่ตรวจแล้ว
- ความเสี่ยงคงเหลือและ rollback path
- เอกสารหรือ evidence ที่อัปเดต
- owner และ next action

## 4. Stop conditions

หยุด deploy และส่งต่อให้เจ้าของระบบเมื่อพบอย่างใดอย่างหนึ่ง:

- migration status ไม่ตรงกับ schema ที่ deploy
- wallet กับ ledger ไม่สมดุล
- permission หรือ session behavior ไม่ตรง contract
- Nest dependency injection/startup ไม่ผ่าน
- provider/webhook signature ตรวจไม่ได้
- private storage เปิด public access
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
Bootstrap/startup:
Migration status:
Deployment identity:
Remaining risks:
Rollback:
Evidence/docs:
Next owner/action:
```

## 6. แหล่งข้อมูลหลัก

- `docs/operations/support-runbook.md`
- `docs/operations/verification-commands.md`
- `docs/operations/ci-alert-response.md`
- `docs/operations/codebase-professionalization-audit.md`
- `docs/architecture/backend-decomposition-policy.md`
- `docs/maintenance/repository-cleanup-policy.md`
- `docs/production-runbook.md`
