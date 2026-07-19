'use client';

import { use, useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: Promise<{ id: string }> };
type ActionKind = 'review' | 'retry' | 'reverse' | 'forceFail';
type Transfer = { id: string; type: string; status: string; amount: string; currency: string; idempotencyKey: string; providerTransactionId?: string | null; errorCode?: string | null; errorMessage?: string | null; requestPayload?: unknown; responsePayload?: any; createdAt: string; resolvedAt?: string | null; user?: { username?: string | null; phone?: string | null } | null; provider?: { name?: string | null; code?: string | null } | null; session?: { id: string; providerSessionId?: string | null; game?: { name?: string | null; providerGameCode?: string | null } | null } | null };

type PendingAction = { kind: ActionKind; item: Transfer };

export default function GameTransferDetailPage({ params }: Props) {
  const { id } = use(params);
  const [item, setItem] = useState<Transfer | null>(null);
  const [message, setMessage] = useState('กำลังโหลดรายการ...');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { void load(); }, [id]);

  async function load() {
    setLoading(true);
    const res = await adminApiFetch(`/admin/game-transfers/${id}`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ'); return; }
    setItem(data);
    setMessage('');
  }

  function requestAction(kind: ActionKind) {
    if (!item) return;
    setNote('');
    setPendingAction({ kind, item });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const reason = note.trim();
    if (!reason) { setMessage('กรุณาระบุเหตุผลหรือหมายเหตุก่อนดำเนินการ'); return; }

    const { kind } = pendingAction;
    const path = kind === 'review'
      ? `/admin/game-transfers/${id}/review`
      : kind === 'retry'
        ? `/admin/game-transfers/${id}/retry-dry-run`
        : kind === 'reverse'
          ? `/admin/game-transfers/${id}/actions/manual-reverse`
          : `/admin/game-transfers/${id}/actions/force-fail`;
    const method = kind === 'review' ? 'PATCH' : kind === 'retry' ? 'POST' : 'PATCH';

    setLoading(true);
    const res = await adminApiFetch(path, { method, body: JSON.stringify({ note: reason }) });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok || data?.ok === false) { setMessage(data?.message ?? 'ดำเนินการไม่สำเร็จ'); return; }

    setPendingAction(null);
    setNote('');
    setMessage(actionSuccess(kind));
    await load();
  }

  if (!item && !message) return <AdminPage eyebrow="แพลตฟอร์มเกม" title="รายละเอียดรายการ"><AdminEmpty>ไม่พบรายการ</AdminEmpty></AdminPage>;

  return <AdminPage
    eyebrow="แพลตฟอร์มเกม"
    title="รายละเอียดการโยกเงิน"
    description="ตรวจสถานะ ยอดเงิน และประวัติการทำงานของรายการ"
    actions={<div style={pageActionsStyle}><AdminLinkButton href="/game-transfers">← กลับ</AdminLinkButton><AdminButton onClick={() => void load()} disabled={loading}>↻ รีเฟรช</AdminButton></div>}
  >
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('กรุณา') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {item && <AdminStack>
      <AdminCard title="สถานะการกู้คืน" description={recoveryDescription(item)} tone={recoveryTone(item)}>
        <AdminRow><strong>{recoveryLabel(item)}</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminRow>
      </AdminCard>

      <AdminCard title="ข้อมูลรายการ" description="ข้อมูลหลักที่ใช้ตรวจสอบกับสมาชิกและค่ายเกม">
        <AdminRow><div><strong>{transferLabel(item.type)}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.provider?.name ?? item.provider?.code ?? '-'}</p></div><strong style={amountStyle}>{formatMoney(item.amount, item.currency)}</strong></AdminRow>
        <DataRow label="เกม" value={item.session?.game?.name ?? item.session?.game?.providerGameCode ?? '-'} />
        <DataRow label="เซสชันค่าย" value={item.session?.providerSessionId ?? item.session?.id ?? '-'} mono />
        <DataRow label="เลขอ้างอิงค่าย" value={item.providerTransactionId ?? '-'} mono />
        <DataRow label="รหัสกันรายการซ้ำ" value={item.idempotencyKey} mono />
        <DataRow label="สร้างเมื่อ" value={new Date(item.createdAt).toLocaleString('th-TH')} />
      </AdminCard>

      <AdminCard title="การดำเนินการ" description={actionHint(item)}>
        <div style={actionRowStyle}>
          <AdminButton tone="secondary" onClick={() => requestAction('review')} disabled={loading}>บันทึกผลตรวจ</AdminButton>
          {item.status === 'FAILED' && <AdminButton onClick={() => requestAction('retry')} disabled={loading}>ทดสอบใหม่</AdminButton>}
          {item.status === 'SUCCESS' && <AdminButton tone="danger" onClick={() => requestAction('reverse')} disabled={loading}>ย้อนรายการ</AdminButton>}
          {item.status === 'PENDING' && <AdminButton tone="danger" onClick={() => requestAction('forceFail')} disabled={loading}>ปิดเป็นล้มเหลว</AdminButton>}
        </div>
      </AdminCard>

      {(item.errorCode || item.errorMessage) && <AdminCard title="ข้อผิดพลาด" tone="danger"><AdminNotice tone="danger">{item.errorCode ?? '-'} · {item.errorMessage ?? '-'}</AdminNotice></AdminCard>}

      <AdminCard title="ประวัติกระเป๋าเงิน" description="เลขบัญชีแยกประเภทที่สร้างจากรายการนี้">
        <LedgerRow label="รายการหลัก" id={item.responsePayload?.walletLedgerId} />
        <LedgerRow label="รายการตัดยอด" id={item.responsePayload?.walletDebitLedgerId} />
        <LedgerRow label="รายการคืนยอด" id={item.responsePayload?.walletRollbackLedgerId} />
        <LedgerRow label="รายการย้อนด้วยมือ" id={item.responsePayload?.manualReverse?.ledgerId} />
        <DataRow label="ยอดคงเหลือหลังทำรายการ" value={item.responsePayload?.walletBalanceAfter ?? item.responsePayload?.walletBalanceAfterRollback ?? item.responsePayload?.manualReverse?.balanceAfter ?? '-'} />
      </AdminCard>

      <JsonCard title="ข้อมูลที่ส่งไปยังค่าย" payload={item.requestPayload} />
      <JsonCard title="ข้อมูลที่ค่ายตอบกลับ" payload={item.responsePayload} />
    </AdminStack>}

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={pendingAction ? actionTitle(pendingAction.kind) : ''}
      description={pendingAction ? actionDescription(pendingAction.kind) : ''}
      confirmLabel={pendingAction ? actionConfirmLabel(pendingAction.kind) : 'ยืนยัน'}
      tone={pendingAction?.kind === 'reverse' || pendingAction?.kind === 'forceFail' ? 'danger' : pendingAction?.kind === 'retry' ? 'primary' : 'success'}
      busy={loading}
      onCancel={() => { setPendingAction(null); setNote(''); }}
      onConfirm={() => void confirmAction()}
      details={<label style={noteStyle}><span>เหตุผล / หมายเหตุ</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="ระบุข้อมูลให้ผู้ตรวจคนถัดไปเข้าใจ" style={textareaStyle} /></label>}
    />
  </AdminPage>;
}

function DataRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return <AdminRow><strong style={labelStyle}>{label}</strong><span style={mono ? monoStyle : valueStyle}>{value}</span></AdminRow>;
}

function LedgerRow({ label, id }: { label: string; id?: string | null }) {
  return <AdminRow><div style={{ minWidth: 0 }}><strong style={labelStyle}>{label}</strong><p style={monoStyle}>{id ?? '-'}</p></div>{id ? <AdminLinkButton href={`/wallet-ledgers/${id}`}>เปิดรายการ</AdminLinkButton> : null}</AdminRow>;
}

function JsonCard({ title, payload }: { title: string; payload: unknown }) {
  return <AdminCard title={title}><details><summary style={summaryStyle}>ดูข้อมูลเทคนิค</summary><pre style={preStyle}>{JSON.stringify(payload ?? {}, null, 2)}</pre></details></AdminCard>;
}

function transferLabel(type: string) { return type === 'TRANSFER_IN' ? 'โยกเข้าเกม' : type === 'TRANSFER_OUT' ? 'โยกกลับกระเป๋า' : type === 'ROLLBACK' ? 'คืนรายการ' : type; }
function statusLabel(status: string) { return ({ SUCCESS: 'สำเร็จ', FAILED: 'ล้มเหลว', PENDING: 'กำลังดำเนินการ', REVERSED: 'ย้อนรายการแล้ว' } as Record<string, string>)[status] ?? status; }
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function recoveryTone(item: Transfer) { if (item.status === 'FAILED') return 'danger'; if (item.status === 'PENDING') return 'warning'; return 'success'; }
function recoveryLabel(item: Transfer) { if (item.status === 'SUCCESS') return item.responsePayload?.manualReverse ? 'มีการย้อนหรือปรับยอดแล้ว' : 'สำเร็จและพร้อมติดตาม'; if (item.status === 'FAILED' && item.responsePayload?.walletRollbackLedgerId) return 'ล้มเหลวและคืนยอดแล้ว'; if (item.status === 'FAILED') return 'ล้มเหลวและอาจทดสอบใหม่ได้'; if (item.status === 'PENDING') return 'รายการค้างรอตรวจ'; return statusLabel(item.status); }
function recoveryDescription(item: Transfer) { if (item.status === 'SUCCESS') return 'ตรวจเลขอ้างอิงและบัญชีแยกประเภทก่อนย้อนรายการ'; if (item.status === 'FAILED' && item.responsePayload?.walletRollbackLedgerId) return 'ระบบสร้างรายการคืนยอดแล้ว ควรตรวจยอดสมาชิกอีกครั้ง'; if (item.status === 'FAILED') return 'ตรวจฝั่งค่ายก่อนทดสอบใหม่ เพื่อป้องกันรายการซ้ำ'; if (item.status === 'PENDING') return 'ตรวจสถานะจากค่ายก่อนปิดรายการเป็นล้มเหลว'; return 'ตรวจข้อมูลเทคนิคและประวัติการทำงานเพิ่มเติม'; }
function actionHint(item: Transfer) { if (item.status === 'FAILED') return 'ทดสอบใหม่เฉพาะเมื่อยืนยันว่าค่ายไม่ได้ทำรายการเดิมสำเร็จ'; if (item.status === 'SUCCESS') return 'การย้อนรายการมีผลต่อยอดเงินจริง ต้องตรวจเลขอ้างอิงและบัญชีแยกประเภทก่อน'; if (item.status === 'PENDING') return 'ปิดเป็นล้มเหลวเมื่อยืนยันแล้วว่าค่ายไม่รับรายการหรือหมดเวลารอ'; return 'บันทึกผลตรวจเพื่อให้ติดตามย้อนหลังได้'; }
function actionTitle(kind: ActionKind) { return ({ review: 'บันทึกผลตรวจ', retry: 'ทดสอบรายการใหม่', reverse: 'ย้อนรายการด้วยมือ', forceFail: 'ปิดรายการเป็นล้มเหลว' } as Record<ActionKind, string>)[kind]; }
function actionDescription(kind: ActionKind) { return ({ review: 'หมายเหตุจะถูกบันทึกไว้กับรายการเพื่อใช้ติดตามย้อนหลัง', retry: 'ระบบจะสร้างการทดสอบใหม่ ต้องมั่นใจว่าค่ายไม่ได้ทำรายการเดิมสำเร็จ', reverse: 'การย้อนรายการมีผลต่อยอดเงินจริง โปรดตรวจเลขอ้างอิงและบัญชีแยกประเภทก่อน', forceFail: 'ใช้เฉพาะเมื่อยืนยันแล้วว่ารายการค้างจริงและค่ายไม่รับรายการ' } as Record<ActionKind, string>)[kind]; }
function actionConfirmLabel(kind: ActionKind) { return ({ review: 'บันทึกผลตรวจ', retry: 'ทดสอบใหม่', reverse: 'ยืนยันย้อนรายการ', forceFail: 'ยืนยันปิดรายการ' } as Record<ActionKind, string>)[kind]; }
function actionSuccess(kind: ActionKind) { return ({ review: 'บันทึกผลตรวจแล้ว', retry: 'ทดสอบรายการใหม่แล้ว', reverse: 'ย้อนรายการแล้ว', forceFail: 'ปิดรายการเป็นล้มเหลวแล้ว' } as Record<ActionKind, string>)[kind]; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const pageActionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const labelStyle = { color: '#cbd5e1', fontSize: 13, lineHeight: 1.4 } as const;
const valueStyle = { color: '#f8fafc', textAlign: 'right' as const, overflowWrap: 'anywhere' as const, minWidth: 0, maxWidth: '100%' };
const monoStyle = { margin: '4px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12, lineHeight: 1.55, overflowWrap: 'anywhere' as const, wordBreak: 'break-word' as const, color: '#cbd5e1', minWidth: 0, maxWidth: '100%' };
const amountStyle = { fontSize: 'clamp(20px, 6vw, 30px)', textAlign: 'right' as const, whiteSpace: 'nowrap' as const };
const summaryStyle = { cursor: 'pointer', color: '#cbd5e1', fontWeight: 800, padding: '4px 0' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, wordBreak: 'break-word' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 420, fontSize: 12, lineHeight: 1.5 } as const;
const noteStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const textareaStyle = { minHeight: 120, width: '100%', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const };
