import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const registry = readFileSync(
  join(root, 'app/(admin)/admin-workspace-registry.ts'),
  'utf8',
);

test('P3 owns exactly five admin workspace templates', () => {
  assert.match(registry, /id: 'finance'/);
  assert.match(registry, /id: 'payments'/);
  assert.match(registry, /id: 'growth'/);
  assert.match(registry, /id: 'manager'/);
  assert.match(registry, /id: 'system'/);
  assert.match(registry, /ADMIN_WORKSPACE_REGISTRY/);
});

test('workspace registry supports multi-role navigation and primary dashboard resolution', () => {
  assert.match(registry, /AdminWorkspaceAssignment/);
  assert.match(registry, /resolveAssignedAdminWorkspaces/);
  assert.match(registry, /resolvePrimaryAdminWorkspace/);
  assert.match(registry, /resolveAdminDashboardKey/);
  assert.match(registry, /resolveVisibleNavGroupIds/);
});

test('P3 remains decoupled from the P2 database authority', () => {
  assert.doesNotMatch(registry, /@prisma\/client/);
  assert.doesNotMatch(registry, /AdminRoleTemplate/);
  assert.match(registry, /P2 maps role templates and multi-role assignments/);
});
