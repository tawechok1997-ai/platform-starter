import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminInvitationAdminService } from './admin-invitation-admin.service';

function permission(code: string) {
  return { permission: { code } };
}

function role(code: string, level: number, permissions: string[]) {
  return { id: `${code}-id`, code, name: code, level, permissions: permissions.map(permission) };
}

describe('AdminInvitationAdminService', () => {
  it('revokes only unused invitation tokens for locked accounts', async () => {
    const prisma = {
      adminUser: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'invited', email: 'staff@example.com', status: 'LOCKED', roles: [{ role: role('support', 50, ['support.view']) }],
        }),
      },
      verificationToken: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminInvitationAdminService(prisma);
    await expect(service.revoke('actor', 'invited')).resolves.toEqual({ success: true, revokedTokens: 2 });
    expect(prisma.verificationToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ usedAt: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalled();
  });

  it('blocks revoking an already active account', async () => {
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue({ id: 'active', status: 'ACTIVE', roles: [] }) },
      verificationToken: { updateMany: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminInvitationAdminService(prisma);
    await expect(service.revoke('actor', 'active')).rejects.toThrow(BadRequestException);
    expect(prisma.verificationToken.updateMany).not.toHaveBeenCalled();
  });

  it('blocks delegated admins from reissuing invitations above their permissions', async () => {
    const actorRole = role('support_manager', 50, ['admin.create', 'support.view']);
    const targetRole = role('finance_manager', 40, ['wallet.view']);
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: actorRole }] })
          .mockResolvedValueOnce({ id: 'target', email: 'finance@example.com', status: 'LOCKED', roles: [{ role: targetRole }] }),
      },
      $transaction: jest.fn(),
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminInvitationAdminService(prisma);
    await expect(service.reissue('actor', 'target', 24)).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it('invalidates old tokens before creating a new invitation token', async () => {
    const managerRole = role('manager', 20, ['*']);
    const targetRole = role('support', 50, ['support.view']);
    const tx = {
      verificationToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'new-token' }),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: managerRole }] })
          .mockResolvedValueOnce({ id: 'target', email: 'staff@example.com', status: 'LOCKED', roles: [{ role: targetRole }] }),
      },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      adminAuditLog: { create: jest.fn() },
    } as any;

    const service = new AdminInvitationAdminService(prisma);
    const result = await service.reissue('actor', 'target', 24);

    expect(tx.verificationToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ usedAt: null }) }));
    expect(tx.verificationToken.create).toHaveBeenCalled();
    expect(tx.adminAuditLog.create).toHaveBeenCalled();
    expect(result.token).toBeTruthy();
    expect(result.tokenVisibleOnce).toBe(true);
  });
});
