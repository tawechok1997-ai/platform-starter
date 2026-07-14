import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const infrastructureDir = path.join(ROOT, 'apps/api/src/common/infrastructure');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(infrastructureDir)
  .filter((file) => file.endsWith('.ts'))
  .filter((file) => /prisma|repository|row-lock/.test(path.basename(file)))
  .sort();

const failures = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(ROOT, file).split(path.sep).join('/');
  const hasPersistenceCall = /\.(?:\$queryRaw|\$executeRaw|create|update|upsert|delete|deleteMany|findUnique)\s*[<(]/.test(source);
  if (!hasPersistenceCall) continue;

  if (/new\s+PrismaClient\s*\(/.test(source)) failures.push(`${relative} instantiates PrismaClient`);
  if (/\.\$transaction\s*\(/.test(source)) failures.push(`${relative} opens a nested transaction`);
  if (/\bthis\.prisma\b/.test(source)) failures.push(`${relative} uses an unscoped PrismaService/client`);
  if (!/Prisma\.TransactionClient/.test(source)) failures.push(`${relative} does not declare TransactionClient ownership`);
}

if (failures.length > 0) {
  console.error('R-009 transaction-context guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`R-009 transaction-context guard passed for ${files.length} infrastructure file(s).`);
