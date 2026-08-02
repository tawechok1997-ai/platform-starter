import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

async function packageScripts(path) {
  const parsed = JSON.parse(await readFile(join(root, path), 'utf8'));
  return parsed.scripts ?? {};
}

const apiScripts = await packageScripts('apps/api/package.json');
const adminScripts = await packageScripts('apps/web-admin/package.json');
const memberScripts = await packageScripts('apps/web-member/package.json');

for (const [name, command] of Object.entries(apiScripts)) {
  if (!['build', 'lint', 'typecheck', 'typecheck:strict-next', 'test'].some((prefix) => name === prefix || name.startsWith(`${prefix}:`))) continue;
  if (String(command).includes('normalize:generated-catalogs')) {
    failures.push(`apps/api package script ${name} may mutate generated catalogs`);
  }
}

const adminReferenceSync = String(adminScripts['sync:reference-assets'] ?? '');
const adminReferenceWrite = String(adminScripts['write:reference-assets'] ?? '');
if (!adminReferenceSync.trim() || adminReferenceSync.includes('--write')) {
  failures.push('apps/web-admin sync:reference-assets must remain read-only');
}
if (!adminReferenceWrite.includes('--write')) {
  failures.push('apps/web-admin write:reference-assets must require an explicit --write flag');
}

for (const name of ['build', 'analyze', 'verify']) {
  const command = String(adminScripts[name] ?? '');
  if (command.includes('write:reference-assets') || command.includes('--write')) {
    failures.push(`apps/web-admin package script ${name} may mutate reference assets`);
  }
}

for (const [name, command] of Object.entries({
  'api build': apiScripts.build,
  'admin build': adminScripts.build,
  'member build': memberScripts.build,
})) {
  if (!String(command ?? '').trim()) failures.push(`${name} command is missing`);
}

const normalizer = await readFile(join(root, 'tools/normalize-provider-simulator-generated-catalogs.mjs'), 'utf8');
if (!normalizer.includes("process.argv.includes('--write')")) {
  failures.push('generated catalog normalizer must require an explicit --write flag');
}

const assetSync = await readFile(join(root, 'apps/web-admin/tools/sync-reference-assets.mjs'), 'utf8');
if (!assetSync.includes("process.argv.includes('--write')")) {
  failures.push('Admin reference asset sync must require an explicit --write flag');
}

console.log('Build purity audit');
console.log(`  violations: ${failures.length}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
