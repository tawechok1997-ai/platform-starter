import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';
import { AdminRefreshSessionService } from './admin-refresh-session.service';

describe('AdminRefreshSessionService', () => {
  it('rotates an active refresh session before issuing a replacement', async () => {
    jest.spyOn(argon2, 'verify').mockResolvedValue(true as never);
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'session-1',
          adminUserId: 'admin-1',
          refreshTokenHash: 'hash',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as never;
    const tokens = { create: jest.fn().mockResolvedValue({ refreshToken: 'session-2.raw' }) } as never;
    const service = new AdminRefreshSessionService(prisma, tokens);

    await expect(service.refresh('session-1.raw')).resolves.toEqual({ refreshToken: 'session-2.raw' });
    expect((prisma as any).authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'session-1', revokedAt: null }),
    }));
    expect((tokens as any).create).toHaveBeenCalledWith('admin-1', {});
  });

  it('revokes the refresh family and writes audit when a revoked token is reused', async () => {
    jest.spyOn(argon2, 'verify').mockResolvedValue(true as never);
    const tx = {
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'session-1',
          adminUserId: 'admin-1',
          refreshTokenHash: 'hash',
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        }),
      },
      $transaction: jest.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)),
    } as never;
    const service = new AdminRefreshSessionService(prisma, { create: jest.fn() } as never);

    await expect(service.refresh('session-1.raw', { ipAddress: '127.0.0.1' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        module: 'auth',
        action: 'admin.refresh.reuse_detected',
        targetId: 'session-1',
        ipAddress: '127.0.0.1',
      }),
    });
  });
});
