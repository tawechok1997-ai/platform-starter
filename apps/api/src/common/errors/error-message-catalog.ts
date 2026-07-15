export const ERROR_MESSAGE_KEYS = {
  INVALID_AMOUNT: 'errors.validation.invalid_amount',
  INVALID_STATE_TRANSITION: 'errors.conflict.invalid_state_transition',
  INSUFFICIENT_BALANCE: 'errors.conflict.insufficient_balance',
  RESOURCE_LOCKED: 'errors.conflict.resource_locked',
  POLICY_VIOLATION: 'errors.forbidden.policy_violation',
  INVALID_IDENTIFIER: 'errors.validation.invalid_identifier',
  INVALID_PHONE: 'errors.validation.invalid_phone',
  INVALID_BANK_ACCOUNT: 'errors.validation.invalid_bank_account',
  FINANCE_INVALID_STATE: 'errors.finance.invalid_state',
  FINANCE_IDEMPOTENCY_CONFLICT: 'errors.finance.idempotency_conflict',
  FINANCE_INSUFFICIENT_BALANCE: 'errors.finance.insufficient_balance',
  WITHDRAWAL_CLAIM_REQUIRED: 'errors.withdrawal.claim_required',
  WITHDRAWAL_CLAIM_CONFLICT: 'errors.withdrawal.claim_conflict',
  WITHDRAWAL_PROOF_INVALID: 'errors.withdrawal.proof_invalid',
  RISK_ALERT_NOT_FOUND: 'errors.risk_alert.not_found',
  RISK_ALERT_INVALID_TRANSITION: 'errors.risk_alert.invalid_transition',
  RISK_ALERT_SCAN_COOLDOWN: 'errors.risk_alert.scan_cooldown',
  PROMOTION_CAMPAIGN_NOT_FOUND: 'errors.promotion.campaign_not_found',
  PROMOTION_DUPLICATE_CLAIM: 'errors.promotion.duplicate_claim',
  PROMOTION_INVALID_LIFECYCLE: 'errors.promotion.invalid_lifecycle',
} as const;

export type ErrorMessageKey = (typeof ERROR_MESSAGE_KEYS)[keyof typeof ERROR_MESSAGE_KEYS];

export function resolveErrorMessageKey(code: string): ErrorMessageKey | `errors.${string}` {
  return ERROR_MESSAGE_KEYS[code as keyof typeof ERROR_MESSAGE_KEYS] ?? `errors.${toMessageKeySegment(code)}`;
}

function toMessageKeySegment(code: string) {
  const normalized = String(code ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || 'unexpected';
}
