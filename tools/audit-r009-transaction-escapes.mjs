import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');
const JSON_MODE = process.env.R009_TRANSACTION_JSON === '1';

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
  const sameMethodEscapes = directWrites.filter((write) => transactionsByMethod.has(write.method));

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
const mixed = entries.filter((entry) => entry.risk === 'mixed-service-method-review');
const direct = entries.filter((entry) => entry.directWriteCount > 0);
const result = {
  audit: 'R-009 transaction escape method-level inventory',
  scannedServices: serviceFiles.length,
  servicesWithPersistenceSignals: entries.length,
  servicesWithDirectWrites: direct.length,
  mixedBoundaryServices: mixed.length,
  sameMethodEscapeCount: sameMethodEscapes.length,
  note: 'Method-level inventory. sameMethodEscapes identify direct Prisma writes in methods that also open a transaction; all findings still require semantic review before refactoring.',
  sameMethodEscapes,
  entries,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 transaction inventory: scanned ${serviceFiles.length} service file(s).`);
  console.log(`Persistence signals: ${entries.length}; direct-write services: ${direct.length}; mixed-service reviews: ${mixed.length}; same-method escapes: ${sameMethodEscapes.length}.`);
  for (const finding of sameMethodEscapes) {
    console.log(`- ESCAPE ${finding.file}:${finding.line} ${finding.method} -> this.prisma.${finding.model}.${finding.operation}`);
  }
  for (const entry of mixed) {
    console.log(`- REVIEW ${entry.file}: transactions=${entry.transactionsByMethod.join(', ') || 'none'}; directWrites=${entry.directWriteCount}`);
  }
}
