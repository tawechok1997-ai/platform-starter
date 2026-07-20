'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSkeleton } from '../_components/admin-ui';
import { formatMoney, humanStatus, statusTone } from '../_components/human-labels';

type Snapshot = { id: string; status: string; systemBalance: string; providerBalance: string; difference: string; checkedAt: string; user?: { username?: string | null; phone?: string | null } | null; provider?: { name?: string | null; code?: string | null } | null; rawPayload?: unknown };
type Payload = { items?: Snapshot[]; summary?: { total: number; matched: number; mismatch: number; unknown: number } };
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ReviewRequest = { item: Snapshot; status: 'REVIEWING' | 'RESOLVED' };

export default function ReconciliationCenterPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<ReviewRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const items = payload.items ?? [];
  const summary = useMemo(() => payload.summary ?? { total: items.length, matched: items.filter((i) => i.status === 'MATCHED').length, mismatch: items.filter((i) => i.status === 'MISMATCH').length, unknown: items.filter((i) => i.status === 'UNKNOWN').length }, [payload.summary, items]);
  const differenceTotal = useMemo(() => items.reduce((sum, item) => sum + Math.abs(Number(item.difference || 0)), 0), [items]);

  useEffect(() => { void load(); }, []);
  function showMessage(nextMessage: string, tone: NoticeTone = 'neutral') { setMessage(nextMessage); setMessageTone(tone); }

  async function load() {
    setLoading(true); showMessage('', 'neutral');
    try {
      const res = await adminApiFetch('/admin/provider-wallet-snapshots');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'โหลดการตรวจยอดไม่สำเร็จ');
      setPayload(data ?? {});
    } catch (error) {
      setPayload({}); showMessage(error instanceof Error ? error.message : 'โหลดการตรวจยอดไม่สำเร็จ', 'danger');
    } finally { setLoading(false); }
  }

  async function runReconcile() {
    if (!sessionId.trim()) return showMessage('กรอก Game Session ID ก่อน', 'warning');
    setLoading(true); showMessage('กำลังตรวจยอด...', 'neutral');
    try {
      const res = await adminApiFetch(`/admin/game-sessions/${sessionId.trim()}/reconcile`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'ตรวจยอดไม่สำเร็จ');
      showMessage(data.ok ? 'ยอดตรงกัน' : `ยอดยังไม่ตรง · ส่วนต่าง ${data.snapshot?.difference ?? '-'}`, data.ok ? 'success' : 'danger');
      setSessionId('');
      await load();
    } catch (error) { showMessage(error instanceof Error ? error.message : 'ตรวจยอดไม่สำเร็จ', 'danger'); }
    finally { setLoading(false); }
  }

  function requestReview(item: Snapshot, status: 'REVIEWING' | 'RESOLVED') { setReviewNote(''); setReviewRequest({ item, status }); }

  async function confirmReview() {
    if (!reviewRequest) return;
    const note = reviewNote.trim();
    if (!note) return showMessage('กรุณาระบุหมายเหตุการตรวจสอบก่อน', 'warning');
    setLoading(true); showMessage('กำลังบันทึกสถานะการตรวจ...', 'neutral');
    try {
      const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${reviewRequest.item.id}/review`, { method: 'PATCH', body: JSON.stringify({ note, status: reviewRequest.status }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'บันทึกไม่สำเร็จ');
      showMessage(reviewRequest.status === 'RESOLVED' ? 'ปิดเคสยอดไม่ตรงแล้ว' : 'บันทึกว่ากำลังตรวจแล้ว', 'success');
      setReviewRequest(null); setReviewNote(''); await load();
    } catch (error) { showMessage(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ', 'danger'); }
    finally { setLoading(false); }
  }

  return <AdminPage eyebrow="การเงิน" title="ตรวจยอดค่าย" description="เทียบยอดในระบบกับยอดฝั่งค่ายและจัดการเคสที่ไม่ตรงอย่างมีหลักฐาน" actions={<AdminButton size="compact" onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    <section className="admin-reconciliation-center" aria-busy={loading}>
      <AdminMetricGrid>
        <AdminMetric title="รายการทั้งหมด" value={String(summary.total)} helper="Snapshot ที่อยู่ในระบบ" />
        <AdminMetric title="ยอดตรง" value={String(summary.matched)} helper="ไม่ต้องดำเนินการต่อ" tone="success" />
        <AdminMetric title="ยอดไม่ตรง" value={String(summary.mismatch)} helper="ต้องตรวจสอบหลักฐาน" tone={summary.mismatch > 0 ? 'warning' : 'success'} />
        <AdminMetric title="ส่วนต่างรวม" value={formatMoney(differenceTotal)} helper="มูลค่าที่ต้องกระทบยอด" tone={differenceTotal > 0 ? 'warning' : 'success'} />
      </AdminMetricGrid>
      <div className="admin-reconciliation-center__toolbar"><input value={sessionId} onChange={(event) => setSessionId(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void runReconcile(); }} placeholder="Game Session ID" aria-label="Game Session ID" /><AdminButton size="compact" onClick={() => void runReconcile()} disabled={loading}>ตรวจยอด</AdminButton></div>
      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
      {loading && items.length === 0 ? <AdminSkeleton lines={5} /> : items.length === 0 ? <div className="admin-reconciliation-center__state"><AdminEmpty>ยังไม่มีรายการตรวจยอด</AdminEmpty></div> : <div className="admin-reconciliation-center__table-shell"><table className="admin-reconciliation-center__table"><thead><tr><th>ค่าย / สมาชิก</th><th>ยอดระบบ</th><th>ยอดค่าย</th><th>ส่วนต่าง</th><th>สถานะ</th><th>ตรวจเมื่อ</th><th>การทำงาน</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.provider?.name ?? item.provider?.code ?? '-'}</strong><br /><small>{item.user?.username ?? item.user?.phone ?? '-'}</small></td><td className="admin-reconciliation-center__amount">{formatMoney(item.systemBalance)}</td><td className="admin-reconciliation-center__amount">{formatMoney(item.providerBalance)}</td><td className="admin-reconciliation-center__amount">{formatMoney(item.difference)}</td><td><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge></td><td>{new Date(item.checkedAt).toLocaleString('th-TH')}</td><td><div className="admin-reconciliation-center__toolbar"><AdminLinkButton size="compact" href={`/provider-wallet-snapshots/${item.id}`}>ดู</AdminLinkButton>{item.status !== 'MATCHED' && <AdminButton size="compact" tone="secondary" disabled={loading} onClick={() => requestReview(item, 'REVIEWING')}>กำลังตรวจ</AdminButton>}{item.status !== 'MATCHED' && <AdminButton size="compact" tone="success" disabled={loading} onClick={() => requestReview(item, 'RESOLVED')}>ปิดเคส</AdminButton>}</div></td></tr>)}</tbody></table></div>}
    </section>
    <AdminConfirmDialog open={Boolean(reviewRequest)} title={reviewRequest?.status === 'RESOLVED' ? 'ปิดเคสยอดไม่ตรง' : 'เริ่มตรวจสอบยอดไม่ตรง'} description={reviewRequest?.status === 'RESOLVED' ? 'ยืนยันว่าตรวจสอบและแก้ไขสาเหตุเรียบร้อยแล้ว' : 'บันทึกว่าเคสนี้อยู่ระหว่างการตรวจสอบ'} confirmLabel={reviewRequest?.status === 'RESOLVED' ? 'ปิดเคส' : 'เริ่มตรวจ'} tone={reviewRequest?.status === 'RESOLVED' ? 'success' : 'primary'} busy={loading} onCancel={() => { setReviewRequest(null); setReviewNote(''); }} onConfirm={() => void confirmReview()} details={<label className="admin-ledger-field"><span>หมายเหตุการตรวจสอบ</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="ระบุสาเหตุ ผลการตรวจ หรือแนวทางแก้ไข" /></label>} />
  </AdminPage>;
}
