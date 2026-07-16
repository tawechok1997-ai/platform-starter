'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberApiFetch } from '../../member-api';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; providerTransactionId?: string | null; errorMessage?: string | null; createdAt: string; responsePayload?: any };
type WalletPayload = { balance?: string; lockedBalance?: string; currency?: string };

export default function GameSessionPage() {
  const params = useSearchParams();
  const session = params.get('session') ?? '';
  const game = params.get('game') ?? 'เกม';
  const launchUrl = params.get('launchUrl') ?? '';
  const [amount, setAmount] = useState('100');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [wallet, setWallet] = useState<WalletPayload>({});

  const loadWallet = useCallback(async () => {
    const res = await memberApiFetch('/member/wallet');
    const data = await res.json().catch(() => null);
    if (res.ok) setWallet(data?.wallet ?? data ?? {});
  }, []);

  const loadTransfers = useCallback(async () => {
    if (!session) return;
    const res = await memberApiFetch(`/member/game-sessions/${session}/transfers`);
    const data = await res.json().catch(() => null);
    if (res.ok) setTransfers(data?.items ?? []);
  }, [session]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadWallet(), loadTransfers()]);
  }, [loadTransfers, loadWallet]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function transfer(type: 'transfer-in' | 'transfer-out') { if (!session) { setMessage('ไม่พบ session สำหรับโยกเงิน'); return; } setBusy(type); setMessage(type === 'transfer-in' ? 'กำลังโยกเงินเข้าเกม...' : 'กำลังโยกเงินกลับวอเลต...'); const res = await memberApiFetch(`/member/game-sessions/${session}/${type}`, { method: 'POST', body: JSON.stringify({ amount }) }); const data = await res.json().catch(() => null); setBusy(''); if (!res.ok || !data?.ok) { setMessage(data?.transfer?.errorMessage ?? data?.message ?? data?.errorMessage ?? 'โยกเงินไม่สำเร็จ'); await loadAll(); return; } const label = type === 'transfer-in' ? 'โยกเข้าเกม' : 'โยกกลับวอเลต'; const balanceAfter = data.walletSync?.balanceAfter ? ` · ยอดคงเหลือ ${formatMoney(data.walletSync.balanceAfter, data.transfer.currency)}` : ''; setMessage(`${label} สำเร็จ ${formatMoney(data.transfer.amount, data.transfer.currency)}${balanceAfter}`); await loadAll(); }
  return <main style={pageStyle}><section style={cardStyle}><span style={eyebrowStyle}>Game Session</span><h1 style={titleStyle}>{game}</h1><p style={mutedStyle}>จัดการ session, กลับเข้าเกม และโยกเงินเข้าออกเกมจากหน้าเดียว</p><section style={screenStyle}><strong>Session พร้อมใช้งาน</strong><code style={codeStyle}>{session || '-'}</code><div style={actionRowStyle}>{launchUrl && <a href={launchUrl} style={buttonStyle}>กลับเข้าเกม</a>}<a href="/games" style={secondaryButtonStyle}>เลือกเกมอื่น</a></div></section><section style={walletCardStyle}><span>ยอดวอเลต</span><strong>{formatMoney(wallet.balance ?? '0.00', wallet.currency ?? 'THB')}</strong><small>ยอดที่ถูกพัก: {formatMoney(wallet.lockedBalance ?? '0.00', wallet.currency ?? 'THB')}</small></section><section style={panelStyle}><strong>โยกเงิน</strong><p style={mutedStyle}>ถ้าโยกเข้าเกมไม่สำเร็จ ระบบจะ rollback คืนวอเลตและแสดงในประวัติ</p><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" style={inputStyle} placeholder="จำนวนเงิน" /><div style={actionRowStyle}><button type="button" style={buttonStyle} disabled={Boolean(busy)} onClick={() => transfer('transfer-in')}>{busy === 'transfer-in' ? 'กำลังโยก...' : 'โยกเข้าเกม'}</button><button type="button" style={secondaryButtonStyle} disabled={Boolean(busy)} onClick={() => transfer('transfer-out')}>{busy === 'transfer-out' ? 'กำลังโยก...' : 'โยกกลับวอเลต'}</button></div>{message && <div style={noticeStyle}>{message}</div>}</section><section style={panelStyle}><strong>ประวัติ session นี้</strong>{transfers.map((item) => <div key={item.id} style={historyRowStyle}><div><strong>{transferLabel(item.type)}</strong><p style={mutedStyle}>{formatMoney(item.amount, item.currency)} · {item.providerTransactionId ?? item.errorMessage ?? '-'}</p><small style={smallStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</small></div><em style={statusStyle}>{statusLabel(item.status, item.responsePayload)}</em></div>)}{transfers.length === 0 && <p style={mutedStyle}>ยังไม่มีรายการโยกเงินใน session นี้</p>}</section></section></main>;
}
function transferLabel(type: string) { return type === 'TRANSFER_IN' ? 'โยกเข้าเกม' : type === 'TRANSFER_OUT' ? 'โยกกลับวอเลต' : type; }
function statusLabel(status: string, responsePayload?: any) { if (status === 'SUCCESS') return 'สำเร็จ'; if (responsePayload?.walletRollbackLedgerId) return 'Rollback แล้ว'; if (status === 'FAILED') return 'ไม่สำเร็จ'; if (status === 'PENDING') return 'กำลังทำรายการ'; return status; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const pageStyle = { minHeight: '100dvh', background: 'radial-gradient(circle at top,#1f2937,#050505 58%)', color: '#fff', padding: 18 } as const;
const cardStyle = { width: '100%', maxWidth: 560, margin: '0 auto', border: '1px solid rgba(245,197,66,.24)', borderRadius: 28, padding: 22, background: 'rgba(15,23,42,.86)', boxShadow: '0 28px 80px rgba(0,0,0,.45)', display: 'grid', gap: 16 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 36, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.6 } as const;
const screenStyle = { minHeight: 120, borderRadius: 22, border: '1px solid rgba(148,163,184,.2)', background: 'linear-gradient(135deg,rgba(245,197,66,.16),rgba(59,130,246,.12))', display: 'grid', gap: 10, padding: 18 } as const;
const walletCardStyle = { border: '1px solid rgba(34,197,94,.28)', borderRadius: 20, padding: 16, background: 'rgba(34,197,94,.10)', display: 'grid', gap: 6 } as const;
const panelStyle = { border: '1px solid rgba(148,163,184,.2)', borderRadius: 20, padding: 14, background: 'rgba(2,6,23,.52)', display: 'grid', gap: 12 } as const;
const inputStyle = { minHeight: 46, borderRadius: 14, border: '1px solid rgba(148,163,184,.24)', background: '#0f172a', color: '#fff', padding: '0 12px', fontWeight: 900, fontSize: 18 };
const actionRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as const;
const codeStyle = { maxWidth: '100%', overflowWrap: 'anywhere' as const, color: '#fef3c7', background: 'rgba(0,0,0,.24)', borderRadius: 12, padding: '8px 10px' };
const buttonStyle = { minHeight: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none', border: 0 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: '#334155', color: '#e2e8f0' } as const;
const noticeStyle = { padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.75)', color: '#e2e8f0' } as const;
const historyRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(15,23,42,.55)', flexWrap: 'wrap' as const } as const;
const statusStyle = { color: '#facc15', fontStyle: 'normal', fontWeight: 950 } as const;
const smallStyle = { color: '#94a3b8' } as const;