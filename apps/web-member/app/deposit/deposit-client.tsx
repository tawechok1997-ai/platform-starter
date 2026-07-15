'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  DEPOSIT_FORM_DEFAULTS,
  DepositView,
  financeInvalidationRules,
  parseDepositAmount,
  resolveDepositError,
  serializeDepositCreateRequest,
  serializeDepositEvidenceRequest,
  useDepositServerState,
  validateDepositSelection,
} from '../../src/features/finance';
import { memberApiFetch } from '../member-api';
import type { DepositMethodCode, DepositStep, ReceivingAccount, TopUpItem } from '../types/member-finance';

const DEPOSIT_EXPIRES_IN_MS = 15 * 60 * 1000;

export default function DepositClient() {
  const [step, setStep] = useState<DepositStep>('select');
  const [amount, setAmount] = useState(DEPOSIT_FORM_DEFAULTS.amount);
  const [method, setMethod] = useState<DepositMethodCode>(DEPOSIT_FORM_DEFAULTS.method);
  const [selected, setSelected] = useState<ReceivingAccount | null>(null);
  const [slipImageData, setSlipImageData] = useState('');
  const [slipImageName, setSlipImageName] = useState('');
  const [transactionRef, setTransactionRef] = useState(DEPOSIT_FORM_DEFAULTS.transactionRef);
  const [note, setNote] = useState(DEPOSIT_FORM_DEFAULTS.note);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<TopUpItem | null>(null);
  const [transferExpiresAt, setTransferExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const {
    accounts,
    history,
    loading: initialLoading,
    error: serverError,
    prependHistory,
  } = useDepositServerState(memberApiFetch);

  const parsedAmount = useMemo(() => parseDepositAmount(amount), [amount]);
  const usable = useMemo(() => accounts.filter((account) => matchAmount(account, parsedAmount)), [accounts, parsedAmount]);
  const availableMethods = useMemo(() => Array.from(new Set(usable.map(accountType))) as DepositMethodCode[], [usable]);
  const formValues = useMemo(() => ({ amount, method, transactionRef, note }), [amount, method, transactionRef, note]);

  useEffect(() => {
    if (serverError) setMessage(serverError);
  }, [serverError]);
  useEffect(() => {
    if (step !== 'transfer' || !transferExpiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step, transferExpiresAt]);
  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.includes(method)) setMethod(availableMethods[0]);
  }, [availableMethods, method]);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`คัดลอก${label}แล้ว`);
    } catch {
      setMessage(`คัดลอก${label}ไม่สำเร็จ`);
    }
  }

  async function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateDepositSelection(formValues, availableMethods);
    if (validationMessage) return setMessage(validationMessage);
    setLoading(true);
    setMessage('กำลังเตรียมข้อมูล...');
    const res = await memberApiFetch(`/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(parsedAmount))}`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok || !data?.item) return setMessage(resolveDepositError(data, 'ยังไม่มีบัญชีธนาคารสำหรับช่องทางนี้'));
    setSelected(data.item);
    setTransferExpiresAt(Date.now() + DEPOSIT_EXPIRES_IN_MS);
    setNow(Date.now());
    setMessage('');
    setStep('transfer');
  }

  async function uploadSlip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('กรุณาเลือกไฟล์รูปภาพ');
    setMessage('กำลังเตรียมรูปสลิป...');
    try {
      const imageData = await resizeImage(file, 900, 0.72);
      setSlipImageName(file.name);
      setSlipImageData(imageData);
      setMessage('แนบสลิปแล้ว ตรวจสอบข้อมูลก่อนส่งรายการ');
    } catch {
      setMessage('อ่านไฟล์สลิปไม่สำเร็จ');
    }
  }

  async function submit() {
    if (!selected || !slipImageData) return setMessage('ข้อมูลไม่ครบ กรุณาเลือกบัญชีและแนบสลิป');
    if (transferExpired) {
      setConfirmOpen(false);
      setMessage('รายการฝากหมดเวลาแล้ว กรุณาเริ่มรายการใหม่เพื่อรับบัญชีและยอดที่ถูกต้อง');
      setStep('select');
      setSelected(null);
      setTransferExpiresAt(null);
      return;
    }
    setConfirmOpen(false);
    setLoading(true);
    setMessage('กำลังสร้างรายการฝาก...');

    const createRes = await memberApiFetch('/member/topups', {
      method: 'POST',
      body: JSON.stringify(serializeDepositCreateRequest(formValues, selected)),
    });
    const created = await createRes.json().catch(() => null);
    if (!createRes.ok || !created?.id) {
      setLoading(false);
      return setMessage(resolveDepositError(created, 'สร้างรายการฝากไม่สำเร็จ'));
    }

    setMessage('กำลังส่งสลิปเพื่อตรวจสอบ...');
    const evidenceRes = await memberApiFetch(`/member/topups/${created.id}/slip-evidence`, {
      method: 'POST',
      body: JSON.stringify(serializeDepositEvidenceRequest(formValues, slipImageData, slipImageName)),
    });
    const evidence = await evidenceRes.json().catch(() => null);
    setLoading(false);

    const item: TopUpItem = {
      ...created,
      status: evidence?.status ?? created.status,
      duplicateOfId: evidence?.duplicateOfId ?? null,
      duplicateReason: evidence?.reason ?? null,
      adminNote: evidence?.message ?? created.adminNote,
    };
    prependHistory(item);
    setLastRequest(item);
    invalidateFinanceQueries(financeInvalidationRules.afterDepositCreated);

    if (!evidenceRes.ok && !evidence?.duplicate) {
      setMessage(resolveDepositError(evidence, 'ส่งสลิปไม่สำเร็จ รายการถูกสร้างแล้ว กรุณาติดต่อฝ่ายบริการ'));
      return;
    }

    setSlipImageData('');
    setSlipImageName('');
    setTransferExpiresAt(null);
    setTransactionRef(DEPOSIT_FORM_DEFAULTS.transactionRef);
    setNote(DEPOSIT_FORM_DEFAULTS.note);
    setMessage(evidence?.duplicate ? 'สลิปนี้ถูกใช้แล้ว ระบบยกเลิกรายการนี้ทันที' : 'ส่งสลิปแล้ว รอแอดมินตรวจสอบ');
    setStep('waiting');
  }

  const remainingMs = transferExpiresAt ? Math.max(0, transferExpiresAt - now) : 0;
  const transferExpired = Boolean(transferExpiresAt && remainingMs <= 0);
  const remainingLabel = transferExpiresAt ? formatDuration(remainingMs) : '';

  return (
    <DepositView
      step={step}
      amount={amount}
      method={method}
      accounts={accounts}
      history={history}
      selected={selected}
      slipImageData={slipImageData}
      slipImageName={slipImageName}
      transactionRef={transactionRef}
      note={note}
      message={message}
      loading={loading}
      initialLoading={initialLoading}
      confirmOpen={confirmOpen}
      lastRequest={lastRequest}
      parsedAmount={parsedAmount}
      availableMethods={availableMethods}
      transferExpiresAt={transferExpiresAt}
      transferExpired={transferExpired}
      remainingLabel={remainingLabel}
      onAmountChange={setAmount}
      onMethodChange={setMethod}
      onTransactionRefChange={setTransactionRef}
      onNoteChange={setNote}
      onNextStep={nextStep}
      onUploadSlip={uploadSlip}
      onCopyText={(value, label) => { void copyText(value, label); }}
      onOpenConfirm={() => setConfirmOpen(true)}
      onCloseConfirm={() => setConfirmOpen(false)}
      onSubmit={() => { void submit(); }}
      onBackToSelect={() => { setStep('select'); setTransferExpiresAt(null); }}
      onCreateAnother={() => { setLastRequest(null); setStep('select'); }}
    />
  );
}

function accountType(account: ReceivingAccount): DepositMethodCode {
  if (account.bankName === 'พร้อมเพย์') return 'promptpay';
  if (account.bankName === 'วอเลต') return 'wallet';
  if (account.bankName === 'อื่น ๆ') return 'other';
  return 'bank_transfer';
}

function matchAmount(account: ReceivingAccount, amount: number) {
  const min = account.minAmount ? Number(account.minAmount) : 0;
  const max = account.maxAmount ? Number(account.maxAmount) : Infinity;
  if (!Number.isFinite(amount) || amount <= 0) return true;
  return amount >= min && amount <= max;
}

function invalidateFinanceQueries(keys: readonly (readonly unknown[])[]) {
  window.dispatchEvent(new CustomEvent('platform:query-invalidate', { detail: { keys } }));
}

function resizeImage(file: File, maxSize: number, quality: number) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('อ่านรูปไม่ได้'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('อ่านรูปไม่ได้'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('อ่านรูปไม่ได้'));
    reader.readAsDataURL(file);
  });
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')} นาที`;
}
