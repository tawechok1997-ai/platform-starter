'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ReceivingAccount = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; status: string; sortOrder: number };
type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string; adminNote?: string | null; user?: { username: string; phone?: string | null; email?: string | null; status: string } };
type PaymentType = 'bank' | 'promptpay' | 'wallet' | 'other';

const THAI_BANKS = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน', 'ธนาคารอาคารสงเคราะห์', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'ธนาคารยูโอบี', 'ธนาคารซีไอเอ็มบีไทย', 'ธนาคารเกียรตินาคินภัทร', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'ธนาคารไอซีบีซี ไทย', 'ธนาคารไทยเครดิต'];
const PAYMENT_TYPES = [{ value: 'bank', label: 'บัญชีธนาคาร' }, { value: 'promptpay', label: 'พร้อมเพย์' }, { value: 'wallet', label: 'วอเลต' }, { value: 'other', label: 'อื่น ๆ' }] as const;
const blankReceiving = { bankName: THAI_BANKS[0], accountName: '', accountNumber: '', promptPay: '', qrImageUrl: '', minAmount: '', maxAmount: '', status: 'ACTIVE', sortOrder: 100 };

export default function BankAccountsPage() {
  const [receiving, setReceiving] = useState<ReceivingAccount[]>([]);
  const [memberBanks, setMemberBanks] = useState<MemberBank[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>('bank');
  const [form, setForm] = useState(blankReceiving);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const typeLabel = useMemo(() => PAYMENT_TYPES.find((item) => item.value === paymentType)?.label ?? 'บัญชีธนาคาร', [paymentType]);
  const accountNumberLabel = paymentType === 'bank' ? 'เลขบัญชี' : paymentType === 'promptpay' ? 'เบอร์พร้อมเพย์' : paymentType === 'wallet' ? 'วอเลต' : 'รายละเอียด';
  const accountNumberPlaceholder = paymentType === 'bank' ? 'เลขบัญชีธนาคาร' : paymentType === 'promptpay' ? 'เบอร์โทร / เลขพร้อมเพย์' : paymentType === 'wallet' ? 'เบอร์วอเลต / เลขวอเลต' : 'รายละเอียดช่องทางรับเงิน';

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setMessage('กำลังโหลดบัญชีรับเงิน...');
    const [receivingRes, memberRes, meRes] = await Promise.all([adminApiFetch('/admin/receiving-bank-accounts'), adminApiFetch('/admin/member-bank-accounts'), adminApiFetch('/admin/auth/me')]);
    const receivingData = await receivingRes.json().catch(() => null);
    const memberData = await memberRes.json().catch(() => null);
    const meData = await meRes.json().catch(() => null);
    if (!receivingRes.ok || !memberRes.ok) { setMessage(receivingData?.message ?? memberData?.message ?? 'โหลดข้อมูลไม่สำเร็จ'); return; }
    setPermissions(Array.isArray(meData?.permissions) ? meData.permissions : []);
    setReceiving(receivingData.items ?? []);
    setMemberBanks(memberData.items ?? []);
    setMessage('');
  }

  async function saveReceiving(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) { setMessage('คุณไม่มีสิทธิ์จัดการบัญชีรับเงิน'); return; }
    const payload = normalizeReceivingPayload();
    if (!payload.accountName.trim() || !payload.accountNumber.trim() || !payload.bankName.trim()) { setMessage('กรอกข้อมูลบัญชีรับเงินให้ครบก่อน'); return; }
    setMessage('กำลังบันทึกบัญชีรับเงิน...');
    const res = await adminApiFetch('/admin/receiving-bank-accounts', { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึกไม่สำเร็จ'); return; }
    setReceiving((current) => [data.item, ...current]);
    setPaymentType('bank'); setForm(blankReceiving);
    setMessage('เพิ่มบัญชีรับเงินแล้ว');
  }

  function normalizeReceivingPayload() {
    const base = { ...form, sortOrder: 100, minAmount: form.minAmount || null, maxAmount: form.maxAmount || null };
    if (paymentType === 'promptpay') return { ...base, bankName: 'พร้อมเพย์', accountNumber: form.accountNumber || form.promptPay, promptPay: form.accountNumber || form.promptPay };
    if (paymentType === 'wallet') return { ...base, bankName: 'วอเลต', promptPay: '' };
    if (paymentType === 'other') return { ...base, bankName: 'อื่น ๆ', promptPay: '' };
    return { ...base, promptPay: '' };
  }

  function changePaymentType(value: PaymentType) {
    setPaymentType(value);
    setForm((current) => ({ ...current, bankName: value === 'bank' ? THAI_BANKS[0] : value === 'promptpay' ? 'พร้อมเพย์' : value === 'wallet' ? 'วอเลต' : 'อื่น ๆ', accountNumber: '', promptPay: '' }));
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพ QR Code'); return; }
    const dataUrl = await resizeImage(file, 720, 0.82);
    setForm((current) => ({ ...current, qrImageUrl: dataUrl }));
    setMessage('อัปโหลด QR Code แล้ว');
  }

  async function setReceivingStatus(item: ReceivingAccount, status: string) {
    if (!canManage) { setMessage('คุณไม่มีสิทธิ์จัดการบัญชีรับเงิน'); return; }
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/receiving-bank-accounts/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตไม่สำเร็จ'); return; }
    setReceiving((current) => current.map((row) => row.id === item.id ? data.item : row));
  }

  async function reviewMemberBank(item: MemberBank, status: string) {
    if (!canReview) { setMessage('คุณไม่มีสิทธิ์ตรวจสอบบัญชีธนาคารสมาชิก'); return; }
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/member-bank-accounts/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ตรวจบัญชีไม่สำเร็จ'); return; }
    setMemberBanks((current) => current.map((row) => row.id === item.id ? { ...row, ...data.item } : row));
  }

  const canView = permissions.includes('*') || permissions.includes('bank_accounts.view');
  const canManage = permissions.includes('*') || permissions.includes('bank_accounts.manage');
  const canReview = permissions.includes('*') || permissions.includes('bank_accounts.review');

  return (
    <AdminPage eyebrow="Bank Operations" title="Bank Accounts" description="เพิ่มบัญชีรับเงินหลายช่องทาง ระบบจะสลับบัญชีเองเมื่อมีหลายบัญชี" actions={<AdminButton onClick={loadAll}>Refresh</AdminButton>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminGrid>
        {canManage && <AdminCard title={`เพิ่ม${typeLabel}`} description={paymentType === 'bank' ? 'กรอกบัญชีธนาคารรับเงิน' : paymentType === 'promptpay' ? 'กรอกเบอร์พร้อมเพย์หรือเลขพร้อมเพย์' : paymentType === 'wallet' ? 'กรอกข้อมูลวอเลต' : 'กรอกช่องทางรับเงินอื่น ๆ'}>
          <form onSubmit={saveReceiving}><AdminToolbar>
            <label style={labelStyle}>ประเภทรับเงิน<select value={paymentType} onChange={(e) => changePaymentType(e.target.value as PaymentType)}>{PAYMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            {paymentType === 'bank' && <label style={labelStyle}>ธนาคาร<select value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}>{THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>}
            <label style={labelStyle}>ชื่อบัญชี<input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="ชื่อบัญชี" /></label>
            <label style={labelStyle}>{accountNumberLabel}<input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value, promptPay: paymentType === 'promptpay' ? e.target.value : form.promptPay })} placeholder={accountNumberPlaceholder} /></label>
            <label style={labelStyle}>Min amount<input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="min amount" /></label>
            <label style={labelStyle}>Max amount<input value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="max amount" /></label>
            <label style={labelStyle}>อัปโหลด QR Code<input type="file" accept="image/*" onChange={handleQrUpload} /></label>
            {form.qrImageUrl && <img src={form.qrImageUrl} alt="QR preview" style={qrPreviewStyle} />}
            <AdminButton type="submit">Add Account</AdminButton>
          </AdminToolbar></form>
        </AdminCard>}
        <AdminCard title="Receiving Accounts"><AdminStack>{receiving.map((item) => <AdminRow key={item.id}><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'danger'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{labelForAccount(item)}</h2><p>ชื่อบัญชี: {item.accountName}</p><p>{numberLabelForAccount(item)}: {item.accountNumber}</p>{item.promptPay && <p>PromptPay: {item.promptPay}</p>}<p>Limit: {item.minAmount ?? '-'} - {item.maxAmount ?? '-'}</p>{item.qrImageUrl && <img src={item.qrImageUrl} alt="QR" style={qrPreviewStyle} />}</div>{canManage && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="success" disabled={busyId === item.id} onClick={() => setReceivingStatus(item, 'ACTIVE')}>Enable</AdminButton><AdminButton tone="danger" disabled={busyId === item.id} onClick={() => setReceivingStatus(item, 'DISABLED')}>Disable</AdminButton></div>}{receiving.length === 0 && <AdminEmpty>ยังไม่มีบัญชีรับเงิน</AdminEmpty>}</AdminStack></AdminCard>
      </AdminGrid>
      <AdminCard title="Member Withdrawal Bank Review" description="สมาชิก 1 คนเพิ่มบัญชีถอนได้ 1 บัญชี และชื่อบัญชีต้องตรงกับชื่อสมาชิก"><AdminStack>{memberBanks.map((item) => <AdminRow key={item.id}><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.bankName}</h2><p>{item.accountName} / {item.accountNumber}</p><p>Member: {item.user?.username ?? item.userId}</p><p>Primary: {item.isPrimary ? 'YES' : 'NO'}</p></div>{canReview && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="success" disabled={busyId === item.id} onClick={() => reviewMemberBank(item, 'ACTIVE')}>Approve</AdminButton><AdminButton tone="danger" disabled={busyId === item.id} onClick={() => reviewMemberBank(item, 'REJECTED')}>Reject</AdminButton></div>}{memberBanks.length === 0 && <AdminEmpty>ยังไม่มีบัญชีถอนของสมาชิก</AdminEmpty>}</AdminStack></AdminCard>
    </AdminPage>
  );
}

function labelForAccount(item: ReceivingAccount) { if (item.bankName === 'พร้อมเพย์') return 'พร้อมเพย์'; if (item.bankName === 'วอเลต') return 'วอเลต'; if (item.bankName === 'อื่น ๆ') return 'อื่น ๆ'; return `บัญชีธนาคาร · ${item.bankName}`; }
function numberLabelForAccount(item: ReceivingAccount) { if (item.bankName === 'พร้อมเพย์') return 'เบอร์พร้อมเพย์'; if (item.bankName === 'วอเลต') return 'วอเลต'; if (item.bankName === 'อื่น ๆ') return 'รายละเอียด'; return 'เลขบัญชี'; }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('อ่านรูปไม่ได้')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('อ่านรูปไม่ได้')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('อ่านรูปไม่ได้')); reader.readAsDataURL(file); }); }
const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const qrPreviewStyle = { width: 150, height: 150, objectFit: 'cover' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)' } as const;
