import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PORT_FILE = path.join(ROOT, 'apps', 'api', 'src', 'common', 'application', 'critical-repository-ports.ts');
const REQUIRED_INTERFACES = [
  'DepositRepositoryPort',
  'WithdrawalRepositoryPort',
  'AdminOwnershipRepositoryPort',
  'KycWatchlistRepositoryPort',
  'PromotionSettlementRepositoryPort',
];

const failures = [];
if (!fs.existsSync(PORT_FILE)) {
  failures.push('critical repository port file is missing');
} else {
  const source = fs.readFileSync(PORT_FILE, 'utf8');
  for (const name of REQUIRED_INTERFACES) {
    if (!new RegExp(`export\\s+interface\\s+${name}\\b`).test(source)) {
      failures.push(`missing interface ${name}`);
    }
  }

  const forbidden = [
    /@prisma\/client/,
    /PrismaService/,
    /\bPrisma\./,
    /TransactionClient/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(source)) failures.push(`persistence-specific type leaked through repository ports: ${pattern}`);
  }

  if (!/findByIdForUpdate|findAdminForUpdate|findKycReviewForUpdate/.test(source)) {
    failures.push('ports do not expose intent-revealing locked-read operations');
  }
}

if (failures.length > 0) {
  console.error('R-009 critical repository port audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`R-009 critical repository port audit passed: ${REQUIRED_INTERFACES.length} critical ports are defined without Prisma leakage.`);
}
