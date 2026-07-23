'use client';

import { useMemo, useState } from 'react';
import { useAdminMutationGuard } from './admin-mutation-guard';
import { AdminButton, AdminConfirmDialog, AdminNotice } from './admin-ui';

type BulkResult = { id: string; ok: boolean; message: string };

function safeActionMessage(error: unknown) {
  if (error instanceof Error && /^(ไม่สำเร็จ|ทำรายการไม่สำเร็จ|โหลดข้อมูลไม่สำเร็จ)$/u.test(error.message.trim())) return error.message;
  return 'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบรายละเอียดและลองใหม่';
}

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
  const [results, setResults] = useState<BulkResult[]>([]);
  const [stepUpCode, setStepUpCode] = useState('');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const mutation = useAdminMutationGuard();
  const running = mutation.busy;
  const ready = selectedIds.length > 0 && reason.trim().length >= 5 && confirmation === confirmText && (!stepUpRequired || stepUpCode.trim().length > 0) && !running;
  const failedIds = useMemo(() => results.filter((item) => !item.ok).map((item) => item.id), [results]);

  function requestExecute(ids: string[], requireReady: boolean) {
    if (ids.length === 0 || running || (requireReady && !ready)) return;
    setPendingIds([...ids]);
  }

  async function executePending() {
    const ids = [...pendingIds];
    if (ids.length === 0) return;

    await mutation.run(`bulk:${confirmText}:${ids.slice().sort().join(',')}`, async () => {
      if (onExecuteBatch) {
        try {
          setResults(await onExecuteBatch(ids, reason.trim(), stepUpCode.trim()));
          onDone?.();
        } catch (error) {
          setResults(ids.map((id) => ({ id, ok: false, message: safeActionMessage(error) })));
        }
        return;
      }

      const next: BulkResult[] = [];
      for (const id of ids) {
        try {
          await onExecute(id, reason.trim());
          next.push({ id, ok: true, message: 'สำเร็จ' });
        } catch (error) {
          next.push({ id, ok: false, message: safeActionMessage(error) });
        }
      }
      setResults(next);
      if (next.every((item) => item.ok)) onDone?.();
    });
    setPendingIds([]);
  }

  return <section className="admin-bulk-action" aria-label="Bulk action">
    <div className="admin-bulk-action__summary"><strong>{actionLabel}</strong><span>{selectedIds.length.toLocaleString('th-TH')} รายการที่เลือก</span></div>
    <label><span>เหตุผล</span><textarea value={reason} disabled={running} onChange={(event) => setReason(event.target.value)} placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร" /></label>
    <label><span>พิมพ์ {confirmText} เพื่อยืนยัน</span><input value={confirmation} disabled={running} onChange={(event) => setConfirmation(event.target.value)} /></label>
    {stepUpRequired && <label><span>รหัส 2FA เพื่อยืนยัน</span><input value={stepUpCode} disabled={running} onChange={(event) => setStepUpCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label>}
    <AdminButton disabled={!ready} onClick={() => requestExecute(selectedIds, true)}>{running ? 'กำลังดำเนินการ...' : `ตรวจสอบ ${actionLabel}`}</AdminButton>
    {results.length > 0 && <div className="admin-bulk-action__results">{results.map((item) => <AdminNotice key={item.id} tone={item.ok ? 'success' : 'danger'}>{item.id.slice(0, 8)} · {item.message}</AdminNotice>)}</div>}
    {failedIds.length > 0 && <AdminButton tone="secondary" disabled={running} onClick={() => requestExecute(failedIds, false)}>ลองเฉพาะรายการที่ล้มเหลว</AdminButton>}
    <AdminConfirmDialog
      open={pendingIds.length > 0}
      title={`ยืนยัน ${actionLabel}`}
      description={stepUpRequired ? 'รายการนี้มีผลต่อยอดเงินจริง ระบบจะกันการกดซ้ำและส่ง Idempotency-Key ไปกับคำขอ' : 'ตรวจจำนวนรายการและเหตุผลก่อนดำเนินการ'}
      confirmLabel={`ยืนยัน ${actionLabel}`}
      tone={stepUpRequired ? 'danger' : 'primary'}
      busy={running}
      onCancel={() => { if (!running) setPendingIds([]); }}
      onConfirm={() => void executePending()}
      details={<><p><strong>จำนวน:</strong> {pendingIds.length.toLocaleString('th-TH')} รายการ</p><p><strong>เหตุผล:</strong> {reason.trim() || '-'}</p><p><strong>คำยืนยัน:</strong> {confirmText}</p>{stepUpRequired && <p><strong>2FA:</strong> ระบุแล้ว</p>}</>}
    />
  </section>;
}
