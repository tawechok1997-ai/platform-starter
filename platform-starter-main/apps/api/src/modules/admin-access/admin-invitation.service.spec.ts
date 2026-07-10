import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AdminInvitationService } from './admin-invitation.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

function createService() {
  const tx = {
    adminUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      updateMany: jest.fn(),
    },
    adminAuditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    verificationToken: {
      findMany: jest.fn(),
    },
    adminUser: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  } as any;

  return { service: new AdminInvitationService(prisma), prisma, tx };
}

describe('AdminInvitationService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an expired or unknown invitation', async () => {
    const { service, prisma } = createService();
    prisma.verificationToken.findMany.mockResolvedValue([]);

    await expect(service.inspect('x'.repeat(48))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('activates a locked admin and consumes the token in one transaction', async () => {
    const { service, prisma, tx } = createService();
    prisma.verificationToken.findMany.mockResolvedValue([
      {
        id: 'token-1',
        type: 'PASSWORD_RESET',
        target: 'ADMIN_INVITE:admin-1:admin@example.com',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        createdAt: new Date(),
      },
    ]);
    mockedArgon2.verify.mockResolvedValue(true as never);
    mockedArgon2.hash.mockResolvedValue('password-hash' as never);
    tx.adminUser.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'admin-1', status: 'LOCKED' });
    tx.verificationToken.updateMany.mockResolvedValue({ count: 1 });
    tx.adminUser.update.mockResolvedValue({
      id: 'admin-1',
      username: 'operator.one',
      email: 'admin@example.com',
      status: 'ACTIVE',
    });
    tx.adminAuditLog.create.mockResolvedValue({ id: 'audit-1' });

    await expect(service.accept('x'.repeat(48), 'operator.one', 'securepassword123')).resolves.toMatchObject({
      success: true,
      admin: { id: 'admin-1', status: 'ACTIVE' },
    });
    expect(tx.verificationToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'token-1', usedAt: null }),
    }));
    expect(tx.adminUser.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ username: 'operator.one', status: 'ACTIVE' }),
    }));
    expect(tx.adminAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not activate an admin when the invitation was consumed concurrently', async () => {
    const { service, prisma, tx } = createService();
    prisma.verificationToken.findMany.mockResolvedValue([
      {
        id: 'token-1',
        type: 'PASSWORD_RESET',
        target: 'ADMIN_INVITE:admin-1:admin@example.com',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        createdAt: new Date(),
      },
    ]);
    mockedArgon2.verify.mockResolvedValue(true as never);
    mockedArgon2.hash.mockResolvedValue('password-hash' as never);
    tx.adminUser.findUnique.mockResolvedValueOnce(null);
    tx.verificationToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.accept('x'.repeat(48), 'operator.one', 'securepassword123')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.adminUser.update).not.toHaveBeenCalled();
    expect(tx.adminAuditLog.create).not.toHaveBeenCalled();
  });
});
