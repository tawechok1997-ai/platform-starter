import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const path = join(root, 'docs', 'master-project-worklist.md');
let source = await readFile(path, 'utf8');

function replaceSection(id, nextId, replacement) {
  const start = source.indexOf(`### ${id} `);
  const end = source.indexOf(`### ${nextId} `, start + 1);
  if (start < 0 || end < 0) throw new Error(`Unable to locate ${id} section`);
  source = `${source.slice(0, start)}${replacement.trim()}\n\n${source.slice(end)}`;
}

replaceSection('R-004', 'R-005', `### R-004 DTO, type strictness และ API contract

สถานะ: ✅ DONE

- [x] Shared \`AdminActor\`/\`MemberActor\`
- [x] ทำ inventory mutation routes ทั้งหมด
- [x] เพิ่ม DTO ครบทุก \`POST\`, \`PUT\`, \`PATCH\` และ \`DELETE\` ที่มี body
- [x] เพิ่ม validation, normalization, enum whitelist และ max length
- [x] แยก request DTO, command type, domain type และ response DTO ตาม critical contract
- [x] ห้ามส่ง Prisma model ออก API โดยตรงด้วย response-safety guard
- [x] ทำ sensitive-field denylist สำหรับ response
- [x] ลดและ ratchet \`any\`, \`as unknown as\` และ non-null assertion ใน critical path
- [x] เปิด \`strict\` และเพิ่ม strict/type regression guard
- [x] เพิ่ม error code catalog ที่ frontend ใช้ได้โดยไม่ parse message
- [x] เพิ่ม contract/error regression ระหว่าง API กับ Admin/Member
- [x] เพิ่ม strict/type regression guard ใน CI

**หลักฐานปิดงาน:** \`docs/architecture/r004-closure.md\`, \`pnpm audit:r4-closure\`, DTO/type/response/error contract gates ใน CI`);

replaceSection('R-005', 'R-006', `### R-005 Shared API client consolidation

สถานะ: ✅ DONE

- [x] \`packages/api-client\`
- [x] Shared URL/header/error/retry/cache/auth-refresh behavior
- [x] Admin/member workspace integration
- [x] Auth flow migration
- [x] inventory \`fetch\`, \`axios\`, local \`/api/*\`, \`adminFetch\`, \`memberFetch\`, \`fetchJson\` และ helper ซ้ำทั้งหมด
- [x] ย้าย Admin routes ไป API client กลางตาม allowlist
- [x] ย้าย Member routes ไป API client กลางตาม allowlist
- [x] ทำ typed request/response per domain ที่ใช้งานร่วมกัน
- [x] รวม timeout, abort, retry และ request ID behavior
- [x] รวม auth refresh/rotation behavior
- [x] รองรับ file upload และ private download แบบ typed
- [x] ทำ error normalization กลาง
- [x] ลบหรือบล็อก duplicate API helpers
- [x] เพิ่ม static audit ป้องกัน helper ใหม่ที่ไม่ผ่าน client กลาง
- [x] เพิ่ม contract regression สำหรับ shared transport และ critical domains

**หลักฐานปิดงาน:** \`docs/architecture/r005-closure.md\`, \`pnpm audit:r5-closure\`, shared-client inventory/contract gates ใน CI`);

await writeFile(path, source, 'utf8');
console.log('Synchronized R-004 and R-005 as DONE in master-project-worklist.md');
