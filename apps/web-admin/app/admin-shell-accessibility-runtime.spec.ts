import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
const shellRuntime = readFileSync(join(root, 'app/admin-shell-accessibility-runtime.tsx'), 'utf8');
const workspaceRuntime = readFileSync(join(root, 'app/admin-workspace-runtime.tsx'), 'utf8');

test('root mounts one shell accessibility owner', () => {
  assert.match(layout, /AdminShellAccessibilityRuntime/);
  assert.equal((layout.match(/<AdminShellAccessibilityRuntime\s*\/>/g) ?? []).length, 1);
});

test('conditional shell controls only reference mounted targets', () => {
  assert.match(shellRuntime, /admin-command-trigger/);
  assert.match(shellRuntime, /admin-command-dialog/);
  assert.match(shellRuntime, /admin-notification-trigger/);
  assert.match(shellRuntime, /admin-notification-menu/);
  assert.match(shellRuntime, /admin-sidebar-profile__trigger/);
  assert.match(shellRuntime, /admin-profile-menu/);
  assert.match(shellRuntime, /document\.getElementById\(targetId\)/);
  assert.match(shellRuntime, /removeAttribute\('aria-controls'\)/);
  assert.match(shellRuntime, /MutationObserver/);
});

test('workspace visibility uses native hidden without redundant aria-hidden focus traps', () => {
  assert.match(workspaceRuntime, /section\.hidden = !visible/);
  assert.match(workspaceRuntime, /section\.removeAttribute\('aria-hidden'\)/);
  assert.match(workspaceRuntime, /link\.removeAttribute\('aria-hidden'\)/);
  assert.match(workspaceRuntime, /result\.removeAttribute\('aria-hidden'\)/);
  assert.doesNotMatch(workspaceRuntime, /section\.setAttribute\('aria-hidden'/);
});
