'use client';

import type { FormEvent, ReactNode } from 'react';
import {
  FinanceActionBar,
  FinanceCard,
  FinanceConfirmDialog,
  FinanceEmptyState,
  FinanceFlowShell,
  FinanceInfoRow,
  FinanceStatusBadge,
  FinanceStepIndicator,
} from './finance-components';
import type {
  BonusLedger,
  MemberBankAccount,
  WalletResponse,
  WithdrawalItem,
  WithdrawStep,
} from '../../../app/types/member-finance';

const withdrawalSteps = [
  { key: 'account', label: 'บัญชี' },
  { key: 'amount', label: 'จำนวนเงิน' },
  { key: 'confirm', label: 'ยืนยัน' },
  { key: 'waiting', label: 'รอดำเนินการ' },
];

export type WithdrawalViewProps = {
  step: WithdrawStep;
  wallet: WalletResponse | null;
  amount: string;
  method: string;
  bankAccountId: string;
  banks: MemberBankAccount[];
  activeBanks: MemberBankAccount[];
  activeBonusLedgers: BonusLedger[];
  items: WithdrawalItem[];
  note: string;
  message: string;
  isSubmitting: boolean;
  isLoading: boolean;
  confirmOpen: boolean;
  bonusBlocked: boolean;
  bonusMessage: string;
  parsedAmount: number;
  selectedBank?: MemberBankAccount | undefined;
  currency: string;
  onMethodChange: (value: string) => void;
  onBankChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onGoAmount: (event: FormEvent<HTMLFormElement>) => void;
  onGoConfirm: (event: FormEvent<HTMLFormElement>) => void;
  onStepChange: (step: WithdrawStep) => void;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onSubmit: () => void;
};

export function WithdrawalView(props: WithdrawalViewProps) {
  const {
    step, wallet, amount, method, bankAccountId, banks, activeBanks, activeBonusLedgers, items, note,
    message, isSubmitting, isLoading, confirmOpen, bonusBlocked, bonusMessage, parsedAmount,
    selectedBank, currency, onMethodChange, onBankChange, onAmountChange, onNoteChange,
    onGoAmount, onGoConfirm, onStepChange, onOpenConfirm, onCloseConfirm, onSubmit,
  } = props;

  const history: ReactNode = (
    <FinanceCard title="ประวัติถอนเงิน" description="รายการล่าสุดและสถานะการตรวจสอบ">
      <div className="withdraw-history-list">
        {items.map((item) => (
          <article key={item.id} className="withdraw-history-item">
            <div className="withdraw-history-head"><strong>{money(Number(item.amount), item.currency)}</strong><FinanceStatusBadge status={item.status} /></div>
            <span>{item.bankName || '-'} / {maskAccount(item.accountNumber)}</span>
            <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('th-TH')}</time>
            {item.adminNote && <p>หมายเหตุ: {item.adminNote}</p>}
          </article>
        ))}
        {!isLoading && items.length === 0 && <FinanceEmptyState title="ยังไม่มีรายการถอน" description="เมื่อส่งคำขอถอน รายการจะแสดงตรงนี้" />}
      </div>
    </FinanceCard>
  );

  return (
    <FinanceFlowShell title="ถอนเงิน" description="เลือกบัญชี กำหนดยอด และตรวจสอบข้อมูลก่อนส่งคำขอ" aside={history}>
      <section className="withdraw-wallet-summary" aria-label="สรุปยอดเงิน">
        <div><span>ยอดที่ถอนได้</span><strong>{money(Number(wallet?.availableBalance ?? 0), currency)}</strong></div>
        <div className="withdraw-wallet-meta"><span>รอดำเนินการ {money(Number(wallet?.lockedBalance ?? 0), currency)}</span>{wallet && <FinanceStatusBadge status={wallet.status} />}</div>
      </section>

      <FinanceStepIndicator current={step} steps={withdrawalSteps} />
      {isLoading && <div className="withdraw-notice" role="status">กำลังโหลดข้อมูล...</div>}
      {message && <div className="withdraw-notice" role="status">{message}</div>}

      {bonusBlocked && (
        <FinanceCard title="ยังถอนเงินไม่ได้ เพราะติดเงื่อนไขโบนัส" description={bonusMessage} tone="warning">
          <div className="withdraw-bonus-grid">
            {activeBonusLedgers.slice(0, 3).map((item) => <FinanceInfoRow key={item.id} label={item.campaign?.title ?? item.campaignId} value={`ทำเทิร์นแล้ว ${money(item.turnoverProgress, item.currency)} / ${money(item.turnoverRequired, item.currency)}`} />)}
          </div>
          <a href="/bonus" className="finance-button finance-button--secondary">ดูรายละเอียดโบนัส</a>
        </FinanceCard>
      )}

      {step === 'account' && (
        <form onSubmit={onGoAmount}><FinanceCard title="เลือกบัญชี" description="เลือกบัญชีธนาคารปลายทางที่อนุมัติแล้วสำหรับรับเงินถอน">
          <label className="finance-field">ช่องทาง<select value={method} onChange={(event) => onMethodChange(event.target.value)}><option value="bank_transfer">โอนธนาคาร</option></select></label>
          <label className="finance-field">บัญชีธนาคาร<select value={bankAccountId} onChange={(event) => onBankChange(event.target.value)}><option value="">เลือกบัญชี</option>{banks.map((item) => <option key={item.id} value={item.id} disabled={item.status !== 'ACTIVE'}>{item.bankName} / {maskAccount(item.accountNumber)} {item.isPrimary ? '(บัญชีหลัก)' : ''} {item.status !== 'ACTIVE' ? `- ${item.status}` : ''}</option>)}</select></label>
          {selectedBank && <FinanceInfoRow label="บัญชีที่เลือก" value={`${selectedBank.bankName} / ${selectedBank.accountName} / ${maskAccount(selectedBank.accountNumber)}`} />}
          {!isLoading && activeBanks.length === 0 && <FinanceEmptyState title="ยังไม่มีบัญชีธนาคารที่ใช้ถอนได้" description="เพิ่มบัญชีธนาคารแล้วรออนุมัติก่อนส่งคำขอถอน" action={<a href="/bank-accounts" className="finance-button finance-button--secondary">การจัดการบัญชีธนาคาร</a>} />}
          {activeBanks.length > 0 && <a href="/bank-accounts" className="withdraw-inline-link">การจัดการบัญชีธนาคาร</a>}
          <FinanceActionBar><button type="submit" disabled={activeBanks.length === 0 || bonusBlocked} className="finance-button finance-button--primary">ถัดไป</button></FinanceActionBar>
        </FinanceCard></form>
      )}

      {step === 'amount' && (
        <form onSubmit={onGoConfirm}><FinanceCard title="ใส่ยอดถอน" description="ยอดถอนต้องมากกว่า 0 และไม่เกินยอดที่ถอนได้">
          <div className="finance-highlight"><em>ยอดที่ถอนได้</em><strong>{money(Number(wallet?.availableBalance ?? 0), currency)}</strong></div>
          <label className="finance-field">จำนวนเงิน<input value={amount} onChange={(event) => onAmountChange(event.target.value)} inputMode="decimal" autoComplete="off" placeholder="เช่น 100" /></label>
          <label className="finance-field">หมายเหตุ<textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" /></label>
          <FinanceActionBar><button type="button" onClick={() => onStepChange('account')} className="finance-button finance-button--secondary">ย้อนกลับ</button><button type="submit" disabled={bonusBlocked} className="finance-button finance-button--primary">ถัดไป</button></FinanceActionBar>
        </FinanceCard></form>
      )}

      {step === 'confirm' && (
        <FinanceCard title="ยืนยันคำขอถอน" description="ตรวจสอบข้อมูลให้ถูกต้องก่อนส่งคำขอ">
          <FinanceInfoRow label="ยอดถอน" value={money(Number.isFinite(parsedAmount) ? parsedAmount : 0, currency)} />
          <FinanceInfoRow label="ช่องทาง" value="โอนธนาคาร" />
          <FinanceInfoRow label="บัญชีธนาคาร" value={selectedBank ? `${selectedBank.bankName} / ${selectedBank.accountName} / ${maskAccount(selectedBank.accountNumber)}` : '-'} />
          {note && <FinanceInfoRow label="หมายเหตุ" value={note} />}
          <FinanceActionBar><button type="button" onClick={() => onStepChange('amount')} className="finance-button finance-button--secondary">แก้ไข</button><button type="button" onClick={onOpenConfirm} disabled={isSubmitting || bonusBlocked} className="finance-button finance-button--primary">{isSubmitting ? 'กำลังส่ง...' : 'ตรวจสอบก่อนส่ง'}</button></FinanceActionBar>
        </FinanceCard>
      )}

      {step === 'waiting' && <FinanceCard title="รอดำเนินการ" description="ระบบรับคำขอถอนแล้ว รอแอดมินตรวจสอบและดำเนินการ" tone="success"><div className="withdraw-success-message">คำขอถอนถูกส่งเรียบร้อยแล้ว</div><FinanceActionBar><a href="/transactions" className="finance-button finance-button--secondary">ดูประวัติ</a><button type="button" onClick={() => onStepChange('account')} className="finance-button finance-button--primary">ถอนอีกครั้ง</button></FinanceActionBar></FinanceCard>}

      <div className="withdraw-mobile-history">{history}</div>
      <FinanceConfirmDialog open={confirmOpen} title="ตรวจสอบคำขอถอน" description="เมื่อยืนยันแล้ว ระบบจะส่งคำขอให้แอดมินตรวจสอบ" onClose={onCloseConfirm} onConfirm={onSubmit} loading={isSubmitting} confirmLabel="ยืนยันถอนเงิน">
        <FinanceInfoRow label="ยอดถอน" value={money(Number.isFinite(parsedAmount) ? parsedAmount : 0, currency)} />
        <FinanceInfoRow label="ช่องทาง" value="โอนธนาคาร" />
        <FinanceInfoRow label="บัญชีธนาคาร" value={selectedBank ? `${selectedBank.bankName} / ${selectedBank.accountName} / ${maskAccount(selectedBank.accountNumber)}` : '-'} />
        {note && <FinanceInfoRow label="หมายเหตุ" value={note} />}
      </FinanceConfirmDialog>
    </FinanceFlowShell>
  );
}

function money(value: number, currency: string) { return `${currency} ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function maskAccount(value?: string | null) { if (!value) return '-'; const compact = value.replace(/\s/g, ''); return compact.length <= 4 ? compact : `••••••${compact.slice(-4)}`; }
