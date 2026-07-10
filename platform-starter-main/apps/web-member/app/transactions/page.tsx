'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';
import { MemberEmptyState, MemberNotice } from '../components/member-ui';
import type { LedgerItem } from '../types/member-api';

export default function TransactionsPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [message, setMessage] = useState('กำลังโหลด...');

  useEffect(() => {
    memberApiFetch('/member/wallet/ledger?limit=100')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
        return data;
      })
      .then((data) => { setItems(data.items ?? []); setMessage(''); })
      .catch((error) => setMessage(error.message));
  }, []);

  const summary = useMemo(() => {
    const income = items.filter((item) => item.direction === 'CREDIT').reduce((sum, item) => sum + Number(item.amount), 0);
    const outcome = items.filter((item) => item.direction === 'DEBIT').reduce((sum, item) => sum + Number(item.amount), 0);
    return { income, outcome, net: income - outcome, count: items.length };
  }, [items]);

  return <main className="member-finance-page">
    <header className="member-finance-page__header">
      <a href="/" className="member-finance-page__back">← หน้าแรก</a>
      <h1 className="member-finance-page__title">ประวัติ</h1>
      <p className="member-finance-page__subtitle">ตรวจสอบรายการเข้า ออก และยอดคงเหลือหลังทำรายการแต่ละครั้ง</p>
    </header>

    {message && <MemberNotice>{message}</MemberNotice>}

    <section className="member-finance-summary" aria-label="สรุปรายการ">
      <SummaryCard label="เงินเข้า" value={summary.income} tone="credit" />
      <SummaryCard label="เงินออก" value={summary.outcome} tone="debit" />
      <SummaryCard label="สุทธิ" value={summary.net} tone={summary.net >= 0 ? 'credit' : 'debit'} />
      <div className="member-finance-summary__card"><span>จำนวนรายการ</span><strong>{summary.count.toLocaleString('th-TH')}</strong></div>
    </section>

    <section className="member-finance-section-head"><h2>รายการล่าสุด</h2><span>{items.length.toLocaleString('th-TH')} รายการ</span></section>
    <div className="member-finance-list">
      {items.map((item) => <article key={item.id} className="member-transaction-card">
        <div className="member-transaction-card__top">
          <div className="member-transaction-card__info">
            <span className={`member-status-badge member-status-badge--${item.direction === 'CREDIT' ? 'credit' : 'debit'}`}>{directionLabel(item.direction)}</span>
            <strong>{typeLabel(item.type)}</strong>
            <p className="member-finance-page__subtitle">{new Date(item.createdAt).toLocaleString('th-TH')}</p>
          </div>
          <h2 className={`member-transaction-card__amount member-transaction-card__amount--${item.direction === 'CREDIT' ? 'credit' : 'debit'}`}>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</h2>
        </div>
        <div className="member-transaction-card__balance">
          <div><span>ยอดก่อนรายการ</span><strong>{formatMoney(item.balanceBefore)}</strong></div>
          <div><span>ยอดหลังรายการ</span><strong>{formatMoney(item.balanceAfter)}</strong></div>
        </div>
      </article>)}
      {items.length === 0 && !message && <MemberEmptyState title="ยังไม่มีประวัติ" description="เมื่อมีรายการฝาก ถอน หรือปรับยอด รายการจะแสดงที่นี่" actionHref="/deposit" actionLabel="ไปหน้าฝาก" />}
    </div>
  </main>;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'credit' | 'debit' }) {
  return <div className={`member-finance-summary__card member-finance-summary__card--${tone}`}><span>{label}</span><strong>{formatMoney(value)}</strong></div>;
}
function typeLabel(type: string) { const upper = type.toUpperCase(); if (upper.includes('DEPOSIT') || upper.includes('TOPUP')) return 'ฝาก'; if (upper.includes('WITHDRAW')) return 'ถอนเงิน'; if (upper.includes('ADJUST')) return 'ปรับยอด'; return 'รายการ'; }
function directionLabel(direction: string) { return direction === 'CREDIT' ? 'เงินเข้า' : 'เงินออก'; }
function formatMoney(value: string | number | null | undefined) { return `THB ${Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
