import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const updated = [];

async function replace(path, search, replacement, { required = true } = {}) {
  const absolute = join(root, path);
  const source = await readFile(absolute, 'utf8');
  if (!source.includes(search)) {
    if (source.includes(replacement)) return;
    if (required) throw new Error(`${path}: marker not found`);
    return;
  }
  await writeFile(absolute, source.replace(search, replacement), 'utf8');
  updated.push(path);
}

const activePnpmFiles = execFileSync('git', ['grep', '-Il', '11.13.0', '--', '.'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((path) => !path.startsWith('docs/evidence/') && !path.startsWith('docs/archive/'));

for (const path of activePnpmFiles) {
  await replace(path, '11.13.0', '11.18.0');
}

await replace(
  'apps/web-admin/app/(admin)/settings/features/page.tsx',
  "], null, 2);\n\nconst FEATURES_DEFAULTS = {",
  `], null, 2);\n\nconst TOURNAMENT_ITEMS_DEFAULT =\n  process.env.NODE_ENV === 'production' &&\n  process.env.NEXT_PUBLIC_ENABLE_DEMO_TOURNAMENT_DATA !== 'true'\n    ? '[]'\n    : DESKTOP_TOURNAMENT_MOCK_DEFAULTS;\n\nconst FEATURES_DEFAULTS = {`,
);
await replace(
  'apps/web-admin/app/(admin)/settings/features/page.tsx',
  'tournament_items_json: DESKTOP_TOURNAMENT_MOCK_DEFAULTS,',
  'tournament_items_json: TOURNAMENT_ITEMS_DEFAULT,',
);
await replace(
  '.env.example',
  'NEXT_PUBLIC_API_URL=http://localhost:4000\n',
  'NEXT_PUBLIC_API_URL=http://localhost:4000\nNEXT_PUBLIC_ENABLE_DEMO_TOURNAMENT_DATA=false\n',
);
await replace(
  'docs/master-project-worklist.md',
  'วันที่จัดโครงสร้างล่าสุด: **2026-07-15**',
  'วันที่จัดโครงสร้างล่าสุด: **2026-07-31**',
);
await replace(
  'docs/master-project-worklist.md',
  '# P0 — Core, schema และ financial safety\n',
  `## Repository hardening baseline — 2026-07-31\n\n- [x] Production build paths เป็น check-only และไม่แก้ tracked source/assets\n- [x] API bootstrap, \`/health\` และ \`/version\` commit identity gate ใน CI\n- [x] Admin/Member browser security headers และ environment-scoped CSP\n- [x] Legacy executable public assets ถูก quarantine และมี automated audit\n- [x] Shared API response cache แยกตาม actor/session namespace\n- [x] Runtime environment, onboarding, troubleshooting และ handoff docs เป็นปัจจุบัน\n- [x] Generated provider catalog headers ถูก normalize ใน source จริง\n- [x] Demo Tournament data ปิดเป็นค่าเริ่มต้นใน production และต้องเปิดด้วย explicit flag\n\n**หลักฐาน:** \`docs/evidence/project-hardening-2026-07-31.md\`, \`docs/security/public-assets.md\`, \`docs/operations/repository-size-migration.md\`\n\n---\n\n# P0 — Core, schema และ financial safety\n`,
);

console.log(`One-time project hardening finalizer updated ${updated.length} files:`);
for (const path of updated) console.log(`  - ${path}`);
