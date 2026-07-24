export type WithdrawalPriorityStatus =
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'APPROVED_FOR_PAYMENT'
  | 'PAYMENT_PROOF_UPLOADED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type WithdrawalPriorityItem = {
  id: string;
  status: WithdrawalPriorityStatus;
  createdAt: string;
  claimedBy?: string | null;
};

const STATUS_PRIORITY: Record<WithdrawalPriorityStatus, number> = {
  PAYMENT_PROOF_UPLOADED: 500,
  APPROVED_FOR_PAYMENT: 400,
  PENDING_REVIEW: 300,
  PENDING: 200,
  COMPLETED: 0,
  REJECTED: 0,
  CANCELLED: 0,
};

export const WITHDRAWAL_SLA_WARNING_MINUTES = 30;
export const WITHDRAWAL_SLA_CRITICAL_MINUTES = 60;

export function withdrawalAgeMinutes(createdAt: string, now = Date.now()) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((now - created) / 60_000));
}

export function withdrawalPriorityScore(item: WithdrawalPriorityItem, now = Date.now()) {
  const age = withdrawalAgeMinutes(item.createdAt, now);
  const slaBoost = age >= WITHDRAWAL_SLA_CRITICAL_MINUTES ? 200 : age >= WITHDRAWAL_SLA_WARNING_MINUTES ? 100 : 0;
  const unclaimedBoost = item.claimedBy ? 0 : 25;
  return STATUS_PRIORITY[item.status] + slaBoost + unclaimedBoost + Math.min(age, 99);
}

export function sortWithdrawalsByPriority<T extends WithdrawalPriorityItem>(items: readonly T[], now = Date.now()) {
  return [...items].sort((left, right) => {
    const scoreDifference = withdrawalPriorityScore(right, now) - withdrawalPriorityScore(left, now);
    if (scoreDifference !== 0) return scoreDifference;
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

export function withdrawalSlaTone(ageMinutes: number): 'neutral' | 'warning' | 'danger' {
  if (ageMinutes >= WITHDRAWAL_SLA_CRITICAL_MINUTES) return 'danger';
  if (ageMinutes >= WITHDRAWAL_SLA_WARNING_MINUTES) return 'warning';
  return 'neutral';
}
