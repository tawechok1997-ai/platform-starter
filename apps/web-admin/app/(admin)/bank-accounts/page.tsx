'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type ReceivingAccount = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; status: string; sortOrder: number };
type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string; adminNote?: string | null; user?: { username: string; phone?: string | null; email?: string | null; status: string } };
type PaymentType = 'bank' | 'promptpay' | 'wallet' | 'other';
type ReviewIntent = { item: MemberBank; status: 'ACTIVE' | 'REJECTED' } | null;

type Copy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; receivingTitle: string; memberTitle: string; memberDescription: string;
  paymentTypes: Record<PaymentType, string>; bank: string; accountName: string; accountNumber: string; promptPayNumber: string; walletNumber: string; details: string;
  minAmount: string; maxAmount: string; uploadQr: string; addAccount: string; enable: string; disable: string; approve: string; reject: string; member: string; primary: string;
  noReceiving: string; noMember: string; duplicate: string; limit: string; permissionManage: string; permissionReview: string; required: string; invalidImage: string;
  qrUploaded: string; loadFailed: string; saveFailed: string; saved: string; updateFailed: string; reviewFailed: string; rejectReason: string;
  approveTitle: string; rejectTitle: string; approveDescription: string; rejectDescription: string; confirmApprove: string; confirmReject: string; reason: string;
};

const copyByLocale: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'การเงิน', title: 'บัญชีธนาคาร', description: 'จัดการบัญชีรับเงินและตรวจบัญชีถอนของสมาชิก', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', receivingTitle: 'บัญชีรับเงิน', memberTitle: 'ตรวจบัญชีถอนสมาชิก', memberDescription: 'สมาชิกหนึ่งคนเพิ่มบัญชีถอนได้หนึ่งบัญชี และชื่อบัญชีต้องตรงกับชื่อสมาชิก',
    paymentTypes: { bank: 'บัญชีธนาคาร', promptpay: 'พร้อมเพย์', wallet: 'วอเลต', other: 'อื่น ๆ' }, bank: 'ธนาคาร', accountName: 'ชื่อบัญชี', accountNumber: 'เลขบัญชี', promptPayNumber: 'เบอร์พร้อมเพย์', walletNumber: 'เลขวอเลต', details: 'รายละเอียด',
    minAmount: 'ยอดขั้นต่ำ', maxAmount: 'ยอดสูงสุด', uploadQr: 'อัปโหลด QR Code', addAccount: 'เพิ่มบัญชี', enable: 'เปิดใช้งาน', disable: 'ปิดใช้งาน', approve: 'อนุมัติ', reject: 'ปฏิเสธ', member: 'สมาชิก', primary: 'บัญชีหลัก',
    noReceiving: 'ยังไม่มีบัญชีรับเงิน', noMember: 'ยังไม่มีบัญชีถอนของสมาชิก', duplicate: 'บัญชีซ้ำ', limit: 'ขีดจำกัด', permissionManage: 'คุณไม่มีสิทธิ์จัดการบัญชีรับเงิน', permissionReview: 'คุณไม่มีสิทธิ์ตรวจสอบบัญชีธนาคารสมาชิก', required: 'กรอกข้อมูลบัญชีรับเงินให้ครบก่อน', invalidImage: 'กรุณาเลือกไฟล์รูปภาพ QR Code',
    qrUploaded: 'อัปโหลด QR Code แล้ว', loadFailed: 'โหลดข้อมูลบัญชีไม่สำเร็จ', saveFailed: 'บันทึกบัญชีรับเงินไม่สำเร็จ', saved: 'เพิ่มบัญชีรับเงินแล้ว', updateFailed: 'อัปเดตบัญชีรับเงินไม่สำเร็จ', reviewFailed: 'ตรวจบัญชีธนาคารไม่สำเร็จ', rejectReason: 'ระบุเหตุผลปฏิเสธอย่างน้อย 5 ตัวอักษร',
    approveTitle: 'อนุมัติบัญชีถอน', rejectTitle: 'ปฏิเสธบัญชีถอน', approveDescription: 'ตรวจสอบชื่อบัญชีและความเสี่ยงก่อนอนุมัติ', rejectDescription: 'การปฏิเสธต้องระบุเหตุผลเพื่อเก็บใน audit log', confirmApprove: 'ยืนยันอนุมัติ', confirmReject: 'ยืนยันปฏิเสธ', reason: 'เหตุผล',
  },
  en: {
    eyebrow: 'Finance', title: 'Bank accounts', description: 'Manage receiving accounts and review member withdrawal accounts', refresh: 'Refresh', loading: 'Loading...', receivingTitle: 'Receiving accounts', memberTitle: 'Member withdrawal bank review', memberDescription: 'Each member may add one withdrawal account and the account name must match the member name',
    paymentTypes: { bank: 'Bank account', promptpay: 'PromptPay', wallet: 'Wallet', other: 'Other' }, bank: 'Bank', accountName: 'Account name', accountNumber: 'Account number', promptPayNumber: 'PromptPay number', walletNumber: 'Wallet number', details: 'Details',
    minAmount: 'Minimum amount', maxAmount: 'Maximum amount', uploadQr: 'Upload QR code', addAccount: 'Add account', enable: 'Enable', disable: 'Disable', approve: 'Approve', reject: 'Reject', member: 'Member', primary: 'Primary',
    noReceiving: 'No receiving accounts', noMember: 'No member withdrawal accounts', duplicate: 'Duplicate account', limit: 'Limit', permissionManage: 'You do not have permission to manage receiving accounts', permissionReview: 'You do not have permission to review member bank accounts', required: 'Complete all required receiving-account fields', invalidImage: 'Select a QR code image',
    qrUploaded: 'QR code uploaded', loadFailed: 'Unable to load bank-account data', saveFailed: 'Unable to save the receiving account', saved: 'Receiving account added', updateFailed: 'Unable to update the receiving account', reviewFailed: 'Unable to review the bank account', rejectReason: 'Enter a rejection reason of at least 5 characters',
    approveTitle: 'Approve withdrawal account', rejectTitle: 'Reject withdrawal account', approveDescription: 'Verify the account name and risk before approval', rejectDescription: 'A rejection reason is required for the audit log', confirmApprove: 'Confirm approval', confirmReject: 'Confirm rejection', reason: 'Reason',
  },
};

const THAI_BANKS = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน', 'ธนาคารอาคารสงเคราะห์', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'ธนาคารยูโอบี', 'ธนาคารซีไอเอ็มบีไทย', 'ธนาคารเกียรตินาคินภัทร', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'ธนาคารไอซีบีซี ไทย', 'ธนาคารไทยเครดิต'];
const DEFAULT_THAI_BANK = THAI_BANKS[0] ?? 'ธนาคารกสิกรไทย';
const blankReceiving = { bankName: DEFAULT_THAI_BANK, accountName: '', accountNumber: '', promptPay: '', qrImageUrl: '', minAmount: '', maxAmount: '', status: 'ACTIVE', sortOrder: 100 };

export default function BankAccountsPage() {
  const [locale] = useAdminLocale();
  const copy = copyByLocale[locale];
  const [receiving, setReceiving] = useState<ReceivingAccount[]>([]);
  const [memberBanks, setMemberBanks] = useState<MemberBank[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>('bank');
  const [form, setForm] = useState(blankReceiving);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [duplicateAccountIds, setDuplicateAccountIds] = useState<string[]>([]);
  const [reviewIntent, setReviewIntent] = useState<ReviewIntent>(null);
  const [reviewReason, setReviewReason] = useState('');

  const paymentTypes = useMemo(() => (Object.keys(copy.paymentTypes) as PaymentType[]).map((value) => ({ value, label: copy.paymentTypes[value] })), [copy]);
  const typeLabel = copy.paymentTypes[paymentType];
  const accountNumberLabel = paymentType === 'bank' ? copy.accountNumber : paymentType === 'promptpay' ? copy.promptPayNumber : paymentType === 'wallet' ? copy.walletNumber : copy.details;
  const canManage = permissions.includes('*') || permissions.includes('bank_accounts.manage');
  const canReview = permissions.includes('*') || permissions.includes('bank_accounts.review');
  const queueBusy = loading || saving || Boolean(busyId);

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setMessage('');
    try {
      const [receivingRes, memberRes, meRes, kycRes] = await Promise.all([adminApiFetch('/admin/receiving-bank-accounts'), adminApiFetch('/admin/member-bank-accounts'), adminApiFetch('/admin/auth/me'), adminApiFetch('/admin/member-bank-accounts/kyc-summary')]);
      const [receivingData, memberData, meData, kycData] = await Promise.all([receivingRes.json().catch(() => null), memberRes.json().catch(() => null), meRes.json().catch(() => null), kycRes.json().catch(() => null)]);
      if (!receivingRes.ok || !memberRes.ok) throw new Error();
      setPermissions(Array.isArray(meData?.permissions) ? meData.permissions : []);
      setReceiving(Array.isArray(receivingData?.items) ? receivingData.items : []);
      setMemberBanks(Array.isArray(memberData?.items) ? memberData.items : []);
      setDuplicateAccountIds((kycData?.duplicateGroups ?? []).flatMap((group: { items?: { id: string }[] }) => group.items?.map((item) => item.id) ?? []));
    } catch {
      setReceiving([]); setMemberBanks([]); setDuplicateAccountIds([]); setMessage(copy.loadFailed);
    } finally { setLoading(false); }
  }

  async function saveReceiving(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return setMessage(copy.permissionManage);
    const payload = normalizeReceivingPayload();
    if (!payload.accountName.trim() || !payload.accountNumber.trim() || !payload.bankName.trim()) return setMessage(copy.required);
    setSaving(true); setMessage('');
    try {
      const res = await adminApiFetch('/admin/receiving-bank-accounts', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.item) throw new Error();
      setReceiving((current) => [data.item, ...current]);
      setPaymentType('bank'); setForm(blankReceiving); setMessage(copy.saved);
    } catch { setMessage(copy.saveFailed); } finally { setSaving(false); }
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
    setForm((current) => ({ ...current, bankName: value === 'bank' ? DEFAULT_THAI_BANK : value === 'promptpay' ? 'พร้อมเพย์' : value === 'wallet' ? 'วอเลต' : 'อื่น ๆ', accountNumber: '', promptPay: '' }));
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage(copy.invalidImage);
    try { const dataUrl = await resizeImage(file, 720, 0.82); setForm((current) => ({ ...current, qrImageUrl: dataUrl })); setMessage(copy.qrUploaded); }
    catch { setMessage(copy.invalidImage); }
  }

  async function setReceivingStatus(item: ReceivingAccount, status: string) {
    if (!canManage) return setMessage(copy.permissionManage);
    setBusyId(item.id); setMessage('');
    try {
      const res = await adminApiFetch(`/admin/receiving-bank-accounts/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.item) throw new Error();
      setReceiving((current) => current.map((row) => row.id === item.id ? data.item : row));
    } catch { setMessage(copy.updateFailed); } finally { setBusyId(''); }
  }

  async function reviewMemberBank(item: MemberBank, status: 'ACTIVE' | 'REJECTED', adminNote?: string) {
    if (!canReview) return setMessage(copy.permissionReview);
    setBusyId(item.id); setMessage('');
    try {
      const res = await adminApiFetch(`/admin/member-bank-accounts/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ status, adminNote: adminNote?.trim() || undefined }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.item) throw new Error();
      setMemberBanks((current) => current.map((row) => row.id === item.id ? { ...row, ...data.item } : row));
    } catch { setMessage(copy.reviewFailed); } finally { setBusyId(''); }
  }

  async function confirmReview() {
    if (!reviewIntent) return;
    if (reviewIntent.status === 'REJECTED' && reviewReason.trim().length < 5) return setMessage(copy.rejectReason);
    const intent = reviewIntent;
    await reviewMemberBank(intent.item, intent.status, reviewReason);
    setReviewIntent(null); setReviewReason('');
  }

  return (
    <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton disabled={queueBusy} onClick={() => void loadAll()}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
      {message && <AdminNotice tone={message.includes('สำเร็จ') || message.includes('added') || message.includes('uploaded') ? 'success' : 'warning'}>{message}</AdminNotice>}
      <AdminGrid>
        {canManage && (
          <AdminCard title={`${copy.addAccount}: ${typeLabel}`} description={copy.description}>
            <form onSubmit={saveReceiving}>
              <AdminToolbar>
                <label style={labelStyle}>{typeLabel}<select disabled={saving} value={paymentType} onChange={(event) => changePaymentType(event.target.value as PaymentType)}>{paymentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                {paymentType === 'bank' && <label style={labelStyle}>{copy.bank}<select disabled={saving} value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })}>{THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>}
                <label style={labelStyle}>{copy.accountName}<input disabled={saving} value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} /></label>
                <label style={labelStyle}>{accountNumberLabel}<input disabled={saving} value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value, promptPay: paymentType === 'promptpay' ? event.target.value : form.promptPay })} /></label>
                <label style={labelStyle}>{copy.minAmount}<input disabled={saving} value={form.minAmount} onChange={(event) => setForm({ ...form, minAmount: event.target.value })} /></label>
                <label style={labelStyle}>{copy.maxAmount}<input disabled={saving} value={form.maxAmount} onChange={(event) => setForm({ ...form, maxAmount: event.target.value })} /></label>
                <label style={labelStyle}>{copy.uploadQr}<input disabled={saving} type="file" accept="image/*" onChange={(event) => void handleQrUpload(event)} /></label>
                {form.qrImageUrl && <img src={form.qrImageUrl} alt="QR preview" style={qrPreviewStyle} />}
                <AdminButton type="submit" disabled={saving}>{saving ? copy.loading : copy.addAccount}</AdminButton>
              </AdminToolbar>
            </form>
          </AdminCard>
        )}
        <AdminCard title={copy.receivingTitle}>
          <AdminStack>
            {receiving.map((item) => (
              <AdminRow key={item.id}>
                <div>
                  <AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'danger'}>{item.status}</AdminBadge>
                  <h2 style={{ margin: '10px 0 4px' }}>{labelForAccount(item, copy)}</h2>
                  <p>{copy.accountName}: {item.accountName}</p>
                  <p>{numberLabelForAccount(item, copy)}: {maskAccountNumber(item.accountNumber)}</p>
                  {item.promptPay && <p>PromptPay: {maskAccountNumber(item.promptPay)}</p>}
                  <p>{copy.limit}: {item.minAmount ?? '-'} - {item.maxAmount ?? '-'}</p>
                  {item.qrImageUrl && <img src={item.qrImageUrl} alt="QR" style={qrPreviewStyle} />}
                </div>
                {canManage && (
                  <div style={actionsStyle}>
                    <AdminButton tone="success" disabled={queueBusy} onClick={() => void setReceivingStatus(item, 'ACTIVE')}>{copy.enable}</AdminButton>
                    <AdminButton tone="danger" disabled={queueBusy} onClick={() => void setReceivingStatus(item, 'DISABLED')}>{copy.disable}</AdminButton>
                  </div>
                )}
              </AdminRow>
            ))}
            {!loading && receiving.length === 0 && <AdminEmpty>{copy.noReceiving}</AdminEmpty>}
          </AdminStack>
        </AdminCard>
      </AdminGrid>
      <AdminCard title={copy.memberTitle} description={copy.memberDescription}>
        <AdminStack>
          {memberBanks.map((item) => (
            <AdminRow key={item.id}>
              <div>
                <AdminBadge tone={item.status === 'ACTIVE' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge>
                {duplicateAccountIds.includes(item.id) && <AdminBadge tone="danger">{copy.duplicate}</AdminBadge>}
                <h2 style={{ margin: '10px 0 4px' }}>{item.bankName}</h2>
                <p>{item.accountName} / {maskAccountNumber(item.accountNumber)}</p>
                <p>{copy.member}: {item.user?.username ?? item.userId}</p>
                <p>{copy.primary}: {item.isPrimary ? '✓' : '−'}</p>
              </div>
              {canReview && (
                <div style={actionsStyle}>
                  <AdminButton tone="success" disabled={queueBusy || duplicateAccountIds.includes(item.id)} onClick={() => setReviewIntent({ item, status: 'ACTIVE' })}>{copy.approve}</AdminButton>
                  <AdminButton tone="danger" disabled={queueBusy} onClick={() => setReviewIntent({ item, status: 'REJECTED' })}>{copy.reject}</AdminButton>
                </div>
              )}
            </AdminRow>
          ))}
          {!loading && memberBanks.length === 0 && <AdminEmpty>{copy.noMember}</AdminEmpty>}
        </AdminStack>
      </AdminCard>
      <AdminConfirmDialog open={Boolean(reviewIntent)} title={reviewIntent?.status === 'ACTIVE' ? copy.approveTitle : copy.rejectTitle} description={reviewIntent?.status === 'ACTIVE' ? copy.approveDescription : copy.rejectDescription} confirmLabel={reviewIntent?.status === 'ACTIVE' ? copy.confirmApprove : copy.confirmReject} tone={reviewIntent?.status === 'REJECTED' ? 'danger' : 'success'} busy={Boolean(reviewIntent && busyId === reviewIntent.item.id)} onCancel={() => { if (!busyId) { setReviewIntent(null); setReviewReason(''); } }} onConfirm={() => void confirmReview()} details={reviewIntent?.status === 'REJECTED' ? <label style={labelStyle}>{copy.reason}<input disabled={Boolean(busyId)} value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} /></label> : undefined} />
    </AdminPage>
  );
}

function labelForAccount(item: ReceivingAccount, copy: Copy) { if (item.bankName === 'พร้อมเพย์') return copy.paymentTypes.promptpay; if (item.bankName === 'วอเลต') return copy.paymentTypes.wallet; if (item.bankName === 'อื่น ๆ') return copy.paymentTypes.other; return `${copy.paymentTypes.bank} · ${item.bankName}`; }
function numberLabelForAccount(item: ReceivingAccount, copy: Copy) { if (item.bankName === 'พร้อมเพย์') return copy.promptPayNumber; if (item.bankName === 'วอเลต') return copy.walletNumber; if (item.bankName === 'อื่น ๆ') return copy.details; return copy.accountNumber; }
function maskAccountNumber(value: string) { const visible = value.slice(-4); return `${'•'.repeat(Math.max(value.length - visible.length, 4))}${visible}`; }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('image')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('image')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('image')); reader.readAsDataURL(file); }); }
const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const qrPreviewStyle = { width: 150, height: 150, objectFit: 'cover' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)' } as const;