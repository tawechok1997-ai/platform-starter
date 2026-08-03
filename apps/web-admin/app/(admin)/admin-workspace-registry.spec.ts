import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_WORKSPACE_REGISTRY,
  inferAdminWorkspaceAssignments,
  normalizeAdminWorkspaceAssignments,
  resolveAdminDashboardKey,
  resolveAdminWorkspaceSelection,
  resolveAssignedAdminWorkspaces,
  resolvePrimaryAdminWorkspace,
  resolveVisibleNavGroupIds,
} from './admin-workspace-registry';

test('P3 owns exactly five admin workspace templates', () => {
  assert.deepEqual(
    ADMIN_WORKSPACE_REGISTRY.map((workspace) => workspace.id),
    ['finance', 'payments', 'growth', 'manager', 'system'],
  );
});

test('explicit multi-role assignments preserve primary workspace and ignore disabled records', () => {
  const assignments = normalizeAdminWorkspaceAssignments([
    { workspaceId: 'finance' },
    { workspaceId: 'payments', primary: true },
    { workspaceId: 'growth', enabled: false },
    { workspaceId: 'payments' },
  ]);

  assert.deepEqual(assignments, [
    { workspaceId: 'finance', primary: false, enabled: true },
    { workspaceId: 'payments', primary: true, enabled: true },
  ]);
  assert.equal(resolvePrimaryAdminWorkspace(assignments)?.id, 'payments');
  assert.equal(resolveAdminDashboardKey(assignments), 'payments');
});

test('P2-compatible roles map into P3 workspace assignments without importing database models', () => {
  const assignments = inferAdminWorkspaceAssignments({
    primaryWorkspaceId: 'finance',
    roles: [
      { code: 'FINANCE', workspaceId: 'finance' },
      { code: 'PAYMENT_OPERATOR', workspaceId: 'payments' },
      'marketing',
    ],
    permissions: ['risk.view'],
  });

  assert.equal(resolvePrimaryAdminWorkspace(assignments)?.id, 'finance');
  assert.deepEqual(
    resolveAssignedAdminWorkspaces(assignments).map((workspace) => workspace.id),
    ['manager', 'payments', 'finance', 'growth'],
  );
});

test('permission fallback gives super administrators manager and system workspaces', () => {
  const assignments = inferAdminWorkspaceAssignments({ permissions: ['*'] });
  const workspaceIds = resolveAssignedAdminWorkspaces(assignments).map((workspace) => workspace.id);

  assert.deepEqual(workspaceIds, ['manager', 'system']);
});

test('workspace filter and all-role union resolve navigation from the same registry', () => {
  const assignments = inferAdminWorkspaceAssignments({
    workspaces: [
      { workspaceId: 'payments', primary: true },
      { workspaceId: 'growth' },
    ],
  });

  assert.equal(resolveAdminWorkspaceSelection(assignments, 'growth'), 'growth');
  assert.equal(resolveAdminWorkspaceSelection(assignments, 'unknown'), 'payments');
  assert.deepEqual(
    [...resolveVisibleNavGroupIds(assignments, 'growth')],
    ['overview', 'growth', 'content', 'members'],
  );
  assert.deepEqual(
    [...resolveVisibleNavGroupIds(assignments, 'all')],
    ['overview', 'finance', 'members', 'risk', 'growth', 'content'],
  );
});
