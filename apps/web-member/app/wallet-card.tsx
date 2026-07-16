'use client';

import type { CSSProperties } from 'react';
import { useMemberSession } from './member-session-provider';

export default function WalletCard({ primaryColor, cardColor, showButtons }: { primaryColor: string; cardColor: string; showButtons: boolean }) {
  const { wallet, walletLoading } = useMemberSession();
  const currency = wallet?.currency ?? 'THB';
  const available = wallet ? Number(wallet.availableBalance) : 0;
  const locked = wallet ? Number(wallet.lockedBalance) : 0;
  const balance = wallet ? Number(wallet.balance) : 0;
  const walletStyle = { '--member-wallet-brand': primaryColor, '--member-wallet-card': cardColor } as CSSProperties;

  return (
    <section className="member-wallet-card" style={walletStyle} aria-labelledby="member-wallet-title">
      <div className="member-wallet-card__top-row">
        <div className="member-wallet-card__heading">
          <p className="member-wallet-card__label">ยอดคงเหลือที่ใช้ได้</p>
          <h2 id="member-wallet-title" className="member-wallet-card__amount"><span>{currency}</span> {available.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
        </div>
        <span className={`member-wallet-card__status${wallet?.status === 'ACTIVE' ? ' is-active' : ''}`}>{statusLabel(wallet?.status)}</span>
      </div>
      <div className="member-wallet-card__mini-grid">
        <div className="member-wallet-card__mini-box"><span>ยอดรวม</span><strong>{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
        <div className="member-wallet-card__mini-box"><span>กำลังดำเนินการ</span><strong>{locked.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
      </div>
      {(walletLoading || !wallet) && <div className="member-wallet-card__notice" role="status">{walletLoading ? 'กำลังโหลดข้อมูลยอดเงิน…' : 'ไม่พบข้อมูลวอลเลต'}</div>}
      {showButtons && <div className="member-wallet-card__actions"><a href="/deposit" className="member-wallet-card__action is-primary">ฝากเงิน</a><a href="/withdraw" className="member-wallet-card__action">ถอนเงิน</a></div>}
    </section>
  );
}

function statusLabel(status?: string) {
  if (status === 'ACTIVE') return 'ใช้งานได้';
  if (!status) return 'ยังไม่พร้อม';
  return status;
}
