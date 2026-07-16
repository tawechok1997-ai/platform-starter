export type FinanceMutation = 'deposit' | 'withdrawal';

const ACCEPTED_DEPOSIT_EVIDENCE_STATUSES = new Set([
  'PENDING_SLIP_REVIEW',
  'PENDING_CREDIT',
  'CREDIT_CONFIRMED',
  'COMPLETED',
  'DUPLICATE',
]);

export function createFinanceIdempotencyKey(
  mutation: FinanceMutation,
  randomUUID: () => string = () => globalThis.crypto.randomUUID(),
) {
  return `member-${mutation}-${randomUUID()}`;
}

export function hasAcceptedDepositEvidence(status: unknown): boolean {
  return typeof status === 'string' && ACCEPTED_DEPOSIT_EVIDENCE_STATUSES.has(status);
}
