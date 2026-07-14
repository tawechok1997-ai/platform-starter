import { UnauthorizedException } from '@nestjs/common';
import {
  assertAdminTotp,
  generateAdminRecoveryCodes,
  generateAdminTwoFactorSecret,
  normalizeAdminRecoveryCode,
} from './admin-two-factor.util';

describe('admin two factor utilities', () => {
  it('generates a base32 secret and ten formatted recovery codes', () => {
    expect(generateAdminTwoFactorSecret()).toMatch(/^[A-Z2-7]+$/);
    const codes = generateAdminRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(codes.every((code) => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code))).toBe(true);
  });

  it('normalizes recovery codes consistently', () => {
    expect(normalizeAdminRecoveryCode('ab12-cd34 ef56')).toBe('AB12CD34EF56');
  });

  it('rejects malformed totp codes before any secret comparison', () => {
    expect(() => assertAdminTotp('JBSWY3DPEHPK3PXP', '12 34')).toThrow(UnauthorizedException);
  });
});
