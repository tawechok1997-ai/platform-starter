import { BadRequestException } from '@nestjs/common';
import { ProviderWebhookService } from './provider-webhook.service';

describe('ProviderWebhookService', () => {
  const provider = {
    id: 'provider-1',
    code: 'demo',
    walletMode: 'TRANSFER',
    currency: 'THB',
    metadata: { webhookSettlementEnabled: true },
    endpoints: [{ type: 'WEBHOOK', url: 'https://provider.test/webhook', timeoutMs: 10000 }],
    credentials: [{ type: 'WEBHOOK_SECRET', maskedValue: 'secret', encryptedValue: null }],
  };

  function setup(options: { valid?: boolean; duplicate?: boolean } = {}) {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      webhookLog: {
        findFirst: jest.fn().mockResolvedValue(options.duplicate ? { id: 'existing-log' } : null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.status === 'DUPLICATE' ? 'duplicate-log' : 'processed-log', ...data })),
      },
    };
    const prisma = {
      gameProvider: { findUnique: jest.fn().mockResolvedValue(provider) },
      gameProviderCredential: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      webhookLog: { create: jest.fn().mockResolvedValue({ id: 'failed-log' }) },
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    };
    const events = [{ providerTransactionId: 'provider-tx-1', eventType: 'BALANCE_CHANGED' }];
    const adapter = {
      validateWebhook: jest.fn().mockResolvedValue(options.valid === false ? { valid: false, reason: 'bad signature' } : { valid: true }),
      parseWebhook: jest.fn().mockResolvedValue(events),
    };
    const adapters = { getAdapter: jest.fn().mockReturnValue(adapter) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const rounds = { applyWebhookEvents: jest.fn().mockResolvedValue([]) };
    return {
      service: new ProviderWebhookService(prisma as never, adapters as never, config as never, rounds as never),
      prisma,
      tx,
      adapter,
      rounds,
      events,
    };
  }

  it('rejects payloads without an idempotency key before provider work starts', async () => {
    const { service, prisma } = setup();
    await expect(service.receive('demo', {}, { eventType: 'BALANCE_CHANGED' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.gameProvider.findUnique).not.toHaveBeenCalled();
  });

  it('records invalid signatures without entering the processing transaction', async () => {
    const { service, prisma, adapter, rounds } = setup({ valid: false });
    const result = await service.receive('demo', {}, { eventType: 'BALANCE_CHANGED', idempotencyKey: 'event-1' });
    expect(result).toEqual({ ok: false, logId: 'failed-log', errorCode: 'INVALID_SIGNATURE' });
    expect(adapter.parseWebhook).not.toHaveBeenCalled();
    expect(rounds.applyWebhookEvents).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.webhookLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', signatureValid: false, idempotencyKey: 'event-1' }),
    }));
  });

  it('uses the advisory lock and writes a duplicate log for repeated events', async () => {
    const { service, tx, rounds } = setup({ duplicate: true });
    const result = await service.receive('demo', {}, { eventType: 'BALANCE_CHANGED', idempotencyKey: 'event-1' });
    expect(result).toEqual({ ok: true, duplicate: true, logId: 'duplicate-log', statusCode: 208 });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(rounds.applyWebhookEvents).not.toHaveBeenCalled();
    expect(tx.webhookLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DUPLICATE', responseStatus: 208, idempotencyKey: 'event-1' }),
    }));
  });

  it('persists normalized round events and exposes the settlement gate for new events', async () => {
    const { service, tx, rounds, events } = setup();
    const result = await service.receive('demo', {}, { eventType: 'BALANCE_CHANGED', idempotencyKey: 'event-2' });
    expect(result).toEqual(expect.objectContaining({ ok: true, logId: 'processed-log', roundTransitions: [], walletSettlementEnabled: true }));
    expect(rounds.applyWebhookEvents).toHaveBeenCalledWith(tx, provider.id, events);
    expect(tx.webhookLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PROCESSED', signatureValid: true, responseStatus: 200 }),
    }));
  });
});
