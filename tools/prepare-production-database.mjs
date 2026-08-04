#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(repositoryRoot, 'prisma', 'schema.prisma');
const migrationsDirectory = path.join(repositoryRoot, 'prisma', 'migrations');

function runPrisma(args) {
  const result = spawnSync('pnpm', ['exec', 'prisma', ...args, '--schema', schemaPath], {
    cwd: repositoryRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Prisma command failed with exit code ${result.status}: prisma ${args.join(' ')}`);
  }
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

  const refreshedHistory = await withPrisma((prisma) => readMigrationHistory(prisma));
  await baselineMigrationHistory(refreshedHistory);
  runPrisma(['migrate', 'deploy']);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required before preparing the production database.');
  }

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
    console.warn('[database-bootstrap] Existing schema has no Prisma migration history; recording the current migrations as the baseline.');
    await baselineMigrationHistory();
  }

  runPrisma(['migrate', 'deploy']);
}

main().catch((error) => {
  console.error('[database-bootstrap] Failed to prepare the database.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
