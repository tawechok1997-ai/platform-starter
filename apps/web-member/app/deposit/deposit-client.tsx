'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';
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
import type { DepositMethodCode, DepositStep, ReceivingAccount, TopUpItem } from '../types/member-finance';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];
const METHOD_CODES: DepositMethodCode[] = ['bank_transfer', 'promptpay', 'wallet', 'other'];
const METHODS: Record<DepositMethodCode, { label: string; numberLabel: string }> = {
  bank_transfer: { label: 'บัญชีธนาคาร', numberLabel: 'เลขบัญชี' },
  promptpay: { label: 'พร้อมเพย์', numberLabel: 'เบอร์พร้อมเพย์' },
  wallet: { label: 'วอเลต', numberLabel: 'วอเลต' },
  other: { label: 'อื่น ๆ', numberLabel: 'รายละเอียด' },
};
const STEPS = [
  { key: 'select', label: 'เลือกยอด' },
  { key: 'transfer', label: 'โอนและแนบสลิป' },
  { key: 'waiting', label: 'รอตรวจสอบ' },
];

export default function DepositClient() {
  const [step, setStep] = useState<DepositStep>('select');
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<DepositMethodCode>('bank_transfer');
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [history, setHistory] = useState<TopUpItem[]>([]);
  const [selected, setSelected] = useState<ReceivingAccount | null>(null);
  const [slipImageData, setSlipImageData] = useState('');
  const [slipImageName, setSlipImageName] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('กำลังโหลด...');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsedAmount = useMemo(() => Number(amount.replace(/,/g, '').trim()), [amount]);
  const usable = useMemo(() => accounts.filter((account) => matchAmount(account, parsedAmount)), [accounts, parsedAmount]);
  const availableMethods = useMemo(() => Array.from(new Set(usable.map(accountType))) as DepositMethodCode[], [usable]);

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => { if (availableMethods.length > 0 && !availableMethods.includes(method)) setMethod(availableMethods[0]); }, [availableMethods, method]);

  async function loadInitial() {
    setInitialLoading(true);
    const [historyRes, accountRes] = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/receiving-bank-accounts')]);
    const historyData = await historyRes.json().catch(() => null);
    const accountData = await accountRes.json().catch(() => null);
    if (historyRes.ok) setHistory(historyData.items ?? []);
    if (accountRes.ok) setAccounts(accountData.items ?? []);
    setMessage(!historyRes.ok || !accountRes.ok ? historyData?.message ?? accountData?.message ?? 'โหลดข้อมูลไม่สำเร็จ' : '');
    setInitialLoading(false);
  }

  async function copyText(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`คัดลอก${label}แล้ว`); }
    catch { setMessage(`คัดลอก${label}ไม่สำเร็จ`); }
  }

  async function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (availableMethods.length === 0) { setMessage('ยังไม่มีบัญชีธนาคารสำหรับยอดหรือช่องทางนี้'); return; }
    setLoading(true); setMessage('กำลังเตรียมข้อมูล...');
    const res = await memberApiFetch(`/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(parsedAmount))}`);
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok || !data?.item) { setMessage(data?.message ?? 'ยังไม่มีบัญชีธนาคารสำหรับช่องทางนี้'); return; }
    setSelected(data.item); setMessage(''); setStep('transfer');
  }

  async function uploadSlip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพ'); return; }
    setMessage('กำลังเตรียมรูปสลิป...');
    const imageData = await resizeImage(file, 900, 0.72);
    setSlipImageName(file.name); setSlipImageData(imageData); setMessage('แนบสลิปแล้ว ตรวจสอบข้อมูลก่อนส่งรายการ');
  }

  async function submit() {
    if (!selected || !slipImageData) { setMessage('ข้อมูลไม่ครบ กรุณาเลือกบัญชีและแนบสลิป'); return; }
    setConfirmOpen(false); setLoading(true); setMessage('กำลังอัปโหลดสลิป...');
    const slipRes = await memberApiFetch('/member/topups/slip', { method: 'POST', body: JSON.stringify({ slipImageData, slipImageName }) });
    const slipData = await slipRes.json().catch(() => null);
    if (!slipRes.ok) { setLoading(false); setMessage(slipData?.message ?? 'อัปโหลดสลิปไม่สำเร็จ'); return; }
    setMessage('กำลังส่งรายการ...');
    const proofNote = JSON.stringify({ userNote: note, slipImageName: slipData.slipImageName ?? slipImageName, slipFileId: slipData.slipFileId, storage: 'private', paymentType: method, receivingBankAccountId: selected.id, receivingBank: selected });
    const res = await memberApiFetch('/member/topups', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, note: proofNote }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งรายการไม่สำเร็จ'); return; }
    setHistory((current) => [data, ...current]); setSlipImageData(''); setSlipImageName(''); setNote(''); setMessage('ส่งรายการแล้ว'); setStep('waiting');
  }

  const aside = <FinanceCard title="รายการล่าสุด" description="สถานะคำขอฝากล่าสุดของคุณ">{history.slice(0, 5).map((item) => <FinanceInfoRow key={item.id} label={`${methodLabel(item.method)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`} value={`${item.currency} ${Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`} action={<FinanceStatusBadge status={item.status} />} />)}{history.length === 0 && <FinanceEmptyState title="ยังไม่มีรายการ" description="เมื่อส่งคำขอฝาก รายการล่าสุดจะแสดงที่นี่" />}</FinanceCard>;

  return <FinanceFlowShell title="ฝาก" description="เลือกยอด โอนเงิน และแนบสลิปให้ครบในขั้นตอนเดียว" aside={aside}>
    <FinanceStepIndicator current={step} steps={STEPS} />
    {message && <div className="member-ui-notice">{message}</div>}

    {step === 'select' && <form onSubmit={nextStep}><FinanceCard title="เลือกยอดและช่องทาง" description="ระบบจะแสดงเฉพาะช่องทางที่รองรับยอดนี้"><div className="finance-amount-grid">{AMOUNTS.map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))} className={`finance-amount-button${Number(amount) === value ? ' is-active' : ''}`}>฿{value.toLocaleString('th-TH')}</button>)}</div><label className="finance-field">จำนวนเงิน<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label><label className="finance-field">ช่องทาง<select value={method} onChange={(event) => setMethod(event.target.value as DepositMethodCode)} disabled={availableMethods.length === 0}>{METHOD_CODES.map((code) => <option key={code} value={code} disabled={!availableMethods.includes(code)}>{METHODS[code].label}{availableMethods.includes(code) ? '' : ' - ยังไม่เปิดใช้งาน'}</option>)}</select></label>{!initialLoading && accounts.length === 0 && <FinanceEmptyState title="ยังไม่มีบัญชีธนาคาร" description="ยังไม่มีช่องทางสำหรับรับฝากตอนนี้ กรุณาลองใหม่ภายหลัง" />}{!initialLoading && accounts.length > 0 && availableMethods.length === 0 && <FinanceEmptyState title="ไม่พบช่องทางที่รองรับยอดนี้" description="ลองเปลี่ยนยอดฝาก หรือเลือกยอดที่อยู่ในช่วงที่ระบบเปิดรับ" />}<FinanceActionBar><button type="submit" disabled={loading || availableMethods.length === 0} className="finance-button finance-button--primary">{loading ? 'กำลังเตรียม...' : 'ถัดไป'}</button></FinanceActionBar></FinanceCard></form>}

    {step === 'transfer' && selected && <FinanceCard title="โอนเงินและแนบสลิป" description="โอนยอดให้ตรงกับรายการ แล้วแนบสลิปก่อนส่งตรวจสอบ"><div className="finance-highlight"><span>ยอดฝาก</span><strong>฿{parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><em>{METHODS[method].label}</em></div><FinanceInfoRow label="ชื่อบัญชี" value={selected.accountName} /><FinanceInfoRow label={METHODS[method].numberLabel} value={selected.accountNumber} action={<button type="button" onClick={() => copyText(selected.accountNumber, METHODS[method].numberLabel)} className="finance-copy-button">คัดลอก</button>} />{selected.promptPay && <FinanceInfoRow label="พร้อมเพย์" value={selected.promptPay} action={<button type="button" onClick={() => copyText(selected.promptPay ?? '', 'พร้อมเพย์')} className="finance-copy-button">คัดลอก</button>} />}{selected.qrImageUrl && <img src={selected.qrImageUrl} alt="QR สำหรับชำระเงิน" className="finance-qr" />}<label className="finance-field">แนบสลิป<input type="file" accept="image/*" onChange={uploadSlip} /></label>{slipImageData && <div className="finance-slip-preview"><strong>ตัวอย่างสลิป</strong><img src={slipImageData} alt="สลิปที่แนบ" /></div>}<label className="finance-field">หมายเหตุ<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" /></label><FinanceActionBar><button type="button" onClick={() => setStep('select')} className="finance-button finance-button--secondary">ย้อนกลับ</button><button type="button" onClick={() => setConfirmOpen(true)} disabled={loading || !slipImageData} className="finance-button finance-button--primary">ตรวจสอบก่อนส่ง</button></FinanceActionBar></FinanceCard>}

    {step === 'waiting' && <FinanceCard title="รอตรวจสอบ" description="ระบบรับรายการแล้ว รอแอดมินตรวจสอบสลิปและปรับยอด" tone="success"><FinanceInfoRow label="สถานะ" value="ส่งคำขอฝากแล้ว" action={<FinanceStatusBadge status="PENDING" />} /><FinanceActionBar><a href="/transactions" className="finance-button finance-button--secondary">ดูประวัติ</a><button type="button" onClick={() => setStep('select')} className="finance-button finance-button--primary">ฝากอีกครั้ง</button></FinanceActionBar></FinanceCard>}

    <FinanceConfirmDialog open={confirmOpen && Boolean(selected)} title="ตรวจสอบรายการฝาก" description="ตรวจข้อมูลให้ถูกต้องก่อนส่งรายการ" onClose={() => setConfirmOpen(false)} onConfirm={submit} loading={loading} confirmLabel="ยืนยันส่งรายการ"><FinanceInfoRow label="ยอดฝาก" value={`THB ${parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`} /><FinanceInfoRow label="ช่องทาง" value={METHODS[method].label} />{selected && <FinanceInfoRow label="บัญชีธนาคาร" value={`${selected.accountName} / ${selected.accountNumber}`} />}{slipImageName && <FinanceInfoRow label="สลิป" value={slipImageName} />}{note && <FinanceInfoRow label="หมายเหตุ" value={note} />}</FinanceConfirmDialog>
  </FinanceFlowShell>;
}

function accountType(account: ReceivingAccount): DepositMethodCode { if (account.bankName === 'พร้อมเพย์') return 'promptpay'; if (account.bankName === 'วอเลต') return 'wallet'; if (account.bankName === 'อื่น ๆ') return 'other'; return 'bank_transfer'; }
function matchAmount(account: ReceivingAccount, amount: number) { const min = account.minAmount ? Number(account.minAmount) : 0; const max = account.maxAmount ? Number(account.maxAmount) : Infinity; if (!Number.isFinite(amount) || amount <= 0) return true; return amount >= min && amount <= max; }
function methodLabel(value?: string | null) { if (value === 'bank_transfer') return 'บัญชีธนาคาร'; if (value === 'promptpay') return 'พร้อมเพย์'; if (value === 'wallet') return 'วอเลต'; return value || '-'; }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('อ่านรูปไม่ได้')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('อ่านรูปไม่ได้')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('อ่านรูปไม่ได้')); reader.readAsDataURL(file); }); }
