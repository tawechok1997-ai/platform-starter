import fs from 'node:fs';

const utilityPath = 'apps/api/src/common/query/cursor-pagination.ts';
const supportPath = 'apps/api/src/modules/support/support-query.service.ts';
const errors = [];

if (!fs.existsSync(utilityPath)) errors.push(`Missing ${utilityPath}`);
if (!fs.existsSync(supportPath)) errors.push(`Missing ${supportPath}`);

const utility = fs.existsSync(utilityPath) ? fs.readFileSync(utilityPath, 'utf8') : '';
const support = fs.existsSync(supportPath) ? fs.readFileSync(supportPath, 'utf8') : '';

for (const symbol of ['parseCursorPage', 'buildCursorPage', 'take: limit + 1', 'nextCursor', 'hasMore']) {
  if (!utility.includes(symbol)) errors.push(`Shared cursor utility must define ${symbol}`);
}

for (const symbol of [
  "from '../../common/query/cursor-pagination'",
  'parseCursorPage({ cursor, limit: limitInput }',
  'parseCursorPage({ cursor: query.cursor, limit: query.limit }',
  'buildCursorPage(rows, pageInput.limit)',
  "orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]",
]) {
  if (!support.includes(symbol)) errors.push(`Support queries must use shared cursor pattern: ${symbol}`);
}

const duplicatedMath = [
  /Math\.min\s*\(\s*Math\.max\s*\(\s*Number\(/,
  /items\.length\s*>\s*limit/,
  /items\.slice\(0,\s*limit\)/,
  /cursor:\s*\{\s*id:\s*(?:cursor|query\.cursor)/,
];
for (const pattern of duplicatedMath) {
  if (pattern.test(support)) errors.push(`Support queries duplicate shared cursor logic: ${pattern}`);
}

if (errors.length > 0) {
  console.error('R-010 cursor pagination audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('R-010 cursor pagination audit passed.');
