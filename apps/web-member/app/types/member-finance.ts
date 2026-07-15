type LegacyFinanceStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'ACTIVE' | 'REVIEWING';

type TopUpStatus =
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

export type WithdrawalStatus =
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'APPROVED_FOR_PAYMENT'
  | 'PAYMENT_PROOF_UPLOADED'
  | 'PAYMENT_VERIFIED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

type FinanceStatus = LegacyFinanceStatus | TopUpStatus | WithdrawalStatus | string;

export type TopUpItem = {
  id: string;
  amount: string;
  currency: string;
  status: TopUpStatus;
  method?: string | null;
  referenceCode?: string | null;
  note?: string | null;
  adminNote?: string | null;
  duplicateOfId?: string | null;
  duplicateReason?: string | null;
  duplicateMatchScore?: string | null;
  createdAt: string;
};

export type ReceivingAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPay?: string | null;
  qrImageUrl?: string | null;
  minAmount?: string | null;
  maxAmount?: string | null;
  sortOrder?: number;
};

export type DepositMethodCode = 'bank_transfer' | 'promptpay' | 'wallet' | 'other';
export type DepositStep = 'select' | 'transfer' | 'waiting';

export type WalletResponse = {
  currency: string;
  availableBalance: string;
  lockedBalance: string;
  status: FinanceStatus;
};

export type WithdrawalItem = {
  id: string;
  amount: string;
  currency: string;
  status: WithdrawalStatus;
  method?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  note?: string | null;
  adminNote?: string | null;
  paymentSlipUrl?: string | null;
  paymentTransactionRef?: string | null;
  createdAt: string;
};

export type MemberBankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
  status: FinanceStatus;
  adminNote?: string | null;
};

export type BonusLedger = {
  id: string;
  campaignId: string;
  campaign?: { title?: string };
  amount: number;
  currency: string;
  turnoverRequired: number;
  turnoverProgress: number;
  turnoverCompleted: boolean;
  status: FinanceStatus;
  walletCreditStatus?: string;
};

export type WithdrawStep = 'account' | 'amount' | 'confirm' | 'waiting';

export function topUpStatusLabel(status: TopUpStatus): string {
  const labels: Record<TopUpStatus, string> = {
    PENDING: 'รอแนบสลิป',
    PENDING_SLIP_REVIEW: 'รอตรวจสลิป',
    SLIP_APPROVED: 'ตรวจสลิปแล้ว',
    PENDING_CREDIT: 'รอเพิ่มเครดิต',
    CREDIT_CONFIRMED: 'เพิ่มเครดิตแล้ว',
    DUPLICATE: 'สลิปซ้ำ',
    APPROVED: 'อนุมัติแล้ว',
    COMPLETED: 'สำเร็จ',
    REJECTED: 'ไม่อนุมัติ',
    CANCELLED: 'ยกเลิก',
  };
  return labels[status] ?? status;
}

function withdrawalStatusLabel(status: WithdrawalStatus): string {
  const labels: Record<WithdrawalStatus, string> = {
    PENDING: 'รอตรวจสอบ',
    PENDING_REVIEW: 'รอตรวจสอบ',
    APPROVED_FOR_PAYMENT: 'รอดำเนินการโอน',
    PAYMENT_PROOF_UPLOADED: 'รอตรวจหลักฐาน',
    PAYMENT_VERIFIED: 'ตรวจหลักฐานแล้ว',
    COMPLETED: 'จ่ายสำเร็จ',
    REJECTED: 'ไม่อนุมัติ',
    CANCELLED: 'ยกเลิก',
  };
  return labels[status] ?? status;
}

function isTerminalTopUpStatus(status: TopUpStatus): boolean {
  return ['DUPLICATE', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status);
}

function isTerminalWithdrawalStatus(status: WithdrawalStatus): boolean {
  return ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(status);
}
