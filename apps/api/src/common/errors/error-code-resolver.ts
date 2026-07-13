import { API_ERROR_CODES, ApiErrorCode } from './error-codes';

type ErrorRule = {
  code: ApiErrorCode;
  matches: RegExp[];
};

const RULES: ErrorRule[] = [
  {
    code: API_ERROR_CODES.WITHDRAWAL_CLAIM_REQUIRED,
    matches: [/ต้อง claim รายการก่อน/i, /claim required/i],
  },
  {
    code: API_ERROR_CODES.WITHDRAWAL_CLAIM_CONFLICT,
    matches: [/แอดมินคนอื่นกำลังตรวจ/i, /claim changed/i],
  },
  {
    code: API_ERROR_CODES.WITHDRAWAL_PROOF_INVALID,
    matches: [/payment slip/i, /payment proof is required/i, /หลักฐาน.*โอน/i],
  },
  {
    code: API_ERROR_CODES.FINANCE_INSUFFICIENT_BALANCE,
    matches: [/insufficient balance/i, /locked balance is not enough/i, /balance is not enough/i],
  },
  {
    code: API_ERROR_CODES.FINANCE_IDEMPOTENCY_CONFLICT,
    matches: [/idempotency/i, /unique/i, /ถูกใช้แล้ว/i],
  },
  {
    code: API_ERROR_CODES.FINANCE_INVALID_STATE,
    matches: [/not waiting for review/i, /cannot accept proof/i, /not ready for verification/i, /wallet is not active/i],
  },
  {
    code: API_ERROR_CODES.RISK_ALERT_NOT_FOUND,
    matches: [/risk alert not found/i, /risk alerts were not found/i],
  },
  {
    code: API_ERROR_CODES.RISK_ALERT_INVALID_TRANSITION,
    matches: [/invalid risk alert status/i, /invalid risk alert status transition/i],
  },
  {
    code: API_ERROR_CODES.RISK_ALERT_SCAN_COOLDOWN,
    matches: [/risk scan is cooling down/i],
  },
  {
    code: API_ERROR_CODES.PROMOTION_CAMPAIGN_NOT_FOUND,
    matches: [/promotion campaign not found/i],
  },
  {
    code: API_ERROR_CODES.PROMOTION_DUPLICATE_CLAIM,
    matches: [/คำขอรับโปร.*รอตรวจ/i, /รายการฝากนี้ถูกใช้รับโปร/i],
  },
  {
    code: API_ERROR_CODES.PROMOTION_INVALID_LIFECYCLE,
    matches: [/bonus lifecycle transition/i, /cannot update turnover/i, /ต้องทำเทิร์นให้ครบ/i, /bonus is already/i],
  },
];

export function resolveApiErrorCode(message: string): ApiErrorCode | undefined {
  const normalized = String(message ?? '').trim();
  if (!normalized) return undefined;
  return RULES.find((rule) => rule.matches.some((pattern) => pattern.test(normalized)))?.code;
}
