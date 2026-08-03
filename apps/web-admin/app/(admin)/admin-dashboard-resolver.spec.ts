import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAdminDashboardModel } from './admin-dashboard-resolver';
import { inferAdminWorkspaceAssignments } from './admin-workspace-registry';

test('primary workspace resolves the default dashboard composition', () => {
  const assignments = inferAdminWorkspaceAssignments({
    workspaces: [
      { workspaceId: 'payments', primary: true },
      { workspaceId: 'finance' },
    ],
  });
  const model = resolveAdminDashboardModel(assignments, 'payments', 'th');

  assert.equal(model.key, 'payments');
  assert.equal(model.title, 'ฝากถอน');
  assert.deepEqual(model.workspaceIds, ['payments']);
  assert.ok(model.quickLinks.some((link) => link.href === '/withdrawals'));
});

test('all-workspace dashboard merges quick links without duplicates', () => {
  const assignments = inferAdminWorkspaceAssignments({
    workspaces: [
      { workspaceId: 'payments', primary: true },
      { workspaceId: 'finance' },
      { workspaceId: 'growth' },
    ],
  });
  const model = resolveAdminDashboardModel(assignments, 'all', 'en');
  const hrefs = model.quickLinks.map((link) => link.href);

  assert.equal(model.key, 'all');
  assert.equal(model.title, 'All workspaces');
  assert.equal(new Set(hrefs).size, hrefs.length);
  assert.ok(model.workspaceIds.includes('growth'));
});
