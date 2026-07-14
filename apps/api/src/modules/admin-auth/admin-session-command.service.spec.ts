import { NotFoundException } from '@nestjs/common';
import { AdminSessionCommandService } from './admin-session-command.service';

describe('AdminSessionCommandService', () => {
  function createSubject(options: { sessionExists?: boolean; revokedCount?: number } = {}) {
    const tx = {
      authSession: {
        updateMany: jest.fn().mockResolvedValue({ count: options.revokedCount ?? 1 }),
      },
      adminAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue(options.sessionExists === false ? null : { id: 'session-2' }),
      },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    return {
      service: new AdminSessionCommandService(prisma as never),
      prisma,
      tx,
    };
  }

  it('revokes one session and writes the audit in the same transaction', async () => {
    const { service, prisma, tx } = createSubject();

    const result = await service.revokeSession('admin-1', 'session-1', 'session-2', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result).toEqual({ success: true, current: false });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-2', adminUserId: 'admin-1', type: 'ADMIN', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        module: 'auth',
        action: 'admin.session.revoke',
        targetId: 'session-2',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    });
  });

  it('does not mutate when the requested session is not owned by the admin', async () => {
    const { service, prisma } = createSubject({ sessionExists: false });

    await expect(service.revokeSession('admin-1', 'session-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('records the revoked count when revoking other sessions', async () => {
    const { service, tx } = createSubject({ revokedCount: 3 });

    await expect(service.revokeOtherSessions('admin-1', 'session-1')).resolves.toEqual({ success: true, revoked: 3 });
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'admin.session.revoke_others',
        newData: { revoked: 3 },
      }),
    });
  });
});
