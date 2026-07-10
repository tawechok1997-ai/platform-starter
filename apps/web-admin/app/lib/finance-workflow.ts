export type DepositWorkflowStatus =
  | 'PENDING'
  | 'PENDING_SLIP_REVIEW'
  | 'SLIP_APPROVED'
  | 'PENDING_CREDIT'
  | 'CREDIT_CONFIRMED'
  | 'DUPLICATE'
  | 'APPROVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type WithdrawalWorkflowStatus =
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'APPROVED_FOR_PAYMENT'
  | 'PAYMENT_PROOF_UPLOADED'
  | 'PAYMENT_VERIFIED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type AdminFinanceAction =
  | 'CLAIM'
  | 'APPROVE_SLIP'
  | 'CONFIRM_CREDIT'
  | 'REJECT_DEPOSIT'
  | 'APPROVE_FOR_PAYMENT'
  | 'UPLOAD_PAYMENT_PROOF'
  | 'VERIFY_PAYMENT'
  | 'REJECT_WITHDRAWAL';

export const depositActionByStatus: Partial<Record<DepositWorkflowStatus, AdminFinanceAction[]>> = {
  PENDING: ['CLAIM'],
  PENDING_SLIP_REVIEW: ['CLAIM', 'APPROVE_SLIP', 'REJECT_DEPOSIT'],
  SLIP_APPROVED: ['CONFIRM_CREDIT', 'REJECT_DEPOSIT'],
  PENDING_CREDIT: ['CONFIRM_CREDIT', 'REJECT_DEPOSIT'],
};

export const withdrawalActionByStatus: Partial<Record<WithdrawalWorkflowStatus, AdminFinanceAction[]>> = {
  PENDING: ['CLAIM'],
  PENDING_REVIEW: ['CLAIM', 'APPROVE_FOR_PAYMENT', 'REJECT_WITHDRAWAL'],
  APPROVED_FOR_PAYMENT: ['UPLOAD_PAYMENT_PROOF', 'REJECT_WITHDRAWAL'],
  PAYMENT_PROOF_UPLOADED: ['VERIFY_PAYMENT', 'REJECT_WITHDRAWAL'],
};

export function allowedDepositActions(status: DepositWorkflowStatus): AdminFinanceAction[] {
  return depositActionByStatus[status] ?? [];
}

export function allowedWithdrawalActions(status: WithdrawalWorkflowStatus): AdminFinanceAction[] {
  return withdrawalActionByStatus[status] ?? [];
}

export function financeStatusLabel(status: DepositWorkflowStatus | WithdrawalWorkflowStatus): string {
  const labels: Record<string, string> = {
    PENDING: 'รอตรวจสอบ',
    PENDING_SLIP_REVIEW: 'รอตรวจสลิป',
    SLIP_APPROVED: 'สลิปผ่านแล้ว',
    PENDING_CREDIT: 'รอเพิ่มเครดิต',
    CREDIT_CONFIRMED: 'เพิ่มเครดิตแล้ว',
    DUPLICATE: 'สลิปซ้ำ',
    APPROVED: 'อนุมัติแล้ว',
    PENDING_REVIEW: 'รอตรวจสอบ',
    APPROVED_FOR_PAYMENT: 'รอโอนเงิน',
    PAYMENT_PROOF_UPLOADED: 'รอตรวจหลักฐาน',
    PAYMENT_VERIFIED: 'ตรวจหลักฐานแล้ว',
    COMPLETED: 'สำเร็จ',
    REJECTED: 'ไม่อนุมัติ',
    CANCELLED: 'ยกเลิก',
  };
  return labels[status] ?? status;
}

export function requiresEvidence(action: AdminFinanceAction): boolean {
  return ['APPROVE_SLIP', 'UPLOAD_PAYMENT_PROOF', 'VERIFY_PAYMENT'].includes(action);
}

export function isFinalFinanceAction(action: AdminFinanceAction): boolean {
  return ['CONFIRM_CREDIT', 'VERIFY_PAYMENT', 'REJECT_DEPOSIT', 'REJECT_WITHDRAWAL'].includes(action);
}
