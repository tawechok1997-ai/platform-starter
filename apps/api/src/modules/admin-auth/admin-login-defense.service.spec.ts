import { HttpException } from '@nestjs/common';
import { AdminLoginDefenseService } from './admin-login-defense.service';

function createPrisma(options: {
  adminId?: string | null;
  lastSuccessAt?: Date | null;
  accountFailures?: number;
  ipFailures?: number;
  latestAccountFailureAt?: Date | null;
  latestIpFailureAt?: Date | null;
} = {}) {
  const adminId = options.adminId === null ? null : options.adminId ?? 'admin-1';

  return {
    adminUser: {
      findUnique: jest.fn().mockResolvedValue(adminId ? { id: adminId } : null),
    },
    loginHistory: {
      count: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.adminUserId) return Promise.resolve(options.accountFailures ?? 0);
        if (where?.ipAddress) return Promise.resolve(options.ipFailures ?? 0);
        return Promise.resolve(0);
      }),
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.success === true) {
          return Promise.resolve(options.lastSuccessAt ? { createdAt: options.lastSuccessAt } : null);
        }
        if (where?.adminUserId) {
          return Promise.resolve(options.latestAccountFailureAt ? { createdAt: options.latestAccountFailureAt } : null);
        }
        if (where?.ipAddress) {
          return Promise.resolve(options.latestIpFailureAt ? { createdAt: options.latestIpFailureAt } : null);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockReturnValue(Promise.resolve({ id: 'history-1' })),
    },
    adminAuditLog: {
      create: jest.fn().mockReturnValue(Promise.resolve({ id: 'audit-1' })),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  } as any;
}

describe('AdminLoginDefenseService', () => {
  it('allows an account below the failure threshold', async () => {
    const prisma = createPrisma({ accountFailures: 4, ipFailures: 10 });
    const service = new AdminLoginDefenseService(prisma);

    await expect(service.assertAllowed('admin', { ipAddress: '203.0.113.10' })).resolves.toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('temporarily locks an account after five recent failures', async () => {
    const now = new Date();
    const prisma = createPrisma({
      accountFailures: 5,
      ipFailures: 5,
      latestAccountFailureAt: now,
      latestIpFailureAt: now,
    });
    const service = new AdminLoginDefenseService(prisma);

    await expect(service.assertAllowed('admin', { ipAddress: '203.0.113.10', userAgent: 'test' }))
      .rejects.toMatchObject({ status: 429 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('throttles repeated unknown usernames by IP without revealing account existence', async () => {
    const now = new Date();
    const prisma = createPrisma({
      adminId: null,
      ipFailures: 15,
      latestIpFailureAt: now,
    });
    const service = new AdminLoginDefenseService(prisma);

    let thrown: unknown;
    try {
      await service.assertAllowed('does-not-exist', { ipAddress: '198.51.100.20' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getResponse()).toEqual(expect.objectContaining({
      code: 'ADMIN_LOGIN_TEMPORARILY_LOCKED',
      message: 'Too many sign-in attempts. Please try again later.',
    }));
  });

  it('counts account failures only after the latest successful login', async () => {
    const lastSuccessAt = new Date(Date.now() - 30_000);
    const prisma = createPrisma({ lastSuccessAt, accountFailures: 0, ipFailures: 0 });
    const service = new AdminLoginDefenseService(prisma);

    await service.assertAllowed('admin', { ipAddress: '203.0.113.10' });

    expect(prisma.loginHistory.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ adminUserId: 'admin-1', createdAt: { gt: lastSuccessAt } }),
    }));
  });

  it('does not count throttled audit rows as fresh credential failures', async () => {
    const prisma = createPrisma({ accountFailures: 0, ipFailures: 0 });
    const service = new AdminLoginDefenseService(prisma);

    await service.assertAllowed('admin', { ipAddress: '203.0.113.10' });

    expect(prisma.loginHistory.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ reason: { in: ['ADMIN_NOT_ACTIVE', 'INVALID_SECRET', 'INVALID_CODE'] } }),
    }));
  });
});