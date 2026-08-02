import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./mobile-source-content.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-source-content.module.css', import.meta.url), 'utf8');

test('mobile home always renders source tournament and leaderboard sections', () => {
  assert.equal(source.includes('data-mobile-source-tournament="true"'), true);
  assert.equal(source.includes('data-mobile-source-leaderboard="true"'), true);
  assert.equal(source.includes('runtime.features.tournament ?'), false);
  assert.equal(source.includes('runtime.features.leaderboard ?'), false);
  assert.equal(source.includes('MOBILE_TOURNAMENT_ART'), false);
});

test('mobile tournament fallback matches the desktop mock competition', () => {
  assert.equal(source.includes('No1. Tournament Football Royale ครั้งที่ 2'), true);
  assert.equal(source.includes("name: 'ZAXXXU709740', score: 20"), true);
  assert.equal(source.includes("name: 'ZAXXXM664100', score: 17"), true);
  assert.equal(source.includes("name: 'ZAXXXR440174', score: 13"), true);
  assert.equal(source.includes("href: '/mobile/member/tournament'"), true);
  assert.equal(css.includes('width:332px'), true);
  assert.equal(css.includes('height:197px'), true);
});

test('mobile leaderboard uses the five source rows and local-first CDN basenames', () => {
  for (const value of [
    '084XXXX728',
    '061XXXX493',
    '091XXXX339',
    '093XXXX507',
    '095XXXX955',
    'evt.png',
    'fortune_tiger.jpg',
    'Thai_Hi_Lo_2.jpg',
    'lali.png',
    'sbo.png',
  ]) {
    assert.equal(source.includes(value), true, value);
  }

  assert.equal(source.includes("resolveLocalAssetByBasename(source, 'any')"), true);
  assert.equal(source.includes("score: 'รายได้ที่ได้รับ'"), true);
  assert.equal(source.includes('LeaderboardRank'), true);
  assert.equal(source.includes('<PlayIcon />'), true);
});
