import { ForbiddenException } from '@nestjs/common';
import { AdminAccessService } from './admin-access.service';

function permission(code: string) {
  return { permission: { code } };
}

function role(id: string, code: string, level: number, permissions: string[]) {
  return {
    id,
    code,
    name: code,
    level,
    permissions: permissions.map(permission),
  };
}

describe('AdminAccessService privilege boundaries', () => {
  it('blocks delegated admins from granting permissions they do not hold', async () => {
    const actorRole = role('actor-role', 'support_manager', 50, ['admin.access.manage', 'support.view']);
    const targetRole = role('target-role', 'finance_manager', 40, ['wallet.view', 'withdraw.view']);
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: actorRole }] })
          .mockResolvedValueOnce({ id: 'target', username: 'staff', roles: [] }),
      },
      role: { findUnique: jest.fn().mockResolvedValue(targetRole) },
      adminUserRole: { upsert: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminAccessService(prisma);
    await expect(service.assignRole('actor', 'target', 'target-role')).rejects.toThrow(ForbiddenException);
    expect(prisma.adminUserRole.upsert).not.toHaveBeenCalled();
  });

  it('blocks non-owner admins from assigning protected or wildcard roles', async () => {
    const actorRole = role('actor-role', 'access_manager', 20, ['admin.access.manage']);
    const ownerRole = role('owner-role', 'super_admin', 1, ['*']);
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: actorRole }] })
          .mockResolvedValueOnce({ id: 'target', username: 'staff', roles: [] }),
      },
      role: { findUnique: jest.fn().mockResolvedValue(ownerRole) },
      adminUserRole: { upsert: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminAccessService(prisma);
    await expect(service.assignRole('actor', 'target', 'owner-role')).rejects.toThrow(ForbiddenException);
    expect(prisma.adminUserRole.upsert).not.toHaveBeenCalled();
  });

  it('blocks removal of protected owner roles through normal role management', async () => {
    const ownerRole = role('owner-role', 'super_admin', 1, ['*']);
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: ownerRole }] })
          .mockResolvedValueOnce({ id: 'owner', username: 'owner', roles: [{ roleId: 'owner-role', role: ownerRole }] }),
      },
      adminUserRole: { delete: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminAccessService(prisma);
    await expect(service.removeRole('actor', 'owner', 'owner-role')).rejects.toThrow(ForbiddenException);
    expect(prisma.adminUserRole.delete).not.toHaveBeenCalled();
  });
});
