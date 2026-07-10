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

  it('blocks delegated admins from inviting a role with permissions they do not hold', async () => {
    const actorRole = role('actor-role', 'support_manager', 50, ['admin.create', 'support.view']);
    const financeRole = role('finance-role', 'finance_operator', 40, ['wallet.view', 'withdraw.view']);
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: actorRole }] })
          .mockResolvedValueOnce(null),
      },
      role: { findUnique: jest.fn().mockResolvedValue(financeRole) },
      $transaction: jest.fn(),
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminAccessService(prisma);
    await expect(service.createInvitation('actor', 'finance@example.com', 'finance-role', 24)).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it('creates an invitation transaction and stores only a token hash', async () => {
    const ownerRole = role('owner-role', 'owner', 1, ['*']);
    const supportRole = role('support-role', 'support_agent', 60, ['support.view']);
    const tx = {
      adminUser: {
        create: jest.fn().mockResolvedValue({ id: 'invited-admin', email: 'support@example.com', status: 'LOCKED', createdAt: new Date() }),
      },
      verificationToken: { create: jest.fn().mockResolvedValue({ id: 'token-id' }) },
    };
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'owner', roles: [{ role: ownerRole }] })
          .mockResolvedValueOnce(null),
      },
      role: { findUnique: jest.fn().mockResolvedValue(supportRole) },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-id' }) },
    } as any;

    const service = new AdminAccessService(prisma);
    const result = await service.createInvitation('owner', ' SUPPORT@example.com ', 'support-role', 24);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.adminUser.create).toHaveBeenCalledTimes(1);
    expect(tx.verificationToken.create).toHaveBeenCalledTimes(1);
    expect(prisma.adminAuditLog.create).toHaveBeenCalledTimes(1);
    expect(result.invitation.email).toBe('support@example.com');
    expect(result.tokenVisibleOnce).toBe(true);
    const tokenData = tx.verificationToken.create.mock.calls[0][0].data;
    expect(tokenData.tokenHash).not.toBe(result.token);
    expect(tokenData.target).toContain('ADMIN_INVITE:invited-admin:support@example.com');
  });
});