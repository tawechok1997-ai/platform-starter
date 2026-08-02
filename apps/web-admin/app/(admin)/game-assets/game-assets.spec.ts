import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./game-assets.module.css', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../admin-nav.ts', import.meta.url), 'utf8');
const providerSettings = readFileSync(new URL('../simple-game-settings/page.tsx', import.meta.url), 'utf8');
const workspaces = readFileSync(new URL('../../../src/features/admin-modernization/workspaces.ts', import.meta.url), 'utf8');

test('asset workspace loads real games providers and permissions', () => {
  assert.match(page, /adminApiFetch\('\/admin\/game-providers\?take=100'\)/);
  assert.match(page, /adminApiFetch\('\/admin\/games'\)/);
  assert.match(page, /adminApiFetch\('\/admin\/auth\/me'\)/);
  assert.match(page, /game\.providers\.manage/);
  assert.match(page, /provider\.update/);
});

test('provider editor supports shared PC and mobile assets independently', () => {
  for (const kind of ['logo', 'badge', 'card', 'background', 'title', 'avatar']) {
    assert.match(page, new RegExp(`'${kind}'`));
  }
  assert.match(page, /const scopes:[^\n]*PlatformScope\[\][\s\S]*'shared'[\s\S]*'pc'[\s\S]*'mobile'/);
  assert.match(page, /providerFieldKey/);
  assert.match(page, /ปล่อยช่อง Override ว่าง/);
});

test('game editor stores presentation metadata without replacing other metadata', () => {
  assert.match(page, /const currentMetadata = record\(selection\.item\.metadata\)/);
  assert.match(page, /const metadata = \{ \.\.\.currentMetadata, presentation \}/);
  assert.match(page, /sharedImageUrl/);
  assert.match(page, /pcImageUrl/);
  assert.match(page, /mobileImageUrl/);
  assert.match(page, /body: JSON\.stringify\(\{ metadata \}\)/);
});

test('workspace previews effective PC and Mobile images and stays responsive', () => {
  assert.match(page, /<Preview label="PC"/);
  assert.match(page, /<Preview label="Mobile"/);
  assert.match(css, /\.fieldGrid[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*grid-template-columns:\s*1fr/);
});

test('new route is discoverable from game navigation and provider setup', () => {
  assert.match(nav, /href: '\/game-assets'/);
  assert.match(providerSettings, /href="\/game-assets"/);
  assert.match(workspaces, /'\/game-assets'/);
});
