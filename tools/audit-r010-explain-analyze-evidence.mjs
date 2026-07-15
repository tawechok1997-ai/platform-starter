import fs from 'node:fs';

const evidencePath = process.argv.slice(2).find((value) => value !== '--') ?? 'artifacts/r010-explain-analyze.json';
const requiredQueries = [
  'dashboard-topups-by-status',
  'queue-aging-pending-topups',
  'reconciliation-wallet-scan',
  'reconciliation-latest-ledger-lookup',
];

if (!fs.existsSync(evidencePath)) {
  console.error(`R-010 EXPLAIN evidence not found: ${evidencePath}`);
  process.exit(1);
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const failures = [];

if (evidence.database !== 'ephemeral-postgresql-ci') failures.push('unexpected database evidence source');
if (!Array.isArray(evidence.queries)) failures.push('queries must be an array');

const byName = new Map((evidence.queries ?? []).map((entry) => [entry.name, entry]));
for (const name of requiredQueries) {
  const entry = byName.get(name);
  if (!entry) {
    failures.push(`missing query evidence: ${name}`);
    continue;
  }
  if (!Array.isArray(entry.plan) || entry.plan.length === 0) failures.push(`${name} is missing raw plan output`);
  if (typeof entry.summary?.planningTimeMs !== 'number') failures.push(`${name} is missing planning time`);
  if (typeof entry.summary?.executionTimeMs !== 'number') failures.push(`${name} is missing execution time`);
  if (!entry.summary?.nodeType) failures.push(`${name} is missing root plan node type`);
}

if (failures.length) {
  console.error('R-010 EXPLAIN ANALYZE evidence audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`R-010 EXPLAIN ANALYZE evidence audit passed (${requiredQueries.length} queries).`);
