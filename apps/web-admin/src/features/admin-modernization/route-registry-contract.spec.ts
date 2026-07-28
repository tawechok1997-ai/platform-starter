import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_ROUTE_DENY_SENTINEL,
  buildRouteTestCoverage,
  inferDesktopPattern,
  inferMobilePattern,
  inferPrimaryTask,
  legacyBehaviorFor,
  localizationNamespaceFor,
  normalizeDataSources,
  parentRouteFor,
  requiredStatesForRoute,
  validateRouteContract,
} from './route-registry-contract';

test('dynamic detail routes keep their collection parent and edge states', () => {
  assert.equal(parentRouteFor('/members/:id', '/members'), '/members');
  assert.deepEqual(requiredStatesForRoute('dynamic-detail'), [
    'loading',
    'error',
    'permission-denied',
    'not-found',
    'deleted',
    'stale',
  ]);
  assert.equal(inferDesktopPattern('dynamic-detail', ''), 'detail');
  assert.equal(inferMobilePattern('dynamic-detail', 'list-detail', 'detail'), 'stacked-detail');
  assert.equal(legacyBehaviorFor('/members/:id', '/members', 'dynamic-detail'), 'compatibility-detail');
});

test('settings editors receive explicit task, parent, localization and mobile contracts', () => {
  assert.equal(parentRouteFor('/settings/seo', '/settings'), '/settings');
  assert.equal(inferPrimaryTask('/settings/seo', 'editor'), 'Manage search and social metadata');
  assert.equal(localizationNamespaceFor('/settings/seo', 'admin.navigation.settings.label'), 'admin.navigation.settings');
  assert.equal(inferDesktopPattern('editor', '<form />'), 'editor');
  assert.equal(inferMobilePattern('editor', 'full-screen-workspace', 'editor'), 'full-screen-sheet');
});

test('data source and test evidence are never empty', () => {
  assert.deepEqual(normalizeDataSources(['/admin/settings/seo', '/admin/settings/seo'], 'editor'), ['/admin/settings/seo']);
  assert.deepEqual(normalizeDataSources([], 'auth'), ['/admin/auth/*']);

  const coverage = buildRouteTestCoverage('editor', ['settings.seo.view'], []);
  for (const evidence of Object.values(coverage)) assert.ok(evidence.length > 0);
});

test('the contract rejects unregistered permissions and missing required metadata', () => {
  const findings = validateRouteContract({
    route: '/new-admin-route',
    source: 'app/(admin)/new-admin-route/page.tsx',
    routeType: 'workspace',
    workspace: 'unassigned',
    parentRoute: null,
    permissions: [ADMIN_ROUTE_DENY_SENTINEL],
    permissionSource: 'admin-nav',
    primaryTask: '',
    dataSources: [],
    desktopPattern: 'workspace',
    mobilePattern: 'stack',
    localizationNamespace: '',
    requiredLocales: ['th', 'en'],
    requiredStates: requiredStatesForRoute('workspace'),
    testCoverage: {
      unit: [],
      interaction: [],
      smoke: [],
      visual: [],
      permission: [],
    },
    legacyBehavior: 'compatibility',
  });

  assert.ok(findings.includes('missing-workspace-owner'));
  assert.ok(findings.includes('unregistered-route-permission'));
  assert.ok(findings.includes('missing-primary-task'));
  assert.ok(findings.includes('missing-data-source'));
  assert.ok(findings.includes('missing-localization-namespace'));
  assert.ok(findings.includes('missing-test-coverage:unit'));
});

test('public authentication routes have stable entry contracts', () => {
  assert.equal(inferPrimaryTask('/login', 'auth'), 'Authenticate an Admin account');
  assert.equal(parentRouteFor('/login', null), null);
  assert.equal(localizationNamespaceFor('/login', null), 'admin.authentication');
  assert.equal(inferDesktopPattern('auth', ''), 'centered-form');
  assert.equal(inferMobilePattern('auth', null, 'centered-form'), 'full-width-form');
  assert.equal(legacyBehaviorFor('/login', null, 'auth'), 'public-entry');
});
