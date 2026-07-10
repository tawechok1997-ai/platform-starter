'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';

type BonusLedger = { id: string; campaignId: string; campaign?: { title?: string }; amount: number; currency: string; turnoverRequired: number; turnoverProgress: number; turnoverCompleted: boolean; lifecycleStatus?: string; lifecycleNote?: string; walletCreditEnabled: boolean; walletCreditStatus: string; status: string; events?: Array<{ by: string; action: string; amount?: number; message?: string; createdAt: string }>; createdAt: string; resolvedAt?: string | null };

export default function MemberBonusPage() {
  const [items, setItems] = useState<BonusLedger[]>([]);
  const [message, setMessage] = useState('กำลังโหลดโบนัส...');
  useEffect(() => { load(); }, []);
  const stats = useMemo(() => ({ total: items.reduce((sum, item) => sum + Number(item.amount || 0), 0), active: items.filter((item) => item.status === 'ACTIVE').length, completed: items.filter((item) => item.turnoverCompleted).length, ready: items.filter((item) => item.status === 'RELEASE_READY').length, remaining: items.reduce((sum, item) => sum + Math.max(Number(item.turnoverRequired || 0) - Number(item.turnoverProgress || 0), 0), 0) }), [items]);
  async function load() { const res = await memberApiFetch('/member/bonus-ledgers'); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลดโบนัสไม่สำเร็จ'); return; } setItems(data.items ?? []); setMessage(''); }
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Bonus</span><h1 style={titleStyle}>โบนัสของฉัน</h1><p style={mutedStyle}>ดูยอดโบนัส เงื่อนไขเทิร์น และสถานะ lifecycle ก่อน settlement จริง</p><div style={statGridStyle}><Stat label="ยอดโบนัส" value={money(stats.total)} /><Stat label="ใช้งาน" value={String(stats.active)} /><Stat label="ผ่านเทิร์น" value={String(stats.completed)} /><Stat label="พร้อม release" value={String(stats.ready)} /><Stat label="เทิร์นคงเหลือ" value={money(stats.remaining)} /></div></section>{message && <div style={noticeStyle}>{message}</div>}<section style={listStyle}>{items.map((item) => <article key={item.id} style={cardStyle}><div style={rowStyle}><strong>{item.campaign?.title ?? item.campaignId}</strong><span style={badgeStyle}>{statusLabel(item.status)}</span></div><p style={mutedStyle}>โบนัส {money(item.amount)} · {item.currency}</p><div style={conditionGridStyle}><Condition label="เทิร์นแล้ว" value={money(item.turnoverProgress)} /><Condition label="ต้องทำ" value={money(item.turnoverRequired)} /><Condition label="คงเหลือ" value={money(Math.max(item.turnoverRequired - item.turnoverProgress, 0))} /></div><div style={progressOuterStyle}><div style={{ ...progressInnerStyle, width: `${progressPercent(item)}%` }} /></div><section style={lifecycleBoxStyle}><strong>{lifecycleText(item)}</strong><span>{item.walletCreditStatus}</span>{item.lifecycleNote && <span>{item.lifecycleNote}</span>}</section></article>)}{items.length === 0 && <div style={emptyStyle}>ยังไม่มีโบนัส</div>}</section><MemberBottomNav /></main>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div style={statStyle}><span>{label}</span><strong>{value}</strong></div>; }
function Condition({ label, value }: { label: string; value: string }) { return <div style={conditionStyle}><span>{label}</span><strong>{value}</strong></div>; }
function statusLabel(status: string) { const map: Record<string, string> = { ACTIVE: 'กำลังทำเทิร์น', REVIEWING: 'กำลังตรวจ', TURNOVER_COMPLETED: 'ผ่านเทิร์นแล้ว', RELEASE_READY: 'พร้อม release', COMPLETED: 'เสร็จสิ้น', EXPIRED: 'หมดอายุ', REVOKED: 'ถูกยกเลิก' }; return map[status] ?? status; }
function lifecycleText(item: BonusLedger) { if (item.status === 'RELEASE_READY' || item.lifecycleStatus === 'RELEASE_READY') return 'โบนัสผ่านเทิร์นและพร้อมให้แอดมินตรวจ settlement'; if (item.status === 'EXPIRED' || item.lifecycleStatus === 'EXPIRED') return 'โบนัสหมดอายุแล้ว'; if (item.status === 'REVOKED' || item.lifecycleStatus === 'REVOKED') return 'โบนัสถูกยกเลิกแล้ว'; if (item.turnoverCompleted) return 'ผ่านเทิร์นแล้ว รอแอดมิน release'; return 'ยังต้องทำเทิร์นก่อนถอนหรือ release โบนัส'; }
function progressPercent(item: BonusLedger) { const required = Number(item.turnoverRequired || 0); if (required <= 0) return 100; return Math.min(100, Math.round((Number(item.turnoverProgress || 0) / required) * 100)); }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 104px', display: 'grid', gap: 16 } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.22), transparent 34%), rgba(245,197,66,.08)', display: 'grid', gap: 12 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const statGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 } as const;
const statStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4 } as const;
const listStyle = { display: 'grid', gap: 12 } as const;
const cardStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 22, padding: 16, background: 'rgba(15,23,42,.82)', display: 'grid', gap: 12, minWidth: 0 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' as const };
const badgeStyle = { borderRadius: 999, padding: '7px 11px', background: 'rgba(245,197,66,.16)', color: '#fde68a', fontWeight: 950, fontSize: 13 } as const;
const conditionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 } as const;
const conditionStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4, minWidth: 0 } as const;
const lifecycleBoxStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4 } as const;
const progressOuterStyle = { height: 10, borderRadius: 999, background: 'rgba(148,163,184,.18)', overflow: 'hidden' as const };
const progressInnerStyle = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#facc15,#22c55e)' };
const emptyStyle = { padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
