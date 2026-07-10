import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';

describe('AdminAccountLifecycleService', () => {
  it('blocks changing a protected owner account', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'owner', username: 'owner', email: 'owner@example.com', status: 'ACTIVE', roles: [{ role: { code: 'super_admin' } }] }) },
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

  it('changes status, revokes active sessions, and audits atomically', async () => {
    const tx = {
      adminUser: { update: jest.fn().mockResolvedValue({ id: 'target', username: 'staff', email: 'staff@example.com', status: 'SUSPENDED' }) },
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'target', username: 'staff', email: 'staff@example.com', status: 'ACTIVE', roles: [{ role: { code: 'support' } }] }) },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    } as any;
    const service = new AdminAccountLifecycleService(prisma);
    const result = await service.changeStatus('actor', 'target', 'SUSPENDED', 'security review');
    expect(result).toMatchObject({ success: true, changed: true, status: 'SUSPENDED', revokedSessions: 2 });
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ adminUserId: 'target', type: 'ADMIN', revokedAt: null }) }));
    expect(tx.adminAuditLog.create).toHaveBeenCalled();
  });
});
