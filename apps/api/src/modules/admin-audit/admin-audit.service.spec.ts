import { BadRequestException } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  function setup() {
    const prisma = {
      adminAuditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (operations: unknown[]) => Promise.all(operations)),
    } as any;
    return { service: new AdminAuditService(prisma), prisma };
  }

  it('builds combined admin, keyword, target, and date filters', async () => {
    const { service, prisma } = setup();

    const result = await service.list({
      module: 'topups',
      action: 'approve',
      admin: 'ops@example.com',
      targetId: 'request-1',
      search: '127.0.0.1',
      from: '2026-07-01',
      to: '2026-07-10',
      page: 2,
      take: 25,
    });

    expect(result).toEqual({ items: [], total: 0, page: 2, take: 25, pageCount: 1 });
    const args = prisma.adminAuditLog.findMany.mock.calls[0][0];
    expect(args.skip).toBe(25);
    expect(args.take).toBe(25);
    expect(args.where.module).toEqual({ equals: 'topups', mode: 'insensitive' });
    expect(args.where.action).toEqual({ contains: 'approve', mode: 'insensitive' });
    expect(args.where.targetId).toBe('request-1');
    expect(args.where.AND).toHaveLength(2);
    expect(args.where.createdAt.gte.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(args.where.createdAt.lte.toISOString()).toBe('2026-07-10T23:59:59.999Z');
  });

  it('rejects invalid or reversed date ranges', async () => {
    const { service } = setup();
    await expect(service.list({ from: 'not-a-date' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.list({ from: '2026-07-11', to: '2026-07-10' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('caps page size at 100', async () => {
    const { service, prisma } = setup();
    await service.list({ take: 999 });
    expect(prisma.adminAuditLog.findMany.mock.calls[0][0].take).toBe(100);
  });
});
