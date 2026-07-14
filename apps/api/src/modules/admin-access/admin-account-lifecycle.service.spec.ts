import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';

function target(overrides: Record<string, unknown> = {}) {
  return {
    id: 'target',
    username: 'staff',
    email: 'staff@example.com',
    status: 'ACTIVE',
    roles: [{ role: { code: 'support' } }],
    ...overrides,
  };
}

describe('AdminAccountLifecycleService', () => {
  it('blocks changing a protected owner account', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue(target({ id: 'owner', username: 'owner', email: 'owner@example.com', roles: [{ role: { code: 'super_admin' } }] })) },
      $transaction: jest.fn(),
    } as any;
    const service = new AdminAccountLifecycleService(prisma);
    await expect(service.changeStatus('actor', 'owner', 'SUSPENDED', 'security review')).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('blocks changing your own account status', async () => {
    const prisma = { adminUser: { findUnique: jest.fn() }, $transaction: jest.fn() } as any;
    const service = new AdminAccountLifecycleService(prisma);
    await expect(service.changeStatus('same', 'same', 'LOCKED', 'security review')).rejects.toThrow(ForbiddenException);
    expect(prisma.adminUser.findUnique).not.toHaveBeenCalled();
  });

  it('requires a meaningful reason', async () => {
    const prisma = { adminUser: { findUnique: jest.fn() }, $transaction: jest.fn() } as any;
    const service = new AdminAccountLifecycleService(prisma);
    await expect(service.changeStatus('actor', 'target', 'LOCKED', 'no')).rejects.toThrow(BadRequestException);
  });

  it('returns an idempotent no-op when the requested status is already active', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue(target({ status: 'ACTIVE' })) },
      $transaction: jest.fn(),
    } as any;
    const service = new AdminAccountLifecycleService(prisma);

    await expect(service.changeStatus('actor', 'target', 'active', 'routine verification')).resolves.toEqual({
      success: true,
      changed: false,
      status: 'ACTIVE',
      revokedSessions: 0,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('changes status, revokes active sessions, and audits atomically', async () => {
    const tx = {
      adminUser: { update: jest.fn().mockResolvedValue({ id: 'target', username: 'staff', email: 'staff@example.com', status: 'SUSPENDED' }) },
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue(target()) },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    } as any;
    const service = new AdminAccountLifecycleService(prisma);
    const result = await service.changeStatus('actor', 'target', 'SUSPENDED', 'security review');
    expect(result).toMatchObject({ success: true, changed: true, status: 'SUSPENDED', revokedSessions: 2 });
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ adminUserId: 'target', type: 'ADMIN', revokedAt: null }) }));
    expect(tx.adminAuditLog.create).toHaveBeenCalled();
  });

  it('rolls back account and session changes when audit persistence fails', async () => {
    const state = { status: 'ACTIVE', revokedSessions: 0 };
    const tx = {
      adminUser: {
        update: jest.fn(async ({ data }: any) => {
          state.status = data.status;
          return { id: 'target', username: 'staff', email: 'staff@example.com', status: data.status };
        }),
      },
      authSession: {
        updateMany: jest.fn(async () => {
          state.revokedSessions = 2;
          return { count: 2 };
        }),
      },
      adminAuditLog: { create: jest.fn().mockRejectedValue(new Error('audit unavailable')) },
    };
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue(target()) },
      $transaction: jest.fn(async (callback: any) => {
        const snapshot = { ...state };
        try {
          return await callback(tx);
        } catch (error) {
          state.status = snapshot.status;
          state.revokedSessions = snapshot.revokedSessions;
          throw error;
        }
      }),
    } as any;
    const service = new AdminAccountLifecycleService(prisma);

    await expect(service.changeStatus('actor', 'target', 'LOCKED', 'security incident')).rejects.toThrow('audit unavailable');
    expect(state).toEqual({ status: 'ACTIVE', revokedSessions: 0 });
    expect(tx.adminUser.update).toHaveBeenCalled();
    expect(tx.authSession.updateMany).toHaveBeenCalled();
    expect(tx.adminAuditLog.create).toHaveBeenCalled();
  });
});