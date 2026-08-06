import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

function source(path: string) {
  return readFileSync(join(ROOT, path), 'utf8');
}

test('shared settings owner previews every asset field before save', () => {
  const settings = source('app/(admin)/settings/settings-section-page.tsx');
  assert.match(settings, /if \(field\.asset\)/);
  assert.match(settings, /className=\{styles\.assetPreview\}/);
  assert.match(settings, /ตัวอย่างก่อนเผยแพร่/);
  assert.match(settings, /ยังไม่กระทบผู้ใช้จนกว่าจะบันทึก/);
  assert.match(settings, /validateImageFile\(file\)/);
});

test('icon settings mark all URL-backed image controls as assets', () => {
  const icons = source('app/(admin)/settings/icons/icon-settings-config.ts');
  assert.match(icons, /const CLOSE_ICON_FIELD = \{[\s\S]*?asset: true,[\s\S]*?defaultValue: '\/images\/close\.svg'/);
  assert.match(icons, /function imageField[\s\S]*?type: 'url' as const,[\s\S]*?asset: true/);
  assert.ok(existsSync(join(ROOT, 'public/images/close.svg')), 'close.svg must exist in Admin public assets');
});

test('feature image fields opt into the shared preview flow', () => {
  const features = source('app/(admin)/settings/features/page.tsx');
  for (const key of ['tournament_image_url', 'jackpot_image_url']) {
    const fieldPattern = new RegExp(`key: '${key}'[\\s\\S]{0,240}?asset: true`);
    assert.match(features, fieldPattern, `${key} must use the shared asset preview field`);
  }
  assert.ok(
    existsSync(join(ROOT, 'public/assets/asset-pc/images/ZAB1/tournament/4a7df032-03f5-4999-ba59-f38d12c13761.png')),
    'the default tournament preview must exist on the Admin origin',
  );
});

test('game and provider image editors show effective PC and Mobile previews', () => {
  const gameAssets = source('app/(admin)/game-assets/page.tsx');
  assert.match(gameAssets, /<EffectivePreview selection=\{selection\} values=\{values\} \/>/);
  assert.match(gameAssets, /PlatformScope = 'shared' \| 'pc' \| 'mobile'/);
  assert.match(gameAssets, /PC/);
  assert.match(gameAssets, /Mobile/);
});

test('future direct image fields cannot silently skip asset preview', () => {
  const settingsFiles = [
    'app/(admin)/settings/features/page.tsx',
    'app/(admin)/settings/branding/page.tsx',
    'app/(admin)/settings/seo/page.tsx',
  ].filter((path) => existsSync(join(ROOT, path)));

  const imageKey = /key:\s*['"]([^'"]*(?:image|logo|icon|banner|avatar|thumbnail|favicon|placeholder)[^'"]*)['"][\s\S]{0,320}/gi;
  const violations: string[] = [];
  for (const path of settingsFiles) {
    const contents = source(path);
    for (const match of contents.matchAll(imageKey)) {
      const snippet = match[0];
      if (!/asset:\s*true/.test(snippet)) violations.push(`${path}: ${match[1]}`);
    }
  }

  assert.deepEqual(violations, [], `image fields without preview ownership:\n${violations.join('\n')}`);
});
