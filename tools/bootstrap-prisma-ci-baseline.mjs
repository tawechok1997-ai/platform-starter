import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const databaseUrl = process.env.DATABASE_URL;

if (process.env.CI !== 'true') {
  throw new Error('CI baseline bootstrap is restricted to CI=true');
}
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const url = new URL(databaseUrl);
const databaseName = url.pathname.replace(/^\//, '');
if (!['localhost', '127.0.0.1'].includes(url.hostname) || !databaseName.endsWith('_ci')) {
  throw new Error(`Refusing to baseline non-CI database ${url.hostname}/${databaseName}`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

run('pnpm', ['exec', 'prisma', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate']);

const migrationsRoot = join(root, 'prisma/migrations');
const migrations = (await readdir(migrationsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^\d{14}_[a-z0-9_]+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const migration of migrations) {
  run('pnpm', ['exec', 'prisma', 'migrate', 'resolve', '--schema', 'prisma/schema.prisma', '--applied', migration]);
}

run('pnpm', ['db:migrate']);
run('pnpm', ['db:migrate:status']);

console.log(`CI Prisma baseline ready with ${migrations.length} migrations recorded.`);
