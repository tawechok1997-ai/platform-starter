import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const migrationsRoot = join(root, 'prisma/migrations');
const failures = [];
const warnings = [];
const entries = (await readdir(migrationsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const seenPrefixes = new Map();
for (const name of entries) {
  if (!/^\d{14}_[a-z0-9_]+$/.test(name)) failures.push(`${name}: migration directory must use YYYYMMDDHHMMSS_snake_case`);
  const prefix = name.slice(0, 14);
  if (seenPrefixes.has(prefix)) failures.push(`${name}: timestamp collides with ${seenPrefixes.get(prefix)}`);
  else seenPrefixes.set(prefix, name);

  const sqlPath = join(migrationsRoot, name, 'migration.sql');
  let sql = '';
  try {
    sql = await readFile(sqlPath, 'utf8');
  } catch {
    failures.push(`${name}: missing migration.sql`);
    continue;
  }
  if (!sql.trim()) failures.push(`${name}/migration.sql: empty migration`);
  if (/\bDROP\s+DATABASE\b/i.test(sql)) failures.push(`${name}/migration.sql: DROP DATABASE is forbidden`);
  if (/\bTRUNCATE\b/i.test(sql)) warnings.push(`${name}/migration.sql: contains TRUNCATE; requires explicit review evidence`);
  if (/\bDROP\s+TABLE\b/i.test(sql)) warnings.push(`${name}/migration.sql: contains DROP TABLE; requires rollback/data-migration evidence`);
}

const lockPath = join(migrationsRoot, 'migration_lock.toml');
try {
  const lock = await readFile(lockPath, 'utf8');
  if (!/provider\s*=\s*"postgresql"/.test(lock)) failures.push('migration_lock.toml: provider must remain postgresql');
} catch {
  failures.push('prisma/migrations/migration_lock.toml: missing');
}

console.log('Migration validation audit:');
console.log(`  migration directories: ${entries.length}`);
console.log(`  warnings: ${warnings.length}`);
console.log(`  failures: ${failures.length}`);
for (const warning of warnings) console.warn(`  warning: ${warning}`);

if (failures.length) {
  console.error('\nMigration validation violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
