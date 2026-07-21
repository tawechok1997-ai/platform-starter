'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type BonusLedger = { id: string; claimId: string; campaignId: string; campaign?: { title?: string }; amount: number; currency: string; turnoverRequired: number; turnoverProgress: number; turnoverCompleted: boolean; lifecycleStatus?: string; lifecycleNote?: string; walletCreditEnabled: boolean; walletCreditStatus: string; status: string; rawStatus: string; events?: Array<{ by: string; action: string; amount?: number; message?: string; createdAt: string }>; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string; resolvedAt?: string | null };
type PendingAction = { id: string; action: 'RELEASE' | 'EXPIRE' | 'REVOKE' } | null;

export default function BonusLedgersPage() {
  const [items, setItems] = useState<BonusLedger[]>([]);
  const [status, setStatus] = useState('ALL');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดบัญชีโบนัส...');
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => { void load(); }, [status]);

  const stats = useMemo(() => ({
    active: items.filter((item) => !isClosed(item) && item.lifecycleStatus !== 'SETTLED').length,
    completed: items.filter((item) => item.turnoverCompleted).length,
    settled: items.filter((item) => item.lifecycleStatus === 'SETTLED' || item.walletCreditStatus === 'CREDITED').length,
    remaining: items.reduce((sum, item) => sum + Math.max(Number(item.turnoverRequired || 0) - Number(item.turnoverProgress || 0), 0), 0),
  }), [items]);

  async function load() {
    setMessage('กำลังโหลดบัญชีโบนัส...');
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    const res = await adminApiFetch(`/admin/bonus-ledgers?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดบัญชีโบนัสไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  async function addProgress(id: string) {
    const amount = Number(amounts[id] || 0);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage('กรุณาใส่ยอดทำรายการที่ต้องการเพิ่มมากกว่า 0'); return; }
    setBusyId(id);
    const res = await adminApiFetch(`/admin/bonus-ledgers/${id}/turnover-progress`, { method: 'PATCH', body: JSON.stringify({ amount, note: notes[id] ?? '' }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตยอดทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? data.item : item));
    setAmounts((current) => ({ ...current, [id]: '' }));
    setNotes((current) => ({ ...current, [id]: '' }));
    setMessage('อัปเดตยอดทำรายการแล้ว');
  }

  function requestLifecycle(id: string, action: 'RELEASE' | 'EXPIRE' | 'REVOKE') {
    const note = (notes[id] ?? '').trim();
    if ((action === 'EXPIRE' || action === 'REVOKE') && !note) { setMessage('กรุณาใส่เหตุผลก่อนหมดอายุหรือยกเลิกโบนัส'); return; }
    setPendingAction({ id, action });
  }

  async function confirmLifecycle() {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    const note = (notes[id] ?? '').trim();
    setBusyId(`${id}:${action}`);
    const res = await adminApiFetch(`/admin/bonus-ledgers/${id}/lifecycle`, { method: 'PATCH', body: JSON.stringify({ action, note }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตสถานะโบนัสไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? data.item : item));
    setNotes((current) => ({ ...current, [id]: '' }));
    setPendingAction(null);
    setMessage(action === 'RELEASE' ? 'จ่ายโบนัสเข้ากระเป๋าเงินแล้ว' : action === 'EXPIRE' ? 'ตั้งโบนัสเป็นหมดอายุแล้ว' : 'ยกเลิกโบนัสแล้ว');
  }

  const pendingItem = pendingAction ? items.find((item) => item.id === pendingAction.id) : undefined;

  return <AdminPage eyebrow="งานโบนัส" title="บัญชีโบนัส" description="ติดตามยอดโบนัส ยอดทำรายการ และสถานะการจ่ายเข้ากระเป๋าเงินของสมาชิก" actions={<AdminButton onClick={() => void load()}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={stats.active > 0 ? 'warning' : 'success'} title="โบนัสที่กำลังใช้งาน" value={String(stats.active)} /><AdminMetric tone="success" title="ทำรายการครบแล้ว" value={String(stats.completed)} /><AdminMetric tone="success" title="จ่ายแล้ว" value={String(stats.settled)} /><AdminMetric tone={stats.remaining > 0 ? 'danger' : 'success'} title="ยอดทำรายการคงเหลือ" value={money(stats.remaining)} /></AdminMetricGrid>
    <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">กำลังใช้งาน</option><option value="REVIEWING">กำลังตรวจ</option><option value="RESOLVED">ครบเงื่อนไขหรือจ่ายแล้ว</option><option value="DISMISSED">หมดอายุหรือยกเลิก</option></select></AdminToolbar>
    <AdminGrid>{items.map((item) => <AdminCard key={item.id} title={item.campaign?.title ?? item.campaignId} description={`${memberLabel(item)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`} tone={cardTone(item)}><AdminStack>
      <AdminRow><strong>สถานะบัญชีโบนัส</strong><span><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status)}</AdminBadge> <AdminBadge tone={item.walletCreditEnabled ? 'success' : 'warning'}>{walletCreditLabel(item.walletCreditStatus)}</AdminBadge></span></AdminRow>
      <AdminRow><strong>วงจรโบนัส</strong><span>{lifecycleLabel(item.lifecycleStatus)}</span></AdminRow>
      {item.lifecycleNote && <AdminRow><strong>หมายเหตุ</strong><span>{item.lifecycleNote}</span></AdminRow>}
      <AdminRow><strong>ยอดโบนัส</strong><span>{money(item.amount)} {item.currency}</span></AdminRow>
      <AdminRow><strong>ยอดทำรายการ</strong><span>{money(item.turnoverProgress)} / {money(item.turnoverRequired)}</span></AdminRow>
      <div style={progressOuterStyle}><div style={{ ...progressInnerStyle, width: `${progressPercent(item)}%` }} /></div>
      <section style={timelineStyle}>{(item.events ?? []).slice(-5).map((event, index) => <div key={index} style={eventStyle}><AdminBadge tone={event.by === 'admin' ? 'success' : event.by === 'member' ? 'warning' : 'neutral'}>{senderLabel(event.by)}</AdminBadge><strong>{eventActionLabel(event.action)}</strong><span>{event.amount ? money(event.amount) : event.message || '-'}</span><small>{new Date(event.createdAt).toLocaleString('th-TH')}</small></div>)}</section>
      {!isClosed(item) && item.lifecycleStatus !== 'SETTLED' && <input value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="หมายเหตุหรือเหตุผล" style={inputStyle} />}
      {!item.turnoverCompleted && !isClosed(item) && <div style={formGridStyle}><input type="number" value={amounts[item.id] ?? ''} onChange={(event) => setAmounts((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="เพิ่มยอดทำรายการ" style={inputStyle} /><AdminButton disabled={busyId === item.id} onClick={() => void addProgress(item.id)}>บันทึกยอดเพิ่ม</AdminButton></div>}
      <div style={actionRowStyle}>{item.turnoverCompleted && !isClosed(item) && item.lifecycleStatus !== 'SETTLED' && <AdminButton disabled={Boolean(busyId)} tone="success" onClick={() => requestLifecycle(item.id, 'RELEASE')}>จ่ายโบนัสเข้ากระเป๋าเงิน</AdminButton>}{!isClosed(item) && item.lifecycleStatus !== 'SETTLED' && <AdminButton disabled={Boolean(busyId)} tone="secondary" onClick={() => requestLifecycle(item.id, 'EXPIRE')}>ทำเครื่องหมายว่าหมดอายุ</AdminButton>}{!isClosed(item) && item.lifecycleStatus !== 'SETTLED' && <AdminButton disabled={Boolean(busyId)} tone="danger" onClick={() => requestLifecycle(item.id, 'REVOKE')}>ยกเลิกโบนัส</AdminButton>}</div>
    </AdminStack></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีบัญชีโบนัส</AdminEmpty>}</AdminGrid>
    <AdminNotice tone="warning">การจ่ายโบนัสเป็นการเพิ่มเงินจริงเข้ากระเป๋าสมาชิก ควรตรวจยอดทำรายการ สมาชิก และเหตุการณ์ย้อนหลังให้ครบก่อนยืนยัน</AdminNotice>
    <AdminConfirmDialog open={Boolean(pendingAction)} title={actionTitle(pendingAction?.action)} description={actionDescription(pendingAction?.action)} confirmLabel={actionConfirmLabel(pendingAction?.action)} tone={pendingAction?.action === 'RELEASE' ? 'success' : pendingAction?.action === 'REVOKE' ? 'danger' : 'primary'} busy={Boolean(pendingAction && busyId === `${pendingAction.id}:${pendingAction.action}`)} details={pendingItem ? <div style={confirmDetailsStyle}><strong>{pendingItem.campaign?.title ?? pendingItem.campaignId}</strong><span>{memberLabel(pendingItem)}</span><span>ยอดโบนัส {money(pendingItem.amount)}</span><span>ยอดทำรายการ {money(pendingItem.turnoverProgress)} / {money(pendingItem.turnoverRequired)}</span>{(notes[pendingItem.id] ?? '').trim() && <span>เหตุผล: {(notes[pendingItem.id] ?? '').trim()}</span>}</div> : undefined} onConfirm={() => void confirmLifecycle()} onCancel={() => { if (!busyId) setPendingAction(null); }} />
  </AdminPage>;
}

function memberLabel(item: BonusLedger) { return item.member?.username ?? item.member?.phone ?? item.member?.email ?? '-'; }
function statusLabel(status: string) { const map: Record<string, string> = { ACTIVE: 'กำลังใช้งาน', REVIEWING: 'กำลังตรวจ', TURNOVER_COMPLETED: 'ทำรายการครบแล้ว', RELEASE_READY: 'พร้อมจ่าย', COMPLETED: 'เสร็จสิ้น', SETTLED: 'จ่ายแล้ว', EXPIRED: 'หมดอายุ', REVOKED: 'ยกเลิกแล้ว' }; return map[status] ?? status; }
function lifecycleLabel(status?: string) { if (!status) return '-'; return statusLabel(status); }
function walletCreditLabel(status: string) { const map: Record<string, string> = { CREDITED: 'จ่ายเข้ากระเป๋าแล้ว', READY_FOR_MANUAL_RELEASE: 'พร้อมจ่าย', READY_FOR_MANUAL_SETTLEMENT: 'พร้อมจ่าย', BLOCKED_UNTIL_TURNOVER_GUARD: 'รอทำรายการให้ครบ', EXPIRED_NO_WALLET_CREDIT: 'หมดอายุโดยไม่จ่าย', REVOKED_NO_WALLET_CREDIT: 'ยกเลิกโดยไม่จ่าย' }; return map[status] ?? status; }
function senderLabel(sender: string) { const map: Record<string, string> = { admin: 'ผู้ดูแล', member: 'สมาชิก', system: 'ระบบ' }; return map[sender] ?? sender; }
function eventActionLabel(action: string) { const map: Record<string, string> = { BONUS_LEDGER_CREATED: 'สร้างบัญชีโบนัส', TURNOVER_PROGRESS: 'เพิ่มยอดทำรายการ', BONUS_RELEASE: 'จ่ายโบนัส', BONUS_EXPIRE: 'หมดอายุ', BONUS_REVOKE: 'ยกเลิกโบนัส' }; return map[action] ?? action; }
function isClosed(item: BonusLedger) { return item.status === 'EXPIRED' || item.status === 'REVOKED' || item.lifecycleStatus === 'EXPIRED' || item.lifecycleStatus === 'REVOKED'; }
function badgeTone(status: string) { if (status === 'RELEASE_READY' || status === 'TURNOVER_COMPLETED' || status === 'COMPLETED' || status === 'SETTLED') return 'success'; if (status === 'EXPIRED' || status === 'REVOKED') return 'danger'; return 'warning'; }
function cardTone(item: BonusLedger) { if (isClosed(item)) return 'danger'; if (item.lifecycleStatus === 'SETTLED' || item.walletCreditStatus === 'CREDITED') return 'success'; if (item.turnoverCompleted) return 'success'; return 'warning'; }
function progressPercent(item: BonusLedger) { const required = Number(item.turnoverRequired || 0); if (required <= 0) return 100; return Math.min(100, Math.round((Number(item.turnoverProgress || 0) / required) * 100)); }
function actionTitle(action?: 'RELEASE' | 'EXPIRE' | 'REVOKE') { return action === 'RELEASE' ? 'ยืนยันการจ่ายโบนัส' : action === 'EXPIRE' ? 'ยืนยันการหมดอายุ' : 'ยืนยันการยกเลิกโบนัส'; }
function actionDescription(action?: 'RELEASE' | 'EXPIRE' | 'REVOKE') { return action === 'RELEASE' ? 'ระบบจะเพิ่มยอดโบนัสเข้ากระเป๋าเงินของสมาชิก การดำเนินการนี้มีผลต่อเงินจริง' : action === 'EXPIRE' ? 'โบนัสนี้จะหมดอายุและไม่ถูกจ่ายเข้ากระเป๋าเงิน' : 'โบนัสนี้จะถูกยกเลิกและไม่สามารถนำกลับมาใช้ได้'; }
function actionConfirmLabel(action?: 'RELEASE' | 'EXPIRE' | 'REVOKE') { return action === 'RELEASE' ? 'ยืนยันจ่ายโบนัส' : action === 'EXPIRE' ? 'ยืนยันหมดอายุ' : 'ยืนยันยกเลิก'; }
function money(value: number) { const amount = Number(value); return `THB ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 8 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const progressOuterStyle = { height: 10, borderRadius: 999, background: 'rgba(148,163,184,.18)', overflow: 'hidden' as const };
const progressInnerStyle = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#facc15,#22c55e)' };
const timelineStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 8 } as const;
const eventStyle = { display: 'grid', gap: 4, borderBottom: '1px solid rgba(148,163,184,.10)', paddingBottom: 8 } as const;
const confirmDetailsStyle = { display: 'grid', gap: 6 } as const;
