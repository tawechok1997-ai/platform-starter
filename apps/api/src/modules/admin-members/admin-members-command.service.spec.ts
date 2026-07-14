import { AdminMembersCommandService } from './admin-members-command.service';
import type { PrismaService } from '../../database/prisma.service';

describe('AdminMembersCommandService', () => {
  it('updates status and writes audit inside one transaction', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'member-1',
      username: 'member',
      status: 'SUSPENDED',
      updatedAt: new Date('2026-07-14T12:00:00.000Z'),
    });
    const createAudit = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const transaction = jest.fn(async (callback: (tx: unknown) => unknown) =>
      callback({ user: { update }, adminAuditLog: { create: createAudit } }),
    );

    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'member-1', username: 'member', status: 'ACTIVE' }),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new AdminMembersCommandService(prisma);
    const result = await service.updateMemberStatus(
      'member-1',
      'SUSPENDED',
      'manual review',
      { id: 'admin-1' } as never,
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ where: { id: 'member-1' }, data: { status: 'SUSPENDED' } });
    expect(createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUser: { connect: { id: 'admin-1' } },
        action: 'UPDATE_MEMBER_STATUS',
        targetId: 'member-1',
        oldData: { status: 'ACTIVE' },
        newData: { status: 'SUSPENDED', reason: 'manual review' },
      }),
    });
    expect(result.user.status).toBe('SUSPENDED');
  });
});
