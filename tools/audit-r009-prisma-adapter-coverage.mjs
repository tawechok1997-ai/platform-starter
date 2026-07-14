import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRED = [
  {
    domain: 'deposit-withdrawal',
    file: 'apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts',
    symbols: ['PrismaDepositRepositoryAdapter', 'PrismaWithdrawalRepositoryAdapter'],
  },
  {
    domain: 'ownership',
    file: 'apps/api/src/common/infrastructure/prisma-admin-ownership-repository.adapter.ts',
    symbols: ['PrismaAdminOwnershipRepositoryAdapter'],
  },
];

const coverage = REQUIRED.map((entry) => {
  const absolute = path.join(ROOT, entry.file);
  const source = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
  const missingSymbols = entry.symbols.filter((symbol) => !new RegExp(`class\\s+${symbol}\\b`).test(source));
  const ownsNestedTransaction = /\$transaction\s*\(/.test(source);
  return {
    ...entry,
    filePresent: Boolean(source),
    missingSymbols,
    ownsNestedTransaction,
    complete: Boolean(source) && missingSymbols.length === 0 && !ownsNestedTransaction,
  };
});

const failures = coverage.filter((entry) => !entry.complete);
const result = {
  audit: 'R-009 Prisma adapter coverage',
  implementedDomains: ['deposit', 'withdrawal', 'ownership'],
  pendingDomains: ['kyc-watchlist', 'promotion-settlement'],
  coverage,
  failures,
};

if (process.env.R009_ADAPTER_COVERAGE_JSON === '1') {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log('R-009 Prisma adapter coverage: 3/5 critical domains implemented.');
  for (const entry of coverage) {
    console.log(`- ${entry.domain}: ${entry.complete ? 'covered' : 'failed'}`);
  }
  console.log('- kyc-watchlist: blocked on confirmed schema mapping');
  console.log('- promotion-settlement: blocked on confirmed schema mapping');
}

if (failures.length > 0) {
  console.error('R-009 Prisma adapter coverage audit failed.');
  process.exitCode = 1;
}
