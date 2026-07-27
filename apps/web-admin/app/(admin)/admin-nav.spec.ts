import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessPath, navGroups, requiredPermissionsForPath } from './admin-nav';

const cmsRoutes = ['/content-center', '/promotion-center'] as const;

test('CMS routes require the same view permission as the features API', () => {
  for (const route of cmsRoutes) {
    assert.deepEqual(requiredPermissionsForPath(route), ['settings.features.view']);
    assert.equal(canAccessPath(route, ['settings.features.view']), true);
    assert.equal(canAccessPath(route, ['settings.website.view']), false);
    assert.equal(canAccessPath(route, ['promotion.view']), false);
  }
});

test('CMS sidebar items use settings.features.view', () => {
  const items = navGroups.flatMap((group) => group.items);
  for (const route of cmsRoutes) {
    const item = items.find((candidate) => candidate.href === route);
    assert.ok(item, `missing navigation item for ${route}`);
    assert.deepEqual(item.permissions, ['settings.features.view']);
  }
});
