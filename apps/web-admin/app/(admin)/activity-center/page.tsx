'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type AuditItem = { id: string; action: string; module: string; targetId?: string | null; createdAt: string; adminUser?: { username?: string | null; email?: string | null } | null };
type RiskItem = { id: string; title: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; createdAt: string; memberId?: string | null };
type FinanceSummary = { totals?: { pendingTopUps?: number; pendingWithdrawals?: number }; recentLedgers?: Array<{ id: string; type: string; direction: string; amount: string; createdAt: string; user?: { username?: string | null; shortId?: string | null } | null }> };

type TimelineItem = { id: string; kind: 'audit' | 'risk' | 'ledger'; title: string; detail: string; createdAt: string; tone: 'neutral' | 'warning' | 'danger' | 'success'; href?: string };

export default function ActivityCenterPage() {
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [risk, setRisk] = useState<RiskItem[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [auditRes, riskRes, financeRes] = await Promise.all([
        adminApiFetch('/admin/audit-logs?page=1&take=20'),
        adminApiFetch('/admin/risk-alerts?status=OPEN'),
        adminApiFetch('/admin/finance/summary'),
      ]);
      const [auditData, riskData, financeData] = await Promise.all([
        auditRes.json().catch(() => null),
        riskRes.json().catch(() => null),
        financeRes.json().catch(() => null),
      ]);
      if (auditRes.ok) setAudit(auditData?.items ?? []);
      if (riskRes.ok) setRisk(riskData?.items ?? []);
      if (financeRes.ok) setFinance(financeData);
      const failed = [auditRes, riskRes, financeRes].filter((res) => !res.ok).length;
      if (failed > 0) setMessage(`โหลดข้อมูลไม่สำเร็จ ${failed} ส่วน ระบบยังแสดงส่วนที่โหลดได้`);
    } catch {
      setMessage('เชื่อมต่อ Activity Center ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo<TimelineItem[]>(() => {
    const auditItems = audit.map((item) => ({ id: `audit-${item.id}`, kind: 'audit' as const, title: `${item.module}: ${item.action}`, detail: item.adminUser?.username ?? item.adminUser?.email ?? 'Unknown admin', createdAt: item.createdAt, tone: auditTone(item.action), href: auditHref(item.module, item.targetId) }));
    const riskItems = risk.map((item) => ({ id: `risk-${item.id}`, kind: 'risk' as const, title: item.title, detail: `${item.severity} risk alert`, createdAt: item.createdAt, tone: item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'danger' as const : 'warning' as const, href: `/risk-alerts/${item.id}` }));
    const ledgerItems = (finance?.recentLedgers ?? []).map((item) => ({ id: `ledger-${item.id}`, kind: 'ledger' as const, title: `${item.type} / ${item.direction}`, detail: `${item.user?.username ?? item.user?.shortId ?? '-'} · ${Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, createdAt: item.createdAt, tone: item.direction === 'CREDIT' ? 'success' as const : 'neutral' as const, href: '/wallet-ledgers' }));
    return [...auditItems, ...riskItems, ...ledgerItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 40);
  }, [audit, finance, risk]);

  const criticalCount = risk.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH').length;
  const pending = Number(finance?.totals?.pendingTopUps ?? 0) + Number(finance?.totals?.pendingWithdrawals ?? 0);

  return <AdminPage eyebrow="Operations Intelligence" title="Recent Activity & Critical Events" description="รวม Audit, Risk และรายการการเงินล่าสุดตามลำดับเวลา" actions={<AdminButton disabled={loading} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone="warning">{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric title="เหตุการณ์ที่โหลด" value={timeline.length.toLocaleString('th-TH')} helper="รวม 3 แหล่งข้อมูล" />
      <AdminMetric title="Critical risk" value={criticalCount.toLocaleString('th-TH')} helper="HIGH และ CRITICAL" tone={criticalCount > 0 ? 'danger' : 'success'} />
      <AdminMetric title="คิวการเงิน" value={pending.toLocaleString('th-TH')} helper="ฝากและถอนรอดำเนินการ" tone={pending > 0 ? 'warning' : 'success'} />
      <AdminMetric title="Audit ล่าสุด" value={audit.length.toLocaleString('th-TH')} helper="สูงสุด 20 รายการ" />
    </AdminMetricGrid>
    <AdminCard title="Critical events" description="เหตุการณ์ที่ควรจัดการก่อนงานทั่วไป" action={<AdminLinkButton href="/risk-alerts">เปิด Risk Queue</AdminLinkButton>}>
      <AdminStack>{risk.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH').slice(0, 8).map((item) => <article key={item.id} style={rowStyle}><div><AdminBadge tone="danger">{item.severity}</AdminBadge><strong style={titleStyle}>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString('th-TH')}</small></div><AdminLinkButton href={`/risk-alerts/${item.id}`}>รายละเอียด</AdminLinkButton></article>)}{criticalCount === 0 && <AdminEmpty>ไม่มี Critical event ในข้อมูลล่าสุด</AdminEmpty>}</AdminStack>
    </AdminCard>
    <AdminCard title="Unified timeline" description="เรียงเหตุการณ์ล่าสุดจาก Audit, Risk และ Ledger">
      <AdminStack>{timeline.map((item) => <article key={item.id} style={rowStyle}><div><div style={badgeRowStyle}><AdminBadge tone={item.tone}>{item.kind.toUpperCase()}</AdminBadge><time>{new Date(item.createdAt).toLocaleString('th-TH')}</time></div><strong style={titleStyle}>{item.title}</strong><small>{item.detail}</small></div>{item.href && <AdminLinkButton href={item.href}>เปิดรายการ</AdminLinkButton>}</article>)}{!loading && timeline.length === 0 && <AdminEmpty>ยังไม่มีเหตุการณ์ล่าสุด</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

function auditTone(action: string): TimelineItem['tone'] { const value = action.toLowerCase(); if (value.includes('fail') || value.includes('reject') || value.includes('revoke') || value.includes('delete')) return 'danger'; if (value.includes('approve') || value.includes('create') || value.includes('complete')) return 'success'; if (value.includes('update') || value.includes('review')) return 'warning'; return 'neutral'; }
function auditHref(moduleName: string, targetId?: string | null) { if (!targetId) return '/audit'; const module = moduleName.toLowerCase(); if (module.includes('topup')) return `/topups?requestId=${encodeURIComponent(targetId)}`; if (module.includes('withdraw')) return `/withdrawals?requestId=${encodeURIComponent(targetId)}`; if (module.includes('risk')) return `/risk-alerts/${encodeURIComponent(targetId)}`; if (module.includes('member') || module.includes('user')) return `/members/${encodeURIComponent(targetId)}`; return '/audit'; }
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: 14, border: '1px solid rgba(148,163,184,.16)', borderRadius: 14, flexWrap: 'wrap' } as const;
const badgeRowStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: '#94a3b8', fontSize: 12 } as const;
const titleStyle = { display: 'block', marginTop: 7, marginBottom: 4 } as const;
