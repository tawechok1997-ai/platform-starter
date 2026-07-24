'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { stringifyAdminPayload } from '../../_components/admin-payload-redaction';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: Promise<{ id: string }> };
type Snapshot = { id: string; status: string; systemBalance: string; providerBalance: string; difference: string; checkedAt: string; rawPayload?: unknown; user?: { id?: string; username?: string | null; phone?: string | null } | null; provider?: { id?: string; name?: string | null; code?: string | null } | null };
type TimelineItem = { type: string; at: string; label: string; refId?: string };
type RelatedSession = { id: string; providerSessionId?: string | null; game?: { name?: string | null; providerGameCode?: string | null }; user?: { username?: string | null; phone?: string | null } };
type RelatedTransfer = { id: string; type: string; status: string; amount: string; currency?: string | null; provider?: { name?: string | null; code?: string | null }; session?: { game?: { name?: string | null; providerGameCode?: string | null } } };
type RelatedAlert = { id: string; title: string; type: string; createdAt: string; severity: string; status: string };
type Investigation = { snapshot: Snapshot; related?: { session?: RelatedSession | null; transfers?: RelatedTransfer[]; riskAlerts?: RelatedAlert[]; auditLogs?: unknown[] }; timeline?: TimelineItem[] };
type ReviewRequest = { status: 'REVIEWING' | 'RESOLVED' } | null;

export default function ProviderWalletSnapshotDetailPage({ params }: Props) {
  const { id } = use(params);
  const [item, setItem] = useState<Snapshot | null>(null);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [message, setMessage] = useState('กำลังโหลด snapshot...');
  const [loading, setLoading] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<ReviewRequest>(null);
  const [reviewNote, setReviewNote] = useState('');
  useEffect(() => { void load(); }, [id]);
  const meta = useMemo(() => isRecord(item?.rawPayload) ? item.rawPayload : {}, [item]);

  async function load() {
    if (loading) return;
    setLoading(true);
    setMessage('กำลังโหลด snapshot...');
    try {
      const [snapshotRes, investigationRes] = await Promise.all([
        adminApiFetch(`/admin/provider-wallet-snapshots/${id}`),
        adminApiFetch(`/admin/money-ops/provider-wallet-snapshots/${id}/investigation`),
      ]);
      const [snapshotData, investigationData] = await Promise.all([
        snapshotRes.json().catch(() => null),
        investigationRes.json().catch(() => null),
      ]);
      if (!snapshotRes.ok || !snapshotData?.id) throw new Error('snapshot');
      setItem(snapshotData as Snapshot);
      setInvestigation(investigationRes.ok && investigationData?.snapshot ? investigationData as Investigation : null);
      setMessage(investigationRes.ok ? '' : 'โหลดข้อมูลสืบสวนไม่สำเร็จ แต่ snapshot ยังเปิดได้');
    } catch {
      setItem(null);
      setInvestigation(null);
      setMessage('โหลด snapshot ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function confirmReview() {
    if (!reviewRequest || loading) return;
    const note = reviewNote.trim();
    if (note.length < 5) { setMessage('กรุณาระบุหมายเหตุอย่างน้อย 5 ตัวอักษร'); return; }
    const action = reviewRequest;
    setLoading(true);
    setMessage('กำลังบันทึกผลตรวจ...');
    try {
      const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${id}/review`, { method: 'PATCH', body: JSON.stringify({ note, status: action.status }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('review');
      setItem((data?.item ?? data) as Snapshot);
      setReviewRequest(null);
      setReviewNote('');
      setMessage(action.status === 'RESOLVED' ? 'ปิดเคส snapshot แล้ว' : 'บันทึกว่ากำลังตรวจแล้ว');
      await load();
    } catch {
      setMessage('อัปเดต snapshot ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  if (!item && !loading && message.includes('ไม่สำเร็จ')) return <AdminPage eyebrow="Reconciliation" title="Snapshot Detail"><AdminNotice tone="danger">{message}</AdminNotice><AdminButton onClick={() => void load()}>ลองใหม่</AdminButton></AdminPage>;
  return <AdminPage eyebrow="Reconciliation" title="Snapshot Detail" description="ตรวจยอด system/provider, related session และปิดเคส reconciliation" actions={<><AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton><AdminLinkButton href="/reconciliation-center">กลับศูนย์ตรวจยอด</AdminLinkButton></>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {item ? <AdminStack>
      <AdminMetricGrid><AdminMetric title="System" value={formatMoney(item.systemBalance, 'THB')} helper="ยอดในระบบ" /><AdminMetric title="Provider" value={formatMoney(item.providerBalance, 'THB')} helper="ยอดค่าย" /><AdminMetric title="Diff" value={formatMoney(item.difference, 'THB')} helper="ส่วนต่าง" /><AdminMetric title="Status" value={snapshotLabel(item.status)} helper="snapshot" /></AdminMetricGrid>
      <AdminCard title="สรุปสถานะ" description="อ่านผลโดยไม่ต้องเดาจากตัวเลขดิบ"><div style={trafficStyle(item.status)}><strong>{snapshotLabel(item.status)}</strong><p style={mutedStyle}>{snapshotDescription(item)}</p></div></AdminCard>
      <AdminCard title="ข้อมูลหลัก" description="ถ้า diff ไม่เป็น 0 ต้องตรวจ transfer, webhook และ ledger"><AdminRow><strong>Provider</strong><span>{item.provider?.name ?? item.provider?.code ?? '-'}</span></AdminRow><AdminRow><strong>User</strong><span>{item.user?.username ?? item.user?.phone ?? '-'}</span></AdminRow><AdminRow><strong>Status</strong><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow><AdminRow><strong>Checked</strong><span>{new Date(item.checkedAt).toLocaleString('th-TH')}</span></AdminRow><div style={actionRowStyle}>{item.status !== 'MATCHED' && <AdminButton tone="secondary" disabled={loading} onClick={() => { setReviewNote(''); setReviewRequest({ status: 'REVIEWING' }); }}>กำลังตรวจ</AdminButton>}{item.status !== 'MATCHED' && <AdminButton disabled={loading} onClick={() => { setReviewNote(''); setReviewRequest({ status: 'RESOLVED' }); }}>ปิดเคส</AdminButton>}</div></AdminCard>
      <AdminCard title="Investigation" description="ข้อมูลที่ระบบรวบรวมจากรายการที่เกี่ยวข้อง"><AdminMetricGrid><AdminMetric title="Session" value={investigation?.related?.session ? 'พบ' : '-'} helper={investigation?.related?.session?.providerSessionId ?? 'ไม่มี session ที่ผูก'} /><AdminMetric title="Transfers" value={String(investigation?.related?.transfers?.length ?? 0)} helper="รายการโยกเงินที่เกี่ยวข้อง" /><AdminMetric title="Risk alerts" value={String(investigation?.related?.riskAlerts?.length ?? 0)} helper="เคสความเสี่ยง" /><AdminMetric title="Audit" value={String(investigation?.related?.auditLogs?.length ?? 0)} helper="ประวัติแอดมิน" /></AdminMetricGrid></AdminCard>
      {investigation?.related?.session && <AdminCard title="Related Session" description="session ที่ใช้ตอน reconcile"><AdminRow><strong>Session</strong><span>{investigation.related.session.providerSessionId ?? investigation.related.session.id}</span></AdminRow><AdminRow><strong>Game</strong><span>{investigation.related.session.game?.name ?? investigation.related.session.game?.providerGameCode ?? '-'}</span></AdminRow><AdminRow><strong>User</strong><span>{investigation.related.session.user?.username ?? investigation.related.session.user?.phone ?? '-'}</span></AdminRow><AdminLinkButton href={`/game-sessions/${investigation.related.session.id}`}>เปิด session</AdminLinkButton></AdminCard>}
      <AdminCard title="Related Transfers" description="รายการโยกเงินที่ต้องตรวจคู่กับ diff"><div style={tableStyle}>{(investigation?.related?.transfers ?? []).length === 0 ? <AdminEmpty>ไม่มี transfer ที่เกี่ยวข้อง</AdminEmpty> : investigation?.related?.transfers?.map((transfer) => <div key={transfer.id} style={listRowStyle}><div><strong>{transfer.type}</strong><p style={mutedStyle}>{transfer.provider?.name ?? transfer.provider?.code ?? '-'} · {transfer.session?.game?.name ?? transfer.session?.game?.providerGameCode ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={transfer.status === 'SUCCESS' ? 'success' : transfer.status === 'FAILED' ? 'danger' : 'warning'}>{transfer.status}</AdminBadge><span>{formatMoney(transfer.amount, transfer.currency ?? 'THB')}</span><AdminLinkButton href={`/game-transfers/${transfer.id}`}>เปิด</AdminLinkButton></div></div>)}</div></AdminCard>
      <AdminCard title="Risk Alerts" description="ปัญหาที่ถูกสร้างจาก snapshot นี้"><div style={tableStyle}>{(investigation?.related?.riskAlerts ?? []).length === 0 ? <AdminEmpty>ไม่มี risk alert ที่ผูกกับ snapshot นี้</AdminEmpty> : investigation?.related?.riskAlerts?.map((alert) => <div key={alert.id} style={listRowStyle}><div><strong>{alert.title}</strong><p style={mutedStyle}>{alert.type} · {new Date(alert.createdAt).toLocaleString('th-TH')}</p></div><div style={rightStyle}><AdminBadge tone={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : alert.severity === 'MEDIUM' ? 'warning' : 'neutral'}>{alert.severity}</AdminBadge><AdminBadge tone={alert.status === 'RESOLVED' ? 'success' : 'warning'}>{alert.status}</AdminBadge><AdminLinkButton href="/risk-alerts">เปิด</AdminLinkButton></div></div>)}</div></AdminCard>
      <AdminCard title="Timeline" description="เรียงเหตุการณ์ล่าสุดก่อน"><div style={tableStyle}>{(investigation?.timeline ?? []).length === 0 ? <AdminEmpty>ยังไม่มี timeline เพิ่มเติม</AdminEmpty> : investigation?.timeline?.map((event, index) => <div key={`${event.type}-${event.refId ?? index}`} style={timelineRowStyle}><AdminBadge tone={event.type === 'risk_alert' ? 'danger' : event.type === 'transfer' ? 'warning' : event.type === 'audit' ? 'neutral' : 'success'}>{event.type}</AdminBadge><div><strong>{event.label}</strong><p style={mutedStyle}>{new Date(event.at).toLocaleString('th-TH')}</p></div></div>)}</div></AdminCard>
      <AdminCard title="Related Links" description="เปิดจุดที่เกี่ยวข้องเพื่อสืบยอด"><div style={actionRowStyle}>{typeof meta.sessionId === 'string' && <AdminLinkButton href={`/game-sessions/${meta.sessionId}`}>Game Session</AdminLinkButton>}{typeof meta.snapshotId === 'string' && <AdminLinkButton href={`/provider-wallet-snapshots/${meta.snapshotId}`}>Snapshot</AdminLinkButton>}<AdminLinkButton href="/game-transfers">Game Transfers</AdminLinkButton><AdminLinkButton href="/risk-alerts">Risk Alerts</AdminLinkButton></div></AdminCard>
      <AdminCard title="Raw Payload"><pre style={preStyle}>{stringifyAdminPayload(item.rawPayload ?? {})}</pre></AdminCard>
    </AdminStack> : <AdminEmpty>{loading ? 'กำลังโหลด snapshot...' : 'ไม่พบ snapshot'}</AdminEmpty>}
    <AdminConfirmDialog open={Boolean(reviewRequest)} title={reviewRequest?.status === 'RESOLVED' ? 'ปิดเคส snapshot' : 'เริ่มตรวจ snapshot'} description={reviewRequest?.status === 'RESOLVED' ? 'ยืนยันว่าตรวจสอบและแก้ไขสาเหตุของยอดไม่ตรงแล้ว' : 'บันทึกว่า snapshot นี้อยู่ระหว่างการตรวจสอบ'} confirmLabel={reviewRequest?.status === 'RESOLVED' ? 'ปิดเคส' : 'เริ่มตรวจ'} tone={reviewRequest?.status === 'RESOLVED' ? 'success' : 'primary'} busy={loading} onCancel={() => { if (!loading) { setReviewRequest(null); setReviewNote(''); } }} onConfirm={() => void confirmReview()} details={<label style={{ display: 'grid', gap: 8 }}><span>หมายเหตุ</span><textarea disabled={loading} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="ระบุอย่างน้อย 5 ตัวอักษร" style={{ minHeight: 100 }} /></label>} />
  </AdminPage>;
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
function snapshotLabel(status: string) { if (status === 'MATCHED') return 'MATCHED'; if (status === 'MISMATCH') return 'NEEDS_REVIEW'; if (status === 'UNKNOWN') return 'UNKNOWN_PROVIDER_BALANCE'; return status; }
function snapshotDescription(item: Snapshot) { if (item.status === 'MATCHED') return 'ยอดระบบและ provider ตรงกัน'; if (item.status === 'MISMATCH') return `ยอดไม่ตรง ${formatMoney(item.difference, 'THB')} ต้องตรวจ transfer, webhook และ ledger`; return 'provider ตอบไม่ชัดหรือดึงยอดไม่สำเร็จ ต้องตรวจ adapter และ log'; }
function formatMoney(value: string | number, currency: string) { const amount = Number(value); return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function trafficStyle(status: string) { const background = status === 'MATCHED' ? 'rgba(34,197,94,.14)' : status === 'MISMATCH' ? 'rgba(239,68,68,.14)' : 'rgba(245,197,66,.14)'; return { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 16, background, display: 'grid', gap: 6 } as const; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const tableStyle = { display: 'grid', gap: 10 } as const;
const listRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const, border: '1px solid rgba(148,163,184,.12)', borderRadius: 14, padding: 12 } as const;
const timelineRowStyle = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'start', border: '1px solid rgba(148,163,184,.12)', borderRadius: 14, padding: 12 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, justifyContent: 'flex-end' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 520 } as const;