import { AdminTwoFactorCommandService } from './admin-two-factor-command.service';

jest.mock('argon2', () => ({ hash: jest.fn(async (value: string) => `hash:${value}`) }));

jest.mock('./admin-two-factor.util', () => ({
  assertAdminTotp: jest.fn(),
  generateAdminRecoveryCodes: jest.fn(() => Array.from({ length: 10 }, (_, index) => `ABCD-EF${String(index).padStart(2, '0')}-GHIJ`)),
  generateAdminTwoFactorSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
  normalizeAdminRecoveryCode: jest.fn((value: string) => value.replace(/-/g, '')),
}));

describe('AdminTwoFactorCommandService', () => {
  it('writes setup mutation and audit in the same transaction', async () => {
    const tx = {
      adminUser: { update: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    };
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'admin-1', username: 'root', status: 'ACTIVE' }) },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const config = { get: jest.fn().mockReturnValue('Platform Admin') };
    const service = new AdminTwoFactorCommandService(prisma as never, config as never);

    const result = await service.setup('admin-1', { ipAddress: '127.0.0.1' });

    expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.adminUser.update).toHaveBeenCalledTimes(1);
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'admin.otp.setup', module: 'auth' }),
    });
  });

  it('rejects inactive admins before writing anything', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'admin-1', status: 'LOCKED' }) },
      $transaction: jest.fn(),
    };
    const service = new AdminTwoFactorCommandService(prisma as never, { get: jest.fn() } as never);

    await expect(service.setup('admin-1')).rejects.toThrow('Admin is not active');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
