import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// Ratchet budgets are intentionally one-way. Lower them as each service is typed.
// Never raise a budget without documenting the reason in
// docs/architecture/critical-service-type-debt.md.
const TARGETS = {
  'apps/api/src/modules/risk-alerts/risk-alerts.service.ts': {
    explicitAny: 0,
    asAny: 0,
    nonNull: 0,
  },
  'apps/api/src/modules/promotions/promotions.service.ts': {
    explicitAny: 25,
    asAny: 10,
    nonNull: 3,
  },
  'apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts': {
    explicitAny: 3,
    asAny: 1,
    nonNull: 1,
  },
  'apps/api/src/modules/money-ops/money-ops.service.ts': {
    explicitAny: 24,
    asAny: 12,
    nonNull: 2,
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
