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

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const failures = [];

for (const error of validateAdminDesignSystemOwners()) failures.push(`design-system: ${error}`);
for (const error of validateAdminSettingsOwnership()) failures.push(`settings: ${error}`);

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
  path.join(packageRoot, 'app/(admin)/system-settings'),
];
for (const root of scanRoots) {
  for (const file of await walk(root)) {
    const relative = path.relative(repositoryRoot, file).replaceAll(path.sep, '/');
    if (hasVersionedOwnerName(relative)) failures.push(`versioned owner path: ${relative}`);
    const source = await fs.readFile(file, 'utf8');
    const forbiddenNames = source.match(/\b(?:final(?:-v?\d+)?|new-new)-(?:table|form|drawer|modal|card|page|settings)\b/gi) ?? [];
    for (const name of forbiddenNames) failures.push(`versioned owner token ${name} in ${relative}`);
  }
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

async function walk(root) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (/\.(?:ts|tsx|css|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
}
