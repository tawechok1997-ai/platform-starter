'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  FinanceActionBar,
  FinanceCard,
  FinanceConfirmDialog,
  FinanceEmptyState,
  FinanceFlowShell,
  FinanceInfoRow,
  FinanceStatusBadge,
  FinanceStepIndicator,
} from '../components/member-finance-flow';
import { memberApiFetch } from '../member-api';
import type {
  BonusLedger,
  MemberBankAccount,
  WalletResponse,
  WithdrawalItem,
  WithdrawStep,
} from '../types/member-finance';

const withdrawalSteps = [
  { key: 'account', label: 'บัญชี' },
  { key: 'amount', label: 'จำนวนเงิน' },
  { key: 'confirm', label: 'ยืนยัน' },
  { key: 'waiting', label: 'รอดำเนินการ' },
];

export default function WithdrawPage() {
  const [step, setStep] = useState<WithdrawStep>('account');
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [banks, setBanks] = useState<MemberBankAccount[]>([]);
  const [bonusLedgers, setBonusLedgers] = useState<BonusLedger[]>([]);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
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
      const primary = nextBanks.find((item) => item.isPrimary && item.status === 'ACTIVE')
        ?? nextBanks.find((item) => item.status === 'ACTIVE');
      if (primary && !bankAccountId) chooseBank(primary.id, nextBanks);
    }
    if (!walletRes.ok || !listRes.ok || !bankRes.ok) {
      setMessage(walletData?.message ?? listData?.message ?? bankData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    }
    setIsLoading(false);
  }

  function chooseBank(id: string, source = banks) {
    setBankAccountId(id);
    const selected = source.find((item) => item.id === id);
    if (!selected) {
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      return;
    }
    setBankName(selected.bankName);
    setAccountName(selected.accountName);
    setAccountNumber(selected.accountNumber);
  }

  function goAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bonusBlock.blocked) {
      setMessage(bonusBlock.message);
      return;
    }
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!selected) {
      setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว');
      return;
    }
    setMessage('');
    setStep('amount');
  }

  function goConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bonusBlock.blocked) {
      setMessage(bonusBlock.message);
      return;
    }
    const parsed = Number(amount.replace(/,/g, '').trim());
    const available = wallet ? Number(wallet.availableBalance) : 0;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('กรุณาใส่จำนวนเงินมากกว่า 0');
      return;
    }
    if (wallet && parsed > available) {
      setMessage('ยอดถอนมากกว่ายอดที่ถอนได้');
      return;
    }
    setMessage('');
    setStep('confirm');
  }

  function openConfirmModal() {
    if (bonusBlock.blocked) {
      setMessage(bonusBlock.message);
      return;
    }
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!selected) {
      setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว');
      return;
    }
    setConfirmOpen(true);
  }

  async function submit() {
    if (bonusBlock.blocked) {
      setConfirmOpen(false);
      setMessage(bonusBlock.message);
      return;
    }
    const parsed = Number(amount.replace(/,/g, '').trim());
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('กรุณาใส่จำนวนเงินมากกว่า 0');
      return;
    }
    if (!selected) {
      setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว');
      return;
    }

    setConfirmOpen(false);
    setIsSubmitting(true);
    setMessage('กำลังส่งคำขอถอน...');
    const res = await memberApiFetch('/member/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amount: parsed,
        method,
        accountName: selected.accountName,
        accountNumber: selected.accountNumber,
        bankName: selected.bankName,
        note,
      }),
    });
    const data = await res.json().catch(() => null);
    setIsSubmitting(false);
    if (!res.ok) {
      setMessage(data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ');
      await loadAll();
      return;
    }
    setAmount('');
    setNote('');
    setItems((current) => [data, ...current]);
    setMessage('ส่งคำขอถอนสำเร็จ');
    setStep('waiting');
    await loadAll();
  }

  const activeBanks = useMemo(() => banks.filter((item) => item.status === 'ACTIVE'), [banks]);
  const activeBonusLedgers = useMemo(
    () => bonusLedgers.filter((item) => !item.turnoverCompleted && ['ACTIVE', 'REVIEWING', 'PENDING'].includes(item.status)),
    [bonusLedgers],
  );
  const bonusBlock = useMemo(() => buildBonusBlock(activeBonusLedgers), [activeBonusLedgers]);
  const parsedAmount = Number(amount.replace(/,/g, '').trim());
  const currency = wallet?.currency ?? 'THB';
  const selectedBank = banks.find((item) => item.id === bankAccountId);

  const history = (
    <FinanceCard title="ประวัติถอนเงิน" description="รายการล่าสุดและสถานะการตรวจสอบ">
      <div className="withdraw-history-list">
        {items.map((item) => (
          <article key={item.id} className="withdraw-history-item">
            <div className="withdraw-history-head">
              <strong>{money(Number(item.amount), item.currency)}</strong>
              <FinanceStatusBadge status={item.status} />
            </div>
            <span>{item.bankName || '-'} / {maskAccount(item.accountNumber)}</span>
            <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('th-TH')}</time>
            {item.adminNote && <p>หมายเหตุ: {item.adminNote}</p>}
          </article>
        ))}
        {!isLoading && items.length === 0 && (
          <FinanceEmptyState title="ยังไม่มีรายการถอน" description="เมื่อส่งคำขอถอน รายการจะแสดงตรงนี้" />
        )}
      </div>
    </FinanceCard>
  );

  return (
    <FinanceFlowShell
      title="ถอนเงิน"
      description="เลือกบัญชี กำหนดยอด และตรวจสอบข้อมูลก่อนส่งคำขอ"
      aside={history}
    >
      <section className="withdraw-wallet-summary" aria-label="สรุปยอดเงิน">
        <div>
          <span>ยอดที่ถอนได้</span>
          <strong>{money(Number(wallet?.availableBalance ?? 0), currency)}</strong>
        </div>
        <div className="withdraw-wallet-meta">
          <span>รอดำเนินการ {money(Number(wallet?.lockedBalance ?? 0), currency)}</span>
          {wallet && <FinanceStatusBadge status={wallet.status} />}
        </div>
      </section>

      <FinanceStepIndicator current={step} steps={withdrawalSteps} />

      {isLoading && <div className="withdraw-notice" role="status">กำลังโหลดข้อมูล...</div>}
      {message && <div className="withdraw-notice" role="status">{message}</div>}

      {bonusBlock.blocked && (
        <FinanceCard
          title="ยังถอนเงินไม่ได้ เพราะติดเงื่อนไขโบนัส"
          description={bonusBlock.message}
          tone="warning"
        >
          <div className="withdraw-bonus-grid">
            {activeBonusLedgers.slice(0, 3).map((item) => (
              <FinanceInfoRow
                key={item.id}
                label={item.campaign?.title ?? item.campaignId}
                value={`ทำเทิร์นแล้ว ${money(item.turnoverProgress, item.currency)} / ${money(item.turnoverRequired, item.currency)}`}
              />
            ))}
          </div>
          <a href="/bonus" className="finance-button finance-button--secondary">ดูรายละเอียดโบนัส</a>
        </FinanceCard>
      )}

      {step === 'account' && (
        <form onSubmit={goAmount}>
          <FinanceCard title="เลือกบัญชี" description="เลือกบัญชีธนาคารปลายทางที่อนุมัติแล้วสำหรับรับเงินถอน">
            <label className="finance-field">
              ช่องทาง
              <select value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="bank_transfer">โอนธนาคาร</option>
              </select>
            </label>
            <label className="finance-field">
              บัญชีธนาคาร
              <select value={bankAccountId} onChange={(event) => chooseBank(event.target.value)}>
                <option value="">เลือกบัญชี</option>
                {banks.map((item) => (
                  <option key={item.id} value={item.id} disabled={item.status !== 'ACTIVE'}>
                    {item.bankName} / {maskAccount(item.accountNumber)} {item.isPrimary ? '(บัญชีหลัก)' : ''} {item.status !== 'ACTIVE' ? `- ${item.status}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {selectedBank && (
              <FinanceInfoRow
                label="บัญชีที่เลือก"
                value={`${selectedBank.bankName} / ${selectedBank.accountName} / ${maskAccount(selectedBank.accountNumber)}`}
              />
            )}
            {!isLoading && activeBanks.length === 0 && (
              <FinanceEmptyState
                title="ยังไม่มีบัญชีธนาคารที่ใช้ถอนได้"
                description="เพิ่มบัญชีธนาคารแล้วรออนุมัติก่อนส่งคำขอถอน"
                action={<a href="/bank-accounts" className="finance-button finance-button--secondary">การจัดการบัญชีธนาคาร</a>}
              />
            )}
            {activeBanks.length > 0 && <a href="/bank-accounts" className="withdraw-inline-link">การจัดการบัญชีธนาคาร</a>}
            <FinanceActionBar>
              <button
                type="submit"
                disabled={activeBanks.length === 0 || bonusBlock.blocked}
                className="finance-button finance-button--primary"
              >
                ถัดไป
              </button>
            </FinanceActionBar>
          </FinanceCard>
        </form>
      )}

      {step === 'amount' && (
        <form onSubmit={goConfirm}>
          <FinanceCard title="ใส่ยอดถอน" description="ยอดถอนต้องมากกว่า 0 และไม่เกินยอดที่ถอนได้">
            <div className="finance-highlight">
              <em>ยอดที่ถอนได้</em>
              <strong>{money(Number(wallet?.availableBalance ?? 0), currency)}</strong>
            </div>
            <label className="finance-field">
              จำนวนเงิน
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                autoComplete="off"
                placeholder="เช่น 100"
              />
            </label>
            <label className="finance-field">
              หมายเหตุ
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="รายละเอียดเพิ่มเติม ถ้ามี"
              />
            </label>
            <FinanceActionBar>
              <button type="button" onClick={() => setStep('account')} className="finance-button finance-button--secondary">ย้อนกลับ</button>
              <button type="submit" disabled={bonusBlock.blocked} className="finance-button finance-button--primary">ถัดไป</button>
            </FinanceActionBar>
          </FinanceCard>
        </form>
      )}

      {step === 'confirm' && (
        <FinanceCard title="ยืนยันคำขอถอน" description="ตรวจสอบข้อมูลให้ถูกต้องก่อนส่งคำขอ">
          <FinanceInfoRow label="ยอดถอน" value={money(Number.isFinite(parsedAmount) ? parsedAmount : 0, currency)} />
          <FinanceInfoRow label="ช่องทาง" value="โอนธนาคาร" />
          <FinanceInfoRow label="บัญชีธนาคาร" value={`${bankName} / ${accountName} / ${maskAccount(accountNumber)}`} />
          {note && <FinanceInfoRow label="หมายเหตุ" value={note} />}
          <FinanceActionBar>
            <button type="button" onClick={() => setStep('amount')} className="finance-button finance-button--secondary">แก้ไข</button>
            <button
              type="button"
              onClick={openConfirmModal}
              disabled={isSubmitting || bonusBlock.blocked}
              className="finance-button finance-button--primary"
            >
              {isSubmitting ? 'กำลังส่ง...' : 'ตรวจสอบก่อนส่ง'}
            </button>
          </FinanceActionBar>
        </FinanceCard>
      )}

      {step === 'waiting' && (
        <FinanceCard title="รอดำเนินการ" description="ระบบรับคำขอถอนแล้ว รอแอดมินตรวจสอบและดำเนินการ" tone="success">
          <div className="withdraw-success-message">คำขอถอนถูกส่งเรียบร้อยแล้ว</div>
          <FinanceActionBar>
            <a href="/transactions" className="finance-button finance-button--secondary">ดูประวัติ</a>
            <button type="button" onClick={() => setStep('account')} className="finance-button finance-button--primary">ถอนอีกครั้ง</button>
          </FinanceActionBar>
        </FinanceCard>
      )}

      <div className="withdraw-mobile-history">{history}</div>

      <FinanceConfirmDialog
        open={confirmOpen}
        title="ตรวจสอบคำขอถอน"
        description="เมื่อยืนยันแล้ว ระบบจะส่งคำขอให้แอดมินตรวจสอบ"
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        loading={isSubmitting}
        confirmLabel="ยืนยันถอนเงิน"
      >
        <FinanceInfoRow label="ยอดถอน" value={money(Number.isFinite(parsedAmount) ? parsedAmount : 0, currency)} />
        <FinanceInfoRow label="ช่องทาง" value="โอนธนาคาร" />
        <FinanceInfoRow label="บัญชีธนาคาร" value={`${bankName} / ${accountName} / ${maskAccount(accountNumber)}`} />
        {note && <FinanceInfoRow label="หมายเหตุ" value={note} />}
      </FinanceConfirmDialog>
    </FinanceFlowShell>
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

function maskAccount(value?: string | null) {
  if (!value) return '-';
  const compact = value.replace(/\s/g, '');
  return compact.length <= 4 ? compact : `••••••${compact.slice(-4)}`;
}
