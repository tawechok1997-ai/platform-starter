import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workspaceCss = readFileSync(new URL('./admin-widget-workspace.module.css', import.meta.url), 'utf8');
const widgetCss = readFileSync(new URL('./admin-widget.module.css', import.meta.url), 'utf8');

test('dashboard workspace uses a readable two-column desktop grid', () => {
  assert.match(workspaceCss, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(workspaceCss, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(workspaceCss, /container-type:\s*inline-size/);
  assert.match(workspaceCss, /@container\s*\(max-width:\s*680px\)/);
});

test('widget headers stack tools before Thai headings collapse vertically', () => {
  assert.match(widgetCss, /container-type:\s*inline-size/);
  assert.match(widgetCss, /@container\s*\(max-width:\s*520px\)/);
  assert.match(widgetCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(widgetCss, /overflow-wrap:\s*normal/);
  assert.match(widgetCss, /word-break:\s*normal/);
  assert.match(widgetCss, /\.toolButton\s*\{[\s\S]*min-width:\s*34px\s*!important/);
});

test('widget body content keeps its natural height instead of stretching grid tracks', () => {
  assert.match(widgetCss, /grid-auto-rows:\s*max-content/);
  assert.match(widgetCss, /align-content:\s*start/);
  assert.match(widgetCss, /align-items:\s*start/);
});

test('empty and error widgets stay compact instead of stretching the dashboard', () => {
  assert.match(widgetCss, /\.widget\[data-state='empty'\]\s+\.body/);
  assert.match(widgetCss, /\.widget\[data-state='error'\]\s+\.body/);
  assert.match(widgetCss, /min-height:\s*150px/);
  assert.match(widgetCss, /min-height:\s*126px/);
});
