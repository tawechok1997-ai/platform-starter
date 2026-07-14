import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ledgerPath = path.join(ROOT, 'docs', 'evidence', 'r009-transaction-escape-review.json');
const allowedStatuses = new Set(['confirmed', 'safe-direct-write']);

if (!fs.existsSync(ledgerPath)) {
  console.error('Missing transaction escape review ledger.');
  process.exit(1);
}

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
if (ledger.version !== 1 || !ledger.findings || typeof ledger.findings !== 'object' || Array.isArray(ledger.findings)) {
  console.error('Invalid transaction escape review ledger shape.');
  process.exit(1);
}

const errors = [];
for (const [key, review] of Object.entries(ledger.findings)) {
  if (!key.includes('#') || !key.includes('.')) errors.push(`${key}: invalid finding key`);
  if (!review || !allowedStatuses.has(review.status)) errors.push(`${key}: invalid status`);
  if (typeof review?.reason !== 'string' || review.reason.trim().length < 12) errors.push(`${key}: reason must be at least 12 characters`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`R-009 transaction review ledger valid: ${Object.keys(ledger.findings).length} reviewed finding(s).`);
