import type { DepositMethodCode, ReceivingAccount } from '../../../app/types/member-finance';

export type DepositFormValues = {
  amount: string;
  method: DepositMethodCode;
  transactionRef: string;
  note: string;
};

export const DEPOSIT_FORM_DEFAULTS: DepositFormValues = {
  amount: '500',
  method: 'bank_transfer',
  transactionRef: '',
  note: '',
};

export function parseDepositAmount(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

export function validateDepositSelection(values: DepositFormValues, availableMethods: readonly DepositMethodCode[]): string | null {
  const amount = parseDepositAmount(values.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'กรุณาใส่จำนวนเงินมากกว่า 0';
  if (!availableMethods.includes(values.method)) return 'ยังไม่มีบัญชีธนาคารสำหรับยอดหรือช่องทางนี้';
  return null;
}

export function serializeDepositCreateRequest(values: DepositFormValues, account: ReceivingAccount) {
  const amount = parseDepositAmount(values.amount);
  return {
    amount,
    method: values.method,
    referenceCode: values.transactionRef.trim() || undefined,
    note: JSON.stringify({
      userNote: values.note,
      paymentType: values.method,
      receivingBankAccountId: account.id,
      receivingBank: account,
    }),
  };
}

export function serializeDepositEvidenceRequest(values: DepositFormValues, slipImageData: string, slipImageName: string) {
  return {
    slipImageData,
    slipImageName,
    transactionRef: values.transactionRef.trim() || undefined,
    detectedAmount: String(parseDepositAmount(values.amount)),
    transferredAt: new Date().toISOString(),
  };
}

export function resolveDepositError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
}
