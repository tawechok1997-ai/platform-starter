'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { formatMoney } from '../_components/human-labels';
import { useAdminLocale } from '../admin-locale';

type AuditItem = { id: string; action: string; module: string; targetId?: string | null; createdAt: string; adminUser?: { username?: string | null; email?: string | null } | null };
type RiskItem = { id: string; title: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; createdAt: string; memberId?: string | null };
type FinanceSummary = { totals?: { pendingTopUps?: number; pendingWithdrawals?: number }; recentLedgers?: Array<{ id: string; type: string; direction: string; amount: string; createdAt: string; user?: { username?: string | null; shortId?: string | null } | null }> };

type TimelineItem = { id: string; kind: 'audit' | 'risk' | 'ledger'; title: string; detail: string; createdAt: string; tone: 'neutral' | 'warning' | 'danger' | 'success'; severity?: RiskItem['severity']; href?: string };

const copy = {
  th: { eyebrow: 'ข้อมูลการปฏิบัติการ', title: 'กิจกรรมและเหตุการณ์สำคัญ', description: 'Audit ความเสี่ยง และการเงินล่าสุด', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', loadFailed: 'โหลดข้อมูลไม่สำเร็จ', connectionFailed: 'เชื่อมต่อศูนย์กิจกรรมไม่สำเร็จ', loadedEvents: 'เหตุการณ์ที่โหลด', threeSources: '3 แหล่งข้อมูล', criticalRisk: 'ความเสี่ยงสูง', highCritical: 'สูงและวิกฤต', financeQueue: 'คิวการเงิน', financePending: 'ฝากและถอนรอดำเนินการ', latestAudit: 'Audit ล่าสุด', latest20: 'สูงสุด 20 รายการ', criticalEvents: 'เหตุการณ์สำคัญ', criticalDescription: 'จัดการก่อนงานทั่วไป', openRiskQueue: 'เปิดคิวความเสี่ยง', noCritical: 'ไม่มีเหตุการณ์สำคัญ', timeline: 'ไทม์ไลน์', timelineDescription: 'Audit ความเสี่ยง และรายการเงินล่าสุด', type: 'ประเภท', all: 'ทั้งหมด', audit: 'Audit', risk: 'ความเสี่ยง', finance: 'การเงิน', severity: 'ความรุนแรง', allLevels: 'ทุกระดับ', highOrCritical: 'สูง / วิกฤต', items: 'รายการ', open: 'เปิดรายการ', noResults: 'ไม่พบเหตุการณ์ตามตัวกรอง', eventDetail: 'รายละเอียดเหตุการณ์', close: 'ปิด', source: 'แหล่งข้อมูล', time: 'เวลา', detail: 'รายละเอียด', related: 'เปิดรายการที่เกี่ยวข้อง', financeSource: 'สรุปการเงิน', riskSource: 'รายการความเสี่ยง', auditSource: 'บันทึก Audit', riskAlert: 'รายการเตือนความเสี่ยง', unknownAdmin: 'ไม่ทราบผู้ดูแล' },
  en: { eyebrow: 'Operations intelligence', title: 'Activity & critical events', description: 'Latest audit, risk, and finance activity', refresh: 'Refresh', loading: 'Loading...', loadFailed: 'Could not load', connectionFailed: 'Could not connect to Activity Center', loadedEvents: 'Events loaded', threeSources: '3 sources', criticalRisk: 'Critical risk', highCritical: 'High and critical', financeQueue: 'Finance queue', financePending: 'Pending top ups and withdrawals', latestAudit: 'Latest audit', latest20: 'Up to 20 items', criticalEvents: 'Critical events', criticalDescription: 'Handle these first', openRiskQueue: 'Open risk queue', noCritical: 'No critical events', timeline: 'Timeline', timelineDescription: 'Latest audit, risk, and finance activity', type: 'Type', all: 'All', audit: 'Audit', risk: 'Risk', finance: 'Finance', severity: 'Severity', allLevels: 'All levels', highOrCritical: 'High / critical', items: 'items', open: 'Open', noResults: 'No events match these filters', eventDetail: 'Event detail', close: 'Close', source: 'Source', time: 'Time', detail: 'Details', related: 'Open related item', financeSource: 'Finance summary', riskSource: 'Risk alerts', auditSource: 'Audit logs', riskAlert: 'risk alert', unknownAdmin: 'Unknown admin' },
} as const;

export default function ActivityCenterPage() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [risk, setRisk] = useState<RiskItem[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<'all' | TimelineItem['kind']>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'HIGH_OR_CRITICAL'>('all');
  const [selected, setSelected] = useState<TimelineItem | null>(null);

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
      if (failed > 0) setMessage(`${t.loadFailed} ${failed} ${t.items}`);
    } catch {
      setMessage(t.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo<TimelineItem[]>(() => {
    const auditItems = audit.map((item) => ({ id: `audit-${item.id}`, kind: 'audit' as const, title: `${item.module}: ${item.action}`, detail: item.adminUser?.username ?? item.adminUser?.email ?? t.unknownAdmin, createdAt: item.createdAt, tone: auditTone(item.action), href: auditHref(item.module, item.targetId) }));
    const riskItems = risk.map((item) => ({ id: `risk-${item.id}`, kind: 'risk' as const, title: item.title, detail: `${severityLabel(item.severity, locale)} ${t.riskAlert}`, createdAt: item.createdAt, tone: item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'danger' as const : 'warning' as const, severity: item.severity, href: `/risk-alerts/${item.id}` }));
    const ledgerItems = (finance?.recentLedgers ?? []).map((item) => ({ id: `ledger-${item.id}`, kind: 'ledger' as const, title: `${item.type} / ${item.direction}`, detail: `${item.user?.username ?? item.user?.shortId ?? '-'} · ${formatMoney(item.amount)}`, createdAt: item.createdAt, tone: item.direction === 'CREDIT' ? 'success' as const : 'neutral' as const, href: '/wallet-ledgers' }));
    return [...auditItems, ...riskItems, ...ledgerItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 40);
  }, [audit, finance, locale, risk, t]);

  const criticalCount = risk.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH').length;
  const pending = Number(finance?.totals?.pendingTopUps ?? 0) + Number(finance?.totals?.pendingWithdrawals ?? 0);
  const filteredTimeline = timeline.filter((item) => (kindFilter === 'all' || item.kind === kindFilter) && (severityFilter === 'all' || (item.kind === 'risk' && (item.severity === 'HIGH' || item.severity === 'CRITICAL'))));

  return <AdminPage eyebrow={t.eyebrow} title={t.title} description={t.description} actions={<AdminButton disabled={loading} onClick={() => void load()}>{loading ? t.loading : t.refresh}</AdminButton>}>
    {message && <AdminNotice tone="warning">{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric title={t.loadedEvents} value={timeline.length.toLocaleString(dateLocale)} helper={t.threeSources} />
      <AdminMetric title={t.criticalRisk} value={criticalCount.toLocaleString(dateLocale)} helper={t.highCritical} tone={criticalCount > 0 ? 'danger' : 'success'} />
      <AdminMetric title={t.financeQueue} value={pending.toLocaleString(dateLocale)} helper={t.financePending} tone={pending > 0 ? 'warning' : 'success'} />
      <AdminMetric title={t.latestAudit} value={audit.length.toLocaleString(dateLocale)} helper={t.latest20} />
    </AdminMetricGrid>
    <AdminCard title={t.criticalEvents} description={t.criticalDescription} action={<AdminLinkButton href="/risk-alerts">{t.openRiskQueue}</AdminLinkButton>}>
      <AdminStack>{risk.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH').slice(0, 8).map((item) => <article key={item.id} style={rowStyle}><div><AdminBadge tone="danger">{severityLabel(item.severity, locale)}</AdminBadge><strong style={titleStyle}>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString(dateLocale)}</small></div><AdminLinkButton href={`/risk-alerts/${item.id}`}>{t.open}</AdminLinkButton></article>)}{criticalCount === 0 && <AdminEmpty>{t.noCritical}</AdminEmpty>}</AdminStack>
    </AdminCard>
    <AdminCard title={t.timeline} description={t.timelineDescription}>
      <AdminToolbar><label>{t.type}<select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}><option value="all">{t.all}</option><option value="audit">{t.audit}</option><option value="risk">{t.risk}</option><option value="ledger">{t.finance}</option></select></label><label>{t.severity}<select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as typeof severityFilter)}><option value="all">{t.allLevels}</option><option value="HIGH_OR_CRITICAL">{t.highOrCritical}</option></select></label><span>{filteredTimeline.length.toLocaleString(dateLocale)} {t.items}</span></AdminToolbar>
      <AdminStack>{filteredTimeline.map((item) => <article key={item.id} style={rowStyle}><button type="button" style={detailButtonStyle} onClick={() => setSelected(item)}><div style={badgeRowStyle}><AdminBadge tone={item.tone}>{kindLabel(item.kind, locale)}</AdminBadge>{item.severity && <AdminBadge tone={item.tone}>{severityLabel(item.severity, locale)}</AdminBadge>}<time>{new Date(item.createdAt).toLocaleString(dateLocale)}</time></div><strong style={titleStyle}>{item.title}</strong><small>{item.detail}</small></button>{item.href && <AdminLinkButton href={item.href}>{t.open}</AdminLinkButton>}</article>)}{!loading && filteredTimeline.length === 0 && <AdminEmpty>{t.noResults}</AdminEmpty>}</AdminStack>
    </AdminCard>
    {selected && <div className="admin-activity-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><aside className="admin-activity-drawer" aria-label={t.eventDetail}><AdminStack><AdminRow><div><p style={{ margin: 0, color: '#94a3b8' }}>{t.eventDetail}</p><h2 style={{ margin: '4px 0 0' }}>{selected.title}</h2></div><AdminButton tone="ghost" onClick={() => setSelected(null)}>{t.close}</AdminButton></AdminRow><AdminRow><span>{t.type}</span><AdminBadge tone={selected.tone}>{kindLabel(selected.kind, locale)}</AdminBadge></AdminRow>{selected.severity && <AdminRow><span>{t.severity}</span><AdminBadge tone={selected.tone}>{severityLabel(selected.severity, locale)}</AdminBadge></AdminRow>}<AdminRow><span>{t.source}</span><strong>{selected.kind === 'ledger' ? t.financeSource : selected.kind === 'risk' ? t.riskSource : t.auditSource}</strong></AdminRow><AdminRow><span>{t.time}</span><strong>{new Date(selected.createdAt).toLocaleString(dateLocale)}</strong></AdminRow><AdminRow><span>{t.detail}</span><strong>{selected.detail}</strong></AdminRow>{selected.href && <AdminLinkButton href={selected.href}>{t.related}</AdminLinkButton>}</AdminStack></aside></div>}
  </AdminPage>;
}

function auditTone(action: string): TimelineItem['tone'] { const value = action.toLowerCase(); if (value.includes('fail') || value.includes('reject') || value.includes('revoke') || value.includes('delete')) return 'danger'; if (value.includes('approve') || value.includes('create') || value.includes('complete')) return 'success'; if (value.includes('update') || value.includes('review')) return 'warning'; return 'neutral'; }
function kindLabel(kind: TimelineItem['kind'], locale: 'th' | 'en') { const t = copy[locale]; return kind === 'audit' ? t.audit : kind === 'risk' ? t.risk : t.finance; }
function severityLabel(severity: RiskItem['severity'], locale: 'th' | 'en') { if (locale === 'en') return severity; const labels: Record<RiskItem['severity'], string> = { LOW: 'ต่ำ', MEDIUM: 'กลาง', HIGH: 'สูง', CRITICAL: 'วิกฤต' }; return labels[severity]; }
function auditHref(moduleName: string, targetId?: string | null) { if (!targetId) return '/audit'; const module = moduleName.toLowerCase(); if (module.includes('topup')) return `/topups?requestId=${encodeURIComponent(targetId)}`; if (module.includes('withdraw')) return `/withdrawals?requestId=${encodeURIComponent(targetId)}`; if (module.includes('risk')) return `/risk-alerts/${encodeURIComponent(targetId)}`; if (module.includes('member') || module.includes('user')) return `/members/${encodeURIComponent(targetId)}`; return '/audit'; }
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: 14, border: '1px solid rgba(148,163,184,.16)', borderRadius: 14, flexWrap: 'wrap' } as const;
const badgeRowStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: '#94a3b8', fontSize: 12 } as const;
const titleStyle = { display: 'block', marginTop: 7, marginBottom: 4 } as const;
const detailButtonStyle = { flex: '1 1 320px', minWidth: 0, border: 0, background: 'transparent', color: 'inherit', padding: 0, textAlign: 'left' as const };
