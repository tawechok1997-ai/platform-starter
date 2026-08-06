'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSkeleton } from '../_components/admin-ui';
import { formatMoney, humanStatus, statusTone } from '../_components/human-labels';
import {
  createAdminIncidentId,
  normalizeReconciliationPayload,
  readAdminLocale,
  safeMoneyValue,
  type AdminLocale,
  type ReconciliationPayload,
  type ReconciliationSnapshot,
} from '../../../src/features/admin-reliability/admin-data-contracts';

type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ReviewRequest = { item: ReconciliationSnapshot; status: 'REVIEWING' | 'RESOLVED' };
type LoadState = 'loading' | 'ready' | 'empty' | 'partial' | 'error';

const EMPTY_PAYLOAD: ReconciliationPayload = {
  items: [],
  summary: { total: 0, matched: 0, mismatch: 0, unknown: 0 },
};

export default function ReconciliationCenterPage() {
  const [payload, setPayload] = useState<ReconciliationPayload>(EMPTY_PAYLOAD);
  const [locale, setLocale] = useState<AdminLocale>('th');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadReference, setLoadReference] = useState('');
  const [contractIssues, setContractIssues] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [busy, setBusy] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<ReviewRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const copy = COPY[locale];
  const items = payload.items;
  const summary = payload.summary;
  const differenceTotal = useMemo(
    () => items.reduce((sum, item) => sum + Math.abs(Number(safeMoneyValue(item.difference))), 0),
    [items],
  );
  const exceptionItems = useMemo(() => items.filter((item) => item.status !== 'MATCHED'), [items]);

  useEffect(() => {
    setLocale(readAdminLocale());
    void load();
  }, []);

  function showMessage(nextMessage: string, tone: NoticeTone = 'neutral') {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  async function load(force = false) {
    if (busy && !force) return;
    setBusy(true);
    setLoadState((current) => current === 'error' || current === 'empty' ? 'loading' : current);
    setLoadReference('');
    setContractIssues([]);
    showMessage('', 'neutral');
    try {
      const response = await adminApiFetch('/admin/provider-wallet-snapshots');
      const rawPayload = await response.json().catch(() => null);
      const contract = normalizeReconciliationPayload(rawPayload);
      if (!response.ok || !contract.data) {
        const incidentId = createAdminIncidentId('REC');
        console.error('Admin reconciliation request failed', {
          incidentId,
          status: response.status,
          contractIssues: contract.issues,
          apiMessage: readApiMessage(rawPayload),
        });
        setPayload(EMPTY_PAYLOAD);
        setLoadState('error');
        setLoadReference(incidentId);
        return;
      }
      setPayload(contract.data);
      setContractIssues(contract.issues);
      setLoadState(contract.partial ? 'partial' : contract.data.items.length === 0 ? 'empty' : 'ready');
    } catch (caught) {
      const incidentId = createAdminIncidentId('REC');
      console.error('Admin reconciliation request crashed', { incidentId, error: caught });
      setPayload(EMPTY_PAYLOAD);
      setLoadState('error');
      setLoadReference(incidentId);
    } finally {
      setBusy(false);
    }
  }

  async function runReconcile() {
    if (busy) return;
    if (!sessionId.trim()) return showMessage(copy.enterSession, 'warning');
    setBusy(true);
    showMessage(copy.reconciling, 'neutral');
    try {
      const response = await adminApiFetch(`/admin/game-sessions/${sessionId.trim()}/reconcile`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const incidentId = createAdminIncidentId('REC-RUN');
        console.error('Admin reconciliation command failed', {
          incidentId,
          status: response.status,
          apiMessage: readApiMessage(data),
        });
        showMessage(`${copy.reconcileFailed} · ${copy.reference} ${incidentId}`, 'danger');
        return;
      }
      const ok = isRecord(data) && data.ok === true;
      const snapshot = isRecord(data) && isRecord(data.snapshot) ? data.snapshot : null;
      const difference = safeMoneyValue(snapshot?.difference);
      showMessage(ok ? copy.matched : `${copy.mismatch} · ${copy.difference} ${formatMoney(difference)}`, ok ? 'success' : 'danger');
      setSessionId('');
      await load(true);
    } catch (caught) {
      const incidentId = createAdminIncidentId('REC-RUN');
      console.error('Admin reconciliation command crashed', { incidentId, error: caught });
      showMessage(`${copy.reconcileFailed} · ${copy.reference} ${incidentId}`, 'danger');
    } finally {
      setBusy(false);
    }
  }

  function exportExceptions() {
    if (exceptionItems.length === 0 || busy || loadState === 'error' || loadState === 'loading') return;
    const rows = [
      copy.csvHeaders,
      ...exceptionItems.map((item) => [
        formatIsoDate(item.checkedAt),
        item.status,
        item.provider?.name ?? item.provider?.code ?? '-',
        item.user?.username ?? item.user?.phone ?? '-',
        safeMoneyValue(item.systemBalance),
        safeMoneyValue(item.providerBalance),
        safeMoneyValue(item.difference),
        item.id,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reconciliation-exceptions-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showMessage(`${copy.exported} ${exceptionItems.length.toLocaleString(locale === 'en' ? 'en-US' : 'th-TH')} ${copy.items}`, 'success');
  }

  function requestReview(item: ReconciliationSnapshot, status: 'REVIEWING' | 'RESOLVED') {
    setReviewNote('');
    setReviewRequest({ item, status });
  }

  async function confirmReview() {
    if (!reviewRequest || busy) return;
    const note = reviewNote.trim();
    if (!note) return showMessage(copy.noteRequired, 'warning');
    setBusy(true);
    showMessage(copy.savingReview, 'neutral');
    try {
      const response = await adminApiFetch(`/admin/provider-wallet-snapshots/${reviewRequest.item.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ note, status: reviewRequest.status }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const incidentId = createAdminIncidentId('REC-REVIEW');
        console.error('Admin reconciliation review failed', {
          incidentId,
          status: response.status,
          apiMessage: readApiMessage(data),
        });
        showMessage(`${copy.saveFailed} · ${copy.reference} ${incidentId}`, 'danger');
        return;
      }
      showMessage(reviewRequest.status === 'RESOLVED' ? copy.caseClosed : copy.reviewStarted, 'success');
      setReviewRequest(null);
      setReviewNote('');
      await load(true);
    } catch (caught) {
      const incidentId = createAdminIncidentId('REC-REVIEW');
      console.error('Admin reconciliation review crashed', { incidentId, error: caught });
      showMessage(`${copy.saveFailed} · ${copy.reference} ${incidentId}`, 'danger');
    } finally {
      setBusy(false);
    }
  }

  return <AdminPage
    eyebrow={copy.eyebrow}
    title={copy.title}
    description={copy.description}
    actions={<>
      <AdminButton
        size="compact"
        tone="secondary"
        onClick={exportExceptions}
        disabled={busy || exceptionItems.length === 0 || loadState === 'error' || loadState === 'loading'}
      >{copy.export}</AdminButton>
      <AdminButton size="compact" onClick={() => void load()} disabled={busy}>{busy ? copy.loading : copy.refresh}</AdminButton>
    </>}
  >
    <section className="admin-reconciliation-center" aria-busy={busy || loadState === 'loading'}>
      <AdminMetricGrid>
        <AdminMetric title={copy.total} value={String(summary.total)} helper={copy.totalHelper} />
        <AdminMetric title={copy.matchedTotal} value={String(summary.matched)} helper={copy.matchedHelper} tone="success" />
        <AdminMetric title={copy.mismatchTotal} value={String(summary.mismatch)} helper={copy.mismatchHelper} tone={summary.mismatch > 0 ? 'warning' : 'success'} />
        <AdminMetric title={copy.differenceTotal} value={formatMoney(differenceTotal)} helper={copy.differenceHelper} tone={differenceTotal > 0 ? 'warning' : 'success'} />
      </AdminMetricGrid>

      <div className="admin-reconciliation-center__toolbar">
        <input
          value={sessionId}
          disabled={busy}
          onChange={(event) => setSessionId(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void runReconcile(); }}
          placeholder="Game Session ID"
          aria-label="Game Session ID"
        />
        <AdminButton size="compact" onClick={() => void runReconcile()} disabled={busy}>{copy.reconcile}</AdminButton>
      </div>

      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
      {loadState === 'partial' && <AdminNotice tone="warning">{copy.partialData} ({contractIssues.length.toLocaleString(locale === 'en' ? 'en-US' : 'th-TH')} {copy.fields})</AdminNotice>}
      {loadState === 'error' && <AdminNotice tone="danger">{copy.loadFailed} · {copy.reference} {loadReference}</AdminNotice>}

      {loadState === 'loading' && items.length === 0 ? <AdminSkeleton lines={5} /> : loadState === 'error' ? (
        <div className="admin-reconciliation-center__state">
          <AdminEmpty>{copy.loadFailed}</AdminEmpty>
          <AdminButton onClick={() => void load()} disabled={busy}>{copy.retry}</AdminButton>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-reconciliation-center__state"><AdminEmpty>{copy.empty}</AdminEmpty></div>
      ) : (
        <div className="admin-reconciliation-center__table-shell">
          <table className="admin-reconciliation-center__table">
            <thead><tr>{copy.tableHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}>
              <td><strong>{item.provider?.name ?? item.provider?.code ?? '-'}</strong><br /><small>{item.user?.username ?? item.user?.phone ?? '-'}</small></td>
              <td className="admin-reconciliation-center__amount">{formatMoney(safeMoneyValue(item.systemBalance))}</td>
              <td className="admin-reconciliation-center__amount">{formatMoney(safeMoneyValue(item.providerBalance))}</td>
              <td className="admin-reconciliation-center__amount">{formatMoney(safeMoneyValue(item.difference))}</td>
              <td><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge></td>
              <td>{formatDisplayDate(item.checkedAt, locale)}</td>
              <td><div className="admin-reconciliation-center__toolbar">
                <AdminLinkButton size="compact" href={`/provider-wallet-snapshots/${item.id}`}>{copy.view}</AdminLinkButton>
                {item.status !== 'MATCHED' && <AdminButton size="compact" tone="secondary" disabled={busy} onClick={() => requestReview(item, 'REVIEWING')}>{copy.reviewing}</AdminButton>}
                {item.status !== 'MATCHED' && <AdminButton size="compact" tone="success" disabled={busy} onClick={() => requestReview(item, 'RESOLVED')}>{copy.closeCase}</AdminButton>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>

    <AdminConfirmDialog
      open={Boolean(reviewRequest)}
      title={reviewRequest?.status === 'RESOLVED' ? copy.closeDialogTitle : copy.reviewDialogTitle}
      description={reviewRequest?.status === 'RESOLVED' ? copy.closeDialogDescription : copy.reviewDialogDescription}
      confirmLabel={reviewRequest?.status === 'RESOLVED' ? copy.closeCase : copy.startReview}
      tone={reviewRequest?.status === 'RESOLVED' ? 'success' : 'primary'}
      busy={busy}
      onCancel={() => { if (!busy) { setReviewRequest(null); setReviewNote(''); } }}
      onConfirm={() => void confirmReview()}
      details={<label className="admin-ledger-field"><span>{copy.reviewNote}</span><textarea disabled={busy} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={copy.reviewNotePlaceholder} /></label>}
    />
  </AdminPage>;
}

function readApiMessage(value: unknown) {
  if (!isRecord(value)) return null;
  return typeof value.message === 'string' && value.message.trim() ? value.message : null;
}

function formatIsoDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() > 0 ? date.toISOString() : '-';
}

function formatDisplayDate(value: string, locale: AdminLocale) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() > 0
    ? date.toLocaleString(locale === 'en' ? 'en-US' : 'th-TH')
    : '-';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const COPY = {
  th: {
    eyebrow: 'การเงิน', title: 'ตรวจยอดค่าย', description: 'เทียบยอดในระบบกับยอดฝั่งค่ายและจัดการเคสที่ไม่ตรงอย่างมีหลักฐาน',
    export: 'ส่งออกข้อผิดปกติ CSV', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', reconcile: 'ตรวจยอด', retry: 'ลองใหม่',
    total: 'รายการทั้งหมด', totalHelper: 'Snapshot ที่อยู่ในระบบ', matchedTotal: 'ยอดตรง', matchedHelper: 'ไม่ต้องดำเนินการต่อ', mismatchTotal: 'ยอดไม่ตรง', mismatchHelper: 'ต้องตรวจสอบหลักฐาน', differenceTotal: 'ส่วนต่างรวม', differenceHelper: 'มูลค่าที่ต้องกระทบยอด',
    enterSession: 'กรอก Game Session ID ก่อน', reconciling: 'กำลังตรวจยอด...', matched: 'ยอดตรงกัน', mismatch: 'ยอดยังไม่ตรง', difference: 'ส่วนต่าง', reconcileFailed: 'ตรวจยอดไม่สำเร็จ',
    loadFailed: 'โหลดการตรวจยอดไม่สำเร็จ', partialData: 'ข้อมูลบางช่องไม่สมบูรณ์ ระบบปรับเป็นค่าปลอดภัยแล้ว', reference: 'รหัสอ้างอิง', fields: 'จุด', empty: 'ยังไม่มีรายการตรวจยอด',
    exported: 'ส่งออกรายการผิดปกติ', items: 'รายการแล้ว', noteRequired: 'กรุณาระบุหมายเหตุการตรวจสอบก่อน', savingReview: 'กำลังบันทึกสถานะการตรวจ...', saveFailed: 'บันทึกไม่สำเร็จ', caseClosed: 'ปิดเคสยอดไม่ตรงแล้ว', reviewStarted: 'บันทึกว่ากำลังตรวจแล้ว',
    view: 'ดู', reviewing: 'กำลังตรวจ', closeCase: 'ปิดเคส', startReview: 'เริ่มตรวจ', closeDialogTitle: 'ปิดเคสยอดไม่ตรง', reviewDialogTitle: 'เริ่มตรวจสอบยอดไม่ตรง', closeDialogDescription: 'ยืนยันว่าตรวจสอบและแก้ไขสาเหตุเรียบร้อยแล้ว', reviewDialogDescription: 'บันทึกว่าเคสนี้อยู่ระหว่างการตรวจสอบ', reviewNote: 'หมายเหตุการตรวจสอบ', reviewNotePlaceholder: 'ระบุสาเหตุ ผลการตรวจ หรือแนวทางแก้ไข',
    tableHeaders: ['ค่าย / สมาชิก', 'ยอดระบบ', 'ยอดค่าย', 'ส่วนต่าง', 'สถานะ', 'ตรวจเมื่อ', 'การทำงาน'],
    csvHeaders: ['ตรวจเมื่อ', 'สถานะ', 'ค่าย', 'สมาชิก', 'ยอดระบบ', 'ยอดค่าย', 'ส่วนต่าง', 'Snapshot ID'],
  },
  en: {
    eyebrow: 'Finance', title: 'Provider reconciliation', description: 'Compare platform and provider balances, then resolve mismatches with traceable evidence.',
    export: 'Export exceptions CSV', refresh: 'Refresh', loading: 'Loading...', reconcile: 'Reconcile', retry: 'Retry',
    total: 'Total snapshots', totalHelper: 'Snapshots currently in the system', matchedTotal: 'Matched', matchedHelper: 'No follow-up required', mismatchTotal: 'Mismatched', mismatchHelper: 'Evidence review required', differenceTotal: 'Total difference', differenceHelper: 'Value requiring reconciliation',
    enterSession: 'Enter a Game Session ID first', reconciling: 'Reconciling...', matched: 'Balances match', mismatch: 'Balances still differ', difference: 'Difference', reconcileFailed: 'Unable to reconcile',
    loadFailed: 'Unable to load reconciliation data', partialData: 'Some fields were incomplete and were normalized to safe values', reference: 'Reference', fields: 'fields', empty: 'No reconciliation snapshots yet',
    exported: 'Exported', items: 'exception items', noteRequired: 'Enter a review note first', savingReview: 'Saving review status...', saveFailed: 'Unable to save', caseClosed: 'Mismatch case closed', reviewStarted: 'Case marked as under review',
    view: 'View', reviewing: 'Reviewing', closeCase: 'Close case', startReview: 'Start review', closeDialogTitle: 'Close mismatch case', reviewDialogTitle: 'Start mismatch review', closeDialogDescription: 'Confirm that the cause was reviewed and resolved.', reviewDialogDescription: 'Record that this case is under review.', reviewNote: 'Review note', reviewNotePlaceholder: 'Describe the cause, findings, or resolution',
    tableHeaders: ['Provider / member', 'System balance', 'Provider balance', 'Difference', 'Status', 'Checked at', 'Actions'],
    csvHeaders: ['Checked at', 'Status', 'Provider', 'Member', 'System balance', 'Provider balance', 'Difference', 'Snapshot ID'],
  },
} as const;
