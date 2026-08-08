import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
const shellRuntime = readFileSync(join(root, 'app/admin-shell-accessibility-runtime.tsx'), 'utf8');
const workspaceRuntime = readFileSync(join(root, 'app/admin-workspace-runtime.tsx'), 'utf8');
const closureStyles = readFileSync(join(root, 'app/admin-final-closure.css'), 'utf8');

test('root mounts one shell accessibility owner', () => {
  assert.match(layout, /AdminShellAccessibilityRuntime/);
  assert.equal((layout.match(/<AdminShellAccessibilityRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(shellRuntime, /admin-final-closure\.css/);
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

test('provider credential selector has an accessible name even while disabled', () => {
  assert.match(shellRuntime, /pathname === '\/provider-credentials'/);
  assert.match(shellRuntime, /\.admin-content-shell \.admin-ui-stack > select/);
  assert.match(shellRuntime, /setAttribute\('aria-label', 'เลือกค่ายเกม'\)/);
});

test('workspace visibility uses native hidden without redundant aria-hidden focus traps', () => {
  assert.match(workspaceRuntime, /section\.hidden = !visible/);
  assert.match(workspaceRuntime, /section\.removeAttribute\('aria-hidden'\)/);
  assert.match(workspaceRuntime, /link\.removeAttribute\('aria-hidden'\)/);
  assert.match(workspaceRuntime, /result\.removeAttribute\('aria-hidden'\)/);
  assert.doesNotMatch(workspaceRuntime, /section\.setAttribute\('aria-hidden'/);
});

test('mobile password field and visibility action keep separate hit targets', () => {
  assert.match(closureStyles, /@media \(max-width: 520px\)/);
  assert.match(closureStyles, /admin-auth-input-wrap[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto\s*!important/);
  assert.match(closureStyles, /admin-auth-input-wrap \.ui-button[\s\S]*position:\s*static\s*!important/);
  assert.match(closureStyles, /admin-auth-input-wrap \.ui-button[\s\S]*grid-column:\s*2\s*!important/);
  assert.match(closureStyles, /admin-auth-input-wrap \.ui-input[\s\S]*grid-column:\s*1\s*!important/);
});
