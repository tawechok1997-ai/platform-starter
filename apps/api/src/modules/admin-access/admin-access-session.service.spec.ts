import {
  ADMIN_PRIVILEGE_CHANGES,
  AdminAccessSessionService,
} from './admin-access-session.service';

describe('AdminAccessSessionService', () => {
  it('covers every access mutation that invalidates active sessions', () => {
    expect(ADMIN_PRIVILEGE_CHANGES).toEqual([
      'ASSIGN_ROLE',
      'REMOVE_ROLE',
      'SYNC_ROLES',
      'REVOKE_DELEGATION',
      'SET_TEAM_MEMBER',
      'REMOVE_TEAM_MEMBER',
      'SET_REPORTING_LINE',
      'SET_PERMISSION_OVERRIDE',
      'DELETE_PERMISSION_OVERRIDE',
      'UPDATE_ACCESS_PROFILE',
      'TRANSFER_OWNERSHIP_OUT',
      'TRANSFER_OWNERSHIP_IN',
    ]);
    expect(new Set(ADMIN_PRIVILEGE_CHANGES).size).toBe(ADMIN_PRIVILEGE_CHANGES.length);
  });

  it('revokes every active admin session for the target account', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 3 });
    const createAudit = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const prisma = {
      authSession: { updateMany },
      adminAuditLog: { create: createAudit },
    } as any;

    const service = new AdminAccessSessionService(prisma);
    const result = await service.revokeAfterPrivilegeChange('actor-1', 'target-1', 'SET_REPORTING_LINE');

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
          change: 'SET_REPORTING_LINE',
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
    const result = await service.revokeAfterPrivilegeChange('actor-2', 'target-2', 'REMOVE_TEAM_MEMBER');

    expect(result.revokedSessions).toBe(0);
    expect(createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        newData: expect.objectContaining({
          change: 'REMOVE_TEAM_MEMBER',
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
