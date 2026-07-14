import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AdminLoginService } from './admin-login.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
  argon2id: 2,
}));

const verifyMock = jest.mocked(argon2.verify);

describe('AdminLoginService', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns a two-factor challenge without creating a session', async () => {
    verifyMock.mockResolvedValue(true);
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'admin-1', status: 'ACTIVE', passwordHash: 'hash', twoFactorEnabled: true, twoFactorSecret: 'secret' }) },
      loginHistory: { create: jest.fn(), findMany: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    } as any;
    const sessions = { create: jest.fn() };
    const service = new AdminLoginService(prisma, { get: jest.fn() } as any, sessions as any);

    await expect(service.signIn({ username: 'root', secret: 'valid' } as any)).resolves.toEqual({
      requiresTwoFactor: true,
      challengeId: 'admin-1',
    });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('creates a session after a valid challenge and writes shared-shape audit metadata', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'admin-1', status: 'ACTIVE', twoFactorEnabled: true, twoFactorSecret: null }) },
      adminRecoveryCode: {
        findMany: jest.fn().mockResolvedValue([{ id: 'code-1', codeHash: 'hash' }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      loginHistory: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    } as any;
    verifyMock.mockResolvedValue(true);
    const sessions = { create: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh', expiresAt: new Date() }) };
    const service = new AdminLoginService(prisma, { get: jest.fn() } as any, sessions as any);

    await service.verifyTwoFactor({ challengeId: 'admin-1', code: 'ABCD-EFGH-IJKL' } as any, { ipAddress: '127.0.0.1' });

    expect(sessions.create).toHaveBeenCalledWith('admin-1', { ipAddress: '127.0.0.1' });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ adminUser: { connect: { id: 'admin-1' } }, module: 'auth' }),
    }));
  });

  it('rejects inactive login before password verification', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'admin-1', status: 'LOCKED' }) },
      loginHistory: { create: jest.fn() },
    } as any;
    const service = new AdminLoginService(prisma, { get: jest.fn() } as any, { create: jest.fn() } as any);

    await expect(service.signIn({ username: 'root', secret: 'x' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyMock).not.toHaveBeenCalled();
  });
});
