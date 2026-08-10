import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const layout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const runtime = readFileSync(path.join(appDir, 'admin-access-refresh-runtime.tsx'), 'utf8');

test('mounts one access refresh owner at the Admin root', () => {
  assert.match(layout, /import \{ AdminAccessRefreshRuntime \} from '\.\/admin-access-refresh-runtime'/);
  assert.match(layout, /<AdminAccessRefreshRuntime \/>/);
});

test('refreshes stale protected-layout access after RBAC changes', () => {
  assert.match(runtime, /ADMIN_IDENTITY_INVALIDATED_EVENT/);
  assert.match(runtime, /window\.addEventListener\(ADMIN_IDENTITY_INVALIDATED_EVENT, refresh\)/);
  assert.match(runtime, /window\.addEventListener\('focus', refresh\)/);
  assert.match(runtime, /document\.addEventListener\('visibilitychange', refreshWhenVisible\)/);
  assert.match(runtime, /window\.setInterval\(refresh, ACCESS_REFRESH_INTERVAL_MS\)/);
  assert.match(runtime, /window\.location\.reload\(\)/);
  assert.match(runtime, /permissions: normalizeArray\(value\.permissions\)/);
  assert.match(runtime, /roles: normalizeArray\(value\.roles\)/);
});
