import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const historyPage = readFileSync(new URL('./mobile-member-history-page.tsx', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

test('history category tabs remain local filters instead of global popup or navigation actions', () => {
  assert.match(historyPage, /data-mobile-member-page="history"/);
  assert.match(historyPage, /data-mobile-navigation-scope="local"/);

  for (const category of ['deposit', 'withdraw', 'bonus', 'affiliate', 'commission']) {
    assert.match(historyPage, new RegExp(`data-history-category=\\{item\\.id\\}`));
    assert.match(historyPage, new RegExp(`id: '${category}'`));
  }

  assert.match(historyPage, /window\.addEventListener\('click', keepHistoryControlsLocal, true\)/);
  assert.match(historyPage, /event\.stopImmediatePropagation\(\)/);
  assert.match(historyPage, /setCategory\(nextCategory\)/);
});

test('history period tabs remain local filters', () => {
  for (const period of ['all', 'today', 'last-week', 'last-month']) {
    assert.match(historyPage, new RegExp(`id: '${period}'`));
  }

  assert.match(historyPage, /data-history-period=\{item\.id\}/);
  assert.match(historyPage, /setPeriod\(nextPeriod\)/);
});

test('local history interception runs before the legacy document popup inference', () => {
  assert.match(popupRuntime, /document\.addEventListener\('click', handleClick, true\)/);
  assert.match(popupRuntime, /text\.includes\('ฝากเงิน'\)/);
  assert.match(popupRuntime, /text\.includes\('ถอนเงิน'\)/);
  assert.match(historyPage, /window\.addEventListener\('click', keepHistoryControlsLocal, true\)/);
});
