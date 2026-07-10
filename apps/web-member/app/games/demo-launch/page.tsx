'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberApiFetch } from '../../member-api';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; providerTransactionId?: string | null; errorMessage?: string | null; createdAt: string; responsePayload?: any };
type WalletPayload = { balance?: string; lockedBalance?: string; currency?: string };

const quickAmounts = ['100', '300', '500', '1000'];

export default function DemoLaunchPage() {
  const params = useSearchParams();
  const game = params.get('game') ?? 'demo-game';
  const session = params.get('session') ?? '-';
  const [amount, setAmount] = useState('100');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [wallet, setWallet] = useState<WalletPayload>({});

  useEffect(() => { loadAll(); }, [session]);

  const currency = wallet.currency ?? transfers[0]?.currency ?? 'THB';
  const latest = transfers[0];
  const successfulIn = useMemo(() => transfers.filter((item) => item.type === 'TRANSFER_IN' && item.status === 'SUCCESS').reduce((sum, item) => sum + Number(item.amount || 0), 0), [transfers]);
  const successfulOut = useMemo(() => transfers.filter((item) => item.type === 'TRANSFER_OUT' && item.status === 'SUCCESS').reduce((sum, item) => sum + Number(item.amount || 0), 0), [transfers]);
  const estimatedGameBalance = Math.max(successfulIn - successfulOut, 0);

  async function loadAll() { await Promise.all([loadWallet(), loadTransfers()]); }
  async function loadWallet() {
    const res = await memberApiFetch('/member/wallet');
    const data = await res.json().catch(() => null);
    if (res.ok) setWallet(data?.wallet ?? data ?? {});
  }
  async function loadTransfers() {
    if (!session || session === '-') return;
    const res = await memberApiFetch(`/member/game-sessions/${session}/transfers`);
    const data = await res.json().catch(() => null);
    if (res.ok) setTransfers(data?.items ?? []);
  }

  function setAllAmount() {
    const available = Number(wallet.balance ?? 0);
    if (available > 0) setAmount(available.toFixed(2));
  }

  async function transfer(type: 'transfer-in' | 'transfer-out') {
    if (!session || session === '-') { setMessage('ไม่พบ session สำหรับโยกเงิน'); return; }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินให้ถูกต้อง'); return; }
    setBusy(type);
    setMessage(type === 'transfer-in' ? 'กำลังโยกเงินเข้าเกม...' : 'กำลังโยกเงินกลับเข้าวอเลต...');
    const res = await memberApiFetch(`/member/game-sessions/${session}/${type}`, { method: 'POST', body: JSON.stringify({ amount }) });
    const data = await res.json().catch(() => null);
    setBusy('');
    if (!res.ok || !data?.ok) {
      const rolledBack = data?.transfer?.responsePayload?.walletRollbackLedgerId || data?.walletSync?.rollback;
      setMessage(rolledBack ? 'โยกเงินไม่สำเร็จ ระบบคืนเงินเข้าวอเลตแล้ว' : data?.transfer?.errorMessage ?? data?.message ?? data?.errorMessage ?? 'โยกเงินไม่สำเร็จ ยอดเงินไม่ถูกเปลี่ยน');
      await loadAll();
      return;
    }
    const label = type === 'transfer-in' ? 'โยกเข้าเกม' : 'โยกกลับวอเลต';
    const balanceAfter = data.walletSync?.balanceAfter ? ` · ยอดคงเหลือ ${formatMoney(data.walletSync.balanceAfter, data.transfer.currency)}` : '';
    setMessage(`${label} สำเร็จ ${formatMoney(data.transfer.amount, data.transfer.currency)}${balanceAfter}`);
    await loadAll();
  }

  return <main style={pageStyle}>
    <section style={cardStyle}>
      <header style={headerStyle}>
        <div>
          <span style={eyebrowStyle}>Game Session</span>
          <h1 style={titleStyle}>โยกเงินเข้าออกเกม</h1>
          <p style={mutedStyle}>เงิน sync กับวอเลตจริง ถ้า provider fail หลังหักยอด ระบบจะ rollback คืนให้ ไม่ใช่ปล่อยเงินหายไปพักร้อน</p>
        </div>
        <button type="button" onClick={loadAll} style={ghostButtonStyle} disabled={Boolean(busy)}>รีเฟรช</button>
      </header>

      <div style={screenStyle}>
        <span style={pillStyle}>กำลังเล่น</span>
        <strong>{game}</strong>
        <span>Session</span>
        <code style={codeStyle}>{session}</code>
      </div>

      <section style={balanceGridStyle}>
        <BalanceCard label="ยอดใช้ได้" value={formatMoney(wallet.balance ?? '0.00', currency)} tone="green" />
        <BalanceCard label="ยอดพัก" value={formatMoney(wallet.lockedBalance ?? '0.00', currency)} tone="yellow" />
        <BalanceCard label="ในเกมโดยประมาณ" value={formatMoney(estimatedGameBalance, currency)} tone="blue" />
      </section>

      <section style={panelStyle}>
        <div style={sectionHeadStyle}><strong>โยกเงิน</strong><span style={smallStyle}>เลือกยอดแล้วกดเข้า/ออก</span></div>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" style={inputStyle} placeholder="จำนวนเงิน" />
        <div style={quickRowStyle}>{quickAmounts.map((item) => <button key={item} type="button" style={chipStyle} onClick={() => setAmount(item)}>{item}</button>)}<button type="button" style={chipStyle} onClick={setAllAmount}>ทั้งหมด</button></div>
        <div style={actionRowStyle}>
          <button type="button" style={buttonStyle} disabled={Boolean(busy)} onClick={() => transfer('transfer-in')}>{busy === 'transfer-in' ? 'กำลังโยก...' : 'โยกเข้าเกม'}</button>
          <button type="button" style={secondaryButtonStyle} disabled={Boolean(busy)} onClick={() => transfer('transfer-out')}>{busy === 'transfer-out' ? 'กำลังโยก...' : 'โยกกลับวอเลต'}</button>
        </div>
        {message && <div style={noticeStyle}>{message}</div>}
      </section>

      <section style={panelStyle}>
        <div style={sectionHeadStyle}><strong>สถานะล่าสุด</strong><span style={smallStyle}>{latest ? new Date(latest.createdAt).toLocaleString('th-TH') : 'ยังไม่มีรายการ'}</span></div>
        {latest ? <div style={latestStyle}><div><strong>{transferLabel(latest.type)}</strong><p style={mutedStyle}>{formatMoney(latest.amount, latest.currency)} · {latest.providerTransactionId ?? latest.errorMessage ?? '-'}</p></div><em style={statusStyle(latest.status, latest.responsePayload)}>{statusLabel(latest.status, latest.responsePayload)}</em></div> : <p style={mutedStyle}>ยังไม่มีรายการโยกเงินใน session นี้</p>}
      </section>

      <section style={panelStyle}>
        <div style={sectionHeadStyle}><strong>ประวัติโยกเงิน</strong><span style={smallStyle}>{transfers.length} รายการ</span></div>
        {transfers.map((item) => <div key={item.id} style={historyRowStyle}><div><strong>{transferLabel(item.type)}</strong><p style={mutedStyle}>{formatMoney(item.amount, item.currency)} · {item.providerTransactionId ?? item.errorMessage ?? '-'}</p><small style={smallStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</small></div><em style={statusStyle(item.status, item.responsePayload)}>{statusLabel(item.status, item.responsePayload)}</em></div>)}
        {transfers.length === 0 && <p style={mutedStyle}>ยังไม่มีรายการโยกเงินใน session นี้</p>}
      </section>

      <div style={footerActionsStyle}>
        <a href="/games" style={linkButtonStyle}>กลับไปหน้าเกม</a>
        <a href="/transactions" style={outlineLinkStyle}>ดูประวัติ</a>
      </div>
    </section>
  </main>;
}

function BalanceCard({ label, value, tone }: { label: string; value: string; tone: 'green' | 'yellow' | 'blue' }) { return <div style={{ ...walletCardStyle, ...balanceToneStyle[tone] }}><span>{label}</span><strong>{value}</strong></div>; }
function transferLabel(type: string) { return type === 'TRANSFER_IN' ? 'โยกเข้าเกม' : type === 'TRANSFER_OUT' ? 'โยกกลับวอเลต' : type; }
function statusLabel(status: string, responsePayload?: any) { if (status === 'SUCCESS') return 'สำเร็จ'; if (responsePayload?.walletRollbackLedgerId) return 'คืนยอดแล้ว'; if (status === 'FAILED') return 'ไม่สำเร็จ'; if (status === 'PENDING') return 'กำลังทำรายการ'; return status; }
function statusStyle(status: string, responsePayload?: any) { const base = { fontStyle: 'normal', fontWeight: 950, borderRadius: 999, padding: '6px 10px', height: 'fit-content' } as const; if (status === 'SUCCESS') return { ...base, color: '#bbf7d0', background: 'rgba(34,197,94,.12)' }; if (responsePayload?.walletRollbackLedgerId) return { ...base, color: '#fde68a', background: 'rgba(245,197,66,.12)' }; if (status === 'FAILED') return { ...base, color: '#fecaca', background: 'rgba(239,68,68,.14)' }; return { ...base, color: '#facc15', background: 'rgba(245,197,66,.12)' }; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const pageStyle = { minHeight: '100dvh', background: 'radial-gradient(circle at top,#1f2937,#050505 58%)', color: '#fff', display: 'grid', placeItems: 'center', padding: 14 } as const;
const cardStyle = { width: '100%', maxWidth: 600, border: '1px solid rgba(245,197,66,.24)', borderRadius: 28, padding: 18, background: 'rgba(15,23,42,.88)', boxShadow: '0 28px 80px rgba(0,0,0,.45)', display: 'grid', gap: 14, minWidth: 0 } as const;
const headerStyle = { display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const };
const eyebrowStyle = { color: '#facc15', fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: '4px 0 8px', fontSize: 'clamp(30px,7vw,40px)', lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.6 } as const;
const smallStyle = { color: '#94a3b8', fontSize: 12 } as const;
const screenStyle = { minHeight: 150, borderRadius: 22, border: '1px solid rgba(148,163,184,.2)', background: 'linear-gradient(135deg,rgba(245,197,66,.16),rgba(59,130,246,.12))', display: 'grid', placeItems: 'center', textAlign: 'center' as const, gap: 8, padding: 18 };
const balanceGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 } as const;
const walletCardStyle = { border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 12, display: 'grid', gap: 6, minWidth: 0 } as const;
const balanceToneStyle = { green: { background: 'rgba(34,197,94,.10)', borderColor: 'rgba(34,197,94,.28)' }, yellow: { background: 'rgba(245,197,66,.10)', borderColor: 'rgba(245,197,66,.28)' }, blue: { background: 'rgba(59,130,246,.10)', borderColor: 'rgba(59,130,246,.28)' } } as const;
const panelStyle = { border: '1px solid rgba(148,163,184,.2)', borderRadius: 20, padding: 14, background: 'rgba(2,6,23,.52)', display: 'grid', gap: 12 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const };
const inputStyle = { minHeight: 48, borderRadius: 14, border: '1px solid rgba(148,163,184,.24)', background: '#0f172a', color: '#fff', padding: '0 12px', fontWeight: 900, fontSize: 18 };
const quickRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const chipStyle = { border: '1px solid rgba(148,163,184,.2)', borderRadius: 999, background: 'rgba(148,163,184,.1)', color: '#e2e8f0', minHeight: 34, padding: '0 12px', fontWeight: 900 } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as const;
const codeStyle = { maxWidth: '100%', overflowWrap: 'anywhere' as const, color: '#fef3c7', background: 'rgba(0,0,0,.24)', borderRadius: 12, padding: '8px 10px' };
const buttonStyle = { minHeight: 50, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none', border: 0 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: '#334155', color: '#e2e8f0' } as const;
const ghostButtonStyle = { minHeight: 40, borderRadius: 999, border: '1px solid rgba(148,163,184,.2)', padding: '0 12px', background: 'rgba(148,163,184,.08)', color: '#e2e8f0', fontWeight: 900 } as const;
const linkButtonStyle = { minHeight: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none' } as const;
const outlineLinkStyle = { ...linkButtonStyle, background: '#334155', color: '#e2e8f0' } as const;
const footerActionsStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as const;
const noticeStyle = { padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.75)', color: '#e2e8f0' } as const;
const latestStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(15,23,42,.55)', flexWrap: 'wrap' as const } as const;
const historyRowStyle = { ...latestStyle } as const;
const pillStyle = { borderRadius: 999, padding: '5px 10px', background: 'rgba(34,197,94,.12)', color: '#bbf7d0', fontSize: 12, fontWeight: 950 } as const;
