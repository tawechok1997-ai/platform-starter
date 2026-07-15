import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for R-010 EXPLAIN ANALYZE evidence.');
  process.exit(1);
}

const prisma = new PrismaClient();
const outputPath = process.env.R010_EXPLAIN_OUTPUT ?? 'artifacts/r010-explain-analyze.json';
const from = new Date('2026-01-01T00:00:00.000Z');
const to = new Date('2026-12-31T23:59:59.999Z');

const queries = [
  {
    name: 'dashboard-topups-by-status',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
      FROM top_up_requests
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY status`,
    params: [from, to],
  },
  {
    name: 'queue-aging-pending-topups',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, user_id, amount, currency, created_at
      FROM top_up_requests
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT 20`,
    params: [],
  },
  {
    name: 'reconciliation-wallet-scan',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, user_id, balance, locked_balance, updated_at
      FROM wallets
      ORDER BY updated_at DESC
      LIMIT 100`,
    params: [],
  },
  {
    name: 'reconciliation-latest-ledger-lookup',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT balance_after, created_at
      FROM wallet_ledgers
      WHERE wallet_id = '00000000-0000-0000-0000-000000000000'::uuid
      ORDER BY created_at DESC
      LIMIT 1`,
    params: [],
  },
];

function summarize(planDocument) {
  const root = planDocument?.[0]?.Plan ?? {};
  return {
    planningTimeMs: planDocument?.[0]?.['Planning Time'] ?? null,
    executionTimeMs: planDocument?.[0]?.['Execution Time'] ?? null,
    nodeType: root['Node Type'] ?? null,
    relationName: root['Relation Name'] ?? null,
    indexName: root['Index Name'] ?? null,
    actualRows: root['Actual Rows'] ?? null,
    sharedHitBlocks: root['Shared Hit Blocks'] ?? null,
    sharedReadBlocks: root['Shared Read Blocks'] ?? null,
  };
}

try {
  const results = [];
  for (const query of queries) {
    const rows = await prisma.$queryRawUnsafe(query.sql, ...query.params);
    const plan = rows?.[0]?.['QUERY PLAN'];
    results.push({ name: query.name, summary: summarize(plan), plan });
  }

  const evidence = {
    generatedAt: new Date().toISOString(),
    database: 'ephemeral-postgresql-ci',
    caveat: 'This is a repeatable empty-schema CI baseline, not a production-volume benchmark.',
    queries: results,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`R-010 EXPLAIN ANALYZE evidence written to ${outputPath}`);
} finally {
  await prisma.$disconnect();
}
