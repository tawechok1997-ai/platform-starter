import { DomainError } from '../errors/domain-error';
import { isFreshStepUp, requireFreshStepUp } from './step-up-policy';

describe('step-up policy', () => {
  const now = new Date('2026-07-15T12:00:00.000Z');
  const requirement = { maxAgeMs: 5 * 60_000, allowedMethods: ['totp'] as const };

  it('accepts a recent allowed verification', () => {
    expect(isFreshStepUp({ verifiedAt: '2026-07-15T11:58:00.000Z', method: 'totp' }, requirement, now)).toBe(true);
  });

  it('rejects expired, future and disallowed verification', () => {
    expect(isFreshStepUp({ verifiedAt: '2026-07-15T11:50:00.000Z', method: 'totp' }, requirement, now)).toBe(false);
    expect(isFreshStepUp({ verifiedAt: '2026-07-15T12:01:00.000Z', method: 'totp' }, requirement, now)).toBe(false);
    expect(isFreshStepUp({ verifiedAt: '2026-07-15T11:58:00.000Z', method: 'password' }, requirement, now)).toBe(false);
  });

  it('throws a stable domain error when step-up is missing', () => {
    expect(() => requireFreshStepUp(null, requirement, now)).toThrow(DomainError);
    try {
      requireFreshStepUp(null, requirement, now);
    } catch (error) {
      expect(error).toMatchObject({ code: 'AUTH_STEP_UP_REQUIRED', category: 'unauthorized' });
    }
  });
});
