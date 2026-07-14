import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const path = join(process.cwd(), 'docs', 'master-project-worklist.md');
let source = await readFile(path, 'utf8');

const replacements = new Map([
  ['R-001', `### R-001 Architecture inventory และ ownership

สถานะ: ✅ DONE

- [x] Endpoint ownership matrix
- [x] Migration/deprecation plan
- [x] สร้าง \`docs/architecture/module-map.md\`
- [x] สร้าง \`docs/architecture/dependency-map.md\`
- [x] สร้าง \`docs/architecture/route-ownership.md\`
- [x] ระบุ owner ของทุก controller, route, cron และ background job
- [x] ระบุ database tables, side effects, permission และ audit event ของทุก critical route
- [x] ระบุ service ที่ถูกเรียกข้าม module พร้อมเหตุผล
- [x] ตรวจ circular dependency ระหว่าง Nest modules
- [x] ตรวจ deep import ข้าม module
- [x] กำหนด public entry point ของแต่ละ module
- [x] เพิ่ม architecture inventory check ใน CI

**หลักฐานปิดงาน:** \`docs/architecture/r001-closure.md\`, \`pnpm audit:r1-closure\`, architecture inventory/boundary gates ใน CI
`],
  ['R-002', `### R-002 Dependency rules และ module boundaries

สถานะ: ✅ DONE

- [x] กำหนด dependency direction: presentation → application → domain
- [x] แยก infrastructure adapter ออกจาก domain rule ด้วย boundary policy
- [x] ห้าม domain import NestJS, Prisma หรือ HTTP exception
- [x] ห้าม frontend import server-only package
- [x] ห้าม app import source ภายในของอีก app
- [x] เพิ่ม ESLint/import boundary rules และ static architecture enforcement
- [x] เพิ่ม forbidden-import script
- [x] เพิ่ม circular dependency scan
- [x] เพิ่ม CI gate สำหรับ architecture violation
- [x] บันทึกข้อยกเว้นชั่วคราวพร้อม owner และวันหมดอายุใน \`boundary-exceptions.md\`

**หลักฐานปิดงาน:** \`docs/architecture/r002-closure.md\`, \`pnpm audit:r2-closure\`, ไม่มี undocumented/expired exception
`],
  ['R-003', `### R-003 Regression safety net ก่อนย้ายโค้ด

สถานะ: ✅ DONE

- [x] ทำ test inventory แยก unit/integration/contract/database/browser/visual/concurrency
- [x] ระบุ critical flows ที่ยังไม่มี regression test
- [x] เพิ่ม characterization tests ให้ service ที่กำลังจะแยก
- [x] เพิ่ม state-transition tests สำหรับ deposit/withdrawal/KYC/watchlist/support/admin lifecycle
- [x] เพิ่ม permission policy tests สำหรับ critical mutations
- [x] เพิ่ม error-contract snapshots/guards
- [x] เพิ่ม database rollback tests สำหรับ transaction สำคัญตาม repository-level coverage
- [x] เพิ่ม test ป้องกัน duplicate settlement/idempotency regression
- [x] ห้าม refactor domain ใดหาก critical behavior ของ domain นั้นยังไม่มี test
- [x] เพิ่ม test failure summary ใน CI

**หลักฐานปิดงาน:** \`docs/architecture/r003-closure.md\`, \`pnpm audit:r3-closure\`, critical database/test-skip guards ใน CI
`],
  ['R-006', `### R-006 CI quality baseline

สถานะ: ✅ DONE

- [x] เพิ่ม \`lint:api\`, \`lint:admin\`, \`lint:member\`, \`lint:packages\`
- [x] เพิ่ม \`typecheck:api\`, \`typecheck:admin\`, \`typecheck:member\`, \`typecheck:packages\`
- [x] เพิ่ม shared ESLint config
- [x] เพิ่ม shared formatter config
- [x] เพิ่ม unused import/export checks
- [x] เพิ่ม forbidden import และ circular dependency checks
- [x] เพิ่ม generated-client/schema drift check
- [x] เพิ่ม migration validation gate
- [x] เพิ่ม test-skip detection สำหรับ critical suites
- [x] เพิ่ม browser console/network error failure gate
- [x] เพิ่ม artifact/failure summary
- [x] ทำ changed-files optimization โดยไม่ตัด critical dependency tests

**หลักฐานปิดงาน:** \`docs/architecture/r006-closure.md\`, \`pnpm audit:r6-closure\`, \`.github/workflows/r006-quality.yml\`
`],
]);

const order = ['R-001', 'R-002', 'R-003', 'R-004', 'R-005', 'R-006', 'R-007'];
for (const [id, replacement] of replacements) {
  const index = order.indexOf(id);
  const next = order[index + 1];
  const pattern = new RegExp(`### ${id}[^\\n]*[\\s\\S]*?(?=### ${next}\\b)`);
  if (!pattern.test(source)) throw new Error(`Unable to locate ${id} section in master worklist`);
  source = source.replace(pattern, `${replacement}\n`);
}

source = source.replace(/วันที่ตรวจล่าสุด: \*\*[^*]+\*\*/, 'วันที่ตรวจล่าสุด: **2026-07-14**');
await writeFile(path, source, 'utf8');
console.log('Synchronized R-001, R-002, R-003 and R-006 in docs/master-project-worklist.md');
