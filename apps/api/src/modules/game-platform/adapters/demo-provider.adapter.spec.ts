import { DemoProviderAdapter } from './demo-provider.adapter';
import { ProviderAdapterContext, TransferInput } from '../provider-adapter.interface';

const context: ProviderAdapterContext = {
  providerCode: 'demo-provider',
  baseUrl: 'https://demo-provider.local',
  walletMode: 'TRANSFER',
  currency: 'THB',
  timeoutMs: 10000,
  endpointMap: {
    LAUNCH: 'https://demo-provider.local/launch',
    BALANCE: 'https://demo-provider.local/balance',
    TRANSFER_IN: 'https://demo-provider.local/transfer-in',
    TRANSFER_OUT: 'https://demo-provider.local/transfer-out',
  },
  credentialMap: { API_KEY: 'test-key' },
};

function transferInput(overrides: Partial<TransferInput> = {}): TransferInput {
  return {
    userId: 'user-1',
    amount: '100.00',
    currency: 'THB',
    idempotencyKey: 'transfer-1',
    sessionId: 'session-1',
    ...overrides,
  };
}

describe('DemoProviderAdapter transfer safety', () => {
  let adapter: DemoProviderAdapter;

  beforeEach(() => {
    adapter = new DemoProviderAdapter();
  });

  it('rejects transfer-out when provider balance is zero', async () => {
    const result = await adapter.transferOut(context, transferInput());

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('INSUFFICIENT_PROVIDER_BALANCE');

    const balance = await adapter.getBalance(context, { userId: 'user-1' });
    expect(balance.payload?.balance).toBe('0.00');
  });

  it('allows transfer-out only up to the transferred-in amount', async () => {
    const transferIn = await adapter.transferIn(context, transferInput({ idempotencyKey: 'in-1' }));
    expect(transferIn.ok).toBe(true);
    expect(transferIn.payload?.afterBalance).toBe('100.00');

    const tooLarge = await adapter.transferOut(context, transferInput({ amount: '150.00', idempotencyKey: 'out-too-large' }));
    expect(tooLarge.ok).toBe(false);
    expect(tooLarge.errorCode).toBe('INSUFFICIENT_PROVIDER_BALANCE');

    const valid = await adapter.transferOut(context, transferInput({ idempotencyKey: 'out-1' }));
    expect(valid.ok).toBe(true);
    expect(valid.payload?.afterBalance).toBe('0.00');
  });

  it('does not apply the same transfer-in idempotency key twice', async () => {
    const input = transferInput({ idempotencyKey: 'same-in' });

    const first = await adapter.transferIn(context, input);
    const second = await adapter.transferIn(context, input);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.payload).toEqual(first.payload);

    const balance = await adapter.getBalance(context, { userId: input.userId });
    expect(balance.payload?.balance).toBe('100.00');
  });

  it('does not apply the same transfer-out idempotency key twice', async () => {
    await adapter.transferIn(context, transferInput({ amount: '200.00', idempotencyKey: 'seed-in' }));
    const input = transferInput({ idempotencyKey: 'same-out' });

    const first = await adapter.transferOut(context, input);
    const second = await adapter.transferOut(context, input);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.payload).toEqual(first.payload);

    const balance = await adapter.getBalance(context, { userId: input.userId });
    expect(balance.payload?.balance).toBe('100.00');
  });

  it('isolates balances by provider and user', async () => {
    await adapter.transferIn(context, transferInput({ idempotencyKey: 'provider-a-in' }));

    const otherProvider = { ...context, providerCode: 'demo-provider-uat' };
    const otherProviderBalance = await adapter.getBalance(otherProvider, { userId: 'user-1' });
    const otherUserBalance = await adapter.getBalance(context, { userId: 'user-2' });

    expect(otherProviderBalance.payload?.balance).toBe('0.00');
    expect(otherUserBalance.payload?.balance).toBe('0.00');
  });
});
