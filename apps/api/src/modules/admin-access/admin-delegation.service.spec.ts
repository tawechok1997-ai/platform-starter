import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminAccessService } from './admin-access.service';

function role(id: string, code: string, level: number, permissions: string[]) {
  return { id, code, name: code, level, permissions: permissions.map((code) => ({ permission: { code } })) };
}

function createService(prisma: any) {
  return new AdminAccessService(prisma, {} as any);
}

describe('AdminAccessService delegated access', () => {
  it('allows a grantor to delegate only permissions they hold', async () => {
    const actorRole = role('actor-role', 'access_manager', 20, ['admin.access.delegate', 'reports.view']);
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'actor', roles: [{ role: actorRole }] })
          .mockResolvedValueOnce({ id: 'delegate', status: 'ACTIVE', roles: [] }),
      },
      adminDelegation: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
      $transaction: jest.fn(async (callback: any) => callback({
        adminDelegation: { create: jest.fn().mockResolvedValue({ id: 'delegation', grantorAdminId: 'actor', delegateAdminId: 'delegate', permissionCodes: ['reports.view'] }) },
        adminAuditLog: { create: jest.fn() },
      })),
    } as any;

    const service = createService(prisma);
    const result = await service.createDelegation('actor', 'delegate', ['reports.view'], 24, 'Cover report queue');
    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('blocks protected permissions and excessive expiry', async () => {
    const actorRole = role('owner-role', 'owner', 1, ['*']);
    const prisma = {
      adminUser: {
        findUnique: jest.fn().mockImplementation((args: any) => args.where.id === 'owner'
          ? { id: 'owner', roles: [{ role: actorRole }], status: 'ACTIVE' }
          : { id: 'delegate', status: 'ACTIVE', roles: [] }),
      },
      adminDelegation: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any;
    const service = createService(prisma);

    await expect(service.createDelegation('owner', 'delegate', ['admin.access.manage'], 24, 'Temporary access')).rejects.toThrow(ForbiddenException);
    await expect(service.createDelegation('owner', 'delegate', ['reports.view'], 169, 'Temporary access')).rejects.toThrow(BadRequestException);
  });
});
