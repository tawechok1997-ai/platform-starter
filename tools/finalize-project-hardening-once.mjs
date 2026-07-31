import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const updated = [];

async function replaceAll(path, search, replacement, { required = true } = {}) {
  const absolute = join(root, path);
  const source = await readFile(absolute, 'utf8');
  if (!source.includes(search)) {
    if (source.includes(replacement)) return;
    if (required) throw new Error(`${path}: marker not found`);
    return;
  }
  await writeFile(absolute, source.split(search).join(replacement), 'utf8');
  updated.push(path);
}

async function removeBetween(path, startMarker, endMarker) {
  const absolute = join(root, path);
  const source = await readFile(absolute, 'utf8');
  const start = source.indexOf(startMarker);
  if (start < 0) return;
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`${path}: end marker not found for removal`);
  await writeFile(absolute, source.slice(0, start) + source.slice(end), 'utf8');
  updated.push(path);
}

const activePnpmFiles = execFileSync('git', ['grep', '-FIl', '11.18.0', '--', '.'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((path) =>
    !path.startsWith('.github/workflows/')
    && !path.startsWith('docs/evidence/')
    && !path.startsWith('docs/archive/'),
  );

for (const path of activePnpmFiles) {
  await replaceAll(path, '11.18.0', '11.18.0');
}

await replaceAll(
  'docs/master-project-worklist.md',
  'วันที่จัดโครงสร้างล่าสุด: **2026-07-15**',
  'วันที่จัดโครงสร้างล่าสุด: **2026-07-31**',
);

await replaceAll(
  'docs/master-project-worklist.md',
  '# P0 — Core, schema และ financial safety\n',
  `## Repository hardening baseline — 2026-07-31\n\n- ✅ Production build paths เป็น check-only และไม่แก้ tracked source/assets\n- ✅ API bootstrap, \`/health\` และ \`/version\` commit identity gate ใน CI\n- ✅ Admin/Member browser security headers และ environment-scoped CSP\n- ✅ Legacy executable public assets ถูก quarantine และมี automated audit\n- ✅ Shared API response cache แยกตาม actor/session namespace\n- ✅ Runtime environment, onboarding, troubleshooting และ handoff docs เป็นปัจจุบัน\n- ✅ Generated provider catalog headers ถูก normalize ใน source จริง\n- ✅ Demo Tournament data ปิดเป็นค่าเริ่มต้นใน production และต้องเปิดด้วย explicit flag\n\n**หลักฐาน:** \`docs/evidence/project-hardening-2026-07-31.md\`, \`docs/security/public-assets.md\`, \`docs/operations/repository-size-migration.md\`\n\n---\n\n# P0 — Core, schema และ financial safety\n`,
);

await removeBetween(
  'apps/api/src/modules/money-ops/money-ops.service.ts',
  '  async financeControlCenter() {\n',
  '  simulateLedgerMutation(body: LedgerDryRunInput)',
);

console.log(`One-time project hardening finalizer updated ${updated.length} files:`);
for (const path of updated) console.log(`  - ${path}`);
