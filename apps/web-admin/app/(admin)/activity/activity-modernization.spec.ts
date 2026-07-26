import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./activity-workspace.module.css', import.meta.url), 'utf8');

test('activity timeline keeps server-side list state and filters', () => {
  assert.match(source, /\/admin\/activity\/timeline\?\$\{params\.toString\(\)\}/);
  assert.match(source, /page: String\(nextPage\)/);
  assert.match(source, /take: String\(nextPageSize\)/);
  assert.match(source, /type: nextType/);
  assert.match(source, /pageSizeOptions=\{\[20, 50, 100\]\}/);
  assert.equal(source.includes('.slice('), false);
});

test('activity timeline uses shared responsive data and detail primitives', () => {
  assert.match(source, /AdminWorkspaceTabs/);
  assert.match(source, /AdminDataTable/);
  assert.match(source, /AdminDrawer/);
  assert.match(source, /AdminPayloadViewer/);
  assert.match(source, /rowKey=\{\(item\) => `\$\{item\.type\}-\$\{item\.id\}`\}/);
  assert.equal(source.includes('AdminSectionRow'), false);
  assert.equal(source.includes('JSON.stringify(item, null, 2)'), false);
});

test('activity timeline preserves related entity navigation', () => {
  assert.match(source, /\/members\/\$\{selected\.memberId\}/);
  assert.match(source, /\/topups\?requestId=/);
  assert.match(source, /\/withdrawals\?requestId=/);
  assert.match(source, /\/wallet-ledgers/);
  assert.match(source, /return '\/audit'/);
});

test('activity timeline separates Thai and English copy and locale formatting', () => {
  assert.match(source, /const COPY: Record<AdminLocale, ActivityCopy>/);
  assert.match(source, /th: \{/);
  assert.match(source, /en: \{/);
  assert.match(source, /const numberLocale = locale === 'th' \? 'th-TH' : 'en-US'/);
  assert.match(source, /formatDate\(item\.createdAt, numberLocale\)/);
});

test('activity workspace supports compact mobile and reduced motion layouts', () => {
  assert.match(css, /\.advancedGrid/);
  assert.match(css, /\.drawerGrid/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
