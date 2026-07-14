import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');
const JSON_MODE = process.env.R009_LOCK_JSON === '1';
const STRICT_MODE = process.env.R009_LOCK_STRICT === '1';

const TABLE_RANK = new Map([
  ['deposit_requests', 10],
  ['withdrawal_requests', 10],
  ['kyc_requests', 10],
  ['watchlist_entries', 10],
  ['promotion_settlements', 10],
  ['admin_users', 20],
  ['users', 20],
  ['wallets', 30],
  ['wallet_ledgers', 40],
  ['admin_audit_logs', 50],
]);

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

function findTransactionBlocks(source) {
  const blocks = [];
  const marker = /\$transaction\s*\(\s*async\s*\([^)]*\)\s*=>\s*\{/g;
  for (const match of source.matchAll(marker)) {
    const open = source.indexOf('{', match.index);
    if (open < 0) continue;
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let index = open; index < source.length; index += 1) {
      const char = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === "'" || char === '"' || char === '`') {
        quote = char;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          blocks.push({ start: match.index, body: source.slice(match.index, index + 1) });
          break;
        }
      }
    }
  }
  return blocks;
}

function lockedTables(block) {
  const locks = [];
  const pattern = /(?:FROM|UPDATE)\s+["']?([a-zA-Z0-9_]+)["']?[\s\S]{0,500}?FOR\s+UPDATE/gi;
  for (const match of block.matchAll(pattern)) {
    locks.push({ table: match[1], offset: match.index ?? 0 });
  }
  return locks;
}

const files = walk(API_SRC).filter((file) => file.endsWith('.ts')).sort();
const transactions = [];
const inversions = [];
const unknownTables = new Set();

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const block of findTransactionBlocks(source)) {
    const locks = lockedTables(block.body);
    if (locks.length === 0) continue;
    const record = {
      file: relative(file),
      line: lineNumber(source, block.start),
      tables: locks.map((lock) => lock.table),
    };
    transactions.push(record);

    for (const lock of locks) {
      if (!TABLE_RANK.has(lock.table)) unknownTables.add(lock.table);
    }

    for (let index = 1; index < locks.length; index += 1) {
      const previous = locks[index - 1];
      const current = locks[index];
      const previousRank = TABLE_RANK.get(previous.table);
      const currentRank = TABLE_RANK.get(current.table);
      if (previousRank !== undefined && currentRank !== undefined && currentRank < previousRank) {
        inversions.push({
          file: record.file,
          line: record.line,
          before: previous.table,
          after: current.table,
          tables: record.tables,
        });
      }
    }
  }
}

const unknown = [...unknownTables].sort();
const result = {
  audit: 'R-009 transaction lock order',
  policy: 'docs/architecture/transaction-lock-order.md',
  scannedTypeScriptFiles: files.length,
  transactionsWithRawRowLocks: transactions.length,
  inversions,
  unknownTables: unknown,
  transactions,
  strict: STRICT_MODE,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 lock-order audit: ${transactions.length} transaction(s) with raw row locks.`);
  if (inversions.length === 0) console.log('No known lock-order inversion detected.');
  for (const inversion of inversions) {
    console.error(`- ${inversion.file}:${inversion.line} locks ${inversion.before} before ${inversion.after}`);
  }
  if (unknown.length > 0) {
    console.log(`Locked tables requiring policy classification: ${unknown.join(', ')}`);
  }
}

if (STRICT_MODE && (inversions.length > 0 || unknown.length > 0)) {
  if (unknown.length > 0) {
    console.error(`R-009 strict lock-order guard failed: unclassified table(s): ${unknown.join(', ')}`);
  } else {
    console.error('R-009 strict lock-order guard failed.');
  }
  process.exitCode = 1;
}
