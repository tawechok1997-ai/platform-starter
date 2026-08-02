import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const livePage = readFileSync(new URL('./mobile-live-schedule-page.tsx', import.meta.url), 'utf8');
const liveData = readFileSync(new URL('./live-match-data.ts', import.meta.url), 'utf8');
const liveCss = readFileSync(new URL('./mobile-live-schedule-page.module.css', import.meta.url), 'utf8');

test('mobile live route uses the dedicated central schedule owner', () => {
  assert.match(sectionPage, /import MobileLiveSchedulePage/);
  assert.match(sectionPage, /section === 'live'[\s\S]*<MobileLiveSchedulePage/);
  assert.doesNotMatch(sectionPage, /category=live&limit=40/);
  assert.match(livePage, /loadCentralLiveMatches\(TIMEZONE/);
});

test('central live loader uses the shared API client and supports empty results', () => {
  assert.match(liveData, /DEFAULT_LIVE_MATCH_PATH = '\/games\/live-events'/);
  assert.match(liveData, /createApiClient/);
  assert.match(liveData, /error instanceof ApiClientError && error\.status === 404/);
  assert.match(liveData, /payload === null/);
  assert.match(liveData, /collectMatches\(payload\)/);
  assert.match(liveData, /timezone/);
});

test('mobile live schedule preserves the source page geometry', () => {
  assert.match(liveCss, /max-width:\s*428px/);
  assert.match(liveCss, /height:\s*50px/);
  assert.match(liveCss, /background:\s*#7100bd/);
  assert.match(liveCss, /grid-template-columns:\s*42px minmax\(0, 1fr\) auto/);
  assert.match(livePage, /เรียงเวลา/);
  assert.match(livePage, /เรียงลีก/);
  assert.match(livePage, /ยังไม่พบรายการถ่ายทอดสด/);
});
