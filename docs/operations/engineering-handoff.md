# Engineering Handoff

ใช้เอกสารนี้เมื่อส่งต่องานพัฒนา ดูแล production หรือรับช่วง incident ของ `platform-starter`

## 1. สิ่งที่ผู้รับช่วงต้องรู้ก่อนแก้โค้ด

1. อ่าน `AGENTS.md`, `docs/README.md` และ `docs/master-project-worklist.md`
2. ตรวจ runtime ด้วย `pnpm check:runtime`
3. ดูคำสั่งที่รองรับด้วย `pnpm help:commands`
4. ห้ามเดาสถานะงานจากข้อความแชตหรือเอกสารย่อย ให้ใช้ unchecked boxes ใน master worklist
5. งานการเงิน สิทธิ์ผู้ดูแล KYC provider และ migration ต้องมีหลักฐานก่อนปิด

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
pnpm audit:backend-decomposition-baseline
pnpm check:architecture
```

เมื่อทำ repository cleanup ให้เพิ่ม:

```bash
pnpm audit:repository-cleanup
pnpm audit:repository-cleanup-baseline
```

## 3. ข้อมูลที่ต้องส่งมอบทุกครั้ง

- เป้าหมายและขอบเขตที่แก้
- commit SHA และ branch
- คำสั่งที่รันพร้อมผลผ่าน/ไม่ผ่าน
- migration หรือ environment variable ที่เกี่ยวข้อง
- production URL หรือ deployment identity ที่ตรวจแล้ว
- ความเสี่ยงคงเหลือและ rollback path
- เอกสารหรือ evidence ที่อัปเดต

## 4. Stop conditions

หยุด deploy และส่งต่อให้เจ้าของระบบเมื่อพบอย่างใดอย่างหนึ่ง:

- migration status ไม่ตรงกับ schema ที่ deploy
- wallet กับ ledger ไม่สมดุล
- permission หรือ session behavior ไม่ตรง contract
- provider/webhook signature ตรวจไม่ได้
- private storage เปิด public access
- build identity ไม่ตรง commit ที่ตั้งใจปล่อย
- cleanup candidate ยังมี reference หรือไม่มีเจ้าของอนุมัติ

## 5. Template สรุปส่งต่องาน

```text
Scope:
Commit:
Environment:
Checks passed:
Checks blocked:
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
- `docs/architecture/backend-decomposition-policy.md`
- `docs/maintenance/repository-cleanup-policy.md`
- `docs/production-runbook.md`
