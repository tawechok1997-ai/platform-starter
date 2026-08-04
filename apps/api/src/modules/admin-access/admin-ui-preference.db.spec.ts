import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AdminUiPreferenceService } from './admin-ui-preference.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) {
    throw new Error('Admin UI preference DB tests require an isolated test database');
  }
}

async function ensurePreferenceTable(prisma: PrismaClient) {
  const rows = await prisma.$queryRaw<Array<{ tableName: string | null }>>`
    SELECT to_regclass('public.admin_ui_preferences')::text AS "tableName"
  `;
  if (rows[0]?.tableName) return;

  const migrationPath = resolve(
    process.cwd(),
    '../../prisma/migrations/20260805040000_add_admin_ui_preferences/migration.sql',
  );
  const sql = readFileSync(migrationPath, 'utf8');
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

describeWithDatabase('admin UI preference persistence with PostgreSQL', () => {
  let prisma: PrismaClient;
  let service: AdminUiPreferenceService;
  const adminUserId = randomUUID();
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    await ensurePreferenceTable(prisma);
    await prisma.adminUser.create({
      data: {
        id: adminUserId,
        username: `ui-preference-${suffix}`,
        email: `ui-preference-${suffix}@example.test`,
        passwordHash: 'not-used',
      },
    });
    service = new AdminUiPreferenceService(prisma as never);
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$executeRawUnsafe(
      'DELETE FROM admin_ui_preferences WHERE admin_user_id = $1::uuid',
      adminUserId,
    );
    await prisma.adminUser.deleteMany({ where: { id: adminUserId } });
    await prisma.$disconnect();
  }, 30_000);

  test('persists and updates a dashboard layout across service instances', async () => {
    const first = await service.upsert(adminUserId, 'dashboard-widget-layout-v1', {
      version: 1,
      adminUserId,
      updatedAt: '2026-08-05T00:00:00.000Z',
      items: [{ widgetId: 'finance.cash-flow', order: 0, columns: 2, rows: 1, pinned: true, hidden: false }],
    });
    expect(first.version).toBe(1);

    const secondService = new AdminUiPreferenceService(prisma as never);
    const loaded = await secondService.get(adminUserId, 'dashboard-widget-layout-v1');
    expect(loaded.value).toEqual(expect.objectContaining({ adminUserId, version: 1 }));

    const updated = await secondService.upsert(adminUserId, 'dashboard-widget-layout-v1', {
      version: 1,
      adminUserId,
      updatedAt: '2026-08-05T00:01:00.000Z',
      items: [{ widgetId: 'finance.cash-flow', order: 0, columns: 4, rows: 2, pinned: false, hidden: false }],
    });
    expect(updated.version).toBe(2);
    expect(updated.value).toEqual(expect.objectContaining({
      items: [expect.objectContaining({ columns: 4, rows: 2 })],
    }));
  }, 30_000);
});
