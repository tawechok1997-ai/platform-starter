import {
  allowedDepositActions,
  allowedWithdrawalActions,
  financeStatusLabel,
  isFinalFinanceAction,
  requiresEvidence,
} from './finance-workflow';

describe('finance workflow contracts', () => {
  it('does not expose actions for terminal deposit states', () => {
    expect(allowedDepositActions('DUPLICATE')).toEqual([]);
    expect(allowedDepositActions('COMPLETED')).toEqual([]);
  });

  it('requires proof before payment verification', () => {
    expect(allowedWithdrawalActions('APPROVED_FOR_PAYMENT')).toContain('UPLOAD_PAYMENT_PROOF');
    expect(allowedWithdrawalActions('PAYMENT_PROOF_UPLOADED')).toContain('VERIFY_PAYMENT');
    expect(requiresEvidence('VERIFY_PAYMENT')).toBe(true);
  });

  it('marks credit and payment confirmation as final actions', () => {
    expect(isFinalFinanceAction('CONFIRM_CREDIT')).toBe(true);
    expect(isFinalFinanceAction('VERIFY_PAYMENT')).toBe(true);
  });

  it('returns Thai labels for risk-sensitive states', () => {
    expect(financeStatusLabel('DUPLICATE')).toBe('สลิปซ้ำ');
    expect(financeStatusLabel('PENDING_CREDIT')).toBe('รอเพิ่มเครดิต');
  });
});
