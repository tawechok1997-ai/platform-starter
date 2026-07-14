import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ledgerPath = path.join(ROOT, 'docs', 'evidence', 'r010-query-review.json');
const allowedStatuses = new Set(['consolidate', 'pagination-foundation', 'projection-cleanup', 'read-model', 'documented-exception']);

if (!fs.existsSync(ledgerPath)) {
  console.error('Missing R-010 query review ledger.');
  process.exit(1);
}

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
if (!ledger || ledger.version !== 1 || !ledger.findings || typeof ledger.findings !== 'object' || Array.isArray(ledger.findings)) {
  console.error('Invalid R-010 query review ledger shape.');
  process.exit(1);
}

const errors = [];
for (const [key, review] of Object.entries(ledger.findings)) {
  if (!key.includes('#') && !key.startsWith('duplicate:')) errors.push(`${key}: invalid finding key`);
  if (!review || !allowedStatuses.has(review.status)) errors.push(`${key}: invalid status`);
  if (typeof review?.owner !== 'string' || review.owner.trim().length < 2) errors.push(`${key}: owner is required`);
  if (typeof review?.reason !== 'string' || review.reason.trim().length < 12) errors.push(`${key}: reason must be at least 12 characters`);
}

if (errors.length > 0) {
  console.error('R-010 query review ledger validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`R-010 query review ledger valid: ${Object.keys(ledger.findings).length} reviewed finding(s).`);
