import { NotFoundException } from '@nestjs/common';
import { AdminProfileCommandService } from './admin-profile-command.service';

describe('AdminProfileCommandService', () => {
  const current = {
    displayName: 'Original name',
    firstName: 'Original',
    lastName: 'Admin',
    position: 'Operator',
    department: 'Operations',
    avatarUrl: 'https://example.com/original.png',
  };

  function setup(profile = current) {
    const tx = {
      adminUser: { update: jest.fn().mockResolvedValue({ id: 'admin-1' }) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const prisma = {
      adminUser: { findUnique: jest.fn().mockResolvedValue(profile) },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    return { service: new AdminProfileCommandService(prisma as never), prisma, tx };
  }

  it('updates profile fields with Prisma and records the before and after audit data atomically', async () => {
    const { service, prisma, tx } = setup();
    const result = await service.updateProfile(
      'admin-1',
      {
        displayName: '  Updated name  ',
        department: '  Finance Operations  ',
        avatarUrl: 'https://example.com/updated.png',
      },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result).toEqual({
      displayName: 'Updated name',
      firstName: 'Original',
      lastName: 'Admin',
      position: 'Operator',
      department: 'Finance Operations',
      avatarUrl: 'https://example.com/updated.png',
    });
    expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'admin-1' },
        select: expect.objectContaining({ displayName: true, avatarUrl: true }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.adminUser.update).toHaveBeenCalledWith({ where: { id: 'admin-1' }, data: result });
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 'admin-1',
        action: 'PROFILE_UPDATED',
        oldData: current,
        newData: result,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    });
  });

  it('does not open a transaction when the Admin account does not exist', async () => {
    const { service, prisma } = setup(null);
    await expect(service.updateProfile('missing', {}, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
