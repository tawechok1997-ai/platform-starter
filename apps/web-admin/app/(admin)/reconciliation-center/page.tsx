'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { formatMoney, humanStatus, statusTone } from '../_components/human-labels';

type Snapshot = { id: string; status: string; systemBalance: string; providerBalance: string; difference: string; checkedAt: string; user?: { username?: string | null; phone?: string | null } | null; provider?: { name?: string | null; code?: string | null } | null; rawPayload?: unknown };
type Payload = { items?: Snapshot[]; summary?: { total: number; matched: number; mismatch: number; unknown: number } };
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ReviewRequest = { item: Snapshot; status: 'REVIEWING' | 'RESOLVED' };

export default function ReconciliationCenterPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('กำลังโหลดการตรวจยอด...');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<ReviewRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const items = payload.items ?? [];
  const summary = useMemo(() => payload.summary ?? { total: items.length, matched: items.filter((i) => i.status === 'MATCHED').length, mismatch: items.filter((i) => i.status === 'MISMATCH').length, unknown: items.filter((i) => i.status === 'UNKNOWN').length }, [payload.summary, items]);

  useEffect(() => { void load(); }, []);

  function showMessage(nextMessage: string, tone: NoticeTone = 'neutral') {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  async function load() {
    setLoading(true);
    showMessage('กำลังโหลดการตรวจยอด...', 'neutral');
    const res = await adminApiFetch('/admin/provider-wallet-snapshots');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      showMessage(data?.message ?? 'โหลดการตรวจยอดไม่สำเร็จ', 'danger');
      return;
    }
    setPayload(data ?? {});
    showMessage('');
  }

  async function runReconcile() {
    if (!sessionId.trim()) {
      showMessage('กรอก Game Session ID ก่อน', 'warning');
      return;
    }
    setLoading(true);
    showMessage('กำลังตรวจยอด...', 'neutral');
    const res = await adminApiFetch(`/admin/game-sessions/${sessionId.trim()}/reconcile`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      showMessage(data?.message ?? 'ตรวจยอดไม่สำเร็จ', 'danger');
      return;
    }
    showMessage(data.ok ? 'ยอดตรงกัน' : `ยอดยังไม่ตรง · ส่วนต่าง ${data.snapshot?.difference ?? '-'}`, data.ok ? 'success' : 'danger');
    setSessionId('');
    await load();
  }

  function requestReview(item: Snapshot, status: 'REVIEWING' | 'RESOLVED') {
    setReviewNote('');
    setReviewRequest({ item, status });
  }

  async function confirmReview() {
    if (!reviewRequest) return;
    const note = reviewNote.trim();
    if (!note) {
      showMessage('กรุณาระบุหมายเหตุการตรวจสอบก่อน', 'warning');
      return;
    }
    setLoading(true);
    showMessage('กำลังบันทึกสถานะการตรวจ...', 'neutral');
    const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${reviewRequest.item.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ note, status: reviewRequest.status }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      showMessage(data?.message ?? 'บันทึกไม่สำเร็จ', 'danger');
      return;
    }
    showMessage(reviewRequest.status === 'RESOLVED' ? 'ปิดเคสยอดไม่ตรงแล้ว' : 'บันทึกว่ากำลังตรวจแล้ว', 'success');
    setReviewRequest(null);
    setReviewNote('');
    await load();
  }

  return <AdminPage eyebrow="การเงิน" title="ตรวจยอดค่าย" description="เทียบยอดเงินในระบบกับยอดฝั่งค่าย ถ้ายอดไม่ตรงต้องตรวจ ก่อนเปิดเงินจริง" actions={<AdminButton onClick={() => void load()} disabled={loading}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(summary.total)} helper="รายการตรวจล่าสุด" /><AdminMetric title="ยอดตรง" value={String(summary.matched)} helper="ปลอดภัย" /><AdminMetric title="ยอดไม่ตรง" value={String(summary.mismatch)} helper="ต้องตรวจ" /><AdminMetric title="ไม่รู้ผล" value={String(summary.unknown)} helper="ค่ายตอบไม่ชัด" /></AdminMetricGrid>
    <AdminCard title="ตรวจยอดจาก Session" description="ใช้เมื่ออยากเทียบยอดของ session หนึ่งกับค่าย"><div style={formStyle}><input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="Game Session ID" style={inputStyle} /><AdminButton onClick={() => void runReconcile()} disabled={loading}>ตรวจยอด</AdminButton></div></AdminCard>
    <AdminToolbar><strong>ผลตรวจยอด</strong><span style={mutedStyle}>ถ้ายอดไม่ตรง อย่ากดผ่านเพราะอยากให้หน้าดูสะอาด ระบบเงินไม่ใช่โต๊ะทำงาน</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{item.provider?.name ?? item.provider?.code ?? '-'}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {new Date(item.checkedAt).toLocaleString('th-TH')}</p><p style={smallStyle}>ระบบ {formatMoney(item.systemBalance)} · ค่าย {formatMoney(item.providerBalance)} · ส่วนต่าง {formatMoney(item.difference)}</p></div><div style={actionsStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminLinkButton href={`/provider-wallet-snapshots/${item.id}`}>ดู</AdminLinkButton>{item.status !== 'MATCHED' && <AdminButton tone="secondary" onClick={() => requestReview(item, 'REVIEWING')}>กำลังตรวจ</AdminButton>}{item.status !== 'MATCHED' && <AdminButton tone="success" onClick={() => requestReview(item, 'RESOLVED')}>ปิดเคส</AdminButton>}</div></AdminRow><details style={detailsStyle}><summary>ข้อมูลเทคนิค</summary><pre style={preStyle}>{JSON.stringify(item.rawPayload ?? {}, null, 2)}</pre></details></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มีรายการตรวจยอด</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog
      open={Boolean(reviewRequest)}
      title={reviewRequest?.status === 'RESOLVED' ? 'ปิดเคสยอดไม่ตรง' : 'เริ่มตรวจสอบยอดไม่ตรง'}
      description={reviewRequest?.status === 'RESOLVED' ? 'ยืนยันว่าตรวจสอบและแก้ไขสาเหตุเรียบร้อยแล้ว' : 'บันทึกว่าเคสนี้อยู่ระหว่างการตรวจสอบ'}
      confirmLabel={reviewRequest?.status === 'RESOLVED' ? 'ปิดเคส' : 'เริ่มตรวจ'}
      tone={reviewRequest?.status === 'RESOLVED' ? 'success' : 'primary'}
      busy={loading}
      onCancel={() => { setReviewRequest(null); setReviewNote(''); }}
      onConfirm={() => void confirmReview()}
      details={<label className="admin-ledger-field"><span>หมายเหตุการตรวจสอบ</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="ระบุสาเหตุ ผลการตรวจ หรือแนวทางแก้ไข" /></label>}
    />
  </AdminPage>;
}

const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const formStyle = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const detailsStyle = { color: '#cbd5e1' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12 } as const;