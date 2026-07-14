import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('apps/api/src');
const findings = [];

// Existing runtime debt is tracked explicitly so strict mode prevents regressions
// without treating test fixtures or the entire historical backlog as new failures.
const legacyBaseline = new Set([
  'apps/api/src/modules/admin-access/admin-access.service.ts',
  'apps/api/src/modules/admin-access/admin-account-lifecycle.service.ts',
  'apps/api/src/modules/admin-access/admin-invitation-admin.service.ts',
  'apps/api/src/modules/admin-access/admin-invitation.service.ts',
  'apps/api/src/modules/admin-auth/admin-login-defense.service.ts',
  'apps/api/src/modules/game-platform/game-platform-money.service.ts',
  'apps/api/src/modules/game-platform/game-platform.service.ts',
  'apps/api/src/modules/game-platform/game-transfer-action.service.ts',
  'apps/api/src/modules/game-platform/provider-preset.service.ts',
  'apps/api/src/modules/money-ops/money-ops.service.ts',
  'apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts',
  'apps/api/src/modules/withdrawals/withdrawals.service.ts',
]);

function isRuntimeTypeScript(file) {
  return file.endsWith('.ts')
    && !file.endsWith('.spec.ts')
    && !file.endsWith('.test.ts')
    && !file.endsWith('.d.ts');
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!entry.isFile() || !isRuntimeTypeScript(full)) continue;

    const source = await readFile(full, 'utf8');
    if (!source.includes('adminAuditLog.create')) continue;
    const usesBuilder = source.includes('buildAdminAuditData');
    findings.push({ file: path.relative(process.cwd(), full).split(path.sep).join('/'), usesBuilder });
  }
}

await walk(root);

const legacy = findings.filter((item) => !item.usesBuilder);
const unexpectedLegacy = legacy.filter((item) => !legacyBaseline.has(item.file));
const retiredBaseline = [...legacyBaseline].filter((file) => !legacy.some((item) => item.file === file));

console.log(`Runtime Admin audit writers: ${findings.length}`);
for (const item of findings) {
  const state = item.usesBuilder ? 'OK' : legacyBaseline.has(item.file) ? 'BASELINE' : 'NEW_LEGACY';
  console.log(`${state} ${item.file}`);
}
console.log(`Baseline legacy writers remaining: ${legacy.length - unexpectedLegacy.length}`);
console.log(`Unexpected legacy writers: ${unexpectedLegacy.length}`);
if (retiredBaseline.length) {
  console.log(`Baseline entries ready to remove: ${retiredBaseline.length}`);
  for (const file of retiredBaseline) console.log(`RETIRED ${file}`);
}

if (process.env.ADMIN_AUDIT_WRITERS_STRICT === '1' && unexpectedLegacy.length > 0) {
  process.exitCode = 1;
}
