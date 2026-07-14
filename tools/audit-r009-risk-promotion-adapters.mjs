import fs from 'node:fs';

const portPath = 'apps/api/src/common/application/critical-repository-ports.ts';
const adapterPath = 'apps/api/src/common/infrastructure/prisma-risk-promotion-repository-adapters.ts';
const kycPath = 'apps/api/src/modules/risk-alerts/kyc-review-command.service.ts';
const watchlistPath = 'apps/api/src/modules/risk-alerts/risk-watchlist.service.ts';
const promotionPath = 'apps/api/src/modules/promotions/settlement-command.service.ts';

const ports = fs.readFileSync(portPath, 'utf8');
const adapters = fs.readFileSync(adapterPath, 'utf8');
const kyc = fs.readFileSync(kycPath, 'utf8');
const watchlist = fs.readFileSync(watchlistPath, 'utf8');
const promotion = fs.readFileSync(promotionPath, 'utf8');

const settleMethod = promotion.match(/private async settleInTransaction[\s\S]*?\n  private async reverseInTransaction/)?.[0] ?? '';
const reverseMethod = promotion.match(/private async reverseInTransaction[\s\S]*?\n  private async recordSettlementFailure/)?.[0] ?? '';

const checks = [
  ['KYC/watchlist port exists', /interface KycWatchlistRepositoryPort/.test(ports)],
  ['promotion settlement port exists', /interface PromotionSettlementRepositoryPort/.test(ports)],
  ['promotion record preserves release actor', /releasedBy\?: RepositoryId \| null/.test(ports)],
  ['promotion record preserves release timestamp', /releasedAt\?: RepositoryTimestamp \| null/.test(ports)],
  ['KYC/watchlist adapter exists', /class PrismaKycWatchlistRepositoryAdapter/.test(adapters)],
  ['promotion settlement adapter exists', /class PrismaPromotionSettlementRepositoryAdapter/.test(adapters)],
  ['adapters receive transaction client', /constructor\(private readonly tx: Prisma\.TransactionClient\)/.test(adapters)],
  ['adapters do not open transactions', !/\$transaction\(/.test(adapters)],
  ['adapters do not instantiate PrismaClient', !/new PrismaClient/.test(adapters)],
  ['promotion adapter persists release actor', /released_by_admin_id" = \$\{record\.releasedBy \?\? null\}::uuid/.test(adapters)],
  ['promotion adapter persists release timestamp', /released_at" = \$\{record\.releasedAt \?\? null\}/.test(adapters)],
  ['KYC service uses adapter inside transaction', /\$transaction\(async \(tx\)[\s\S]*new PrismaKycWatchlistRepositoryAdapter\(tx\)/.test(kyc)],
  ['watchlist release uses adapter inside transaction', /async release[\s\S]*\$transaction\(async \(tx\)[\s\S]*new PrismaKycWatchlistRepositoryAdapter\(tx\)/.test(watchlist)],
  ['promotion imports transaction-scoped adapter', /import \{ PrismaPromotionSettlementRepositoryAdapter \}/.test(promotion)],
  ['promotion creates adapter inside transaction', /\$transaction\(async \(tx\)[\s\S]*new PrismaPromotionSettlementRepositoryAdapter\(tx\)/.test(promotion)],
  ['promotion settlement helper receives adapter', /settleInTransaction\([\s\S]*settlements: PrismaPromotionSettlementRepositoryAdapter/.test(promotion)],
  ['promotion reversal helper receives adapter', /reverseInTransaction\([\s\S]*settlements: PrismaPromotionSettlementRepositoryAdapter/.test(promotion)],
  ['promotion settlement locks through adapter', /settlements\.findBySourceRiskAlertIdForUpdate\(input\.sourceRiskAlertId\)/.test(settleMethod)],
  ['promotion reversal locks through adapter', /settlements\.findBySourceRiskAlertIdForUpdate\(input\.sourceRiskAlertId\)/.test(reverseMethod)],
  ['promotion settlement persists through adapter', /settlements\.save\(/.test(settleMethod)],
  ['promotion reversal persists through adapter', /settlements\.save\(/.test(reverseMethod)],
  ['promotion settlement has no direct bonus lock', !/SELECT \* FROM "bonus_ledgers"[\s\S]*FOR UPDATE/.test(settleMethod)],
  ['promotion reversal has no direct bonus lock', !/SELECT \* FROM "bonus_ledgers"[\s\S]*FOR UPDATE/.test(reverseMethod)],
  ['KYC service has no inline FOR UPDATE', !/FOR UPDATE/.test(kyc)],
  ['watchlist release has no inline FOR UPDATE', !/async release[\s\S]*FOR UPDATE/.test(watchlist.match(/async release[\s\S]*?\n  async match/)?.[0] ?? '')],
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error(`R-009 risk/promotion adapter audit failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log(`R-009 risk/promotion adapter audit passed: ${checks.length}/${checks.length} contracts.`);
