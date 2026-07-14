import fs from 'node:fs';

const kycPath = 'apps/api/src/modules/risk-alerts/kyc-review-command.service.ts';
const watchlistPath = 'apps/api/src/modules/risk-alerts/risk-watchlist.service.ts';
const kyc = fs.readFileSync(kycPath, 'utf8');
const watchlist = fs.readFileSync(watchlistPath, 'utf8');

function method(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return '';
  return source.slice(start, end);
}

const reviewDocument = method(kyc, '  async reviewDocument(', '\n  async reviewCase(');
const reviewCase = method(kyc, '  async reviewCase(', '\n}');
const createWatchlist = method(watchlist, '  async create(', '\n  async release(');
const releaseWatchlist = method(watchlist, '  async release(', '\n  async match(');

const checks = [
  ['KYC document method exists', reviewDocument.length > 0],
  ['KYC document has transaction owner', reviewDocument.includes('this.prisma.$transaction(async (tx) =>')],
  ['KYC document locks row', reviewDocument.includes('FOR UPDATE')],
  ['KYC document guards version', reviewDocument.includes('AND "version"=${input.version}')],
  ['KYC document audit uses tx', reviewDocument.includes('tx.adminAuditLog.create')],
  ['KYC document uses Serializable', reviewDocument.includes('TransactionIsolationLevel.Serializable')],
  ['KYC case method exists', reviewCase.length > 0],
  ['KYC case has transaction owner', reviewCase.includes('this.prisma.$transaction(async (tx) =>')],
  ['KYC case locks row', reviewCase.includes('FOR UPDATE')],
  ['KYC case revalidates documents in tx', reviewCase.includes('FROM "kyc_documents"')],
  ['KYC case guards version', reviewCase.includes('AND "version"=${input.version}')],
  ['KYC case audit uses tx', reviewCase.includes('tx.adminAuditLog.create')],
  ['KYC case uses Serializable', reviewCase.includes('TransactionIsolationLevel.Serializable')],
  ['watchlist create method exists', createWatchlist.length > 0],
  ['watchlist create has transaction owner', createWatchlist.includes('this.prisma.$transaction(async (tx) =>')],
  ['watchlist create insert uses tx', createWatchlist.includes('tx.$queryRaw')],
  ['watchlist create audit uses tx', createWatchlist.includes('tx.adminAuditLog.create')],
  ['watchlist create uses Serializable', createWatchlist.includes('TransactionIsolationLevel.Serializable')],
  ['watchlist release method exists', releaseWatchlist.length > 0],
  ['watchlist release has transaction owner', releaseWatchlist.includes('this.prisma.$transaction(async (tx) =>')],
  ['watchlist release locks row', releaseWatchlist.includes('FOR UPDATE')],
  ['watchlist release guards version', releaseWatchlist.includes('AND "version" = ${input.version}')],
  ['watchlist release audit uses tx', releaseWatchlist.includes('tx.adminAuditLog.create')],
  ['watchlist release uses Serializable', releaseWatchlist.includes('TransactionIsolationLevel.Serializable')],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length > 0) {
  console.error('R-009 KYC/watchlist transaction audit failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 KYC/watchlist transaction audit passed (${checks.length} checks).`);