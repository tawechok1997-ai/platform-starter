#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(repositoryRoot, 'prisma', 'schema.prisma');
const migrationsDirectory = path.join(repositoryRoot, 'prisma', 'migrations');
const BOOTSTRAP_SAFE_MIGRATIONS = [
  {
    name: '20260803070000_add_admin_team_access_governance',
    requiredRelations: [
      'admin_teams',
      'admin_team_members',
      'admin_reporting_lines',
      'admin_permission_overrides',
      'admin_access_profiles',
    ],
  },
  {
    name: '20260805040000_add_admin_ui_preferences',
    requiredRelations: ['admin_ui_preferences'],
  },
];

function runPnpm(args, description = `pnpm ${args.join(' ')}`) {
  const result = spawnSync('pnpm', args, {
    cwd: repositoryRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit code ${result.status}`);
  }
}

function runPrisma(args) {
  runPnpm(
    ['exec', 'prisma', ...args, '--schema', schemaPath],
    `Prisma command prisma ${args.join(' ')}`,
  );
}

function runTypeScriptSeed(relativePath) {
  runPnpm(['exec', 'tsx', relativePath], `Database seed ${relativePath}`);
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function withPrisma(operation) {
  const prisma = new PrismaClient();
  try {
    return await operation(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function relationExists(prisma, relationName) {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT to_regclass($1)::text AS relation_name',
    `public.${relationName}`,
  );
  return Boolean(rows[0]?.relation_name);
}

async function readMigrationHistory(prisma) {
  if (!(await relationExists(prisma, '_prisma_migrations'))) return [];

  return prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `);
}

async function findNonEmptyPublicTables(prisma) {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename ASC
  `);
  const nonEmptyTables = [];

  for (const { tablename } of tables) {
    const qualifiedName = `${quoteIdentifier('public')}.${quoteIdentifier(tablename)}`;
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM ${qualifiedName}`);
    if (BigInt(rows[0]?.count ?? 0) > 0n) nonEmptyTables.push(tablename);
  }

  return nonEmptyTables;
}

async function listMigrationNames() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function inspectDatabase() {
  return withPrisma(async (prisma) => {
    const usersExists = await relationExists(prisma, 'users');
    return {
      usersExists,
      migrationHistory: await readMigrationHistory(prisma),
      nonEmptyTables: usersExists ? [] : await findNonEmptyPublicTables(prisma),
    };
  });
}

function successfulMigrationNames(history) {
  return new Set(
    history
      .filter((migration) => migration.finished_at && !migration.rolled_back_at)
      .map((migration) => migration.migration_name),
  );
}

function activeFailedMigrations(history) {
  return history.filter((migration) => !migration.finished_at && !migration.rolled_back_at);
}

async function baselineMigrationHistory(history = []) {
  const migrationNames = await listMigrationNames();
  const appliedNames = successfulMigrationNames(history);

  for (const migrationName of migrationNames) {
    if (!appliedNames.has(migrationName)) {
      runPrisma(['migrate', 'resolve', '--applied', migrationName]);
    }
  }
}

async function relationPresence(prisma, relationNames) {
  return Promise.all(
    relationNames.map(async (relationName) => ({
      relationName,
      exists: await relationExists(prisma, relationName),
    })),
  );
}

async function applyBootstrapSafeMigrations() {
  await withPrisma((prisma) =>
    prisma.$transaction(
      async (tx) => {
        await tx.$queryRawUnsafe(
          "SELECT pg_advisory_xact_lock(hashtext('platform-bootstrap-safe-migrations'))",
        );

        for (const migration of BOOTSTRAP_SAFE_MIGRATIONS) {
          const before = await relationPresence(tx, migration.requiredRelations);
          const existing = before
            .filter((relation) => relation.exists)
            .map((relation) => relation.relationName);
          const missing = before
            .filter((relation) => !relation.exists)
            .map((relation) => relation.relationName);

          if (missing.length === 0) {
            console.log(
              `[database-bootstrap] Bootstrap-safe migration ${migration.name} is already materialized.`,
            );
            continue;
          }

          if (existing.length > 0) {
            throw new Error(
              `Refusing partial bootstrap-safe migration ${migration.name}; existing relations: ${existing.join(', ')}; missing relations: ${missing.join(', ')}`,
            );
          }

          console.warn(
            `[database-bootstrap] Migration history does not match the physical schema; applying ${migration.name} to restore: ${missing.join(', ')}.`,
          );
          const migrationPath = path.join(migrationsDirectory, migration.name, 'migration.sql');
          const sql = await readFile(migrationPath, 'utf8');
          const statements = sql
            .split(/;\s*(?:\r?\n|$)/)
            .map((statement) => statement.trim())
            .filter(Boolean);
          for (const statement of statements) await tx.$executeRawUnsafe(statement);

          const after = await relationPresence(tx, migration.requiredRelations);
          const stillMissing = after
            .filter((relation) => !relation.exists)
            .map((relation) => relation.relationName);
          if (stillMissing.length > 0) {
            throw new Error(
              `Bootstrap-safe migration ${migration.name} completed without creating required relations: ${stillMissing.join(', ')}`,
            );
          }
        }
      },
      { maxWait: 30_000, timeout: 30_000 },
    ),
  );
}

async function baselineEmptyDatabase(state) {
  if (state.nonEmptyTables.length > 0) {
    throw new Error(
      `Refusing automatic database bootstrap because public tables contain data while public.users is missing: ${state.nonEmptyTables.join(', ')}`,
    );
  }

  console.warn('[database-bootstrap] public.users is missing and no application table contains data.');
  console.warn('[database-bootstrap] Rebuilding the current Prisma schema and baselining migration history.');

  for (const migration of activeFailedMigrations(state.migrationHistory)) {
    runPrisma(['migrate', 'resolve', '--rolled-back', migration.migration_name]);
  }

  runPrisma(['db', 'push', '--accept-data-loss', '--skip-generate']);
  await applyBootstrapSafeMigrations();

  const refreshedHistory = await withPrisma((prisma) => readMigrationHistory(prisma));
  await baselineMigrationHistory(refreshedHistory);
  runPrisma(['migrate', 'deploy']);
  await applyBootstrapSafeMigrations();
}

async function ensureCoreSeedData() {
  const seedRequired = await withPrisma(async (prisma) => {
    const [superAdminRole, permissionCount, siteSettingCount] = await Promise.all([
      prisma.role.findUnique({ where: { code: 'super_admin' }, select: { id: true } }),
      prisma.permission.count(),
      prisma.siteSetting.count(),
    ]);
    return !superAdminRole || permissionCount === 0 || siteSettingCount === 0;
  });

  if (!seedRequired) {
    console.log('[database-bootstrap] Core roles, permissions, and site settings already exist.');
    return;
  }

  console.warn('[database-bootstrap] Core roles, permissions, or site settings are missing; applying idempotent seeds.');
  runTypeScriptSeed('prisma/seed.ts');
  runTypeScriptSeed('prisma/seed-access.ts');
}

async function prepareSchema() {
  const state = await inspectDatabase();

  if (!state.usersExists) {
    await baselineEmptyDatabase(state);
    return;
  }

  const failedMigrations = activeFailedMigrations(state.migrationHistory);
  if (failedMigrations.length > 0) {
    throw new Error(
      `Database contains public.users but has unresolved failed migrations: ${failedMigrations.map((item) => item.migration_name).join(', ')}`,
    );
  }

  if (state.migrationHistory.length === 0) {
    console.warn('[database-bootstrap] Existing schema has no Prisma migration history; applying bootstrap-safe SQL migrations before recording the baseline.');
    await applyBootstrapSafeMigrations();
    await baselineMigrationHistory();
  }

  runPrisma(['migrate', 'deploy']);
  await applyBootstrapSafeMigrations();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required before preparing the production database.');
  }

  await prepareSchema();
  await ensureCoreSeedData();
  runTypeScriptSeed('prisma/seed-production-admin.ts');
}

main().catch((error) => {
  console.error('[database-bootstrap] Failed to prepare the database.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
