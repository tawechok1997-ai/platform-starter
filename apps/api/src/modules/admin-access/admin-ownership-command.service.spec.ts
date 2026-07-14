import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AdminOwnershipCommandService } from './admin-ownership-command.service';

const ownerRole = {
  id: 'role-owner',
  code: 'owner',
  permissions: [],
};

const supportRole = {
  id: 'role-support',
  code: 'support',
  permissions: [],
};

function assignment(role = ownerRole) {
  return { roleId: role.id, role };
}

describe('AdminOwnershipCommandService', () => {
  function createHarness() {
    let ownerId = '00000000-0000-0000-0000-000000000001';
    const actorId = ownerId;
    const targetId = '00000000-0000-0000-0000-000000000002';
    const competingTargetId = '00000000-0000-0000-0000-000000000003';
    const lockOrder: string[] = [];

    const users = new Map([
      [actorId, { id: actorId, status: 'ACTIVE', twoFactorEnabled: true }],
      [targetId, { id: targetId, status: 'ACTIVE', twoFactorEnabled: true }],
      [competingTargetId, { id: competingTargetId, status: 'ACTIVE', twoFactorEnabled: true }],
    ]);

    const tx = {
      $queryRaw: jest.fn(async (query: { values?: unknown[] }) => {
        const id = query.values?.find(
          (value): value is string => typeof value === 'string' && users.has(value),
        );
        if (id) lockOrder.push(id);
        return id ? [{ id }] : [];
      }),
      adminUser: {
        findUnique: jest.fn(async ({ where }: any) => {
          const user = users.get(where.id);
          if (!user) return null;
          const roles = where.id === ownerId ? [assignment()] : [assignment(supportRole)];
          return { ...user, roles };
        }),
      },
      adminUserRole: {
        delete: jest.fn(async ({ where }: any) => {
          const currentOwnerId = where.adminUserId_roleId.adminUserId;
          if (currentOwnerId !== ownerId) throw new Error('owner role already transferred');
          return { adminUserId: currentOwnerId, roleId: ownerRole.id };
        }),
        create: jest.fn(async ({ data }: any) => {
          ownerId = data.adminUserId;
          return data;
        }),
      },
      adminAuditLog: {
        create: jest.fn(async ({ data }: any) => data),
      },
    } as any;

    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    } as any;
    const adminAuth = {
      assertStepUp: jest.fn().mockResolvedValue(undefined),
    } as any;

    return {
      service: new AdminOwnershipCommandService(prisma, adminAuth),
      prisma,
      adminAuth,
      tx,
      actorId,
      targetId,
      competingTargetId,
      lockOrder,
      currentOwner: () => ownerId,
    };
  }

  it('locks actor and target deterministically and commits role transfer with its audit', async () => {
    const harness = createHarness();

    await expect(
      harness.service.transferOwnership(
        harness.actorId,
        harness.targetId,
        '123456',
        'planned ownership transfer',
        { ipAddress: '127.0.0.1' },
      ),
    ).resolves.toEqual(expect.objectContaining({ newOwnerId: harness.targetId }));

    expect(harness.adminAuth.assertStepUp).toHaveBeenCalled();
    expect(harness.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(harness.tx.adminUserRole.delete).toHaveBeenCalledTimes(1);
    expect(harness.tx.adminUserRole.create).toHaveBeenCalledTimes(1);
    expect(harness.tx.adminAuditLog.create).toHaveBeenCalledTimes(1);
    expect(harness.currentOwner()).toBe(harness.targetId);
    expect(harness.lockOrder).toEqual([harness.actorId, harness.targetId]);
  });

  it('rejects a competing transfer after the first transaction changes ownership', async () => {
    const harness = createHarness();

    await harness.service.transferOwnership(
      harness.actorId,
      harness.targetId,
      '123456',
      'first ownership transfer',
      {},
    );

    await expect(
      harness.service.transferOwnership(
        harness.actorId,
        harness.competingTargetId,
        '123456',
        'competing ownership transfer',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(harness.currentOwner()).toBe(harness.targetId);
    expect(harness.tx.adminUserRole.create).toHaveBeenCalledTimes(1);
    expect(harness.tx.adminAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not write role or audit rows when the target already has protected access', async () => {
    const harness = createHarness();
    harness.tx.adminUser.findUnique.mockImplementation(async ({ where }: any) => ({
      id: where.id,
      status: 'ACTIVE',
      twoFactorEnabled: true,
      roles: [assignment()],
    }));

    await expect(
      harness.service.transferOwnership(
        harness.actorId,
        harness.targetId,
        '123456',
        'invalid ownership transfer',
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(harness.tx.adminUserRole.delete).not.toHaveBeenCalled();
    expect(harness.tx.adminUserRole.create).not.toHaveBeenCalled();
    expect(harness.tx.adminAuditLog.create).not.toHaveBeenCalled();
  });
});
