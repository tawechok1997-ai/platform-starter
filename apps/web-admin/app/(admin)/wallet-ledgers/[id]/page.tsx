'use client';

import { use, useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { stringifyAdminPayload } from '../../_components/admin-payload-redaction';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: Promise<{ id: string }> };
type LedgerUser = { username?: string | null; phone?: string | null; email?: string | null; status?: string | null };
type LedgerWallet = { id?: string | null; currency?: string | null; balance?: string | number | null; lockedBalance?: string | number | null };
type LedgerItem = { id: string; type: string; direction: string; amount: string | number; balanceBefore: string | number; balanceAfter: string | number; createdAt: string; createdByAdminId?: string | null; referenceType?: string | null; referenceId?: string | null; idempotencyKey?: string | null; metadata?: unknown; user?: LedgerUser | null; wallet?: LedgerWallet | null };
type GameTransfer = { id: string; type: string; status: string; provider?: { name?: string | null; code?: string | null } | null; session?: { game?: { name?: string | null; providerGameCode?: string | null } | null } | null };
type RiskAlert = { id: string; title?: string | null; type: string; refType?: string | null; refId?: string | null; severity: string };
type AuditLog = { id: string; action: string; module: string; createdAt: string; adminUserId?: string | null };
type LedgerDetail = { item?: LedgerItem; related?: { gameTransfer?: GameTransfer | null; deposit?: unknown; withdrawal?: unknown; riskAlerts?: RiskAlert[]; auditLogs?: AuditLog[] } };

export default function WalletLedgerDetailPage({ params }: Props) {
  const { id } = use(params);
  const [payload, setPayload] = useState<LedgerDetail | null>(null);
  const [message, setMessage] = useState('กำลังโหลดรายการเดินเงิน...');
  const [loading, setLoading] = useState(false);

  useEffect(() => { void load(); }, [id]);

  async function load() {
    if (loading) return;
    setLoading(true);
    setMessage('กำลังโหลดรายการเดินเงิน...');
    try {
      const res = await adminApiFetch(`/admin/money-ops/ledger/${id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.item?.id) throw new Error('load');
      setPayload(data as LedgerDetail);
      setMessage('');
    } catch {
      setPayload(null);
      setMessage('โหลดรายการเดินเงินไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const item = payload?.item;
  const related = payload?.related ?? {};

  return <AdminPage eyebrow="การเงิน" title="รายละเอียดรายการเดินเงิน" description="ตรวจว่ายอดเปลี่ยนเพราะอะไร ใครเกี่ยวข้อง และเชื่อมกลับไปยังรายการต้นทาง" actions={<><AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton><AdminLinkButton href="/wallet-ledgers">กลับรายการ</AdminLinkButton></>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {!item && !message && <AdminEmpty>ไม่พบรายการเดินเงิน</AdminEmpty>}
    {item && <AdminStack>
      <AdminMetricGrid><AdminMetric title="ประเภท" value={ledgerTitle(item)} helper={directionLabel(item.direction)} /><AdminMetric title="จำนวน" value={formatMoney(item.amount, item.wallet?.currency ?? 'THB')} helper="มูลค่ารายการ" /><AdminMetric title="ยอดก่อน" value={formatMoney(item.balanceBefore, item.wallet?.currency ?? 'THB')} helper="ก่อนบันทึกรายการ" /><AdminMetric title="ยอดหลัง" value={formatMoney(item.balanceAfter, item.wallet?.currency ?? 'THB')} helper="หลังบันทึกรายการ" /></AdminMetricGrid>
      <AdminCard title="สรุปรายการ" description="ยอดก่อน จำนวน และยอดหลังต้องอธิบายเส้นทางเงินได้ครบ"><AdminRow><strong>{ledgerTitle(item)}</strong><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{directionLabel(item.direction)}</AdminBadge></AdminRow><AdminRow><strong>สร้างเมื่อ</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow><AdminRow><strong>ผู้ดูแลที่สร้าง</strong><span style={monoStyle}>{item.createdByAdminId ?? '-'}</span></AdminRow></AdminCard>
      <AdminCard title="สมาชิกและกระเป๋าเงิน"><AdminRow><strong>สมาชิก</strong><span>{item.user?.username ?? item.user?.phone ?? item.user?.email ?? '-'}</span></AdminRow><AdminRow><strong>สถานะสมาชิก</strong><AdminBadge tone={item.user?.status === 'ACTIVE' ? 'success' : 'warning'}>{statusLabel(item.user?.status)}</AdminBadge></AdminRow><AdminRow><strong>รหัสกระเป๋าเงิน</strong><span style={monoStyle}>{item.wallet?.id ?? '-'}</span></AdminRow><AdminRow><strong>ยอดปัจจุบัน</strong><span>{formatMoney(item.wallet?.balance ?? 0, item.wallet?.currency ?? 'THB')}</span></AdminRow><AdminRow><strong>ยอดที่ถูกล็อก</strong><span>{formatMoney(item.wallet?.lockedBalance ?? 0, item.wallet?.currency ?? 'THB')}</span></AdminRow></AdminCard>
      <AdminCard title="ข้อมูลอ้างอิง" description="ใช้เชื่อมกลับไปยังรายการต้นทางและป้องกันการบันทึกซ้ำ"><AdminRow><strong>ประเภทอ้างอิง</strong><span>{item.referenceType ?? '-'}</span></AdminRow><AdminRow><strong>รหัสอ้างอิง</strong><span style={monoStyle}>{item.referenceId ?? '-'}</span></AdminRow><AdminRow><strong>รหัสป้องกันรายการซ้ำ</strong><span style={monoStyle}>{item.idempotencyKey ?? '-'}</span></AdminRow></AdminCard>
      {related.gameTransfer && <AdminCard title="รายการโยกเงินเกมที่เกี่ยวข้อง" action={<AdminLinkButton href={`/game-transfers/${related.gameTransfer.id}`}>เปิดรายการ</AdminLinkButton>}><AdminRow><strong>รายการ</strong><span>{related.gameTransfer.type} · {related.gameTransfer.status}</span></AdminRow><AdminRow><strong>ค่าย</strong><span>{related.gameTransfer.provider?.name ?? related.gameTransfer.provider?.code ?? '-'}</span></AdminRow><AdminRow><strong>เกม</strong><span>{related.gameTransfer.session?.game?.name ?? related.gameTransfer.session?.game?.providerGameCode ?? '-'}</span></AdminRow></AdminCard>}
      {related.deposit && <JsonCard title="รายการฝากที่เกี่ยวข้อง" payload={related.deposit} />}{related.withdrawal && <JsonCard title="รายการถอนที่เกี่ยวข้อง" payload={related.withdrawal} />}
      <AdminCard title="การแจ้งเตือนความเสี่ยง">{related.riskAlerts?.length ? <AdminStack>{related.riskAlerts.map((alert) => <AdminRow key={alert.id}><div><strong>{alert.title ?? alert.type}</strong><p style={mutedStyle}>{alert.refType ?? '-'} · {alert.refId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'warning'}>{alert.severity}</AdminBadge><AdminLinkButton href={`/risk-alerts/${alert.id}`}>เปิด</AdminLinkButton></div></AdminRow>)}</AdminStack> : <p style={mutedStyle}>ยังไม่มีการแจ้งเตือนที่เชื่อมกับรายการนี้</p>}</AdminCard>
      <AdminCard title="ประวัติการตรวจสอบ">{related.auditLogs?.length ? <AdminStack>{related.auditLogs.map((log) => <AdminRow key={log.id}><div><strong>{log.action}</strong><p style={mutedStyle}>{log.module} · {new Date(log.createdAt).toLocaleString('th-TH')}</p></div><span style={monoStyle}>{log.adminUserId ?? '-'}</span></AdminRow>)}</AdminStack> : <p style={mutedStyle}>ยังไม่มีประวัติการตรวจสอบที่เชื่อมกับรายการนี้</p>}</AdminCard>
      <JsonCard title="ข้อมูลเพิ่มเติม" payload={item.metadata ?? {}} />
    </AdminStack>}
  </AdminPage>;
}

function JsonCard({ title, payload }: { title: string; payload: unknown }) { return <AdminCard title={title}><pre style={preStyle}>{stringifyAdminPayload(payload)}</pre></AdminCard>; }
function ledgerTitle(item: LedgerItem) { if (item.referenceType?.includes('GAME')) return item.direction === 'DEBIT' ? 'โยกเข้าเกม' : item.type === 'REVERSAL' ? 'คืนยอดเข้ากระเป๋าเงิน' : 'โยกกลับกระเป๋าเงิน'; if (item.type === 'DEPOSIT') return 'ฝากเงิน'; if (item.type === 'WITHDRAWAL') return 'ถอนเงิน'; if (item.type === 'ADJUSTMENT') return 'ปรับยอด'; return item.type; }
function directionLabel(value?: string | null) { return value === 'CREDIT' ? 'เงินเข้า' : value === 'DEBIT' ? 'เงินออก' : value ?? '-'; }
function statusLabel(value?: string | null) { return value === 'ACTIVE' ? 'ใช้งานอยู่' : value === 'SUSPENDED' ? 'ระงับใช้งาน' : value === 'LOCKED' ? 'ถูกล็อก' : value ?? '-'; }
function formatMoney(value: string | number | null | undefined, currency: string) { const amount = Number(value ?? 0); return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 460 } as const;