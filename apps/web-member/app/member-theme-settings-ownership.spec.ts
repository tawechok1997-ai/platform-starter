import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const memberRoot = process.cwd();
const adminThemePage = path.join(memberRoot, '..', 'web-admin', 'app', '(admin)', 'settings', 'theme', 'page.tsx');
const runtimePath = path.join(memberRoot, 'app', 'member-theme-settings-runtime.tsx');

test('all 24 Admin Theme & layout fields have one explicit Member runtime owner', () => {
  const adminSource = readFileSync(adminThemePage, 'utf8');
  const runtimeSource = readFileSync(runtimePath, 'utf8');
  const keys = [...adminSource.matchAll(/\{\s*key:\s*'([^']+)'/g)]
    .map((match) => match[1])
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  assert.equal(keys.length, 24, `Expected exactly 24 Theme & layout fields, found ${keys.length}`);

  const missing = keys.filter((key) => !runtimeSource.includes(`theme.${key}`));
  assert.deepEqual(
    missing,
    [],
    `Theme settings missing from member-theme-settings-runtime.tsx: ${missing.join(', ')}`,
  );

  assert.match(runtimeSource, /data-member-bottom-navigation='false'/);
  assert.match(runtimeSource, /data-member-desktop-sidebar='false'/);
  assert.match(runtimeSource, /--member-runtime-game-grid-columns/);
  assert.match(runtimeSource, /--mobile-source-bg:\s*var\(--member-runtime-background\)/);
  assert.match(runtimeSource, /--member-canvas:\s*var\(--member-runtime-background\)/);
});
