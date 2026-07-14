import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const TARGETS = {
  'apps/api/src/modules/risk-alerts/risk-alerts.service.ts': {
    explicitAny: 18,
    asAny: 16,
    nonNull: 2,
  },
  'apps/api/src/modules/promotions/promotions.service.ts': {
    explicitAny: 11,
    asAny: 5,
    nonNull: 1,
  },
  'apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts': {
    explicitAny: 1,
    asAny: 0,
    nonNull: 0,
  },
  'apps/api/src/modules/money-ops/money-ops.service.ts': {
    explicitAny: 8,
    asAny: 4,
    nonNull: 0,
  },
};

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

const violations = [];
const rows = [];

for (const [path, budget] of Object.entries(TARGETS)) {
  const source = await readFile(join(ROOT, path), 'utf8');
  const actual = {
    explicitAny: countMatches(source, /\bany\b/g),
    asAny: countMatches(source, /\bas\s+any\b/g),
    nonNull: countMatches(source, /\w+!(?=[.\[,;)])/g),
  };

  rows.push({ path, ...actual, budget });

  for (const key of Object.keys(budget)) {
    if (actual[key] > budget[key]) {
      violations.push({ path, kind: key, actual: actual[key], allowed: budget[key] });
    }
  }
}

console.log('Critical service type debt ratchet');
for (const row of rows) {
  console.log(`  ${relative(ROOT, join(ROOT, row.path))}`);
  console.log(`    explicit any: ${row.explicitAny}/${row.budget.explicitAny}`);
  console.log(`    as any:       ${row.asAny}/${row.budget.asAny}`);
  console.log(`    non-null (!): ${row.nonNull}/${row.budget.nonNull}`);
}

if (violations.length) {
  console.error('\nCritical service type debt increased:');
  for (const item of violations) {
    console.error(`  - ${item.path}: ${item.kind} ${item.actual} > ${item.allowed}`);
  }
  console.error('\nReduce the debt or explicitly lower the ratchet budget. Never raise a budget without an architecture note.');
  process.exitCode = 1;
}