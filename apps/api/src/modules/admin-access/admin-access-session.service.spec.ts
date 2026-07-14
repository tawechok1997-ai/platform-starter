import { AdminAccessSessionService } from './admin-access-session.service';

describe('AdminAccessSessionService', () => {
  it('revokes every active admin session for the target account', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 3 });
    const createAudit = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const prisma = {
      authSession: { updateMany },
      adminAuditLog: { create: createAudit },
    } as any;

    const service = new AdminAccessSessionService(prisma);
    const result = await service.revokeAfterPrivilegeChange('actor-1', 'target-1', 'ASSIGN_ROLE');

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        adminUserId: 'target-1',
        type: 'ADMIN',
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result.revokedSessions).toBe(3);
    expect(createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUser: { connect: { id: 'actor-1' } },
        action: 'REVOKE_ADMIN_SESSIONS_AFTER_PRIVILEGE_CHANGE',
        module: 'admin-access',
        targetId: 'target-1',
        newData: expect.objectContaining({
          change: 'ASSIGN_ROLE',
          revokedSessions: 3,
        }),
      }),
    });
  });

  it('still writes an audit record when no active sessions exist', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const createAudit = jest.fn().mockResolvedValue({ id: 'audit-2' });
    const prisma = {
      authSession: { updateMany },
      adminAuditLog: { create: createAudit },
    } as any;

    const service = new AdminAccessSessionService(prisma);
    const result = await service.revokeAfterPrivilegeChange('actor-2', 'target-2', 'REMOVE_ROLE');

    expect(result.revokedSessions).toBe(0);
    expect(createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        newData: expect.objectContaining({
          change: 'REMOVE_ROLE',
          revokedSessions: 0,
        }),
      }),
    });
  });
  it('supports ownership transfer revoke reasons', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const createAudit = jest.fn().mockResolvedValue({ id: 'audit-3' });
    const prisma = { authSession: { updateMany }, adminAuditLog: { create: createAudit } } as any;

    const service = new AdminAccessSessionService(prisma);
    await service.revokeAfterPrivilegeChange('actor-3', 'target-3', 'TRANSFER_OWNERSHIP_IN');

    expect(createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        newData: expect.objectContaining({ change: 'TRANSFER_OWNERSHIP_IN', revokedSessions: 1 }),
      }),
    });
  });

});