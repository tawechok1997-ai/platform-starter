import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_WORKSPACES, getWorkspaceByPathname } from './workspaces';

test('admin workspaces are ordered, unique and limited to the approved top-level count', () => {
  assert.equal(ADMIN_WORKSPACES.length, 11);

  const ids = new Set(ADMIN_WORKSPACES.map((workspace) => workspace.id));
  const routes = new Set(ADMIN_WORKSPACES.map((workspace) => workspace.route));
  const orders = ADMIN_WORKSPACES.map((workspace) => workspace.order);

  assert.equal(ids.size, ADMIN_WORKSPACES.length);
  assert.equal(routes.size, ADMIN_WORKSPACES.length);
  assert.deepEqual([...orders].sort((a, b) => a - b), orders);
});

test('workspace labels use locale keys instead of mixed visible copy', () => {
  for (const workspace of ADMIN_WORKSPACES) {
    assert.match(workspace.labelKey, /^admin\.navigation\.[a-zA-Z]+\.label$/);
    assert.match(workspace.descriptionKey, /^admin\.navigation\.[a-zA-Z]+\.description$/);
    assert.ok(workspace.legacyPrefixes.length > 0);
  }
});

test('legacy routes resolve to one workspace owner', () => {
  const examples = new Map([
    ['/dashboard', 'command-center'],
    ['/wallet-ledgers', 'finance'],
    ['/members/123', 'members'],
    ['/risk-alerts/alert-1', 'risk-compliance'],
    ['/provider-health', 'provider-operations'],
    ['/game-transfers', 'games'],
    ['/promotion-center', 'growth-promotions'],
    ['/commission-ledgers', 'affiliate-commission'],
    ['/content-center', 'content'],
    ['/roles', 'access-security'],
    ['/settings', 'settings'],
    ['/settings/activities', 'settings'],
    ['/system-settings', 'settings'],
    ['/system-settings/providers', 'settings'],
  ]);

  for (const [pathname, expected] of examples) {
    assert.equal(getWorkspaceByPathname(pathname)?.id, expected);
  }
});

test('legacy prefixes are not owned by multiple workspaces', () => {
  const owners = new Map<string, string>();

  for (const workspace of ADMIN_WORKSPACES) {
    for (const prefix of workspace.legacyPrefixes) {
      const existingOwner = owners.get(prefix);
      assert.equal(existingOwner, undefined, `${prefix} is owned by both ${existingOwner} and ${workspace.id}`);
      owners.set(prefix, workspace.id);
    }
  }
});
