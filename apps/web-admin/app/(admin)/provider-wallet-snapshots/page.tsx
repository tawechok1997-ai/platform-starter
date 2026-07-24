'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { stringifyAdminPayload } from '../_components/admin-payload-redaction';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type SnapshotStatus = 'MATCHED' | 'MISMATCH' | 'UNKNOWN' | string;
type ReviewStatus = 'REVIEWED' | 'RESOLVED' | 'IGNORED';
type Snapshot = { id: string; systemBalance: string; providerBalance: string; difference: string; status: SnapshotStatus; rawPayload?: unknown; checkedAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string } };
type Payload = { items?: Snapshot[]; summary?: { total: number; matched: number; mismatch: number; unknown: number } };
type PendingReview = { item: Snapshot; status: ReviewStatus };

export default function ProviderWalletSnapshotsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลดรายการตรวจยอด...');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState('');
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => { void loadSnapshots(); }, []);

  const items = payload.items ?? [];
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => (status === 'all' || item.status === status)
      && (!keyword || [item.provider?.name, item.provider?.code, item.user?.username, item.user?.phone, item.difference].join(' ').toLowerCase().includes(keyword)));
  }, [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? {
    total: items.length,
    matched: items.filter((item) => item.status === 'MATCHED').length,
    mismatch: items.filter((item) => item.status === 'MISMATCH').length,
    unknown: items.filter((item) => item.status === 'UNKNOWN').length,
  }, [payload.summary, items]);

  async function loadSnapshots() {
    if (loading) return;
    setLoading(true);
    setMessage('กำลังโหลดรายการตรวจยอด...');
    try {
      const res = await adminApiFetch('/admin/provider-wallet-snapshots');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('load');
      setPayload(data ?? {});
      setMessage('');
    } catch {
      setPayload({});
      setExpanded('');
      setMessage('โหลดรายการตรวจยอดไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function requestReview(item: Snapshot, nextStatus: ReviewStatus) {
    if (loading || reviewing) return;
    setReviewNote('');
    setPendingReview({ item, status: nextStatus });
  }

  async function confirmReview() {
    if (!pendingReview || loading || reviewing) return;
    const note = reviewNote.trim();
    if (note.length < 5) {
      setMessage('กรุณาระบุหมายเหตุอย่างน้อย 5 ตัวอักษร');
      return;
    }
    setReviewing(pendingReview.item.id);
    setMessage('กำลังบันทึกผลตรวจ...');
    try {
      const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${pendingReview.item.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ note, status: pendingReview.status }),
      });
      if (!res.ok) throw new Error('review');
      setPendingReview(null);
      setReviewNote('');
      setMessage(pendingReview.status === 'RESOLVED' ? 'ปิดเคสตรวจยอดแล้ว' : 'บันทึกผลตรวจแล้ว');
      await reloadSnapshots();
    } catch {
      setMessage('บันทึกผลตรวจไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setReviewing('');
    }
  }

  async function reloadSnapshots() {
    const res = await adminApiFetch('/admin/provider-wallet-snapshots');
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error('reload');
    setPayload(data ?? {});
  }

  const busy = loading || Boolean(reviewing);
  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="ตรวจยอดค่าย" description="เปรียบเทียบยอดระบบกับยอดค่ายก่อนเปิดใช้งานเงินจริง" actions={<AdminButton onClick={() => void loadSnapshots()} disabled={busy}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="รายการทั้งหมด" value={String(metrics.total)} helper="รายการตรวจยอดล่าสุด" /><AdminMetric title="ยอดตรง" value={String(metrics.matched)} helper="ไม่ต้องดำเนินการต่อ" tone="success" /><AdminMetric title="ยอดไม่ตรง" value={String(metrics.mismatch)} helper="ต้องตรวจสอบ" tone={metrics.mismatch ? 'danger' : 'success'} /><AdminMetric title="ไม่ทราบผล" value={String(metrics.unknown)} helper="ค่ายตอบกลับไม่สมบูรณ์" tone={metrics.unknown ? 'warning' : 'success'} /></AdminMetricGrid>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('กรุณา') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminToolbar><input value={query} disabled={busy} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาค่าย สมาชิก หรือส่วนต่าง" style={inputStyle} /><select value={status} disabled={busy} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">ทุกสถานะ</option><option value="MATCHED">ยอดตรง</option><option value="MISMATCH">ยอดไม่ตรง</option><option value="UNKNOWN">ไม่ทราบผล</option></select><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${filtered.length}/${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.provider?.name ?? '-'} · {item.user?.username ?? item.user?.phone ?? '-'}</h2><p style={mutedStyle}>ระบบ {item.systemBalance} · ค่าย {item.providerBalance} · ส่วนต่าง {item.difference}</p><p style={smallMutedStyle}>ตรวจเมื่อ {new Date(item.checkedAt).toLocaleString('th-TH')}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminButton tone="secondary" disabled={busy} onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'ซ่อนข้อมูล' : 'ข้อมูลเทคนิค'}</AdminButton><AdminButton tone="secondary" disabled={busy} onClick={() => requestReview(item, 'REVIEWED')}>บันทึกผลตรวจ</AdminButton><AdminButton tone="success" disabled={busy} onClick={() => requestReview(item, 'RESOLVED')}>ปิดเคส</AdminButton></div></AdminRow>{item.status === 'MISMATCH' && <AdminNotice tone="danger">ยอดไม่ตรง ต้องตรวจสอบก่อนเปิดใช้งานเงินจริง</AdminNotice>}{expanded === item.id && <pre style={preStyle}>{stringifyAdminPayload({ rawPayload: item.rawPayload })}</pre>}</AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ไม่พบรายการตรวจยอดตามเงื่อนไข</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog open={Boolean(pendingReview)} title={pendingReview?.status === 'RESOLVED' ? 'ปิดเคสตรวจยอด' : 'บันทึกผลตรวจ'} description="ระบุผลการตรวจเพื่อให้ติดตามย้อนหลังได้" confirmLabel={pendingReview?.status === 'RESOLVED' ? 'ปิดเคส' : 'บันทึกผลตรวจ'} tone={pendingReview?.status === 'RESOLVED' ? 'success' : 'primary'} busy={Boolean(reviewing)} onCancel={() => { if (!reviewing) { setPendingReview(null); setReviewNote(''); } }} onConfirm={() => void confirmReview()} details={<label style={noteStyle}><span>หมายเหตุการตรวจสอบ</span><textarea disabled={Boolean(reviewing)} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="ระบุสาเหตุ ผลการตรวจ หรือแนวทางแก้ไข" style={textareaStyle} /></label>} />
  </AdminPage>;
}

function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { if (status === 'MATCHED') return 'ยอดตรง'; if (status === 'MISMATCH') return 'ยอดไม่ตรง'; if (status === 'UNKNOWN') return 'ไม่ทราบผล'; return status; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const preStyle = { margin: 0, padding: 12, borderRadius: 14, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, fontSize: 12, lineHeight: 1.5 };
const noteStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const textareaStyle = { minHeight: 120, width: '100%', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const };