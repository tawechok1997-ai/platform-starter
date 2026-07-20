import fs from 'node:fs';
import path from 'node:path';

const root = 'apps/api/src/modules';
const ownerFiles = new Set([
  'wallet/wallet.service.ts',
  'topups/topups.service.ts',
  'topups/deposit-workflow.service.ts',
  'withdrawals/withdrawals.service.ts',
  'withdrawals/withdrawal-workflow.service.ts',
]);

// Existing compatibility exception. DEDUP-05 remains open until this mutation delegates to WalletService.
const temporaryExceptions = new Set(['money-ops/money-ops.service.ts']);
const mutationPatterns = [
  /(?:tx|this\.prisma)\.wallet\.(?:create|update|upsert|delete)\s*\(/,
  /(?:tx|this\.prisma)\.walletLedger\.(?:create|update|upsert|delete)\s*\(/,
];

const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) inspect(full);
  }
}

function inspect(file) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');
  if (!mutationPatterns.some((pattern) => pattern.test(source))) return;
  findings.push({ relative, owner: ownerFiles.has(relative), temporary: temporaryExceptions.has(relative) });
}

walk(root);

const violations = findings.filter((finding) => !finding.owner && !finding.temporary);
if (violations.length) {
  console.error('Finance mutation boundary audit failed:');
  for (const finding of violations) console.error(`- unauthorized wallet mutation in ${finding.relative}`);
  process.exit(1);
}

const missingException = !findings.some((finding) => finding.relative === 'money-ops/money-ops.service.ts' && finding.temporary);
if (missingException) {
  console.error('Finance mutation boundary audit failed: expected temporary MoneyOps mutation exception was not found; update the audit and ownership documentation intentionally.');
  process.exit(1);
}

console.log('Finance mutation boundary inventory is valid.');
console.log('Temporary exception: money-ops/money-ops.service.ts must migrate to WalletService before DEDUP-05 closes.');
