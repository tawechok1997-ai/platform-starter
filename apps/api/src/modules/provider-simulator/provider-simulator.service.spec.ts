import { createHmac } from 'crypto';
import { ProviderSimulatorService } from './provider-simulator.service';

describe('ProviderSimulatorService', () => {
  let service: ProviderSimulatorService;

  beforeEach(() => {
    process.env.PROVIDER_SIMULATOR_API_KEY = 'test-api-key';
    process.env.PROVIDER_SIMULATOR_MERCHANT_ID = 'test-merchant';
    process.env.PROVIDER_SIMULATOR_SECRET = 'test-secret';
    service = new ProviderSimulatorService();
  });

  afterEach(() => {
    delete process.env.PROVIDER_SIMULATOR_API_KEY;
    delete process.env.PROVIDER_SIMULATOR_MERCHANT_ID;
    delete process.env.PROVIDER_SIMULATOR_SECRET;
  });

  it('moves funds in and out while preserving the expected balance', () => {
    const transferIn = service.transfer('TRANSFER_IN', {
      userId: 'member-1',
      amount: '100.00',
      currency: 'THB',
      idempotencyKey: 'in-1',
    });
    expect(transferIn.beforeBalance).toBe('0.00');
    expect(transferIn.afterBalance).toBe('100.00');

    const transferOut = service.transfer('TRANSFER_OUT', {
      userId: 'member-1',
      amount: '35.50',
      currency: 'THB',
      idempotencyKey: 'out-1',
    });
    expect(transferOut.beforeBalance).toBe('100.00');
    expect(transferOut.afterBalance).toBe('64.50');
    expect(service.getBalance({ userId: 'member-1' }).balance).toBe('64.50');
  });

  it('returns the same result for a retried idempotent transfer without changing balance twice', () => {
    const input = {
      userId: 'member-2',
      amount: '50.00',
      currency: 'THB',
      idempotencyKey: 'retry-safe-1',
    };
    const first = service.transfer('TRANSFER_IN', input);
    const retry = service.transfer('TRANSFER_IN', input);

    expect(retry).toEqual(first);
    expect(service.getBalance({ userId: 'member-2' }).balance).toBe('50.00');
  });

  it('rejects overdrafts and idempotency-key reuse with different data', () => {
    expect(() =>
      service.transfer('TRANSFER_OUT', {
        userId: 'member-3',
        amount: '1.00',
        idempotencyKey: 'out-no-funds',
      }),
    ).toThrow('Insufficient provider balance');

    service.transfer('TRANSFER_IN', {
      userId: 'member-3',
      amount: '10.00',
      idempotencyKey: 'same-key',
    });
    expect(() =>
      service.transfer('TRANSFER_IN', {
        userId: 'member-3',
        amount: '11.00',
        idempotencyKey: 'same-key',
      }),
    ).toThrow('Idempotency key was already used');
  });

  it('validates the same HMAC contract used by the generic provider adapter', () => {
    const body = { ping: true };
    const timestamp = new Date().toISOString();
    const signature = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${JSON.stringify(body)}`)
      .digest('hex');

    expect(() =>
      service.verifyRequest(
        {
          'x-api-key': 'test-api-key',
          'x-merchant-id': 'test-merchant',
          'x-timestamp': timestamp,
          'x-signature': signature,
        },
        body,
      ),
    ).not.toThrow();
  });

  it('returns a game catalog with loadable API icon URLs', () => {
    const result = service.games('https://api.example.test');
    expect(result.items.length).toBeGreaterThanOrEqual(8);
    expect(result.items[0]?.name).toBeTruthy();
    expect(result.items[0]?.iconUrl).toMatch(/^https:\/\/api\.example\.test\/provider-simulator\/icons\/.+\.svg$/);
    expect(service.icon('fortune-tiger.svg')).toContain('<svg');
  });
});
