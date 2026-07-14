import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');
const REVIEW_PATH = path.join(ROOT, 'docs', 'evidence', 'r009-transaction-escape-review.json');
const JSON_MODE = process.env.R009_TRANSACTION_JSON === '1';
const STRICT_MODE = process.env.R009_TRANSACTION_STRICT === '1';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function methodRanges(source) {
  const starts = [...source.matchAll(/^\s{2}(?:private\s+|protected\s+|public\s+)?(?:async\s+)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?::[^\{]+)?\{/gm)]
    .map((match) => ({ name: match[1], start: match.index ?? 0 }));

  return starts.map((item, index) => ({
    ...item,
    end: starts[index + 1]?.start ?? source.length,
  }));
}

function methodForIndex(ranges, index) {
  return ranges.find((range) => index >= range.start && index < range.end)?.name ?? '<class-field-or-unknown>';
}

function findingKey(finding) {
  return `${finding.file}#${finding.method}#${finding.model}.${finding.operation}`;
}

function loadReviewLedger() {
  if (!fs.existsSync(REVIEW_PATH)) {
    return { version: 1, findings: {} };
  }

  const parsed = JSON.parse(fs.readFileSync(REVIEW_PATH, 'utf8'));
  if (!parsed || parsed.version !== 1 || typeof parsed.findings !== 'object' || Array.isArray(parsed.findings)) {
    throw new Error(`Invalid R-009 transaction review ledger: ${relative(REVIEW_PATH)}`);
  }
  return parsed;
}

const reviewLedger = loadReviewLedger();
const serviceFiles = walk(API_SRC)
  .filter((file) => file.endsWith('.service.ts'))
  .sort();

const entries = [];
for (const file of serviceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const ranges = methodRanges(source);
  const transactionMatches = [...source.matchAll(/\.(?:\$transaction)\s*\(/g)];
  const rawMatches = [...source.matchAll(/\.(?:\$queryRaw|\$executeRaw)(?:Unsafe)?\s*[<(]/g)];
  const directWriteMatches = [...source.matchAll(/\bthis\.prisma\.([A-Za-z0-9_]+)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g)];
  const transactionWriteMatches = [...source.matchAll(/\btx\.([A-Za-z0-9_]+)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g)];

  const transactionsByMethod = new Set(transactionMatches.map((match) => methodForIndex(ranges, match.index ?? 0)));
  const directWrites = directWriteMatches.map((match) => ({
    method: methodForIndex(ranges, match.index ?? 0),
    line: lineNumber(source, match.index ?? 0),
    model: match[1],
    operation: match[2],
  }));
  const transactionalWrites = transactionWriteMatches.map((match) => ({
    method: methodForIndex(ranges, match.index ?? 0),
    line: lineNumber(source, match.index ?? 0),
    model: match[1],
    operation: match[2],
  }));
  const sameMethodEscapes = directWrites
    .filter((write) => transactionsByMethod.has(write.method))
    .map((write) => {
      const finding = { file: relative(file), ...write };
      const key = findingKey(finding);
      const review = reviewLedger.findings[key] ?? null;
      return {
        ...write,
        key,
        reviewStatus: review?.status ?? 'needs-review',
        reviewReason: review?.reason ?? null,
      };
    });

  if (transactionMatches.length || rawMatches.length || directWrites.length || transactionalWrites.length) {
    entries.push({
      file: relative(file),
      transactionCount: transactionMatches.length,
      rawQueryCount: rawMatches.length,
      directWriteCount: directWrites.length,
      transactionClientWriteCount: transactionalWrites.length,
      transactionsByMethod: [...transactionsByMethod].sort(),
      directWrites,
      transactionalWrites,
      sameMethodEscapes,
      risk: sameMethodEscapes.length > 0
        ? 'direct-write-inside-transaction-owning-method'
        : directWrites.length > 0 && transactionMatches.length > 0
          ? 'mixed-service-method-review'
          : directWrites.length > 0
            ? 'direct-write-review'
            : 'transactional-only-or-read-only',
    });
  }
}

const sameMethodEscapes = entries.flatMap((entry) => entry.sameMethodEscapes.map((finding) => ({ file: entry.file, ...finding })));
const reviewedSafe = sameMethodEscapes.filter((finding) => finding.reviewStatus === 'safe-direct-write');
const confirmed = sameMethodEscapes.filter((finding) => finding.reviewStatus === 'confirmed');
const needsReview = sameMethodEscapes.filter((finding) => finding.reviewStatus === 'needs-review');
const mixed = entries.filter((entry) => entry.risk === 'mixed-service-method-review');
const direct = entries.filter((entry) => entry.directWriteCount > 0);
const staleReviewKeys = Object.keys(reviewLedger.findings).filter((key) => !sameMethodEscapes.some((finding) => finding.key === key));

const result = {
  audit: 'R-009 transaction escape method-level inventory',
  scannedServices: serviceFiles.length,
  servicesWithPersistenceSignals: entries.length,
  servicesWithDirectWrites: direct.length,
  mixedBoundaryServices: mixed.length,
  sameMethodEscapeCount: sameMethodEscapes.length,
  reviewedSafeCount: reviewedSafe.length,
  confirmedEscapeCount: confirmed.length,
  needsReviewCount: needsReview.length,
  staleReviewCount: staleReviewKeys.length,
  note: 'Strict mode fails on confirmed escapes, unreviewed same-method findings, or stale review entries. Safe direct writes require a documented reason in the review ledger.',
  confirmed,
  needsReview,
  reviewedSafe,
  staleReviewKeys,
  sameMethodEscapes,
  entries,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 transaction inventory: scanned ${serviceFiles.length} service file(s).`);
  console.log(`Persistence signals: ${entries.length}; direct-write services: ${direct.length}; mixed-service reviews: ${mixed.length}; same-method findings: ${sameMethodEscapes.length}.`);
  console.log(`Reviewed safe: ${reviewedSafe.length}; confirmed escapes: ${confirmed.length}; needs review: ${needsReview.length}; stale reviews: ${staleReviewKeys.length}.`);
  for (const finding of confirmed) {
    console.log(`- CONFIRMED ${finding.file}:${finding.line} ${finding.method} -> this.prisma.${finding.model}.${finding.operation}`);
  }
  for (const finding of needsReview) {
    console.log(`- REVIEW ${finding.file}:${finding.line} ${finding.method} -> this.prisma.${finding.model}.${finding.operation}`);
  }
  for (const key of staleReviewKeys) {
    console.log(`- STALE ${key}`);
  }
}

if (STRICT_MODE && (confirmed.length > 0 || needsReview.length > 0 || staleReviewKeys.length > 0)) {
  process.exitCode = 1;
}
