'use client';

import { use, useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: Promise<{ id: string }> };

type LedgerDetail = {
  item?: any;
  related?: {
    gameTransfer?: any;
    deposit?: any;
    withdrawal?: any;
    riskAlerts?: any[];
    auditLogs?: any[];
  };
};

export default function WalletLedgerDetailPage({ params }: Props) {
  const { id } = use(params);
  const [payload, setPayload] = useState<LedgerDetail | null>(null);
  const [message, setMessage] = useState('กำลังโหลด ledger...');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลด ledger...');
    const res = await adminApiFetch(`/admin/money-ops/ledger/${id}`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setMessage(data?.message ?? 'โหลด ledger ไม่สำเร็จ');
      return;
    }
    setPayload(data);
    setMessage('');
  }

  const item = payload?.item;
  const related = payload?.related ?? {};

  return <AdminPage eyebrow="Money" title="Wallet Ledger Detail" description="ดูหนึ่งรายการเดินเงินให้รู้ว่ายอดเปลี่ยนเพราะอะไร ใครเกี่ยวข้อง และตามไปที่รายการต้นทางได้ ไม่ต้องนั่งสวดมนต์หน้า spreadsheet" actions={<><AdminButton onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</AdminButton><AdminLinkButton href="/wallet-ledgers">กลับรายการ</AdminLinkButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {!item && !message && <AdminEmpty>ไม่พบ wallet ledger</AdminEmpty>}
    {item && <AdminStack>
      <AdminMetricGrid><AdminMetric title="Type" value={item.type} helper={item.direction} /><AdminMetric title="Amount" value={formatMoney(item.amount, item.wallet?.currency ?? 'THB')} helper="จำนวน" /><AdminMetric title="Before" value={formatMoney(item.balanceBefore, item.wallet?.currency ?? 'THB')} helper="ยอดก่อน" /><AdminMetric title="After" value={formatMoney(item.balanceAfter, item.wallet?.currency ?? 'THB')} helper="ยอดหลัง" /></AdminMetricGrid>

      <AdminCard title="Ledger summary" description="ยอดก่อน / จำนวน / ยอดหลัง ต้องอธิบายเส้นทางเงินได้ครบ">
        <AdminRow><strong>{ledgerTitle(item)}</strong><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.direction}</AdminBadge></AdminRow>
        <AdminRow><strong>Created at</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>
        <AdminRow><strong>Created by admin</strong><span style={monoStyle}>{item.createdByAdminId ?? '-'}</span></AdminRow>
      </AdminCard>

      <AdminCard title="Member and wallet">
        <AdminRow><strong>Member</strong><span>{item.user?.username ?? item.user?.phone ?? item.user?.email ?? '-'}</span></AdminRow>
        <AdminRow><strong>User status</strong><AdminBadge tone={item.user?.status === 'ACTIVE' ? 'success' : 'warning'}>{item.user?.status ?? '-'}</AdminBadge></AdminRow>
        <AdminRow><strong>Wallet</strong><span style={monoStyle}>{item.wallet?.id ?? '-'}</span></AdminRow>
        <AdminRow><strong>Wallet balance now</strong><span>{formatMoney(item.wallet?.balance ?? 0, item.wallet?.currency ?? 'THB')}</span></AdminRow>
        <AdminRow><strong>Locked now</strong><span>{formatMoney(item.wallet?.lockedBalance ?? 0, item.wallet?.currency ?? 'THB')}</span></AdminRow>
      </AdminCard>

      <AdminCard title="Reference and idempotency" description="จุดเชื่อมโยงไป record ต้นทาง ถ้า reference หายคือเริ่มมีงานนักสืบให้ทำ">
        <AdminRow><strong>Reference type</strong><span>{item.referenceType ?? '-'}</span></AdminRow>
        <AdminRow><strong>Reference id</strong><span style={monoStyle}>{item.referenceId ?? '-'}</span></AdminRow>
        <AdminRow><strong>Idempotency key</strong><span style={monoStyle}>{item.idempotencyKey ?? '-'}</span></AdminRow>
      </AdminCard>

      {related.gameTransfer && <AdminCard title="Related game transfer" action={<AdminLinkButton href={`/game-transfers/${related.gameTransfer.id}`}>เปิด transfer</AdminLinkButton>}>
        <AdminRow><strong>Transfer</strong><span>{related.gameTransfer.type} · {related.gameTransfer.status}</span></AdminRow>
        <AdminRow><strong>Provider</strong><span>{related.gameTransfer.provider?.name ?? related.gameTransfer.provider?.code ?? '-'}</span></AdminRow>
        <AdminRow><strong>Game</strong><span>{related.gameTransfer.session?.game?.name ?? related.gameTransfer.session?.game?.providerGameCode ?? '-'}</span></AdminRow>
      </AdminCard>}

      {related.deposit && <JsonCard title="Related deposit" payload={related.deposit} />}
      {related.withdrawal && <JsonCard title="Related withdrawal" payload={related.withdrawal} />}

      <AdminCard title="Risk alerts">
        {related.riskAlerts?.length ? <AdminStack>{related.riskAlerts.map((alert: any) => <AdminRow key={alert.id}><div><strong>{alert.title ?? alert.type}</strong><p style={mutedStyle}>{alert.refType ?? '-'} · {alert.refId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'warning'}>{alert.severity}</AdminBadge><AdminLinkButton href={`/risk-alerts/${alert.id}`}>Open</AdminLinkButton></div></AdminRow>)}</AdminStack> : <p style={mutedStyle}>ยังไม่มี alert ที่โยงกับ ledger นี้</p>}
      </AdminCard>

      <AdminCard title="Audit timeline">
        {related.auditLogs?.length ? <AdminStack>{related.auditLogs.map((log: any) => <AdminRow key={log.id}><div><strong>{log.action}</strong><p style={mutedStyle}>{log.module} · {new Date(log.createdAt).toLocaleString('th-TH')}</p></div><span style={monoStyle}>{log.adminUserId ?? '-'}</span></AdminRow>)}</AdminStack> : <p style={mutedStyle}>ยังไม่มี audit log ที่โยงกับรายการนี้</p>}
      </AdminCard>

      <JsonCard title="Metadata" payload={item.metadata ?? {}} />
    </AdminStack>}
  </AdminPage>;
}

function JsonCard({ title, payload }: { title: string; payload: unknown }) { return <AdminCard title={title}><pre style={preStyle}>{JSON.stringify(payload ?? {}, null, 2)}</pre></AdminCard>; }
function ledgerTitle(item: any) { if (item.referenceType?.includes('GAME')) return item.direction === 'DEBIT' ? 'โยกเข้าเกม' : item.type === 'REVERSAL' ? 'Rollback คืนวอเลต' : 'โยกกลับวอเลต'; if (item.type === 'DEPOSIT') return 'ฝาก'; if (item.type === 'WITHDRAWAL') return 'ถอนเงิน'; if (item.type === 'ADJUSTMENT') return 'ปรับยอด'; return item.type; }
function formatMoney(value: string | number, currency: string) { const amount = Number(value ?? 0); return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 460 } as const;
