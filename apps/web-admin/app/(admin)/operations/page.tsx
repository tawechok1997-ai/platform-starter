'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminActionStrip, AdminBadge, AdminButton, AdminCard, AdminCommandPanel, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
type QuickLink = readonly [title: string, href: string];
type QuickGroup = { title: string; tone: BadgeTone; items: readonly QuickLink[] };
type ControlCenter = { summary?: Record<string, number>; queues?: Record<string, number>; recent?: { ledgers?: any[]; transfers?: any[]; snapshots?: any[]; alerts?: any[] }; realLedgerMutationEnabled?: boolean };
type QueueSummary = { topUps?: { count?: number }; withdrawals?: { count?: number } };

const quickGroups: readonly QuickGroup[] = [
  { title: 'งานประจำวัน', tone: 'warning', items: [['ตรวจฝาก', '/topups'], ['ตรวจถอน', '/withdrawals'], ['ปัญหาที่ต้องดู', '/risk-alerts'], ['ประวัติเงิน', '/wallet-ledgers']] },
  { title: 'ตั้งค่าค่ายเกม', tone: 'success', items: [['ตั้งค่าง่าย', '/simple-game-settings'], ['เพิ่มค่ายใหม่', '/provider-setup-wizard'], ['ดูการโยกเงิน', '/game-transfers'], ['ตรวจยอดค่าย', '/reconciliation-center']] },
  { title: 'ขั้นสูง / ใช้ตอน debug', tone: 'neutral', items: [['ทดสอบ API ทีละจุด', '/adapter-test'], ['เปลี่ยน API Key', '/provider-credentials'], ['Webhook', '/webhook-logs'], ['Audit Logs', '/audit-logs']] },
];

export default function OperationsPage() {
  const [control, setControl] = useState<ControlCenter>({});
  const [queues, setQueues] = useState<QueueSummary>({});
  const [message, setMessage] = useState('กำลังโหลดงาน...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, []);
  const summary = control.summary ?? {};
  const pendingTopUps = Number(queues.topUps?.count ?? 0);
  const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);
  const failedTransfers = Number(summary.failedTransfers ?? 0);
  const openRiskAlerts = Number(summary.openRiskAlerts ?? 0);
  const mismatchSnapshots = Number(summary.mismatchSnapshots ?? 0);
  const webhookFailed = Number(summary.webhookFailed ?? 0);
  const urgentCount = useMemo(() => pendingTopUps + pendingWithdrawals + failedTransfers + mismatchSnapshots + openRiskAlerts + webhookFailed, [pendingTopUps, pendingWithdrawals, failedTransfers, mismatchSnapshots, openRiskAlerts, webhookFailed]);
  const primaryAction = topAction({ pendingTopUps, pendingWithdrawals, failedTransfers, openRiskAlerts, mismatchSnapshots, webhookFailed });
  async function load() { setLoading(true); setMessage('กำลังโหลดงาน...'); const [controlRes, queueRes] = await Promise.all([adminApiFetch('/admin/money-ops/control-center'), adminApiFetch('/admin/queues/summary')]); const controlData = await controlRes.json().catch(() => null); const queueData = await queueRes.json().catch(() => null); setLoading(false); if (controlRes.ok && controlData) setControl(controlData); if (queueRes.ok && queueData) setQueues(queueData); if (!controlRes.ok && !queueRes.ok) { setMessage(controlData?.message ?? queueData?.message ?? 'โหลดงานไม่สำเร็จ'); return; } setMessage(''); }
  return <AdminPage eyebrow="Admin" title="งานแอดมิน" description="เปิดหน้านี้แล้วต้องรู้ทันทีว่าวันนี้ควรกดอะไร ไม่ใช่ให้แอดมินเล่นเกมเดาใจระบบ" actions={<AdminButton onClick={load} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={loading ? 'neutral' : 'danger'}>{message}</AdminNotice>}
    <AdminCommandPanel>
      <AdminActionStrip><div><p style={eyebrowInlineStyle}>งานที่ควรทำตอนนี้</p><h2 style={commandTitleStyle}>{primaryAction.title}</h2><p style={mutedStyle}>{primaryAction.description}</p></div><AdminLinkButton href={primaryAction.href} tone="primary">เปิดงานหลัก</AdminLinkButton></AdminActionStrip>
      <div style={{ height: 14 }} />
      <AdminMetricGrid><AdminMetric tone={urgentCount > 0 ? 'danger' : 'success'} title="งานที่ต้องดู" value={String(urgentCount)} helper="รวมงานค้างและปัญหา" /><AdminMetric tone={pendingTopUps > 0 ? 'warning' : 'neutral'} title="ฝากรอตรวจ" value={String(pendingTopUps)} helper="สมาชิกแจ้งฝาก" /><AdminMetric tone={pendingWithdrawals > 0 ? 'warning' : 'neutral'} title="ถอนรอดำเนินการ" value={String(pendingWithdrawals)} helper="สมาชิกขอถอน" /><AdminMetric tone={failedTransfers > 0 ? 'danger' : 'neutral'} title="โยกเงินมีปัญหา" value={String(failedTransfers)} helper="เกม/วอเลต" /><AdminMetric tone={openRiskAlerts > 0 ? 'danger' : 'neutral'} title="ปัญหาความเสี่ยง" value={String(openRiskAlerts)} helper="ต้องตรวจ" /><AdminMetric tone={mismatchSnapshots > 0 ? 'danger' : 'neutral'} title="ยอดไม่ตรง" value={String(mismatchSnapshots)} helper="ค่าย/ระบบ" /></AdminMetricGrid>
    </AdminCommandPanel>
    {control.realLedgerMutationEnabled && <AdminNotice tone="warning">โหมดเขียนเงินจริงเปิดอยู่ ตรวจให้แน่ใจก่อนกด action เกี่ยวกับยอดเงินทุกครั้ง</AdminNotice>}
    <AdminGrid><AdminCard tone="warning" title="งานที่ต้องจัดการ" description="เปิดเฉพาะหน้าที่จำเป็นก่อน"><AdminStack><QueueRow title="ตรวจรายการฝาก" count={pendingTopUps} href="/topups" tone="warning" /><QueueRow title="ตรวจรายการถอน" count={pendingWithdrawals} href="/withdrawals" tone="warning" /><QueueRow title="โยกเงินไม่สำเร็จ" count={failedTransfers} href="/game-transfers" tone="danger" /><QueueRow title="ปัญหาที่ต้องตรวจ" count={openRiskAlerts} href="/risk-alerts" tone="danger" /><QueueRow title="ยอดค่ายไม่ตรง" count={mismatchSnapshots} href="/reconciliation-center" tone="danger" /></AdminStack></AdminCard><AdminCard tone="success" title="ตั้งค่าค่ายเกมแบบง่าย" description="ใช้หน้านี้เป็นหลัก แทนการเปิดหลายหน้า"><AdminStack><ToolRow title="ตั้งค่าง่าย" href="/simple-game-settings" description="ดูว่าค่ายพร้อมไหม ใส่ API Key ทดสอบ และไปขั้นต่อไป" /><ToolRow title="เพิ่มค่ายใหม่" href="/provider-setup-wizard" description="เพิ่มค่ายด้วยขั้นตอนง่าย ๆ" /><ToolRow title="ดูการโยกเงิน" href="/game-transfers" description="ดูว่าเงินเข้าเกม/กลับวอเลตสำเร็จไหม" /></AdminStack></AdminCard></AdminGrid>
    <AdminToolbar><strong>ล่าสุด</strong><span style={mutedStyle}>ดูภาพรวมเร็ว ๆ ไม่ต้องเข้าไปไล่ทุกหน้าเหมือนตามหารีโมตทีวี</span></AdminToolbar>
    <AdminGrid><RecentCard title="โยกเงินล่าสุด" items={control.recent?.transfers ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{transferLabel(item.type)} · {formatMoney(item.amount, item.currency ?? 'THB')}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.provider?.name ?? item.provider?.code ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminLinkButton href={`/game-transfers/${item.id}`}>ดู</AdminLinkButton></div></AdminRow>} /><RecentCard title="ปัญหาล่าสุด" items={control.recent?.alerts ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.title ?? item.type}</strong><p style={mutedStyle}>{item.refType ?? '-'} · {item.refId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={severityTone(item.severity)}>{humanSeverity(item.severity)}</AdminBadge><AdminLinkButton href={`/risk-alerts/${item.id}`}>ดู</AdminLinkButton></div></AdminRow>} /><RecentCard title="รายการเงินล่าสุด" items={control.recent?.ledgers ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.direction === 'CREDIT' ? 'เงินเข้า' : 'เงินออก'} · {formatMoney(item.amount, 'THB')}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.referenceType ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{ledgerLabel(item.type)}</AdminBadge><AdminLinkButton href={`/wallet-ledgers/${item.id}`}>ดู</AdminLinkButton></div></AdminRow>} /></AdminGrid>
    <AdminToolbar><strong>เมนูทั้งหมด</strong><span style={mutedStyle}>เมนูขั้นสูงยังอยู่ แต่ไม่เอาไปกองให้คนใช้งานหลักสับสน</span></AdminToolbar>
    <AdminGrid>{quickGroups.map((group) => <AdminCard key={group.title} title={group.title}><AdminStack>{group.items.map(([title, href]) => <AdminRow key={href}><strong>{title}</strong><div style={rightStyle}><AdminBadge tone={group.tone}>{group.title}</AdminBadge><AdminLinkButton href={href}>เปิด</AdminLinkButton></div></AdminRow>)}</AdminStack></AdminCard>)}</AdminGrid>
  </AdminPage>;
}
function QueueRow({ title, count, href, tone }: { title: string; count: number; href: string; tone: BadgeTone }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{count > 0 ? 'ต้องจัดการ' : 'ยังไม่มีงานค้าง'}</p></div><div style={rightStyle}><AdminBadge tone={count > 0 ? tone : 'success'}>{count}</AdminBadge><AdminLinkButton href={href} tone={count > 0 ? 'primary' : 'secondary'}>เปิด</AdminLinkButton></div></AdminRow>; }
function ToolRow({ title, description, href }: { title: string; description: string; href: string }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminLinkButton href={href}>เปิด</AdminLinkButton></AdminRow>; }
function RecentCard({ title, items, render }: { title: string; items: any[]; render: (item: any) => ReactNode }) { return <AdminCard title={title}>{items.length ? <AdminStack>{items.map(render)}</AdminStack> : <AdminEmpty>ยังไม่มีข้อมูลล่าสุด</AdminEmpty>}</AdminCard>; }
function topAction(input: { pendingTopUps: number; pendingWithdrawals: number; failedTransfers: number; openRiskAlerts: number; mismatchSnapshots: number; webhookFailed: number }) { if (input.failedTransfers > 0) return { title: 'ตรวจโยกเงินมีปัญหาก่อน', description: 'เกี่ยวกับยอดสมาชิกและค่ายเกมโดยตรง ควรจัดการก่อนงานแต่งหน้าใด ๆ', href: '/game-transfers' }; if (input.mismatchSnapshots > 0) return { title: 'ตรวจยอดค่ายไม่ตรง', description: 'เปิด reconciliation เพื่อดู snapshot, transfer และ risk alert ที่เกี่ยวข้อง', href: '/reconciliation-center' }; if (input.openRiskAlerts > 0) return { title: 'เปิดเคสความเสี่ยง', description: 'เคลียร์ risk alert ก่อนจะมีรายการสะสมเหมือนกล่องจดหมายที่ไม่มีใครรัก', href: '/risk-alerts' }; if (input.pendingWithdrawals > 0) return { title: 'ตรวจถอนรอดำเนินการ', description: 'งานถอนควรเร็วและตรวจหลักฐานให้ชัด', href: '/withdrawals' }; if (input.pendingTopUps > 0) return { title: 'ตรวจฝากรอตรวจ', description: 'เคลียร์ฝากเพื่อให้สมาชิกใช้งานต่อได้', href: '/topups' }; if (input.webhookFailed > 0) return { title: 'ตรวจ webhook failed', description: 'callback จากค่ายมีปัญหา ควรดู log ก่อนเกิดเรื่องแปลก ๆ', href: '/webhook-logs' }; return { title: 'ไม่มีงานด่วนตอนนี้', description: 'ระบบดูสงบผิดธรรมชาติ แต่ก็เป็นข่าวดีในโลกซอฟต์แวร์', href: '/simple-game-settings' }; }
function formatMoney(value: string | number | null | undefined, currency: string) {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function severityTone(severity: string) { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; return 'neutral'; }
function humanStatus(status: string) { const map: Record<string, string> = { SUCCESS: 'สำเร็จ', FAILED: 'มีปัญหา', PENDING: 'กำลังทำ', REVERSED: 'คืนแล้ว', CANCELLED: 'ยกเลิก' }; return map[status] ?? status ?? '-'; }
function humanSeverity(severity: string) { const map: Record<string, string> = { CRITICAL: 'ด่วนมาก', HIGH: 'สูง', MEDIUM: 'กลาง', LOW: 'ต่ำ' }; return map[severity] ?? severity ?? '-'; }
function transferLabel(type: string) { const map: Record<string, string> = { TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับวอเลต', ROLLBACK: 'คืนเงิน', SYNC: 'ซิงก์ยอด', ADJUSTMENT: 'ปรับยอด' }; return map[type] ?? type ?? 'โยกเงิน'; }
function ledgerLabel(type: string) { const map: Record<string, string> = { DEPOSIT: 'ฝาก', WITHDRAWAL: 'ถอน', TRANSFER: 'โยกเงิน', REVERSAL: 'คืนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส' }; return map[type] ?? type ?? '-'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
const eyebrowInlineStyle = { margin: '0 0 6px', color: '#f5c542', fontSize: 12, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase' as const } as const;
const commandTitleStyle = { margin: '0 0 6px', fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.08, fontWeight: 950, letterSpacing: -0.6 } as const;
