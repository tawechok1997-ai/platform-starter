# Repository Tooling

โฟลเดอร์ `tools/` เก็บสคริปต์ที่ใช้ตรวจคุณภาพ สถาปัตยกรรม การทดสอบ และการ deploy ของทั้ง monorepo

## Tool categories

### Active quality gates

ใช้ในงานประจำวันหรือ CI หลัก:

- runtime validation
- lint and typecheck orchestration
- architecture boundary checks
- security and secret audits
- migration validation
- browser quality gates
- full-system test runner
- deployment identity and readiness checks

### Scope-specific verification

ใช้เมื่อแก้ส่วนที่เกี่ยวข้องเท่านั้น:

- finance and reconciliation
- KYC and private storage
- provider readiness
- shared API client
- Admin permissions
- browser visual and accessibility evidence

### Historical closure evidence

ไฟล์ที่ชื่อเกี่ยวกับ `r001` ถึง `r014`, `p4`, `p5` หรือ closure เฉพาะรอบ เป็นหลักฐานของงานสถาปัตยกรรมที่ปิดแล้ว ไม่ควรถูกเพิ่มเข้า default CI โดยไม่มีเหตุผลใหม่

## Rules for adding tools

1. Prefer one reusable tool over several near-duplicate scripts.
2. Every tool must have a root `package.json` command or be referenced by another documented runner.
3. Tools that mutate source files must not run during production builds.
4. Tools must return a non-zero exit code on a real failure.
5. JSON output must be opt-in and stable enough for CI consumption.
6. Never print credentials, tokens, private URLs or raw SQL containing sensitive values.
7. Add a test when the tool contains parsing, matching or policy logic that can regress.

## Naming

- `check-*`: runtime/readiness validation
- `audit-*`: static policy or repository inspection
- `test-*`: executable regression checks
- `run-*`: orchestration across multiple checks

## Maintenance review

During cleanup, classify each file as:

- `active`: required by current CI or operations
- `scoped`: required only for a specific domain
- `historical`: retained as closure evidence
- `unused`: no script, workflow or documentation references it

Delete only `unused` tools after confirming repository references. Do not move tools merely for cosmetic structure when doing so would break package scripts, workflows or evidence links.
