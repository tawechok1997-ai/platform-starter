import type { ProviderAdapterContext } from './provider-adapter.interface';
import { validateProviderReadiness } from './provider-readiness';

function context(overrides: Partial<ProviderAdapterContext> = {}): ProviderAdapterContext {
  return {
    providerCode: 'demo',
    baseUrl: 'https://provider.example',
    walletMode: 'TRANSFER',
    currency: 'THB',
    timeoutMs: 5000,
    endpointMap: {
      HEALTH_CHECK: '/health',
      LAUNCH: '/launch',
      BALANCE: '/balance',
      TRANSFER_IN: '/transfer/in',
      TRANSFER_OUT: '/transfer/out',
      WEBHOOK: '/webhook',
    },
    credentialMap: {
      API_KEY: 'test-key',
      SECRET_KEY: 'test-secret',
    },
    ...overrides,
  };
}

describe('validateProviderReadiness', () => {
  it('accepts a complete generic provider configuration', () => {
    const result = validateProviderReadiness(context(), {
      endpoints: ['HEALTH_CHECK', 'LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK'],
      credentials: ['API_KEY', 'SECRET_KEY'],
    });

    expect(result).toEqual({ ready: true, issues: [] });
  });

  it('reports missing endpoints and credentials without exposing secret values', () => {
    const result = validateProviderReadiness(context({ endpointMap: {}, credentialMap: {} }), {
      endpoints: ['LAUNCH', 'WEBHOOK'],
      credentials: ['API_KEY', 'SECRET_KEY'],
    });

    expect(result.ready).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual([
      'ENDPOINT_REQUIRED',
      'ENDPOINT_REQUIRED',
      'CREDENTIAL_REQUIRED',
      'CREDENTIAL_REQUIRED',
    ]);
    expect(JSON.stringify(result)).not.toContain('test-secret');
  });

  it('rejects unsafe URLs, embedded credentials, invalid currency, and invalid timeout', () => {
    const result = validateProviderReadiness(context({
      baseUrl: 'https://user:password@provider.example',
      currency: 'thb',
      timeoutMs: 0,
    }));

    expect(result.ready).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      'BASE_URL_INVALID',
      'CURRENCY_INVALID',
      'TIMEOUT_INVALID',
    ]));
  });
});
