import { createHmac } from 'crypto';
import { ProviderSimulatorSecurityService } from './provider-simulator-security.service';

describe('ProviderSimulatorSecurityService', () => {
  let service: ProviderSimulatorSecurityService;
  let executeRaw: jest.Mock;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.PROVIDER_SIMULATOR_API_KEY = 'test-api-key';
    process.env.PROVIDER_SIMULATOR_MERCHANT_ID = 'test-merchant';
    process.env.PROVIDER_SIMULATOR_SECRET = 'test-secret';
    process.env.PROVIDER_SIMULATOR_RATE_LIMIT_PER_MINUTE = '120';
    executeRaw = jest.fn(async () => 1);
    const prisma = {
      $transaction: jest.fn(async (callback: any) => callback({ $executeRaw: executeRaw })),
    };
    service = new ProviderSimulatorSecurityService(prisma as any);
  });

  afterEach(() => {
    delete process.env.PROVIDER_SIMULATOR_API_KEY;
    delete process.env.PROVIDER_SIMULATOR_MERCHANT_ID;
    delete process.env.PROVIDER_SIMULATOR_SECRET;
    delete process.env.PROVIDER_SIMULATOR_RATE_LIMIT_PER_MINUTE;
  });

  it('canonicalizes objects independently of input key order', () => {
    expect(service.canonicalJson({ b: 2, a: { d: 4, c: 3 } }))
      .toBe(service.canonicalJson({ a: { c: 3, d: 4 }, b: 2 }));
  });

  it('accepts a canonical HMAC and reserves its nonce', async () => {
    const body = { b: 2, a: 1 };
    const timestamp = new Date().toISOString();
    const nonce = 'nonce-security-0001';
    const signature = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${nonce}.${service.canonicalJson(body)}`)
      .digest('hex');

    await expect(service.authenticate({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    }, body, 'bet')).resolves.toBeUndefined();

    expect(executeRaw).toHaveBeenCalledTimes(2);
  });

  it('rejects a missing nonce before database reservation', async () => {
    const timestamp = new Date().toISOString();
    await expect(service.authenticate({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': timestamp,
      'x-signature': 'invalid',
    }, {}, 'bet')).rejects.toThrow('nonce is missing or invalid');
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rejects signatures made from non-canonical key order', async () => {
    const body = { b: 2, a: 1 };
    const timestamp = new Date().toISOString();
    const nonce = 'nonce-security-0002';
    const signature = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${nonce}.${JSON.stringify(body)}`)
      .digest('hex');

    await expect(service.authenticate({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    }, body, 'bet')).rejects.toThrow('Invalid simulator provider signature');
  });

  it('applies rate limits independently per endpoint', async () => {
    process.env.PROVIDER_SIMULATOR_RATE_LIMIT_PER_MINUTE = '10';
    const body = { ping: true };
    const timestamp = new Date().toISOString();

    for (let index = 0; index < 10; index += 1) {
      const nonce = `nonce-rate-limit-${String(index).padStart(4, '0')}`;
      const signature = createHmac('sha256', 'test-secret')
        .update(`${timestamp}.${nonce}.${service.canonicalJson(body)}`)
        .digest('hex');
      await service.authenticate({
        'x-api-key': 'test-api-key',
        'x-merchant-id': 'test-merchant',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      }, body, 'balance');
    }

    const nonce = 'nonce-rate-limit-over';
    const signature = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${nonce}.${service.canonicalJson(body)}`)
      .digest('hex');
    await expect(service.authenticate({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    }, body, 'balance')).rejects.toThrow('rate limit exceeded');
  });
});
