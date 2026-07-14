import { UnauthorizedException } from '@nestjs/common';
import { AdminStepUpService } from './admin-step-up.service';

jest.mock('./admin-two-factor.util', () => ({ assertAdminTotp: jest.fn() }));

const { assertAdminTotp } = jest.requireMock('./admin-two-factor.util') as { assertAdminTotp: jest.Mock };

describe('AdminStepUpService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects inactive or unconfigured admins before writing audit', async () => {
    const prisma = { adminUser: { findUnique: jest.fn().mockResolvedValue(null) }, adminAuditLog: { create: jest.fn() } } as any;
    await expect(new AdminStepUpService(prisma).verify('admin-1', '123456')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it('verifies totp and writes shared audit shape', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'admin-1', status: 'ACTIVE', twoFactorEnabled: true, twoFactorSecret: 'SECRET' }) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    } as any;
    await expect(new AdminStepUpService(prisma).verify('admin-1', '123456', { ipAddress: '127.0.0.1' })).resolves.toEqual({ success: true });
    expect(assertAdminTotp).toHaveBeenCalledWith('SECRET', '123456');
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ module: 'auth', action: 'admin.step_up.verify' }) }));
  });
});
