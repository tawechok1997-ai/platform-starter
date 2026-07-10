'use client';

import { useEffect, useState } from 'react';
import { memberApiFetch } from './member-api';

type WalletResponse = {
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
  status: string;
};

export default function WalletCard({ primaryColor, cardColor, showButtons }: { primaryColor: string; cardColor: string; showButtons: boolean }) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [message, setMessage] = useState('กำลังโหลด...');

  useEffect(() => {
    memberApiFetch('/member/wallet')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
        return data;
      })
      .then((data) => { setWallet(data); setMessage(''); })
      .catch((error) => setMessage(error.message));
  }, []);

  const currency = wallet?.currency ?? 'THB';
  const available = wallet ? Number(wallet.availableBalance) : 0;
  const locked = wallet ? Number(wallet.lockedBalance) : 0;
  const balance = wallet ? Number(wallet.balance) : 0;

  return (
    <section style={{ ...cardStyle, background: `radial-gradient(circle at top right, rgba(245,197,66,.18), transparent 34%), linear-gradient(150deg, ${cardColor}, rgba(255,255,255,.045))` }}>
      <div style={topRowStyle}>
        <div style={{ minWidth: 0 }}>
          <p style={mutedStyle}>ยอดใช้ได้</p>
          <h2 style={amountStyle}>{currency} {available.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
        </div>
        <span style={{ ...statusStyle, background: wallet?.status === 'ACTIVE' ? 'rgba(80,255,140,0.14)' : 'rgba(255,255,255,0.1)' }}>{statusLabel(wallet?.status)}</span>
      </div>

      <div style={miniGridStyle}>
        <div style={miniBoxStyle}><span>ทั้งหมด</span><strong>{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
        <div style={miniBoxStyle}><span>รอดำเนินการ</span><strong>{locked.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
      </div>

      {message && <div style={noticeStyle}>{message}</div>}

      {showButtons && (
        <div style={actionRowStyle}>
          <a href="/deposit" style={{ ...actionStyle, background: primaryColor, color: '#111', borderColor: primaryColor }}>ฝาก</a>
          <a href="/withdraw" style={actionStyle}>ถอนเงิน</a>
          <a href="/transactions" style={actionStyle}>ประวัติ</a>
          <a href="/bank-accounts" style={actionStyle}>การจัดการบัญชีธนาคาร</a>
        </div>
      )}
    </section>
  );
}

function statusLabel(status?: string) {
  if (status === 'ACTIVE') return 'ใช้งานได้';
  if (!status) return 'ยังไม่พร้อม';
  return status;
}

const cardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 28, padding: 18, display: 'grid', gap: 14, boxShadow: '0 18px 60px rgba(0,0,0,0.28)', overflow: 'hidden', minWidth: 0 } as const;
const topRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' as const, minWidth: 0 };
const mutedStyle = { margin: 0, opacity: 0.72, fontSize: 13, fontWeight: 800 } as const;
const amountStyle = { margin: '4px 0 0', fontSize: 'clamp(30px, 9vw, 46px)', lineHeight: 1, letterSpacing: -0.8, overflowWrap: 'anywhere' as const };
const statusStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 900, flex: '0 0 auto' } as const;
const miniGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 } as const;
const miniBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: '11px 12px', display: 'grid', gap: 4, background: 'rgba(255,255,255,0.055)', minWidth: 0, overflow: 'hidden' as const };
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,0.06)', fontSize: 13 } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 9 } as const;
const actionStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, minHeight: 48, padding: '12px 8px', textAlign: 'center' as const, textDecoration: 'none', color: 'inherit', fontWeight: 950, background: 'rgba(255,255,255,0.10)', display: 'grid', placeItems: 'center', fontSize: 15, lineHeight: 1.15 };
