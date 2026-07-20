import { createHmac } from 'crypto';
import { ProviderSimulatorSecurityService } from './provider-simulator-security.service';

describe('ProviderSimulatorSecurityService', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.PROVIDER_SIMULATOR_API_KEY = 'test-api-key';
    process.env.PROVIDER_SIMULATOR_MERCHANT_ID = 'test-merchant';
    process.env.PROVIDER_SIMULATOR_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.PROVIDER_SIMULATOR_API_KEY;
    delete process.env.PROVIDER_SIMULATOR_MERCHANT_ID;
    delete process.env.PROVIDER_SIMULATOR_SECRET;
    delete process.env.PROVIDER_SIMULATOR_RATE_LIMIT_PER_MINUTE;
  });

  function setup() {
    const reserveNonce = jest.fn(async () => undefined);
    return {
      reserveNonce,
      service: new ProviderSimulatorSecurityService({ reserveNonce } as never),
    };
  }

  it('canonicalizes object keys deterministically', () => {
    const { service } = setup();
    expect(service.canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });

  it('authenticates a canonical signed request and reserves the nonce', async () => {
    const { service, reserveNonce } = setup();
    const body = { b: 2, a: 1 };
    const timestamp = new Date().toISOString();
    const nonce = 'nonce-security-0001';
    const signature = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${nonce}.${service.canonicalJson(body)}`)
      .digest('hex');

    await service.authenticate({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    }, body, 'bet');

    expect(reserveNonce).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing nonce without persistence', async () => {
    const { service, reserveNonce } = setup();
    await expect(service.authenticate({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': new Date().toISOString(),
      'x-signature': 'invalid',
    }, {}, 'bet')).rejects.toThrow('nonce is missing or invalid');
    expect(reserveNonce).not.toHaveBeenCalled();
  });
});
