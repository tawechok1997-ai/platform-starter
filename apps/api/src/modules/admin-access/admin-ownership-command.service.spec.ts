import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminOwnershipCommandService } from './admin-ownership-command.service';

function ownerAssignment() {
  return {
    role: {
      code: 'owner',
      permissions: [],
    },
  };
}

describe('AdminOwnershipCommandService', () => {
  function createService(input?: { actorOwner?: boolean; targetStatus?: string }) {
    const actorOwner = input?.actorOwner ?? true;
    const targetStatus = input?.targetStatus ?? 'ACTIVE';
    const prisma = {
      adminUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'actor-1',
            roles: actorOwner ? [ownerAssignment()] : [{ role: { code: 'support', permissions: [] } }],
          })
          .mockResolvedValueOnce({ id: 'target-1', status: targetStatus }),
      },
    } as any;
    const adminAccess = {
      transferOwnership: jest.fn().mockResolvedValue({
        success: true,
        previousOwnerId: 'actor-1',
        newOwnerId: 'target-1',
      }),
    } as any;
    return {
      service: new AdminOwnershipCommandService(prisma, adminAccess),
      adminAccess,
    };
  }

  it('delegates a valid ownership transfer to the transactional access service', async () => {
    const { service, adminAccess } = createService();

    await expect(
      service.transferOwnership(
        'actor-1',
        'target-1',
        '123456',
        'planned ownership transfer',
        { ipAddress: '127.0.0.1' },
      ),
    ).resolves.toEqual(expect.objectContaining({ newOwnerId: 'target-1' }));

    expect(adminAccess.transferOwnership).toHaveBeenCalledWith(
      'actor-1',
      'target-1',
      '123456',
      'planned ownership transfer',
      { ipAddress: '127.0.0.1' },
    );
  });

  it('maps a non-owner policy violation to ForbiddenException', async () => {
    const { service, adminAccess } = createService({ actorOwner: false });

    await expect(
      service.transferOwnership('actor-1', 'target-1', '123456', 'not permitted', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(adminAccess.transferOwnership).not.toHaveBeenCalled();
  });

  it('maps self-transfer and inactive-target policy violations to BadRequestException', async () => {
    const selfTransfer = createService();
    await expect(
      selfTransfer.service.transferOwnership('actor-1', 'actor-1', '123456', 'invalid target', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(selfTransfer.adminAccess.transferOwnership).not.toHaveBeenCalled();

    const inactiveTarget = createService({ targetStatus: 'LOCKED' });
    await expect(
      inactiveTarget.service.transferOwnership('actor-1', 'target-1', '123456', 'inactive target', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(inactiveTarget.adminAccess.transferOwnership).not.toHaveBeenCalled();
  });
});
