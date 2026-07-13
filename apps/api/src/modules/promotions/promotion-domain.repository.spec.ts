import { BadRequestException } from '@nestjs/common';
import { PromotionDomainRepository } from './promotion-domain.repository';

describe('PromotionDomainRepository', () => {
  function createRepository(transactionHandler?: (tx: any) => Promise<unknown>) {
    const prisma = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback: (tx: any) => Promise<unknown>) => transactionHandler
        ? transactionHandler(callback)
        : callback({})),
    } as any;
    return { repository: new PromotionDomainRepository(prisma), prisma };
  }

  it('reuses an existing wallet ledger for an idempotent settlement retry', async () => {
    const tx = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ id: 'bonus-1', member_id: 'member-1', status: 'RELEASE_READY', amount: '100.00' }])
        .mockResolvedValueOnce([{ id: 'wallet-1', status: 'ACTIVE', balance: '500.00' }])
        .mockResolvedValueOnce([{ id: 'ledger-1' }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const prisma = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as any;
    const repository = new PromotionDomainRepository(prisma);

    const result = await repository.settleBonus({
      sourceRiskAlertId: '11111111-1111-4111-8111-111111111111',
      adminUserId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey: 'bonus:11111111-1111-4111-8111-111111111111:settlement',
    });

    expect(result).toMatchObject({ status: 'SETTLED', wallet_ledger_id: 'ledger-1' });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects settlement before turnover is completed', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValueOnce([
        { id: 'bonus-1', member_id: 'member-1', status: 'ACTIVE', amount: '100.00' },
      ]),
      $executeRaw: jest.fn(),
    };
    const prisma = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as any;
    const repository = new PromotionDomainRepository(prisma);

    await expect(repository.settleBonus({
      sourceRiskAlertId: '11111111-1111-4111-8111-111111111111',
      adminUserId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey: 'bonus:11111111-1111-4111-8111-111111111111:settlement',
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it('caps turnover progress in the database update path', async () => {
    const { repository, prisma } = createRepository();
    prisma.$queryRaw.mockResolvedValueOnce([
      { turnover_progress: '100.00', turnover_required: '100.00', status: 'TURNOVER_COMPLETED' },
    ]);

    const result = await repository.addTurnover(
      '11111111-1111-4111-8111-111111111111',
      '150.00',
    );

    expect(result).toMatchObject({ status: 'TURNOVER_COMPLETED', turnover_progress: '100.00' });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
