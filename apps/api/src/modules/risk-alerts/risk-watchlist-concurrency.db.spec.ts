import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { RiskWatchlistService } from './risk-watchlist.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('FINANCE_TEST_DATABASE_URL must point to an isolated test database');
}

describeWithDatabase('risk watchlist concurrency with PostgreSQL', () => {
  let prisma: PrismaClient;
  let service: RiskWatchlistService;
  const adminId = randomUUID();
  const subject = `089${Math.floor(Math.random() * 1_000_0000).toString().padStart(7, '0')}`;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    process.env.RISK_MATCH_SECRET = process.env.RISK_MATCH_SECRET || 'risk-watchlist-db-test-secret-2026';
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    service = new RiskWatchlistService(prisma as any);
    await prisma.$connect();
    const suffix = randomUUID().slice(0, 12);
    await prisma.adminUser.create({
      data: {
        id: adminId,
        username: `risk-admin-${suffix}`,
        email: `risk-admin-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$executeRawUnsafe(
      'DELETE FROM risk_watchlist_entries WHERE created_by_admin_id = $1::uuid OR released_by_admin_id = $1::uuid',
      adminId,
    );
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: adminId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  }, 30_000);

  it('allows only one active duplicate and only one release for the same version', async () => {
    const input = {
      subjectType: 'PHONE',
      subjectValue: subject,
      listType: 'BLACKLIST',
      reasonCode: 'FRAUD_CONFIRMED',
      severity: 'HIGH',
      note: 'PostgreSQL concurrency test',
    } as any;

    const creates = await Promise.allSettled([
      service.create(input, { id: adminId }),
      service.create(input, { id: adminId }),
    ]);

    expect(creates.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(creates.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const active = await prisma.$queryRawUnsafe<Array<{ id: string; version: number }>>(
      `SELECT id, version FROM risk_watchlist_entries
       WHERE subject_type = 'PHONE' AND list_type = 'BLACKLIST' AND status = 'ACTIVE'
         AND created_by_admin_id = $1::uuid`,
      adminId,
    );
    expect(active).toHaveLength(1);

    const releases = await Promise.allSettled([
      service.release(active[0].id, { version: active[0].version, reason: 'Concurrent release test A' }, { id: adminId }),
      service.release(active[0].id, { version: active[0].version, reason: 'Concurrent release test B' }, { id: adminId }),
    ]);

    expect(releases.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(releases.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const rows = await prisma.$queryRawUnsafe<Array<{ status: string; version: number; released_at: Date | null }>>(
      'SELECT status, version, released_at FROM risk_watchlist_entries WHERE id = $1::uuid',
      active[0].id,
    );
    expect(rows[0].status).toBe('RELEASED');
    expect(rows[0].version).toBe(active[0].version + 1);
    expect(rows[0].released_at).not.toBeNull();
  }, 30_000);
});