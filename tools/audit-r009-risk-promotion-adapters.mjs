import fs from 'node:fs';

const portPath = 'apps/api/src/common/application/critical-repository-ports.ts';
const adapterPath = 'apps/api/src/common/infrastructure/prisma-risk-promotion-repository-adapters.ts';
const kycPath = 'apps/api/src/modules/risk-alerts/kyc-review-command.service.ts';
const watchlistPath = 'apps/api/src/modules/risk-alerts/risk-watchlist.service.ts';

const ports = fs.readFileSync(portPath, 'utf8');
const adapters = fs.readFileSync(adapterPath, 'utf8');
const kyc = fs.readFileSync(kycPath, 'utf8');
const watchlist = fs.readFileSync(watchlistPath, 'utf8');

const checks = [
  ['KYC/watchlist port exists', /interface KycWatchlistRepositoryPort/],
  ['promotion settlement port exists', /interface PromotionSettlementRepositoryPort/],
  ['KYC/watchlist adapter exists', /class PrismaKycWatchlistRepositoryAdapter/],
  ['promotion settlement adapter exists', /class PrismaPromotionSettlementRepositoryAdapter/],
  ['adapters receive transaction client', /constructor\(private readonly tx: Prisma\.TransactionClient\)/],
  ['adapters do not open transactions', !/\$transaction\(/.test(adapters)],
  ['adapters do not instantiate PrismaClient', !/new PrismaClient/.test(adapters)],
  ['KYC service uses adapter inside transaction', /\$transaction\(async \(tx\)[\s\S]*new PrismaKycWatchlistRepositoryAdapter\(tx\)/.test(kyc)],
  ['watchlist release uses adapter inside transaction', /async release[\s\S]*\$transaction\(async \(tx\)[\s\S]*new PrismaKycWatchlistRepositoryAdapter\(tx\)/.test(watchlist)],
  ['KYC service has no inline FOR UPDATE', !/FOR UPDATE/.test(kyc)],
  ['watchlist release has no inline FOR UPDATE', !/async release[\s\S]*FOR UPDATE/.test(watchlist.match(/async release[\s\S]*?\n  async match/)?.[0] ?? '')],
];

const failed = checks.filter(([, result]) => result instanceof RegExp ? false : !result).map(([name]) => name);
const regexChecks = checks.filter(([, result]) => result instanceof RegExp);
for (const [name, pattern] of regexChecks) {
  const source = name.startsWith('KYC/watchlist port') || name.startsWith('promotion settlement port') ? ports : adapters;
  if (!pattern.test(source)) failed.push(name);
}

if (failed.length) {
  console.error(`R-009 risk/promotion adapter audit failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log(`R-009 risk/promotion adapter audit passed: ${checks.length}/${checks.length} contracts.`);
