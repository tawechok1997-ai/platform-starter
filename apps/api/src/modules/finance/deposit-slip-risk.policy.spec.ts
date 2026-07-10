import {
  chooseStrongestDuplicateMatch,
  duplicateAttemptRisk,
  duplicateMemberMessage,
} from './deposit-slip-risk.policy';

describe('deposit slip duplicate risk policy', () => {
  it('does not alert on the first duplicate attempt', () => {
    expect(duplicateAttemptRisk(1, 1)).toEqual({
      severity: 'LOW',
      shouldAlert: false,
      shouldTemporarilyBlockDeposits: false,
    });
  });

  it('raises medium risk on two attempts within seven days', () => {
    expect(duplicateAttemptRisk(2, 2)).toEqual({
      severity: 'MEDIUM',
      shouldAlert: true,
      shouldTemporarilyBlockDeposits: false,
    });
  });

  it('raises high risk on three attempts within thirty days', () => {
    expect(duplicateAttemptRisk(1, 3)).toEqual({
      severity: 'HIGH',
      shouldAlert: true,
      shouldTemporarilyBlockDeposits: false,
    });
  });

  it('temporarily blocks deposits on five attempts within thirty days', () => {
    expect(duplicateAttemptRisk(2, 5)).toEqual({
      severity: 'CRITICAL',
      shouldAlert: true,
      shouldTemporarilyBlockDeposits: true,
    });
  });

  it('prefers a transaction reference match over weaker image similarity', () => {
    const match = chooseStrongestDuplicateMatch([
      { reason: 'PERCEPTUAL_HASH', originalRequestId: 'visual', score: 0.99 },
      { reason: 'TRANSACTION_REFERENCE', originalRequestId: 'reference', score: 1 },
    ]);

    expect(match?.originalRequestId).toBe('reference');
    expect(duplicateMemberMessage(match!)).toContain('เลขอ้างอิงธุรกรรมซ้ำ');
  });
});
