import { BadRequestException } from '@nestjs/common';
import { SettlementCommandService } from './settlement-command.service';

function sqlText(query: any) {
  return Array.isArray(query?.strings) ? query.strings.join('?') : String(query ?? '');
}

function sqlValues(query: any) {
  return Array.isArray(query?.values) ? query.values : [];
}

describe('SettlementCommandService', () => {
  const actor = { id: 'admin-1' };
  const base = {
    id: 'bonus-1',
    refType: 'BONUS_LEDGER',
    status: 'REVIEWING',
    resolvedAt: null,
    metadata: {
      turnoverCompleted: true,
      lifecycleStatus: 'TURNOVER_COMPLETED',
      walletCreditStatus: 'READY_FOR_MANUAL_RELEASE',
      events: [],
    },
  };

  function setup(input?: { item?: any; walletActive?: boolean; existingLedger?: any }) {
    const item = input?.item ?? base;
    const bonus = {
      id: 'bonus-ledger-1',
      source_risk_alert_id: item.id,
      member_id: 'member-1',
      amount: '100',
      status: 'RELEASE_READY',
      wallet_ledger_id: null,
    };
    const wallet = {
      id: 'wallet-1',
      user_id: 'member-1',
      status: input?.walletActive === false ? 'LOCKED' : 'ACTIVE',
      balance: '500',
    };

    const tx = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(item),
        findUnique: jest.fn().mockResolvedValue(item),
        update: jest.fn().mockImplementation(({ data }) => ({ ...item, ...data })),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockImplementation((query: any) => {
        const text = sqlText(query);
        if (text.includes('FROM "risk_alerts"')) return [{ id: item.id }];
        if (text.includes('UPDATE "bonus_ledgers"') && text.includes("'RELEASE_READY'")) return [{ ...bonus }];
        if (text.includes('FROM "bonus_ledgers"')) return [{ ...bonus }];
        if (text.includes('FROM "wallets"')) return [wallet];
        if (text.includes('FROM "wallet_ledgers"') && text.includes('idempotency_key')) {
          return input?.existingLedger ? [input.existingLedger] : [];
        }
        if (text.includes('gen_random_uuid')) return [{ id: 'ledger-1' }];
        if (text.includes('UPDATE "bonus_ledgers"') && text.includes("'SETTLED'")) {
          return [{ ...bonus, status: 'SETTLED', wallet_ledger_id: 'ledger-1' }];
        }
        return [];
      }),
    } as any;
    const prisma = {
      riskAlert: { findFirst: jest.fn().mockResolvedValue(item) },
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    } as any;
    return { service: new SettlementCommandService(prisma), prisma, tx };
  }

  it('settles wallet, ledger, bonus metadata, and audit under one transaction owner', async () => {
    const ctx = setup();

    await expect(ctx.service.execute(actor, 'bonus-1', 'RELEASE')).resolves.toEqual(
      expect.objectContaining({ ok: true }),
    );

    expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
    const mutations = ctx.tx.$executeRaw.mock.calls.map(([query]: any[]) => sqlText(query));
    expect(mutations.some((text: string) => text.includes('UPDATE "wallets"'))).toBe(true);
    expect(mutations.some((text: string) => text.includes('INSERT INTO "wallet_ledgers"'))).toBe(true);
    expect(ctx.tx.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'RESOLVED' }),
    }));
    expect(ctx.tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'bonus.settlement.release', module: 'promotions' }),
    });

    const queryValues = ctx.tx.$queryRaw.mock.calls.flatMap(([query]: any[]) => sqlValues(query));
    expect(queryValues).toContain('bonus:bonus-1:settlement');
  });

  it('reuses the stable settlement idempotency key without creating another wallet ledger', async () => {
    const existingLedger = { id: 'ledger-existing' };
    const ctx = setup({ existingLedger });

    await ctx.service.execute(actor, 'bonus-1', 'RELEASE');

    const mutations = ctx.tx.$executeRaw.mock.calls.map(([query]: any[]) => sqlText(query));
    expect(mutations.some((text: string) => text.includes('UPDATE "wallets"'))).toBe(false);
    expect(mutations.some((text: string) => text.includes('INSERT INTO "wallet_ledgers"'))).toBe(false);
    expect(mutations.some((text: string) => text.includes('UPDATE "bonus_ledgers"'))).toBe(true);
    expect(ctx.tx.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'RESOLVED' }),
    }));
  });

  it('records failure metadata and audit only after the settlement transaction rolls back', async () => {
    const ctx = setup({ walletActive: false });

    await expect(ctx.service.execute(actor, 'bonus-1', 'RELEASE')).rejects.toThrow('Active wallet not found');

    expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(ctx.tx.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REVIEWING', resolvedAt: null }),
    }));
    expect(ctx.tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'bonus.settlement.failed', module: 'promotions' }),
    });
  });

  it('rejects retry and reversal before opening a transaction when lifecycle preconditions fail', async () => {
    const retry = setup();
    await expect(retry.service.execute(actor, 'bonus-1', 'RETRY')).rejects.toBeInstanceOf(BadRequestException);
    expect(retry.prisma.$transaction).not.toHaveBeenCalled();

    const reversalItem = {
      ...base,
      metadata: { ...base.metadata, lifecycleStatus: 'SETTLED', walletCreditStatus: 'CREDITED' },
    };
    const reversal = setup({ item: reversalItem });
    await expect(reversal.service.execute(actor, 'bonus-1', 'REVERSE')).rejects.toBeInstanceOf(BadRequestException);
    expect(reversal.prisma.$transaction).not.toHaveBeenCalled();
  });
});
