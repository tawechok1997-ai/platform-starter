import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const memberRoot = process.cwd();
const memberAppDir = path.join(memberRoot, 'app');
const adminThemePage = path.join(memberRoot, '..', 'web-admin', 'app', '(admin)', 'settings', 'theme', 'page.tsx');

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|css)$/.test(entry) && !entry.endsWith('.spec.ts') && !entry.endsWith('.spec.tsx')) files.push(full);
  }
  return files;
}

test('every Admin Theme & layout field has a Member runtime owner', () => {
  const adminSource = readFileSync(adminThemePage, 'utf8');
  const keys = [...adminSource.matchAll(/\{\s*key:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.ok(keys.length >= 20, `Expected the Theme page field inventory, found only ${keys.length}`);

  const memberSource = walk(memberAppDir)
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const missing = keys.filter((key) => !memberSource.includes(key));

  assert.deepEqual(
    missing,
    [],
    `Theme settings with no Member consumer: ${missing.join(', ')}`,
  );
});
