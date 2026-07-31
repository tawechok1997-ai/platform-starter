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

// These domains are intentionally managed through raw SQL and are not fully
// represented in schema.prisma. Apply their ordered migrations after db push,
// before the historical migration ledger is baselined.
const rawSqlBootstrapMigrations = [
  '20260714190000_add_promotion_domain_models',
  '20260714191000_backfill_promotion_domain_models',
  '20260714213000_add_risk_watchlist_domain',
  '20260714213100_add_watchlist_risk_alert_type',
  '20260714230000_add_kyc_document_domain',
  '20260714230100_add_phone_otp_verification',
  '20260720212000_game_round_transaction_foundation',
  '20260720214500_separate_round_refund_cancel',
  '20260720220000_provider_simulator_nonce_security',
  '20260720223500_game_round_manual_review_and_diagnostics',
];

for (const migration of rawSqlBootstrapMigrations) {
  if (!migrations.includes(migration)) {
    throw new Error(`Required CI raw-SQL migration is missing: ${migration}`);
  }
  run('pnpm', [
    'exec',
    'prisma',
    'db',
    'execute',
    '--schema',
    'prisma/schema.prisma',
    '--file',
    join('prisma/migrations', migration, 'migration.sql'),
  ]);
}

for (const migration of migrations) {
  run('pnpm', ['exec', 'prisma', 'migrate', 'resolve', '--schema', 'prisma/schema.prisma', '--applied', migration]);
}

run('pnpm', ['db:migrate']);
run('pnpm', ['db:migrate:status']);

console.log(`CI Prisma baseline ready with ${migrations.length} migrations recorded and ${rawSqlBootstrapMigrations.length} raw-SQL migrations applied.`);
