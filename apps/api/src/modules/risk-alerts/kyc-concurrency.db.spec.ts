import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { KycDocumentsService } from './kyc-documents.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('FINANCE_TEST_DATABASE_URL must point to an isolated test database');
}

describeWithDatabase('KYC review concurrency with PostgreSQL', () => {
  let prisma: PrismaClient;
  let service: KycDocumentsService;
  const memberId = randomUUID();
  const adminA = randomUUID();
  const adminB = randomUUID();
  const caseId = randomUUID();

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    process.env.KYC_ACCESS_SECRET = process.env.KYC_ACCESS_SECRET || 'kyc-db-test-secret-2026';
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    const storage = {
      put: jest.fn(),
      get: jest.fn(),
      remove: jest.fn(),
    };
    service = new KycDocumentsService(prisma as any, storage as any);
    await prisma.$connect();

    const suffix = randomUUID().slice(0, 12);
    await prisma.user.create({
      data: {
        id: memberId,
        username: `kyc-member-${suffix}`,
        email: `kyc-member-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.adminUser.createMany({
      data: [
        { id: adminA, username: `kyc-admin-a-${suffix}`, email: `kyc-admin-a-${suffix}@example.test`, passwordHash: 'not-used' },
        { id: adminB, username: `kyc-admin-b-${suffix}`, email: `kyc-admin-b-${suffix}@example.test`, passwordHash: 'not-used' },
      ],
    });

    await prisma.$executeRawUnsafe(
      `INSERT INTO kyc_cases (id, member_id, status, version, submitted_at)
       VALUES ($1::uuid, $2::uuid, 'SUBMITTED', 1, CURRENT_TIMESTAMP)`,
      caseId,
      memberId,
    );

    for (const type of ['PASSPORT', 'SELFIE']) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO kyc_documents
          (case_id, member_id, document_type, status, storage_key, original_name, mime_type,
           size_bytes, sha256, retention_until, version)
         VALUES ($1::uuid, $2::uuid, $3, 'ACCEPTED', $4, $5, 'image/png', 4, $6,
           CURRENT_TIMESTAMP + INTERVAL '365 days', 1)`,
        caseId,
        memberId,
        type,
        `kyc/${memberId}/${caseId}/${randomUUID()}.png`,
        `${type.toLowerCase()}.png`,
        randomUUID().replace(/-/g, '').padEnd(64, '0').slice(0, 64),
      );
    }
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$executeRawUnsafe('DELETE FROM kyc_documents WHERE case_id = $1::uuid', caseId);
    await prisma.$executeRawUnsafe('DELETE FROM kyc_cases WHERE id = $1::uuid', caseId);
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: [adminA, adminB] } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: [adminA, adminB] } } });
    await prisma.user.deleteMany({ where: { id: memberId } });
    await prisma.$disconnect();
  }, 30_000);

  it('allows only one reviewer to transition the same case version', async () => {
    const reviews = await Promise.allSettled([
      service.reviewCase(caseId, { status: 'APPROVED', version: 1, note: 'Approve from reviewer A' } as any, adminA),
      service.reviewCase(caseId, { status: 'REJECTED', version: 1, note: 'Reject from reviewer B' } as any, adminB),
    ]);

    expect(reviews.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(reviews.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const rows = await prisma.$queryRawUnsafe<Array<{ status: string; version: number; reviewed_by_admin_id: string | null }>>(
      'SELECT status, version, reviewed_by_admin_id FROM kyc_cases WHERE id = $1::uuid',
      caseId,
    );
    expect(['APPROVED', 'REJECTED']).toContain(rows[0].status);
    expect(rows[0].version).toBe(2);
    expect([adminA, adminB]).toContain(rows[0].reviewed_by_admin_id);

    await expect(
      service.reviewCase(caseId, { status: 'REVIEWING', version: 1, note: 'stale retry' } as any, adminA),
    ).rejects.toThrow();
  }, 30_000);
});