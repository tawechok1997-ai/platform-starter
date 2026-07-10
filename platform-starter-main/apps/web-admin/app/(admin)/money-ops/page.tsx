'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ControlCenter = { summary?: Record<string, number>; queues?: Record<string, number>; recent?: { ledgers?: any[]; transfers?: any[]; snapshots?: any[]; alerts?: any[] }; realLedgerMutationEnabled?: boolean };
type AlertRule = { code: string; title: string; severity: string; description: string; queryHint: string };

export default function MoneyOpsPage() {
  const [payload, setPayload] = useState<ControlCenter>({});
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [simulator, setSimulator] = useState<any>(null);
  const [security, setSecurity] = useState<string[]>([]);
  const [message, setMessage] = useState('กำลังโหลด money ops...');
  const [loading, setLoading] = useState(false);
  const [workingAlert, setWorkingAlert] = useState('');
  useEffect(() => { loadAll(); }, []);
  async function loadAll() {
    setLoading(true); setMessage('กำลังโหลด money ops...');
    const [controlRes, rulesRes, simulatorRes, securityRes] = await Promise.all([adminApiFetch('/admin/money-ops/control-center'), adminApiFetch('/admin/money-ops/alert-rules'), adminApiFetch('/admin/money-ops/provider-simulator/scenarios'), adminApiFetch('/admin/money-ops/security-hardening')]);
    const [control, rulePayload, simPayload, securityPayload] = await Promise.all([controlRes.json().catch(() => null), rulesRes.json().catch(() => null), simulatorRes.json().catch(() => null), securityRes.json().catch(() => null)]);
    setLoading(false);
    if (!controlRes.ok) { setMessage(control?.message ?? 'โหลด control center ไม่สำเร็จ'); return; }
    setPayload(control ?? {}); setRules(rulePayload?.items ?? []); setSimulator(simPayload); setSecurity(securityPayload?.items ?? []); setMessage('');
  }
  async function scanAlerts() {
    setLoading(true); setMessage('กำลัง scan alert rules...');
    const res = await adminApiFetch('/admin/money-ops/alert-rules/scan', { method: 'POST' });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'scan alert rules ไม่สำเร็จ'); return; }
    setMessage(`scan แล้ว: ${data.findings?.length ?? 0} findings · persisted ${data.persisted?.length ?? 0}`);
    await loadAll();
  }
  async function updateAlert(id: string, action: 'resolve' | 'dismiss') {
    const note = window.prompt(`${action} note`) ?? '';
    setWorkingAlert(id);
    const res = await adminApiFetch(`/admin/money-ops/risk-alerts/${id}/${action}`, { method: 'PATCH', body: JSON.stringify({ note }) });
    const data = await res.json().catch(() => null);
    setWorkingAlert('');
    if (!res.ok) { setMessage(data?.message ?? `${action} alert ไม่สำเร็จ`); return; }
    setMessage(`${action} alert แล้ว`);
    await loadAll();
  }
  const summary = payload.summary ?? {};
  const alerts = payload.recent?.alerts ?? [];
  return <AdminPage eyebrow="Money" title="Money Ops Control Center" description="รวมสถานะ ledger, transfer, reconciliation, webhook, alert และ simulator ก่อนเงินจริง" actions={<><AdminButton onClick={loadAll} disabled={loading}>Refresh</AdminButton><AdminButton tone="secondary" onClick={scanAlerts} disabled={loading}>Scan Alerts</AdminButton></>}>
    <AdminMetricGrid><AdminMetric title="Wallets" value={String(summary.walletCount ?? 0)} helper="all wallets" /><AdminMetric title="Failed Transfers" value={String(summary.failedTransfers ?? 0)} helper="needs review" /><AdminMetric title="Mismatch" value={String(summary.mismatchSnapshots ?? 0)} helper="reconciliation" /><AdminMetric title="Open Alerts" value={String(summary.openRiskAlerts ?? 0)} helper="risk queue" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminCard title="Safety state" description="สถานะระบบก่อนเปิดเงินจริง"><AdminRow><strong>Real ledger mutation</strong><AdminBadge tone={payload.realLedgerMutationEnabled ? 'danger' : 'success'}>{payload.realLedgerMutationEnabled ? 'ENABLED' : 'DISABLED'}</AdminBadge></AdminRow></AdminCard>
    <AdminToolbar><strong>Queues</strong><span style={mutedStyle}>{loading ? 'Loading...' : 'dry-run safety center'}</span></AdminToolbar>
    <AdminStack>{Object.entries(payload.queues ?? {}).map(([key, value]) => <AdminCard key={key}><AdminRow><strong>{key}</strong><AdminBadge tone={Number(value) > 0 ? 'warning' : 'success'}>{String(value)}</AdminBadge></AdminRow></AdminCard>)}</AdminStack>
    <AdminToolbar><strong>Open Risk Alerts</strong><span style={mutedStyle}>{alerts.length} latest</span></AdminToolbar>
    <AdminStack>{alerts.map((alert) => <AdminCard key={alert.id}><AdminRow><div><strong>{alert.title}</strong><p style={mutedStyle}>{alert.description}</p><p style={smallMutedStyle}>{alert.refType ?? '-'} · {alert.refId ?? '-'}</p></div><div style={actionStackStyle}><AdminBadge tone={severityTone(alert.severity)}>{alert.severity}</AdminBadge><AdminButton tone="secondary" disabled={workingAlert === alert.id} onClick={() => updateAlert(alert.id, 'resolve')}>Resolve</AdminButton><AdminButton tone="secondary" disabled={workingAlert === alert.id} onClick={() => updateAlert(alert.id, 'dismiss')}>Dismiss</AdminButton></div></AdminRow></AdminCard>)}{alerts.length === 0 && <AdminEmpty>ยังไม่มี alert ที่เปิดอยู่</AdminEmpty>}</AdminStack>
    <AdminToolbar><strong>Recent transfers</strong><span style={mutedStyle}>latest 10</span></AdminToolbar>
    <AdminStack>{(payload.recent?.transfers ?? []).map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{item.type} · {item.amount} {item.currency}</strong><p style={mutedStyle}>{item.provider?.name ?? '-'} · user {item.user?.username ?? item.user?.phone ?? '-'}</p></div><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow></AdminCard>)}{(payload.recent?.transfers ?? []).length === 0 && <AdminEmpty>ยังไม่มี recent transfer</AdminEmpty>}</AdminStack>
    <AdminToolbar><strong>Alert rules</strong><span style={mutedStyle}>{rules.length} rules</span></AdminToolbar>
    <AdminStack>{rules.map((rule) => <AdminCard key={rule.code}><AdminRow><div><strong>{rule.title}</strong><p style={mutedStyle}>{rule.description}</p><p style={smallMutedStyle}>{rule.queryHint}</p></div><AdminBadge tone={severityTone(rule.severity)}>{rule.severity}</AdminBadge></AdminRow></AdminCard>)}</AdminStack>
    <AdminToolbar><strong>Provider simulator scenarios</strong><span style={mutedStyle}>{simulator?.modes?.join(', ')}</span></AdminToolbar>
    <AdminStack>{(simulator?.scenarios ?? []).map((item: any) => <AdminCard key={item.code}><AdminRow><strong>{item.code}</strong><span style={mutedStyle}>{item.description}</span></AdminRow></AdminCard>)}</AdminStack>
    <AdminToolbar><strong>Security hardening</strong><span style={mutedStyle}>checklist</span></AdminToolbar>
    <AdminStack>{security.map((item) => <AdminCard key={item}><AdminRow><strong>{item}</strong><AdminBadge tone="neutral">TODO</AdminBadge></AdminRow></AdminCard>)}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'SUCCESS' || status === 'MATCHED') return 'success'; if (status === 'FAILED' || status === 'MISMATCH') return 'danger'; if (status === 'PENDING' || status === 'UNKNOWN') return 'warning'; return 'neutral'; }
function severityTone(severity: string) { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; if (severity === 'LOW') return 'success'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const actionStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
