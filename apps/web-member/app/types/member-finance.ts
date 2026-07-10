export type FinanceStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'ACTIVE' | 'REVIEWING' | string;

export type TopUpItem = {
  id: string;
  amount: string;
  currency: string;
  status: FinanceStatus;
  method?: string | null;
  note?: string | null;
  adminNote?: string | null;
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
  status: FinanceStatus;
  method?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  note?: string | null;
  adminNote?: string | null;
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
