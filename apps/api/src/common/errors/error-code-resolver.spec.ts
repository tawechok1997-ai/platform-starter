import { API_ERROR_CODES } from './error-codes';
import { resolveApiErrorCode } from './error-code-resolver';

describe('resolveApiErrorCode', () => {
  it.each([
    ['ต้อง claim รายการก่อนอนุมัติ', API_ERROR_CODES.WITHDRAWAL_CLAIM_REQUIRED],
    ['รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่', API_ERROR_CODES.WITHDRAWAL_CLAIM_CONFLICT],
    ['Payment slip must be jpg, png, or webp', API_ERROR_CODES.WITHDRAWAL_PROOF_INVALID],
    ['Locked balance is not enough', API_ERROR_CODES.FINANCE_INSUFFICIENT_BALANCE],
    ['Withdrawal is not ready for verification: PENDING', API_ERROR_CODES.FINANCE_INVALID_STATE],
    ['Risk alert not found', API_ERROR_CODES.RISK_ALERT_NOT_FOUND],
    ['Invalid risk alert status transition: OPEN -> RESOLVED', API_ERROR_CODES.RISK_ALERT_INVALID_TRANSITION],
    ['Risk scan is cooling down', API_ERROR_CODES.RISK_ALERT_SCAN_COOLDOWN],
    ['Promotion campaign not found or inactive', API_ERROR_CODES.PROMOTION_CAMPAIGN_NOT_FOUND],
    ['คุณมีคำขอรับโปรนี้ที่กำลังรอตรวจอยู่แล้ว', API_ERROR_CODES.PROMOTION_DUPLICATE_CLAIM],
    ['ต้องทำเทิร์นให้ครบก่อน release โบนัส', API_ERROR_CODES.PROMOTION_INVALID_LIFECYCLE],
  ])('maps %s', (message, expected) => {
    expect(resolveApiErrorCode(message)).toBe(expected);
  });

  it('does not invent a code for an uncatalogued message', () => {
    expect(resolveApiErrorCode('Unrelated validation failure')).toBeUndefined();
  });
});
