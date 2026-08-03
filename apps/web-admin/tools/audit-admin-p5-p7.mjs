import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADMIN_DESIGN_SYSTEM_OWNERS,
  hasVersionedOwnerName,
  validateAdminDesignSystemOwners,
} from '../src/features/admin-modernization/design-system-ownership.ts';
import {
  ADMIN_SETTINGS_ROUTE_REGISTRY,
  validateAdminSettingsOwnership,
} from '../src/features/admin-modernization/settings-ownership.ts';
import { validateAdminSettingsMutationRules } from '../app/admin-settings-mutation-owner.ts';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const failures = [];

for (const error of validateAdminDesignSystemOwners()) failures.push(`design-system: ${error}`);
for (const error of validateAdminSettingsOwnership()) failures.push(`settings: ${error}`);
for (const error of validateAdminSettingsMutationRules()) failures.push(`settings-mutation: ${error}`);

for (const owner of ADMIN_DESIGN_SYSTEM_OWNERS) {
  const absolutePath = path.join(repositoryRoot, owner.modulePath);
  try {
    const source = await fs.readFile(absolutePath, 'utf8');
    if (!source.includes(owner.exportName)) failures.push(`missing export ${owner.exportName} in ${owner.modulePath}`);
  } catch {
    failures.push(`missing owner module ${owner.modulePath}`);
  }
}

const settingsOwners = new Set(ADMIN_SETTINGS_ROUTE_REGISTRY.map((definition) => definition.owner));
assert.deepEqual([...settingsOwners].sort(), ['/settings', '/system-settings']);

const scanRoots = [
  path.join(packageRoot, 'src/features/admin-modernization'),
  path.join(packageRoot, 'app/(admin)'),
  path.join(packageRoot, 'app/admin-api.ts'),
  path.join(packageRoot, 'app/admin-settings-mutation-owner.ts'),
];
for (const root of scanRoots) {
  for (const file of await walk(root)) {
    const relative = path.relative(repositoryRoot, file).replaceAll(path.sep, '/');
    if (hasVersionedOwnerName(relative)) failures.push(`versioned owner path: ${relative}`);
    const source = await fs.readFile(file, 'utf8');
    const forbiddenNames = source.match(/\b(?:final(?:-v?\d+)?|new-new)-(?:table|form|drawer|modal|card|page|settings)\b/gi) ?? [];
    for (const name of forbiddenNames) failures.push(`versioned owner token ${name} in ${relative}`);

    if (!relative.endsWith('/_components/admin-ui.tsx') && importsLegacyAdminDrawer(source)) {
      failures.push(`legacy AdminDrawer import in ${relative}`);
    }
  }
}

const adminUiSource = await fs.readFile(path.join(packageRoot, 'app/(admin)/_components/admin-ui.tsx'), 'utf8');
if (adminUiSource.includes('export function AdminDrawer')) failures.push('legacy AdminDrawer implementation remains in admin-ui.tsx');
if (!adminUiSource.includes("export { AdminDrawer } from './admin-drawer';")) failures.push('admin-ui compatibility export does not delegate to canonical drawer');
if (adminUiSource.includes('.admin-drawer-layer{') || adminUiSource.includes('.admin-drawer__head{')) failures.push('legacy drawer CSS remains in admin-ui.tsx');

const dataTableSource = await fs.readFile(path.join(packageRoot, 'src/features/admin-modernization/data-table.tsx'), 'utf8');
if (!dataTableSource.includes('<AdminDataTableViewControls')) failures.push('shared table does not adopt saved-view controls');
if (!dataTableSource.includes('parseAdminTableQuery(params')) failures.push('shared table does not restore URL query state');
if (!dataTableSource.includes('window.history.replaceState')) failures.push('shared table does not persist URL query state');

const adminApiSource = await fs.readFile(path.join(packageRoot, 'app/admin-api.ts'), 'utf8');
if (!adminApiSource.includes('applyAdminSettingsMutationHeaders(headers, path, sourceRoute)')) {
  failures.push('admin mutations do not apply central settings ownership metadata');
}

if (failures.length > 0) {
  console.error('Admin P5-P7 ownership audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Admin P5-P7 ownership audit passed.');
console.log(`Design-system owners: ${ADMIN_DESIGN_SYSTEM_OWNERS.length}`);
console.log(`Settings routes: ${ADMIN_SETTINGS_ROUTE_REGISTRY.length}`);
console.log(`Settings write owners: ${[...settingsOwners].join(', ')}`);
console.log('Saved views: adopted by the shared table owner');
console.log('URL query state: restore and persistence enabled');
console.log('Settings mutations: owner metadata applied centrally');
console.log('Canonical AdminDrawer implementations: 1');
console.log('Legacy AdminDrawer imports outside the compatibility export: 0');

function importsLegacyAdminDrawer(source) {
  return /import\s*\{[^}]*\bAdminDrawer\b[^}]*\}\s*from\s*['"][^'"]*admin-ui['"]/s.test(source);
}

async function walk(root) {
  const files = [];
  let stats;
  try {
    stats = await fs.stat(root);
  } catch {
    return files;
  }
  if (stats.isFile()) return /\.(?:ts|tsx|css|mjs)$/.test(root) ? [root] : files;

  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (/\.(?:ts|tsx|css|mjs)$/.test(entry.name) && !/\.spec\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}
