'use client';

import { useMemo, useState } from 'react';
import { AdminButton, AdminNotice } from './admin-ui';

type BulkResult = { id: string; ok: boolean; message: string };

type Props = {
  selectedIds: string[];
  actionLabel: string;
  confirmText: string;
  onExecute: (id: string, reason: string) => Promise<void>;
  onDone?: () => void;
  stepUpRequired?: boolean;
  onExecuteBatch?: (ids: string[], reason: string, stepUpCode: string) => Promise<BulkResult[]>;
};

export function AdminBulkAction({ selectedIds, actionLabel, confirmText, onExecute, onDone, stepUpRequired = false, onExecuteBatch }: Props) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [stepUpCode, setStepUpCode] = useState('');
  const ready = selectedIds.length > 0 && reason.trim().length >= 5 && confirmation === confirmText && (!stepUpRequired || stepUpCode.trim().length > 0) && !running;
  const failedIds = useMemo(() => results.filter((item) => !item.ok).map((item) => item.id), [results]);

  async function execute(ids = selectedIds) {
    if (!ready && ids === selectedIds) return;
    setRunning(true);
    if (onExecuteBatch && ids === selectedIds) {
      try { setResults(await onExecuteBatch(ids, reason.trim(), stepUpCode.trim())); onDone?.(); }
      catch (error) { setResults(ids.map((id) => ({ id, ok: false, message: error instanceof Error ? error.message : 'ไม่สำเร็จ' }))); }
      setRunning(false); return;
    }
    const next: BulkResult[] = [];
    for (const id of ids) {
      try { await onExecute(id, reason.trim()); next.push({ id, ok: true, message: 'สำเร็จ' }); }
      catch (error) { next.push({ id, ok: false, message: error instanceof Error ? error.message : 'ไม่สำเร็จ' }); }
    }
    setResults(next);
    setRunning(false);
    if (next.every((item) => item.ok)) onDone?.();
  }

  return <section className="admin-bulk-action" aria-label="Bulk action">
    <div className="admin-bulk-action__summary"><strong>{actionLabel}</strong><span>{selectedIds.length.toLocaleString('th-TH')} รายการที่เลือก</span></div>
    <label><span>เหตุผล</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร" /></label>
    <label><span>พิมพ์ {confirmText} เพื่อยืนยัน</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
    {stepUpRequired && <label><span>รหัส 2FA เพื่อยืนยัน</span><input value={stepUpCode} onChange={(event) => setStepUpCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label>}
    <AdminButton disabled={!ready} onClick={() => void execute()}>{running ? 'กำลังดำเนินการ...' : `ยืนยัน ${actionLabel}`}</AdminButton>
    {results.length > 0 && <div className="admin-bulk-action__results">{results.map((item) => <AdminNotice key={item.id} tone={item.ok ? 'success' : 'danger'}>{item.id.slice(0, 8)} · {item.message}</AdminNotice>)}</div>}
    {failedIds.length > 0 && <AdminButton tone="secondary" disabled={running} onClick={() => void execute(failedIds)}>ลองเฉพาะรายการที่ล้มเหลว</AdminButton>}
  </section>;
}
