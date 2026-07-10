'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';

type WalletResponse = { currency: string; availableBalance: string; lockedBalance: string; status: string };
type WithdrawalItem = { id: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };
type BankItem = { id: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string };
type BonusLedger = { id: string; campaignId: string; campaign?: { title?: string }; amount: number; currency: string; turnoverRequired: number; turnoverProgress: number; turnoverCompleted: boolean; status: string; walletCreditStatus?: string };
type WithdrawStep = 'account' | 'amount' | 'confirm' | 'waiting';

export default function WithdrawPage() {
  const [step, setStep] = useState<WithdrawStep>('account');
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [bonusLedgers, setBonusLedgers] = useState<BonusLedger[]>([]);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setIsLoading(true);
    const [walletRes, listRes, bankRes, bonusRes] = await Promise.all([memberApiFetch('/member/wallet'), memberApiFetch('/member/withdrawals'), memberApiFetch('/member/bank-accounts'), memberApiFetch('/member/bonus-ledgers')]);
    const walletData = await walletRes.json().catch(() => null);
    const listData = await listRes.json().catch(() => null);
    const bankData = await bankRes.json().catch(() => null);
    const bonusData = await bonusRes.json().catch(() => null);
    if (walletRes.ok) setWallet(walletData);
    if (listRes.ok) setItems(listData.items ?? []);
    if (bonusRes.ok) setBonusLedgers(bonusData.items ?? []);
    if (bankRes.ok) {
      const nextBanks = bankData.items ?? [];
      setBanks(nextBanks);
      const primary = nextBanks.find((item: BankItem) => item.isPrimary && item.status === 'ACTIVE') ?? nextBanks.find((item: BankItem) => item.status === 'ACTIVE');
      if (primary && !bankAccountId) chooseBank(primary.id, nextBanks);
    }
    if (!walletRes.ok || !listRes.ok || !bankRes.ok) setMessage(walletData?.message ?? listData?.message ?? bankData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    setIsLoading(false);
  }

  function chooseBank(id: string, source = banks) {
    setBankAccountId(id);
    const selected = source.find((item) => item.id === id);
    if (!selected) { setBankName(''); setAccountName(''); setAccountNumber(''); return; }
    setBankName(selected.bankName);
    setAccountName(selected.accountName);
    setAccountNumber(selected.accountNumber);
  }

  function goAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bonusBlock.blocked) { setMessage(bonusBlock.message); return; }
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!selected) { setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว'); return; }
    setMessage('');
    setStep('amount');
  }

  function goConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bonusBlock.blocked) { setMessage(bonusBlock.message); return; }
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    const available = wallet ? Number(wallet.availableBalance) : 0;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (wallet && parsedAmount > available) { setMessage('ยอดถอนมากกว่ายอดที่ถอนได้'); return; }
    setMessage('');
    setStep('confirm');
  }

  function openConfirmModal() {
    if (bonusBlock.blocked) { setMessage(bonusBlock.message); return; }
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!selected) { setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว'); return; }
    setConfirmOpen(true);
  }

  async function submit() {
    if (bonusBlock.blocked) { setConfirmOpen(false); setMessage(bonusBlock.message); return; }
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (!selected) { setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว'); return; }
    setConfirmOpen(false);
    setIsSubmitting(true); setMessage('กำลังส่งคำขอถอน...');
    const res = await memberApiFetch('/member/withdrawals', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, accountName: selected.accountName, accountNumber: selected.accountNumber, bankName: selected.bankName, note }) });
    const data = await res.json().catch(() => null); setIsSubmitting(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ'); await loadAll(); return; }
    setAmount(''); setNote(''); setItems((current) => [data, ...current]); setMessage('ส่งคำขอถอนสำเร็จ'); setStep('waiting'); await loadAll();
  }

  const activeBanks = useMemo(() => banks.filter((item) => item.status === 'ACTIVE'), [banks]);
  const activeBonusLedgers = useMemo(() => bonusLedgers.filter((item) => !item.turnoverCompleted && ['ACTIVE', 'REVIEWING', 'PENDING'].includes(item.status)), [bonusLedgers]);
  const bonusBlock = useMemo(() => buildBonusBlock(activeBonusLedgers), [activeBonusLedgers]);
  const hasSelectedBank = Boolean(bankName && accountName && accountNumber);
  const parsedAmount = Number(amount.replace(/,/g, '').trim());
  const availableText = wallet ? `${wallet.currency} ${Number(wallet.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 'THB 0.00';

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a>
      <section style={heroCardStyle}><p style={mutedStyle}>ยอดที่ถอนได้</p><h1 style={amountTitleStyle}>{availableText}</h1>{wallet && <div style={walletMetaStyle}><span>รอดำเนินการ: {Number(wallet.lockedBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span><span>{wallet.status === 'ACTIVE' ? 'ใช้งานได้' : wallet.status}</span></div>}</section>
      <h1 style={titleStyle}>ถอนเงิน</h1>
      {isLoading && <div style={noticeStyle}>กำลังโหลด...</div>}
      {bonusBlock.blocked && <section style={bonusBlockStyle}><strong>ยังถอนเงินไม่ได้ เพราะติดเงื่อนไขโบนัส</strong><span>{bonusBlock.message}</span><div style={bonusGridStyle}>{activeBonusLedgers.slice(0, 3).map((item) => <div key={item.id} style={bonusItemStyle}><strong>{item.campaign?.title ?? item.campaignId}</strong><span>ทำเทิร์นแล้ว {money(item.turnoverProgress)} / {money(item.turnoverRequired)}</span><span>คงเหลือ {money(Math.max(item.turnoverRequired - item.turnoverProgress, 0))}</span></div>)}</div><a href="/bonus" style={bonusLinkStyle}>ดูรายละเอียดโบนัส</a></section>}
      {message && <div style={noticeStyle}>{message}</div>}

      {step === 'account' && (
        <form onSubmit={goAmount} style={cardStyle}>
          <div style={cardHeaderStyle}><h2 style={sectionTitleStyle}>เลือกบัญชี</h2><p style={mutedStyle}>เลือกบัญชีธนาคารปลายทางที่อนุมัติแล้วสำหรับรับเงินถอน</p></div>
          <label style={labelStyle}>ช่องทาง<select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}><option value="bank_transfer">โอนธนาคาร</option></select></label>
          <label style={labelStyle}>บัญชีธนาคาร<select value={bankAccountId} onChange={(e) => chooseBank(e.target.value)} style={inputStyle}><option value="">เลือกบัญชี</option>{banks.map((item) => <option key={item.id} value={item.id} disabled={item.status !== 'ACTIVE'}>{item.bankName} / {item.accountNumber} {item.isPrimary ? '(หลัก)' : ''} {item.status !== 'ACTIVE' ? `- ${item.status}` : ''}</option>)}</select></label>
          {!isLoading && activeBanks.length === 0 && <EmptyAction title="ยังไม่มีบัญชีธนาคารที่ใช้ถอนได้" description="เพิ่มบัญชีธนาคารแล้วรออนุมัติก่อนส่งคำขอถอน" actionHref="/bank-accounts" actionLabel="การจัดการบัญชีธนาคาร" />}
          {activeBanks.length > 0 && <a href="/bank-accounts" style={bankLinkStyle}>การจัดการบัญชีธนาคาร</a>}
          <button type="submit" disabled={activeBanks.length === 0 || bonusBlock.blocked} style={bonusBlock.blocked ? disabledButtonStyle : buttonStyle}>ถัดไป</button>
        </form>
      )}

      {step === 'amount' && (
        <form onSubmit={goConfirm} style={cardStyle}>
          <div style={cardHeaderStyle}><h2 style={sectionTitleStyle}>ใส่ยอดถอน</h2><p style={mutedStyle}>ยอดถอนต้องไม่เกินยอดที่ถอนได้</p></div>
          <label style={labelStyle}>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="เช่น 100" style={inputStyle} /></label>
          <label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={textareaStyle} /></label>
          <div style={actionRowStyle}><button type="button" onClick={() => setStep('account')} style={secondaryButtonStyle}>ย้อนกลับ</button><button type="submit" disabled={bonusBlock.blocked} style={bonusBlock.blocked ? disabledButtonStyle : buttonStyle}>ถัดไป</button></div>
        </form>
      )}

      {step === 'confirm' && (
        <section style={cardStyle}>
          <div style={cardHeaderStyle}><h2 style={sectionTitleStyle}>ยืนยันคำขอถอน</h2><p style={mutedStyle}>ตรวจสอบข้อมูลให้ถูกต้องก่อนส่งคำขอ</p></div>
          <section style={confirmBoxStyle}><span>ยอดถอน</span><strong>THB {Number.isFinite(parsedAmount) ? parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}</strong></section>
          {hasSelectedBank && <section style={confirmBoxStyle}><span>บัญชีธนาคาร</span><strong>{bankName} / {accountName} / {accountNumber}</strong></section>}
          {note && <div style={noticeStyle}>หมายเหตุ: {note}</div>}
          <div style={actionRowStyle}><button type="button" onClick={() => setStep('amount')} style={secondaryButtonStyle}>แก้ไข</button><button type="button" onClick={openConfirmModal} disabled={isSubmitting || bonusBlock.blocked} style={bonusBlock.blocked ? disabledButtonStyle : buttonStyle}>{isSubmitting ? 'กำลังส่ง...' : 'ตรวจสอบก่อนส่ง'}</button></div>
        </section>
      )}

      {step === 'waiting' && (
        <section style={cardStyle}>
          <div style={cardHeaderStyle}><h2 style={sectionTitleStyle}>รอดำเนินการ</h2><p style={mutedStyle}>ระบบรับคำขอถอนแล้ว รอแอดมินตรวจสอบและดำเนินการ</p></div>
          <div style={successBoxStyle}>คำขอถอนถูกส่งแล้ว</div>
          <div style={actionRowStyle}><a href="/transactions" style={secondaryLinkStyle}>ดูประวัติ</a><button type="button" onClick={() => setStep('account')} style={buttonStyle}>ถอนอีกครั้ง</button></div>
        </section>
      )}

      {confirmOpen && <SummaryModal title="ตรวจสอบคำขอถอน" onClose={() => setConfirmOpen(false)} onConfirm={submit} loading={isSubmitting} confirmLabel="ยืนยันถอนเงิน">
        <InfoRow label="ยอดถอน" value={`THB ${Number.isFinite(parsedAmount) ? parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}`} />
        <InfoRow label="ช่องทาง" value="โอนธนาคาร" />
        <InfoRow label="บัญชีธนาคาร" value={`${bankName} / ${accountName} / ${accountNumber}`} />
        {note && <InfoRow label="หมายเหตุ" value={note} />}
      </SummaryModal>}

      <section style={historySectionStyle}>
        <h2 style={sectionTitleStyle}>ประวัติถอนเงิน</h2>
        <div style={listStyle}>{items.map((item) => <section key={item.id} style={historyCardStyle}><div style={historyTopStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><span style={statusBadgeStyle(item.status)}>{statusLabel(item.status)}</span></div><p style={mutedStyle}>บัญชี: {item.bankName || '-'} / {item.accountNumber || '-'}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.adminNote && <p style={mutedStyle}>หมายเหตุ: {item.adminNote}</p>}</section>)}{items.length === 0 && <EmptyAction title="ยังไม่มีรายการถอน" description="เมื่อส่งคำขอถอน รายการจะแสดงตรงนี้" actionHref="/withdraw" actionLabel="ถอนเงิน" />}</div>
      </section>
    </main>
  );
}

function buildBonusBlock(items: BonusLedger[]) { const remaining = items.reduce((sum, item) => sum + Math.max(Number(item.turnoverRequired || 0) - Number(item.turnoverProgress || 0), 0), 0); return { blocked: remaining > 0, remaining, message: remaining > 0 ? `ต้องทำเทิร์นโบนัสคงเหลือ ${money(remaining)} ก่อนจึงจะส่งคำขอถอนได้` : '' }; }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div style={infoRowStyle}><div style={{ minWidth: 0 }}><span>{label}</span><strong>{value}</strong></div></div>; }
function EmptyAction({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref: string; actionLabel: string }) { return <div style={emptyStyle}><div><strong>{title}</strong><span>{description}</span></div><a href={actionHref}>{actionLabel}</a></div>; }
function SummaryModal({ title, children, onClose, onConfirm, loading, confirmLabel }: { title: string; children: React.ReactNode; onClose: () => void; onConfirm: () => void; loading: boolean; confirmLabel: string }) { return <div style={modalBackdropStyle}><section style={modalStyle}><div style={modalHeadStyle}><h2 style={sectionTitleStyle}>{title}</h2><button type="button" onClick={onClose} style={closeButtonStyle}>×</button></div>{children}<div style={actionRowStyle}><button type="button" onClick={onClose} style={secondaryButtonStyle}>แก้ไข</button><button type="button" onClick={onConfirm} disabled={loading} style={buttonStyle}>{loading ? 'กำลังส่ง...' : confirmLabel}</button></div></section></div>; }
function statusLabel(status: string) { if (status === 'PENDING') return 'รอดำเนินการ'; if (status === 'APPROVED' || status === 'COMPLETED') return 'สำเร็จ'; if (status === 'REJECTED') return 'ไม่อนุมัติ'; return status; }

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '18px 12px calc(120px + env(safe-area-inset-bottom))', display: 'grid', gap: 14, width: '100%', maxWidth: 920, margin: '0 auto', overflowX: 'hidden' as const } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(34px, 11vw, 58px)', lineHeight: 0.98, letterSpacing: -1.2, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const };
const heroCardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 14, background: '#181818', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const walletMetaStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8, color: 'rgba(255,255,255,.72)' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const cardHeaderStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const amountTitleStyle = { margin: '4px 0', fontSize: 'clamp(30px, 9vw, 50px)', lineHeight: 1, overflowWrap: 'anywhere' as const, color: '#f5c542' };
const sectionTitleStyle = { margin: 0, fontSize: 'clamp(24px, 7vw, 34px)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', marginTop: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' as const, fontSize: 16 };
const textareaStyle = { ...inputStyle, minHeight: 96, resize: 'vertical' as const };
const buttonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900, width: '100%', textDecoration: 'none', display: 'grid', placeItems: 'center' } as const;
const disabledButtonStyle = { ...buttonStyle, opacity: .48, cursor: 'not-allowed' } as const;
const secondaryButtonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)', fontWeight: 900, width: '100%' } as const;
const secondaryLinkStyle = { ...secondaryButtonStyle, textDecoration: 'none', display: 'grid', placeItems: 'center' } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', overflowWrap: 'anywhere' as const };
const bonusBlockStyle = { border: '1px solid rgba(245,197,66,.30)', borderRadius: 20, padding: 14, background: 'rgba(245,197,66,.10)', display: 'grid', gap: 10, overflowWrap: 'anywhere' as const };
const bonusGridStyle = { display: 'grid', gap: 8 } as const;
const bonusItemStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.05)', display: 'grid', gap: 4 } as const;
const bonusLinkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const emptyStyle = { border: '1px dashed rgba(255,255,255,.18)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, color: 'rgba(255,255,255,.82)' };
const bankLinkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const confirmBoxStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 22, padding: 14, background: 'rgba(245,197,66,.10)', display: 'grid', gap: 5, minWidth: 0 } as const;
const successBoxStyle = { border: '1px solid rgba(101,217,139,.30)', borderRadius: 18, padding: 14, background: 'rgba(101,217,139,.10)', color: '#a9ffc4', fontWeight: 950 } as const;
const infoRowStyle = { display: 'grid', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', overflowWrap: 'anywhere' as const };
const listStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const historySectionStyle = { display: 'grid', gap: 10, minWidth: 0 } as const;
const historyCardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 14, background: '#151515', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const historyTopStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 8, alignItems: 'center' } as const;
const modalBackdropStyle = { position: 'fixed' as const, inset: 0, zIndex: 90, background: 'rgba(0,0,0,.68)', display: 'grid', placeItems: 'end center', padding: 12 };
const modalStyle = { width: '100%', maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto' as const, border: '1px solid rgba(255,255,255,.14)', borderRadius: 26, padding: 16, background: '#151515', color: '#fff', display: 'grid', gap: 12, boxShadow: '0 24px 90px rgba(0,0,0,.55)' };
const modalHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } as const;
const closeButtonStyle = { width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 24, cursor: 'pointer' } as const;
function statusBadgeStyle(status: string) { return { width: 'fit-content', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 10px', background: status === 'COMPLETED' || status === 'APPROVED' ? 'rgba(34,197,94,.14)' : status === 'REJECTED' ? 'rgba(239,68,68,.14)' : 'rgba(245,197,66,.14)', color: status === 'COMPLETED' || status === 'APPROVED' ? '#bbf7d0' : status === 'REJECTED' ? '#fecaca' : '#fde68a', fontSize: 12, fontWeight: 900 }; }
