import { createHmac } from 'node:crypto';
import { GenericTransferProviderAdapter } from './generic-transfer-provider.adapter';

function makeContext() {
  return {
    providerCode: 'generic-transfer',
    baseUrl: 'http://provider.test',
    walletMode: 'TRANSFER',
    currency: 'THB',
    timeoutMs: 1_000,
    endpointMap: {},
    credentialMap: { WEBHOOK_SECRET: 'unit-test-secret' },
  } as any;
}

function sign(body: string, timestamp: string) {
  return createHmac('sha256', 'unit-test-secret').update(`${timestamp}.${body}`).digest('hex');
}

describe('GenericTransferProviderAdapter webhook validation', () => {
  const adapter = new GenericTransferProviderAdapter();

  it('accepts a fresh signature built from the exact raw body', async () => {
    const body = JSON.stringify({ eventType: 'transfer.completed', idempotencyKey: 'event-1' });
    const timestamp = new Date().toISOString();
    const result = await adapter.validateWebhook(
      makeContext(),
      { 'x-provider-signature': sign(body, timestamp), 'x-provider-timestamp': timestamp },
      JSON.parse(body),
      Buffer.from(body),
    );

    expect(result).toEqual(expect.objectContaining({ valid: true, idempotencyKey: 'event-1' }));
  });

  it('rejects a stale timestamp even when the signature is correct', async () => {
    const body = JSON.stringify({ eventType: 'transfer.completed', idempotencyKey: 'event-2' });
    const timestamp = new Date(Date.now() - 10 * 60 * 1_000).toISOString();
    const result = await adapter.validateWebhook(
      makeContext(),
      { 'x-provider-signature': sign(body, timestamp), 'x-provider-timestamp': timestamp },
      JSON.parse(body),
      Buffer.from(body),
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('rejects a signature made from a reserialized body', async () => {
    const rawBody = '{"idempotencyKey":"event-3","eventType":"transfer.completed"}';
    const parsedBody = { eventType: 'transfer.completed', idempotencyKey: 'event-3' };
    const timestamp = new Date().toISOString();
    const result = await adapter.validateWebhook(
      makeContext(),
      { 'x-provider-signature': sign(JSON.stringify(parsedBody), timestamp), 'x-provider-timestamp': timestamp },
      parsedBody,
      Buffer.from(rawBody),
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('signature');
  });
});
