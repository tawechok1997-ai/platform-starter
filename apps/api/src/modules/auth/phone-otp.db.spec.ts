import { PrismaClient } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import { PhoneOtpService } from './phone-otp.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const secret = 'ci-phone-otp-secret-value-2026';

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('FINANCE_TEST_DATABASE_URL must point to an isolated test database');
}

function hash(value: string) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

describeWithDatabase('phone OTP security with PostgreSQL', () => {
  let prismaA: PrismaClient;
  let prismaB: PrismaClient;
  let serviceA: PhoneOtpService;
  let serviceB: PhoneOtpService;
  const concurrentUserId = randomUUID();
  const bruteUserId = randomUUID();
  const concurrentChallengeId = randomUUID();
  const bruteChallengeId = randomUUID();
  const concurrentPhone = `08${String(randomUUID().replace(/\D/g, '')).padEnd(8, '1').slice(0, 8)}`;
  const brutePhone = `09${String(randomUUID().replace(/\D/g, '')).padEnd(8, '2').slice(0, 8)}`;
  const validCode = '482731';

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    process.env.PHONE_OTP_SECRET = secret;
    prismaA = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    prismaB = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    serviceA = new PhoneOtpService(prismaA as any, { sendOtp: jest.fn() } as any);
    serviceB = new PhoneOtpService(prismaB as any, { sendOtp: jest.fn() } as any);
    await Promise.all([prismaA.$connect(), prismaB.$connect()]);

    const suffix = randomUUID().slice(0, 10);
    await prismaA.user.createMany({
      data: [
        { id: concurrentUserId, username: `otp-race-${suffix}`, phone: concurrentPhone, passwordHash: 'unused' },
        { id: bruteUserId, username: `otp-brute-${suffix}`, phone: brutePhone, passwordHash: 'unused' },
      ],
    });
    await prismaA.$executeRawUnsafe(
      `INSERT INTO phone_otp_challenges
        (id, user_id, phone_hash, phone_masked, otp_hash, max_attempts, provider, expires_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, 5, 'test', NOW() + INTERVAL '5 minutes')`,
      concurrentChallengeId,
      concurrentUserId,
      hash(`phone:${concurrentPhone}`),
      `******${concurrentPhone.slice(-4)}`,
      hash(`otp:${validCode}`),
    );
    await prismaA.$executeRawUnsafe(
      `INSERT INTO phone_otp_challenges
        (id, user_id, phone_hash, phone_masked, otp_hash, max_attempts, provider, expires_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, 3, 'test', NOW() + INTERVAL '5 minutes')`,
      bruteChallengeId,
      bruteUserId,
      hash(`phone:${brutePhone}`),
      `******${brutePhone.slice(-4)}`,
      hash('otp:654321'),
    );
  }, 30_000);

  afterAll(async () => {
    if (!prismaA) return;
    await prismaA.$executeRawUnsafe('DELETE FROM phone_otp_challenges WHERE user_id IN ($1::uuid, $2::uuid)', concurrentUserId, bruteUserId);
    await prismaA.user.deleteMany({ where: { id: { in: [concurrentUserId, bruteUserId] } } });
    await Promise.all([prismaA.$disconnect(), prismaB.$disconnect()]);
    delete process.env.PHONE_OTP_SECRET;
  }, 30_000);

  it('allows exactly one concurrent verification and rejects replay', async () => {
    const results = await Promise.allSettled([
      serviceA.verify(concurrentUserId, validCode),
      serviceB.verify(concurrentUserId, validCode),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const user = await prismaA.user.findUniqueOrThrow({ where: { id: concurrentUserId } });
    const rows = await prismaA.$queryRawUnsafe<Array<{ status: string; used_at: Date | null }>>(
      'SELECT status, used_at FROM phone_otp_challenges WHERE id = $1::uuid',
      concurrentChallengeId,
    );
    expect(user.phoneVerifiedAt).not.toBeNull();
    expect(rows[0].status).toBe('VERIFIED');
    expect(rows[0].used_at).not.toBeNull();
    await expect(serviceA.verify(concurrentUserId, validCode)).rejects.toThrow(/ถูกใช้แล้ว/);
  }, 30_000);

  it('persists failed attempts and locks after the configured limit', async () => {
    await expect(serviceA.verify(bruteUserId, '000001')).rejects.toThrow('OTP ไม่ถูกต้อง');
    await expect(serviceA.verify(bruteUserId, '000002')).rejects.toThrow('OTP ไม่ถูกต้อง');
    await expect(serviceA.verify(bruteUserId, '000003')).rejects.toThrow(/ถูกล็อก/);

    const rows = await prismaA.$queryRawUnsafe<Array<{ status: string; attempt_count: number }>>(
      'SELECT status, attempt_count FROM phone_otp_challenges WHERE id = $1::uuid',
      bruteChallengeId,
    );
    expect(rows[0]).toEqual({ status: 'LOCKED', attempt_count: 3 });
    await expect(serviceA.verify(bruteUserId, '654321')).rejects.toThrow(/ถูกใช้แล้ว|ถูกล็อก/);
  }, 30_000);
});
