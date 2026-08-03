import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const settings = readFileSync(new URL('./site-settings.ts', import.meta.url), 'utf8');
const popup = readFileSync(new URL('./components/member-source-content-popup.tsx', import.meta.url), 'utf8');
const seed = readFileSync(new URL('../../../prisma/seed.ts', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../../../prisma/migrations/20260803105000_seed_source_activity_content/migration.sql', import.meta.url),
  'utf8',
);

test('CMS wrapper preserves source-specific activity fields stripped by the strict normalizer', () => {
  for (const field of [
    'thumbnailImageUrl',
    'bannerImageUrl',
    'endsAt',
    'statusLabel',
    'activityType',
    'numberPrediction',
    'terms',
  ]) {
    assert.match(settings, new RegExp(field));
  }
  assert.match(settings, /rawById/);
  assert.match(settings, /announcements:\s*normalized\.announcements\.map/);
});

test('source popup reads separate thumbnail and banner metadata from CMS', () => {
  assert.match(popup, /record\.thumbnailImageUrl/);
  assert.match(popup, /record\.bannerImageUrl/);
  assert.match(popup, /record\.endsAt/);
  assert.match(popup, /record\.terms/);
});

test('new environments seed both source activities without overwriting existing CMS settings', () => {
  assert.match(seed, /source-activity-predict-lottery/);
  assert.match(seed, /source-activity-turnover-reward/);
  assert.match(seed, /where:\s*\{ key: 'features\.cms_content' \}[\s\S]*update:\s*\{\}/);
  assert.match(seed, /1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d\.jpeg/);
  assert.match(seed, /1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4\.jpeg/);
});

test('production migration merges source events and preserves unrelated announcements', () => {
  assert.match(migration, /jsonb_set/);
  assert.match(migration, /source_content\.announcements\s*\|\|/);
  assert.match(migration, /NOT IN\s*\([\s\S]*source-activity-predict-lottery[\s\S]*source-activity-turnover-reward/);
  assert.match(migration, /ON CONFLICT \("key"\) DO UPDATE/);
});
