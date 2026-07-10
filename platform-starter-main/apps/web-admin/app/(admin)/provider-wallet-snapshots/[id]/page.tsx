'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: { id: string } };

type Snapshot = { id: string; status: string; systemBalance: string; providerBalance: string; difference: string; checkedAt: string; rawPayload?: any; user?: { id?: string; username?: string | null; phone?: string | null } | null; provider?: { id?: string; name?: string | null; code?: string | null } | null };
type TimelineItem = { type: string; at: string; label: string; refId?: string };
type Investigation = { snapshot: Snapshot; related?: { session?: any; transfers?: any[]; riskAlerts?: any[]; auditLogs?: any[] }; timeline?: TimelineItem[] };

export default function ProviderWalletSnapshotDetailPage({ params }: Props) {
  const [item, setItem] = useState<Snapshot | null>(null);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [message, setMessage] = useState('กำลังโหลด snapshot...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, [params.id]);
  const meta = useMemo(() => item?.rawPayload ?? {}, [item]);
  async function load() {
    setLoading(true);
    const [snapshotRes, investigationRes] = await Promise.all([
      adminApiFetch(`/admin/provider-wallet-snapshots/${params.id}`),
      adminApiFetch(`/admin/money-ops/provider-wallet-snapshots/${params.id}/investigation`),
    ]);
    const snapshotData = await snapshotRes.json().catch(() => null);
    const investigationData = await investigationRes.json().catch(() => null);
    setLoading(false);
    if (!snapshotRes.ok) { setMessage(snapshotData?.message ?? 'โหลด snapshot ไม่สำเร็จ'); return; }
    setItem(snapshotData);
    setInvestigation(investigationRes.ok ? investigationData : null);
    setMessage(investigationRes.ok ? '' : investigationData?.message ?? 'โหลด investigation ไม่สำเร็จ แต่ snapshot ยังเปิดได้');
  }
  async function review(status: 'REVIEWING' | 'RESOLVED') { const note = window.prompt(status === 'RESOLVED' ? 'Resolve note' : 'Review note') ?? ''; if (!note) return; setLoading(true); const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${params.id}/review`, { method: 'PATCH', body: JSON.stringify({ note, status }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'อัปเดต snapshot ไม่สำเร็จ'); return; } setMessage(status === 'RESOLVED' ? 'resolve snapshot แล้ว' : 'บันทึก review แล้ว'); setItem(data.item ?? data); load(); }
  if (!item && !message) return <AdminPage eyebrow="Reconciliation" title="Snapshot Detail"><AdminEmpty>ไม่พบ snapshot</AdminEmpty></AdminPage>;
  return <AdminPage eyebrow="Reconciliation" title="Snapshot Detail" description="ตรวจยอด system/provider, raw payload, related session และปิดเคส reconciliation" actions={<><AdminButton onClick={load} disabled={loading}>Refresh</AdminButton><AdminLinkButton href="/reconciliation-center">กลับศูนย์ reconcile</AdminLinkButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {item && <AdminStack>
      <AdminMetricGrid><AdminMetric title="System" value={formatMoney(item.systemBalance, 'THB')} helper="ยอดในระบบ" /><AdminMetric title="Provider" value={formatMoney(item.providerBalance, 'THB')} helper="ยอดค่าย" /><AdminMetric title="Diff" value={formatMoney(item.difference, 'THB')} helper="ส่วนต่าง" /><AdminMetric title="Status" value={snapshotLabel(item.status)} helper="snapshot" /></AdminMetricGrid>
      <AdminCard title="Traffic-light" description="อ่านผลแบบไม่ต้องเปิดเครื่องคิดเลขแล้วหวังว่าตัวเลขจะเมตตา"><div style={trafficStyle(item.status)}><strong>{snapshotLabel(item.status)}</strong><p style={mutedStyle}>{snapshotDescription(item)}</p></div></AdminCard>
      <AdminCard title="Summary" description="ถ้า diff ไม่เป็น 0 ต้องตาม related transfer/webhook/ledger"><AdminRow><strong>Provider</strong><span>{item.provider?.name ?? item.provider?.code ?? '-'}</span></AdminRow><AdminRow><strong>User</strong><span>{item.user?.username ?? item.user?.phone ?? '-'}</span></AdminRow><AdminRow><strong>Status</strong><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow><AdminRow><strong>Checked</strong><span>{new Date(item.checkedAt).toLocaleString('th-TH')}</span></AdminRow><div style={actionRowStyle}>{item.status !== 'MATCHED' && <AdminButton tone="secondary" onClick={() => review('REVIEWING')} disabled={loading}>Mark Reviewing</AdminButton>}{item.status !== 'MATCHED' && <AdminButton onClick={() => review('RESOLVED')} disabled={loading}>Resolve</AdminButton>}</div></AdminCard>
      <AdminCard title="Investigation" description="ข้อมูลที่ backend รวบมาให้ ไม่ต้องเดาเหมือนอ่านไพ่ยิปซีของระบบเงิน"><AdminMetricGrid><AdminMetric title="Session" value={investigation?.related?.session ? 'พบ' : '-'} helper={investigation?.related?.session?.providerSessionId ?? 'ไม่มี session ที่ผูก'} /><AdminMetric title="Transfers" value={String(investigation?.related?.transfers?.length ?? 0)} helper="รายการโยกเงินที่เกี่ยวข้อง" /><AdminMetric title="Risk alerts" value={String(investigation?.related?.riskAlerts?.length ?? 0)} helper="เคสความเสี่ยง" /><AdminMetric title="Audit" value={String(investigation?.related?.auditLogs?.length ?? 0)} helper="ประวัติแอดมิน" /></AdminMetricGrid></AdminCard>
      {investigation?.related?.session && <AdminCard title="Related Session" description="session ที่ใช้ตอน reconcile"><AdminRow><strong>Session</strong><span>{investigation.related.session.providerSessionId ?? investigation.related.session.id}</span></AdminRow><AdminRow><strong>Game</strong><span>{investigation.related.session.game?.name ?? investigation.related.session.game?.providerGameCode ?? '-'}</span></AdminRow><AdminRow><strong>User</strong><span>{investigation.related.session.user?.username ?? investigation.related.session.user?.phone ?? '-'}</span></AdminRow><div style={actionRowStyle}><AdminLinkButton href={`/game-sessions/${investigation.related.session.id}`}>เปิด session</AdminLinkButton></div></AdminCard>}
      <AdminCard title="Related Transfers" description="รายการโยกเงินที่ต้องตรวจคู่กับ diff"><div style={tableStyle}>{(investigation?.related?.transfers ?? []).length === 0 ? <AdminEmpty>ไม่มี transfer ที่เกี่ยวข้อง</AdminEmpty> : investigation?.related?.transfers?.map((transfer) => <div key={transfer.id} style={listRowStyle}><div><strong>{transfer.type}</strong><p style={mutedStyle}>{transfer.provider?.name ?? transfer.provider?.code ?? '-'} · {transfer.session?.game?.name ?? transfer.session?.game?.providerGameCode ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={transfer.status === 'SUCCESS' ? 'success' : transfer.status === 'FAILED' ? 'danger' : 'warning'}>{transfer.status}</AdminBadge><span>{formatMoney(transfer.amount, transfer.currency ?? 'THB')}</span><AdminLinkButton href={`/game-transfers/${transfer.id}`}>เปิด</AdminLinkButton></div></div>)}</div></AdminCard>
      <AdminCard title="Risk Alerts" description="ปัญหาที่ถูกสร้างจาก snapshot นี้"><div style={tableStyle}>{(investigation?.related?.riskAlerts ?? []).length === 0 ? <AdminEmpty>ไม่มี risk alert ที่ผูกกับ snapshot นี้</AdminEmpty> : investigation?.related?.riskAlerts?.map((alert) => <div key={alert.id} style={listRowStyle}><div><strong>{alert.title}</strong><p style={mutedStyle}>{alert.type} · {new Date(alert.createdAt).toLocaleString('th-TH')}</p></div><div style={rightStyle}><AdminBadge tone={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : alert.severity === 'MEDIUM' ? 'warning' : 'neutral'}>{alert.severity}</AdminBadge><AdminBadge tone={alert.status === 'RESOLVED' ? 'success' : 'warning'}>{alert.status}</AdminBadge><AdminLinkButton href="/risk-alerts">เปิด</AdminLinkButton></div></div>)}</div></AdminCard>
      <AdminCard title="Timeline" description="เรียงเหตุการณ์ล่าสุดก่อน"><div style={tableStyle}>{(investigation?.timeline ?? []).length === 0 ? <AdminEmpty>ยังไม่มี timeline เพิ่มเติม</AdminEmpty> : investigation?.timeline?.map((event, index) => <div key={`${event.type}-${event.refId ?? index}`} style={timelineRowStyle}><AdminBadge tone={event.type === 'risk_alert' ? 'danger' : event.type === 'audit' ? 'neutral' : event.type === 'transfer' ? 'warning' : 'success'}>{event.type}</AdminBadge><div><strong>{event.label}</strong><p style={mutedStyle}>{new Date(event.at).toLocaleString('th-TH')}</p></div></div>)}</div></AdminCard>
      <AdminCard title="Related Links" description="เปิดจุดที่เกี่ยวข้องเพื่อสืบยอด"><div style={actionRowStyle}>{meta.sessionId && <AdminLinkButton href={`/game-sessions/${meta.sessionId}`}>Game Session</AdminLinkButton>}{meta.snapshotId && <AdminLinkButton href={`/provider-wallet-snapshots/${meta.snapshotId}`}>Snapshot</AdminLinkButton>}{meta.adapterResult?.payload?.providerTransactionId && <AdminLinkButton href="/game-transfers">Game Transfers</AdminLinkButton>}{meta.walletLedgerId && <AdminLinkButton href={`/wallet-ledgers/${meta.walletLedgerId}`}>Wallet Ledger</AdminLinkButton>}<AdminLinkButton href="/risk-alerts">Risk Alerts</AdminLinkButton></div></AdminCard>
      <JsonCard title="Raw Payload" payload={item.rawPayload} />
    </AdminStack>}
  </AdminPage>;
}
function JsonCard({ title, payload }: { title: string; payload: unknown }) { return <AdminCard title={title}><pre style={preStyle}>{JSON.stringify(payload ?? {}, null, 2)}</pre></AdminCard>; }
function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
function snapshotLabel(status: string) { if (status === 'MATCHED') return 'MATCHED'; if (status === 'MISMATCH') return 'NEEDS_REVIEW'; if (status === 'UNKNOWN') return 'UNKNOWN_PROVIDER_BALANCE'; return status; }
function snapshotDescription(item: Snapshot) { if (item.status === 'MATCHED') return 'ยอดระบบและ provider ตรงกัน'; if (item.status === 'MISMATCH') return `ยอดไม่ตรง diff ${formatMoney(item.difference, 'THB')} ต้องตรวจ transfer/webhook/ledger`; return 'provider ตอบไม่ชัดหรือดึง balance ไม่สำเร็จ ต้องตรวจ adapter/log'; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function trafficStyle(status: string) { const background = status === 'MATCHED' ? 'rgba(34,197,94,.14)' : status === 'MISMATCH' ? 'rgba(239,68,68,.14)' : 'rgba(245,197,66,.14)'; return { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 16, background, display: 'grid', gap: 6 } as const; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const tableStyle = { display: 'grid', gap: 10 } as const;
const listRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const, border: '1px solid rgba(148,163,184,.12)', borderRadius: 14, padding: 12 } as const;
const timelineRowStyle = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'start', border: '1px solid rgba(148,163,184,.12)', borderRadius: 14, padding: 12 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, justifyContent: 'flex-end' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 520 } as const;
