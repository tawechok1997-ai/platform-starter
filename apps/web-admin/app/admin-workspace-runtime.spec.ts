import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
const runtime = readFileSync(join(root, 'app/admin-workspace-runtime.tsx'), 'utf8');
const profile = readFileSync(join(root, 'app/(admin)/profile/page.tsx'), 'utf8');
const styles = readFileSync(join(root, 'app/admin-workspace-runtime.css'), 'utf8');

test('root mounts one P3 workspace owner and one stylesheet', () => {
  assert.match(layout, /admin-workspace-runtime\.css/);
  assert.match(layout, /<AdminWorkspaceRuntime\s*\/>/);
  assert.equal((layout.match(/<AdminWorkspaceRuntime\s*\/>/g) ?? []).length, 1);
});

test('workspace owner filters sidebar favorites recent and command palette from one selection', () => {
  assert.match(runtime, /resolveVisibleNavGroupIds/);
  assert.match(runtime, /\.admin-nav-group/);
  assert.match(runtime, /\.admin-quick-nav a\[href\]/);
  assert.match(runtime, /\.admin-command-result/);
  assert.match(runtime, /admin_workspace_selection_v1/);
  assert.match(runtime, /admin:workspace-change/);
});

test('workspace owner provides responsive switcher dashboard resolver and profile roles', () => {
  assert.match(runtime, /admin-workspace-switcher-slot/);
  assert.match(runtime, /admin-workspace-dashboard-slot/);
  assert.match(runtime, /admin-profile-workspaces-slot/);
  assert.match(runtime, /resolveAdminDashboardModel/);
  assert.match(profile, /พื้นที่ทำงานตามตำแหน่ง/);
  assert.match(profile, /resolveAssignedAdminWorkspaces/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('P3 does not replace the protected route permission guard', () => {
  assert.doesNotMatch(runtime, /requiredPermissionsForPath/);
  assert.doesNotMatch(runtime, /permissions\.includes\('\*'\).*canViewRoute/);
  assert.match(runtime, /The protected layout owns authentication/);
});
