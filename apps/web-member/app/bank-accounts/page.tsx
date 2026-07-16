'use client';

import { FormEvent, useEffect, useState } from 'react';
import { memberApiFetch } from '../member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberNotice } from '../components/member-ui';

type BankItem = { id: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string; adminNote?: string | null };

const THAI_BANKS = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน', 'ธนาคารอาคารสงเคราะห์', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'ธนาคารยูโอบี', 'ธนาคารซีไอเอ็มบีไทย', 'ธนาคารเกียรตินาคินภัทร', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'ธนาคารไอซีบีซี ไทย', 'ธนาคารไทยเครดิต'];

export default function MemberBankAccountsPage() {
  const [items, setItems] = useState<BankItem[]>([]);
  const [bankName, setBankName] = useState(THAI_BANKS[0]);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true); setMessage('กำลังโหลด...');
    const res = await memberApiFetch('/member/bank-accounts');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดบัญชีไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function addBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length > 0) { setMessage('เพิ่มได้ 1 บัญชีเท่านั้น'); return; }
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) { setMessage('กรอกข้อมูลบัญชีให้ครบก่อน'); return; }
    setBusy(true); setMessage('กำลังเพิ่มบัญชี...');
    const res = await memberApiFetch('/member/bank-accounts', { method: 'POST', body: JSON.stringify({ bankName, accountName, accountNumber }) });
    const data = await res.json().catch(() => null); setBusy(false);
    if (!res.ok) { setMessage(data?.message ?? 'เพิ่มบัญชีไม่สำเร็จ'); return; }
    setItems((current) => [data.item, ...current]); setBankName(THAI_BANKS[0]); setAccountName(''); setAccountNumber(''); setMessage('เพิ่มบัญชีแล้ว รอตรวจสอบ');
  }

  async function setPrimary(id: string) {
    setMessage('กำลังตั้งบัญชีหลัก...');
    const res = await memberApiFetch(`/member/bank-accounts/${id}/primary`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'ตั้งบัญชีหลักไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => ({ ...item, isPrimary: item.id === id })));
    setMessage('ตั้งบัญชีหลักแล้ว');
  }

  return <main className="member-finance-page">
    <header className="member-finance-page__header">
      <a href="/" className="member-finance-page__back">← หน้าแรก</a>
      <h1 className="member-finance-page__title">การจัดการบัญชีธนาคาร</h1>
      <p className="member-finance-page__subtitle">เพิ่มบัญชีสำหรับรับเงินถอนและติดตามสถานะการตรวจสอบจากแอดมิน</p>
    </header>

    {loading && <MemberNotice>กำลังโหลด...</MemberNotice>}
    {message && <MemberNotice>{message}</MemberNotice>}

    <section className="member-bank-layout">
      {items.length === 0 && !loading ? <MemberCard tone="brand">
        <form onSubmit={addBank} className="member-bank-form">
          <div><h2>เพิ่มบัญชี</h2><p className="member-finance-page__subtitle">ตรวจสอบชื่อและเลขบัญชีให้ถูกต้องก่อนส่ง</p></div>
          <label>ธนาคาร<select value={bankName} onChange={(e) => setBankName(e.target.value)}>{THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>
          <label>ชื่อบัญชี<input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="ชื่อบัญชี" autoComplete="name" /></label>
          <label>เลขบัญชี<input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="เลขบัญชี" inputMode="numeric" autoComplete="off" /></label>
          <MemberButton type="submit" disabled={busy}>{busy ? 'กำลังเพิ่ม...' : 'เพิ่มบัญชี'}</MemberButton>
        </form>
      </MemberCard> : <div />}

      <div className="member-finance-list">
        {items.length > 0 && <MemberNotice>เพิ่มบัญชีแล้ว หากต้องการเปลี่ยนข้อมูล กรุณาติดต่อแอดมิน</MemberNotice>}
        {items.map((item) => <MemberCard key={item.id} className="member-bank-card">
          <div className="member-bank-card__row">
            <div className="member-bank-card__info">
              <div className="member-bank-card__badges">
                <span className={`member-status-badge member-status-badge--${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                {item.isPrimary && <span className="member-status-badge member-status-badge--primary">บัญชีหลัก</span>}
              </div>
              <h2 className="member-bank-card__title">{item.bankName}</h2>
              <InfoText label="ชื่อบัญชี" value={item.accountName} />
              <InfoText label="เลขบัญชี" value={maskAccountNumber(item.accountNumber)} />
              {item.adminNote && <InfoText label="หมายเหตุ" value={item.adminNote} />}
            </div>
            {!item.isPrimary && <MemberButton type="button" tone="default" onClick={() => setPrimary(item.id)}>ตั้งเป็นบัญชีหลัก</MemberButton>}
          </div>
        </MemberCard>)}
        {items.length === 0 && !loading && <MemberEmptyState title="ยังไม่มีบัญชีธนาคาร" description="เพิ่มบัญชีเพื่อใช้รับเงินถอนจากระบบ" />}
      </div>
    </section>
  </main>;
}

function InfoText({ label, value }: { label: string; value: string }) { return <p className="member-bank-info"><strong>{label}:</strong> {value}</p>; }
function statusTone(status: string) { if (status === 'ACTIVE') return 'active'; if (status === 'REJECTED') return 'rejected'; return 'pending'; }
function statusLabel(status: string) { if (status === 'ACTIVE') return 'ใช้งานได้'; if (status === 'REJECTED') return 'ไม่อนุมัติ'; if (status === 'PENDING') return 'รอตรวจสอบ'; return status; }
function maskAccountNumber(value: string) { const compact = value.replace(/\s+/g, ''); if (compact.length <= 4) return compact; return `${'•'.repeat(Math.max(compact.length - 4, 4))}${compact.slice(-4)}`; }