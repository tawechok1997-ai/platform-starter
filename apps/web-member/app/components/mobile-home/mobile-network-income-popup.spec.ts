import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const authenticatedRuntime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const popupCss = readFileSync(new URL('../../member-authenticated-source-overrides.css', import.meta.url), 'utf8');
const popupModuleCss = readFileSync(new URL('./mobile-member-popup-runtime.module.css', import.meta.url), 'utf8');

test('the first authenticated income action opens the existing network income owner', () => {
  assert.match(authenticatedRuntime, /รายได้จากเครือข่าย/);
  assert.match(authenticatedRuntime, /data-mobile-member-popup="network-income"/);
  assert.match(authenticatedRuntime, /affiliateBalance/);

  assert.match(popupRuntime, /popup === 'network-income'/);
  assert.match(popupRuntime, /kind="network-income"/);
  assert.match(popupRuntime, /value=\{affiliateIncome\}/);
  assert.match(popupRuntime, /showClose=\{!\['deposit', 'network-income', 'commission-income'\]\.includes\(popup\)\}/);
});

test('network income keeps real amount controls and source actions', () => {
  assert.match(popupRuntime, /รายได้เครือข่ายที่ถอนได้|\{label\}ที่ถอนได้/);
  assert.match(popupRuntime, /ใส่จำนวนเงินที่ต้องการถอนมายังกระเป๋าหลัก/);
  assert.match(popupRuntime, /QUICK_AMOUNTS = \[100, 300, 500, 1000, 5000, 10000\]/);
  assert.match(popupRuntime, /disabled=\{!valid\}/);
  assert.match(popupRuntime, /<SupportFooter onContact=\{onContact\} \/>/);
});

test('network income popup matches the supplied mobile geometry without changing other popup owners', () => {
  assert.match(popupModuleCss, /\.dialog[\s\S]*width:\s*min\(480px, 100%\)/);
  assert.match(popupModuleCss, /\.titleChrome[\s\S]*width:\s*192px/);

  assert.match(popupCss, /\[data-mobile-popup-owner='network-income'\]/);
  assert.match(popupCss, /incomeBalance[\s\S]*min-height:\s*75px/);
  assert.match(popupCss, /amountInput[\s\S]*height:\s*55px/);
  assert.match(popupCss, /quickGrid[\s\S]*min-height:\s*45px/);
  assert.match(popupCss, /confirmButton'\]:disabled[\s\S]*background:\s*rgb\(56 55 62\)/);
  assert.match(popupCss, /supportDivider[\s\S]*linear-gradient\(180deg, #efd596/);
  assert.match(popupCss, /incomeBalance[\s\S]*strong::after[\s\S]*mask:\s*url/);
  assert.doesNotMatch(popupCss, /data-mobile-popup-owner='commission-income'/);
});
