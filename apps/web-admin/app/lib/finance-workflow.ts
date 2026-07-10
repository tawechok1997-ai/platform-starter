export type DepositWorkflowStatus =
  | 'PENDING_SLIP_REVIEW'
  | 'PENDING_CREDIT'
  | 'DUPLICATE'
  | 'COMPLETED'
  | 'REJECTED';

export type DepositWorkflowAction =
  | 'APPROVE_SLIP'
  | 'CONFIRM_CREDIT';

const DEPOSIT_STATUS_LABELS: Record<DepositWorkflowStatus, string> = {
  PENDING_SLIP_REVIEW: 'รอตรวจสลิป',
  PENDING_CREDIT: 'รอเพิ่มเครดิต',
  DUPLICATE: 'สลิปซ้ำ',
  COMPLETED: 'สำเร็จ',
  REJECTED: 'ไม่อนุมัติ',
};

const DEPOSIT_ALLOWED_ACTIONS: Record<DepositWorkflowStatus, readonly DepositWorkflowAction[]> = {
  PENDING_SLIP_REVIEW: ['APPROVE_SLIP'],
  PENDING_CREDIT: ['CONFIRM_CREDIT'],
  DUPLICATE: [],
  COMPLETED: [],
  REJECTED: [],
};

export function financeStatusLabel(status: DepositWorkflowStatus): string {
  return DEPOSIT_STATUS_LABELS[status];
}

export function allowedDepositActions(
  status: DepositWorkflowStatus,
): readonly DepositWorkflowAction[] {
  return DEPOSIT_ALLOWED_ACTIONS[status];
}
