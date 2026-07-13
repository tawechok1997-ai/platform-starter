import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'web-admin', 'app');
const ALLOWED = new Set(['admin-api.ts']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

let failed = false;
for (const file of await walk(ROOT)) {
  if (ALLOWED.has(file.split('/').pop())) continue;
  const source = await readFile(file, 'utf8');
  if (source.includes('admin_access_token')) {
    failed = true;
    console.error(`[FAIL] direct admin access token storage in ${file}`);
  }
}
if (failed) process.exitCode = 1;
else console.log('[PASS] no direct admin access token storage outside admin-api.ts');
