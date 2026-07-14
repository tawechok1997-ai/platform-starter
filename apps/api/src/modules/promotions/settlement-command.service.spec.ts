import { BadRequestException } from '@nestjs/common';
import { SettlementCommandService } from './settlement-command.service';

describe('SettlementCommandService', () => {
  const actor = { id: 'admin-1' };
  const base = {
    id: 'bonus-1',
    refType: 'BONUS_LEDGER',
    status: 'RESOLVED',
    resolvedAt: null,
    metadata: {
      turnoverCompleted: true,
      lifecycleStatus: 'TURNOVER_COMPLETED',
      walletCreditStatus: 'READY_FOR_MANUAL_RELEASE',
      events: [],
    },
  };

  function setup(item: any = base) {
    const tx = {
      riskAlert: { update: jest.fn().mockImplementation(({ data }) => ({ ...item, ...data, metadata: data.metadata })) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      riskAlert: { findFirst: jest.fn().mockResolvedValue(item) },
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    } as any;
    const domain = { updateLifecycle: jest.fn().mockResolvedValue({ status: 'RELEASE_READY' }) } as any;
    const settlements = {
      settle: jest.fn().mockResolvedValue({ wallet_ledger_id: 'ledger-1', status: 'SETTLED' }),
      reverse: jest.fn().mockResolvedValue({ reversal_wallet_ledger_id: 'ledger-r1', status: 'REVOKED' }),
    } as any;
    return { service: new SettlementCommandService(prisma, domain, settlements), prisma, domain, settlements, tx };
  }

  it('uses one stable idempotency key for release and retry', async () => {
    const first = setup();
    await first.service.execute(actor, 'bonus-1', 'RELEASE');
    expect(first.settlements.settle).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: 'bonus:bonus-1:settlement' }));

    const retryItem = { ...base, status: 'REVIEWING', metadata: { ...base.metadata, lifecycleStatus: 'SETTLEMENT_FAILED', settlementAttemptCount: 1 } };
    const retry = setup(retryItem);
    await retry.service.execute(actor, 'bonus-1', 'RETRY', 'retry provider timeout');
    expect(retry.settlements.settle).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: 'bonus:bonus-1:settlement' }));
    expect(retry.domain.updateLifecycle).not.toHaveBeenCalled();
  });

  it('records a failed state and audit when settlement throws', async () => {
    const ctx = setup();
    ctx.settlements.settle.mockRejectedValueOnce(new Error('wallet unavailable'));
    await expect(ctx.service.execute(actor, 'bonus-1', 'RELEASE')).rejects.toThrow('wallet unavailable');
    expect(ctx.tx.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REVIEWING', resolvedAt: null }),
    }));
    expect(ctx.tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'bonus.settlement.failed', module: 'promotions' }),
    });
  });

  it('requires failed state before retry', async () => {
    const ctx = setup();
    await expect(ctx.service.execute(actor, 'bonus-1', 'RETRY')).rejects.toBeInstanceOf(BadRequestException);
    expect(ctx.settlements.settle).not.toHaveBeenCalled();
  });

  it('reverses only a settled bonus and requires a note', async () => {
    const settled = { ...base, metadata: { ...base.metadata, lifecycleStatus: 'SETTLED', walletCreditStatus: 'CREDITED' } };
    const ctx = setup(settled);
    await expect(ctx.service.execute(actor, 'bonus-1', 'REVERSE')).rejects.toBeInstanceOf(BadRequestException);
    await ctx.service.execute(actor, 'bonus-1', 'REVERSE', 'manual correction');
    expect(ctx.settlements.reverse).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: 'bonus:bonus-1:settlement:reversal' }));
    expect(ctx.tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'bonus.settlement.reverse', module: 'promotions' }),
    });
  });
});
