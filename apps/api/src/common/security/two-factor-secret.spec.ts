import { protectTwoFactorSecret, revealTwoFactorSecret } from './two-factor-secret';

describe('two-factor secret protection', () => {
  const config = {
    get: jest.fn((key: string) =>
      key === 'TWO_FACTOR_ENCRYPTION_KEY' ? 'test-key-with-at-least-thirty-two-characters' : undefined,
    ),
  };

  it('encrypts a secret and decrypts it with the configured key', () => {
    const protectedValue = protectTwoFactorSecret('JBSWY3DPEHPK3PXP', config);

    expect(protectedValue).toMatch(/^enc:v1:/);
    expect(protectedValue).not.toContain('JBSWY3DPEHPK3PXP');
    expect(revealTwoFactorSecret(protectedValue, config)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('keeps legacy plaintext values readable during migration', () => {
    expect(revealTwoFactorSecret('legacy-secret', config)).toBe('legacy-secret');
  });

  it('rejects an encrypted value when the key is different', () => {
    const protectedValue = protectTwoFactorSecret('JBSWY3DPEHPK3PXP', config);
    const wrongConfig = { get: jest.fn(() => 'different-test-key-with-thirty-two-characters') };

    expect(() => revealTwoFactorSecret(protectedValue, wrongConfig)).toThrow();
  });
});
