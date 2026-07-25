import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkspaceTabHref } from './workspace-tab-url';

test('workspace tab links preserve unrelated query context', () => {
  assert.equal(buildWorkspaceTabHref({ pathname: '/finance', search: 'range=7d&page=3', queryKey: 'tab', target: { value: 'withdrawals' } }), '/finance?range=7d&page=3&tab=withdrawals');
});

test('workspace tab links can clear a default tab without leaving a trailing query', () => {
  assert.equal(buildWorkspaceTabHref({ pathname: '/members', search: 'tab=overview', queryKey: 'tab', target: {} }), '/members');
});

test('explicit detail routes remain untouched', () => {
  assert.equal(buildWorkspaceTabHref({ pathname: '/risk', search: 'tab=alerts', queryKey: 'tab', target: { href: '/risk-alerts/alert-1' } }), '/risk-alerts/alert-1');
});
