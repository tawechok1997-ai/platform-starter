'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createFinanceIdempotencyKey, WithdrawalView } from '../../src/features/finance';
import { memberApiFetch } from '../member-api';
import type {
  BonusLedger,
  MemberBankAccount,
  WalletResponse,
  WithdrawalItem,
  WithdrawStep,
} from '../types/member-finance';
import { MEMBER_WALLET_REFRESH_EVENT } from '../../src/features/wallet/member-wallet';

export default function WithdrawPage() {
  const [step, setStep] = useState<WithdrawStep>('account');
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [bankAccountId, setBankAccountId] = useState('');
  const [banks, setBanks] = useState<MemberBankAccount[]>([]);
  const [bonusLedgers, setBonusLedgers] = useState<BonusLedger[]>([]);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const idempotencyKeyRef = useRef('');
  const submissionInFlightRef = useRef(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    const [walletRes, listRes, bankRes, bonusRes] = await Promise.all([
      memberApiFetch('/member/wallet'),
      memberApiFetch('/member/withdrawals'),
      memberApiFetch('/member/bank-accounts'),
      memberApiFetch('/member/bonus-ledgers'),
    ]);
    const walletData = await walletRes.json().catch(() => null);
    const listData = await listRes.json().catch(() => null);
    const bankData = await bankRes.json().catch(() => null);
    const bonusData = await bonusRes.json().catch(() => null);

    if (walletRes.ok) setWallet(walletData);
    if (listRes.ok) setItems(listData.items ?? []);
    if (bonusRes.ok) setBonusLedgers(bonusData.items ?? []);
    if (bankRes.ok) {
      const nextBanks: MemberBankAccount[] = bankData.items ?? [];
      setBanks(nextBanks);
      const primary =
        nextBanks.find((item) => item.isPrimary && item.status === 'ACTIVE') ??
        nextBanks.find((item) => item.status === 'ACTIVE');
      if (primary) setBankAccountId((current) => current || primary.id);
    }
    if (!walletRes.ok || !listRes.ok || !bankRes.ok) {
      setMessage(walletData?.message ?? listData?.message ?? bankData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function goAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bonusBlock.blocked) return setMessage(bonusBlock.message);
    if (!selectedBank || selectedBank.status !== 'ACTIVE') return setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว');
    setMessage('');
    setStep('amount');
  }

  function goConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bonusBlock.blocked) return setMessage(bonusBlock.message);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setMessage('กรุณาใส่จำนวนเงินมากกว่า 0');
    if (wallet && parsedAmount > Number(wallet.availableBalance)) return setMessage('ยอดถอนมากกว่ายอดที่ถอนได้');
    setMessage('');
    setStep('confirm');
  }

  function openConfirmModal() {
    if (bonusBlock.blocked) return setMessage(bonusBlock.message);
    if (!selectedBank || selectedBank.status !== 'ACTIVE') return setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว');
    setConfirmOpen(true);
  }

  async function submit() {
    if (submissionInFlightRef.current) return;
    if (bonusBlock.blocked) {
      setConfirmOpen(false);
      setMessage(bonusBlock.message);
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setMessage('กรุณาใส่จำนวนเงินมากกว่า 0');
    if (!selectedBank || selectedBank.status !== 'ACTIVE') return setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว');

    setConfirmOpen(false);
    setIsSubmitting(true);
    setMessage('กำลังส่งคำขอถอน...');
    submissionInFlightRef.current = true;
    idempotencyKeyRef.current ||= createFinanceIdempotencyKey('withdrawal');
    try {
      const res = await memberApiFetch('/member/withdrawals', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKeyRef.current },
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          accountName: selectedBank.accountName,
          accountNumber: selectedBank.accountNumber,
          bankName: selectedBank.bankName,
          note,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(
          `${data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ'} หากเป็นปัญหาเครือข่ายสามารถลองส่งอีกครั้งได้โดยไม่สร้างรายการซ้ำ`,
        );
        await loadAll();
        return;
      }
      idempotencyKeyRef.current = '';
      setAmount('');
      setNote('');
      setItems((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setMessage('ส่งคำขอถอนสำเร็จ');
      setStep('waiting');
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await loadAll();
    } catch {
      setMessage('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองส่งอีกครั้ง ระบบจะใช้รหัสคำขอเดิมเพื่อป้องกันการล็อกยอดซ้ำ');
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  const activeBanks = useMemo(() => banks.filter((item) => item.status === 'ACTIVE'), [banks]);
  const activeBonusLedgers = useMemo(
    () =>
      bonusLedgers.filter(
        (item) => !item.turnoverCompleted && ['ACTIVE', 'REVIEWING', 'PENDING'].includes(item.status),
      ),
    [bonusLedgers],
  );
  const bonusBlock = useMemo(() => buildBonusBlock(activeBonusLedgers), [activeBonusLedgers]);
  const parsedAmount = Number(amount.replace(/,/g, '').trim());
  const currency = wallet?.currency ?? 'THB';
  const selectedBank = banks.find((item) => item.id === bankAccountId);

  return (
    <WithdrawalView
      step={step}
      wallet={wallet}
      amount={amount}
      method={method}
      bankAccountId={bankAccountId}
      banks={banks}
      activeBanks={activeBanks}
      activeBonusLedgers={activeBonusLedgers}
      items={items}
      note={note}
      message={message}
      isSubmitting={isSubmitting}
      isLoading={isLoading}
      confirmOpen={confirmOpen}
      bonusBlocked={bonusBlock.blocked}
      bonusMessage={bonusBlock.message}
      parsedAmount={parsedAmount}
      selectedBank={selectedBank}
      currency={currency}
      onMethodChange={(value) => {
        idempotencyKeyRef.current = '';
        setMethod(value);
      }}
      onBankChange={(value) => {
        idempotencyKeyRef.current = '';
        setBankAccountId(value);
      }}
      onAmountChange={(value) => {
        idempotencyKeyRef.current = '';
        setAmount(value);
      }}
      onNoteChange={(value) => {
        idempotencyKeyRef.current = '';
        setNote(value);
      }}
      onGoAmount={goAmount}
      onGoConfirm={goConfirm}
      onStepChange={(value) => {
        if (value === 'account' && step === 'waiting') idempotencyKeyRef.current = '';
        setStep(value);
      }}
      onOpenConfirm={openConfirmModal}
      onCloseConfirm={() => setConfirmOpen(false)}
      onSubmit={() => {
        void submit();
      }}
    />
  );
}

function buildBonusBlock(items: BonusLedger[]) {
  const remaining = items.reduce(
    (sum, item) => sum + Math.max(Number(item.turnoverRequired || 0) - Number(item.turnoverProgress || 0), 0),
    0,
  );
  return {
    blocked: remaining > 0,
    remaining,
    message: remaining > 0 ? `ต้องทำเทิร์นโบนัสคงเหลือ ${money(remaining, 'THB')} ก่อนจึงจะส่งคำขอถอนได้` : '',
  };
}

function money(value: number, currency: string) {
  return `${currency} ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}