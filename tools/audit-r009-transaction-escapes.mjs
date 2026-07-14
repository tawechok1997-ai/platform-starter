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

const serviceFiles = walk(API_SRC)
  .filter((file) => file.endsWith('.service.ts'))
  .sort();

const entries = [];
for (const file of serviceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const transactionCount = [...source.matchAll(/\.(?:\$transaction)\s*\(/g)].length;
  const rawQueryCount = [...source.matchAll(/\.(?:\$queryRaw|\$executeRaw)(?:Unsafe)?\s*[<(]/g)].length;
  const directWriteCount = [...source.matchAll(/\bthis\.prisma\.[A-Za-z0-9_]+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g)].length;
  const transactionClientWriteCount = [...source.matchAll(/\btx\.[A-Za-z0-9_]+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g)].length;

  if (transactionCount || rawQueryCount || directWriteCount || transactionClientWriteCount) {
    entries.push({
      file: relative(file),
      transactionCount,
      rawQueryCount,
      directWriteCount,
      transactionClientWriteCount,
      risk: directWriteCount > 0 && transactionCount > 0 ? 'mixed-direct-and-transactional-writes' : directWriteCount > 0 ? 'direct-write-review' : 'transactional-only-or-read-only',
    });
  }
}

const mixed = entries.filter((entry) => entry.risk === 'mixed-direct-and-transactional-writes');
const direct = entries.filter((entry) => entry.directWriteCount > 0);
const result = {
  audit: 'R-009 transaction escape inventory',
  scannedServices: serviceFiles.length,
  servicesWithPersistenceSignals: entries.length,
  servicesWithDirectWrites: direct.length,
  mixedBoundaryServices: mixed.length,
  note: 'Inventory only. Findings require method-level review before any refactor or strict enforcement.',
  entries,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 transaction inventory: scanned ${serviceFiles.length} service file(s).`);
  console.log(`Persistence signals: ${entries.length}; direct-write services: ${direct.length}; mixed-boundary services: ${mixed.length}.`);
  for (const entry of mixed) {
    console.log(`- REVIEW ${entry.file}: directWrites=${entry.directWriteCount}, transactions=${entry.transactionCount}, rawQueries=${entry.rawQueryCount}`);
  }
}
