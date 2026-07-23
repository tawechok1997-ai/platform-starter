import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const quickActionsSource = readFileSync(new URL('./home-quick-actions.tsx', import.meta.url), 'utf8');
const highlightsSource = readFileSync(new URL('./home-highlights-panel.tsx', import.meta.url), 'utf8');
const memberHomeSource = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('quick actions keep navigation and feature flags as source of truth', () => {
  assert.match(quickActionsSource, /navigationFor\(['"]home['"],\s*features\)/);
  assert.match(quickActionsSource, /deposit/);
  assert.match(quickActionsSource, /withdraw/);
  assert.match(quickActionsSource, /transactions/);
  assert.match(quickActionsSource, /bonus/);
  assert.match(highlightsSource, /features:\s*MemberFeatureFlags/);
  assert.match(memberHomeSource, /features={features}/);
});

test('quick actions use the shared BrandIcon renderer only', () => {
  assert.match(quickActionsSource, /<BrandIcon\s+name={item\.iconKey}\s+existing={icons}\s*\/>/);
  assert.doesNotMatch(quickActionsSource, /isIconUrl/);
  assert.doesNotMatch(quickActionsSource, /MemberRuntimeImage/);
  assert.doesNotMatch(quickActionsSource, /defaultIconSettings/);
  assert.doesNotMatch(quickActionsSource, /MemberIcon/);
});

test('quick actions preserve route labels and descriptions from navigation items', () => {
  assert.match(quickActionsSource, /href={item\.href}/);
  assert.match(quickActionsSource, /item\.shortTitle\s*\?\?\s*item\.title/);
  assert.match(quickActionsSource, /item\.description/);
  assert.doesNotMatch(quickActionsSource, /href=["']\/(deposit|withdraw|transactions|bonus)["']/);
});
