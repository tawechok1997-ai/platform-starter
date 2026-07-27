'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminSkeleton,
  AdminStack,
  AdminToolbar,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type RiskAlert = {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  refType?: string | null;
  refId?: string | null;
};

type Transfer = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  provider?: { name?: string | null } | null;
  user?: { username?: string | null; phone?: string | null } | null;
};

type ControlCenter = {
  summary?: Record<string, number>;
  queues?: Record<string, number>;
  recent?: {
    transfers?: Transfer[];
    alerts?: RiskAlert[];
  };
  realLedgerMutationEnabled?: boolean;
};

type AlertRule = {
  code: string;
  title: string;
  severity: string;
  description: string;
  queryHint: string;
};

type SimulatorScenario = { code: string; description: string };
type SimulatorPayload = { modes?: string[]; scenarios?: SimulatorScenario[] };
type PendingAlertAction = { id: string; title: string; action: 'resolve' | 'dismiss' };

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  loading: string;
  scanAlerts: string;
  loadFailed: string;
  partialLoad: string;
  wallets: string;
  failedTransfers: string;
  mismatch: string;
  openAlerts: string;
  allWallets: string;
  needsReview: string;
  reconciliation: string;
  riskQueue: string;
  safetyState: string;
  safetyDescription: string;
  realLedgerMutation: string;
  enabled: string;
  disabled: string;
  queues: string;
  noQueues: string;
  openRiskAlerts: string;
  noOpenAlerts: string;
  resolve: string;
  dismiss: string;
  recentTransfers: string;
  noTransfers: string;
  alertRules: string;
  noRules: string;
  simulatorScenarios: string;
  noScenarios: string;
  securityReadiness: string;
  securityDescription: string;
  preflightRequired: string;
  noChecklist: string;
  readOnly: string;
  readOnlyDescription: string;
  confirmResolve: string;
  confirmDismiss: string;
  confirmDescription: string;
  note: string;
  notePlaceholder: string;
  confirm: string;
  saving: string;
  actionSuccess: string;
  actionFailed: string;
  scanSuccess: string;
  latest: string;
  rules: string;
  scenarios: string;
};

const copies: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'การเงินและความเสี่ยง',
    title: 'ศูนย์ควบคุม Money Ops',
    description: 'ตรวจสถานะ Ledger, Transfer, Reconciliation, Webhook และความพร้อมก่อนเปิดเงินจริง',
    refresh: 'อัปเดตข้อมูล',
    loading: 'กำลังโหลด',
    scanAlerts: 'สแกนความเสี่ยง',
    loadFailed: 'โหลดข้อมูล Money Ops ไม่สำเร็จ',
    partialLoad: 'ข้อมูลบางส่วนโหลดไม่สำเร็จ กรุณาตรวจสอบบริการที่เกี่ยวข้อง',
    wallets: 'กระเป๋าเงิน',
    failedTransfers: 'รายการโอนล้มเหลว',
    mismatch: 'ยอดไม่ตรงกัน',
    openAlerts: 'ความเสี่ยงที่เปิดอยู่',
    allWallets: 'กระเป๋าทั้งหมด',
    needsReview: 'ต้องตรวจสอบ',
    reconciliation: 'กระทบยอด',
    riskQueue: 'คิวความเสี่ยง',
    safetyState: 'สถานะความปลอดภัย',
    safetyDescription: 'ตรวจประตูก่อนอนุญาตให้แก้ยอดเงินจริง',
    realLedgerMutation: 'การแก้ Ledger จริง',
    enabled: 'เปิดใช้งาน',
    disabled: 'ปิดใช้งาน',
    queues: 'คิวงาน',
    noQueues: 'ไม่มีคิวงานค้าง',
    openRiskAlerts: 'ความเสี่ยงที่เปิดอยู่',
    noOpenAlerts: 'ไม่มีความเสี่ยงที่เปิดอยู่',
    resolve: 'แก้ไขแล้ว',
    dismiss: 'ยกเลิกการแจ้งเตือน',
    recentTransfers: 'รายการโอนล่าสุด',
    noTransfers: 'ยังไม่มีรายการโอนล่าสุด',
    alertRules: 'กฎตรวจจับความเสี่ยง',
    noRules: 'ไม่พบกฎตรวจจับความเสี่ยง',
    simulatorScenarios: 'สถานการณ์จำลอง Provider',
    noScenarios: 'ไม่พบสถานการณ์จำลอง',
    securityReadiness: 'ความพร้อมด้านความปลอดภัย',
    securityDescription: 'รายการที่ต้องตรวจยืนยันก่อนเปิดเงินจริง ไม่ใช่ปุ่มงานที่กดแล้วเสร็จเอง',
    preflightRequired: 'ต้องยืนยันก่อนเปิดจริง',
    noChecklist: 'ไม่พบรายการตรวจความพร้อม',
    readOnly: 'สิทธิ์อ่านอย่างเดียว',
    readOnlyDescription: 'บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์สแกน แก้ไข หรือยกเลิกความเสี่ยง',
    confirmResolve: 'ยืนยันว่าแก้ไขความเสี่ยงแล้ว',
    confirmDismiss: 'ยืนยันการยกเลิกการแจ้งเตือน',
    confirmDescription: 'การดำเนินการนี้จะถูกบันทึกใน Audit Log',
    note: 'หมายเหตุ',
    notePlaceholder: 'ระบุเหตุผลหรือหลักฐานประกอบ',
    confirm: 'ยืนยัน',
    saving: 'กำลังบันทึก',
    actionSuccess: 'บันทึกสถานะความเสี่ยงแล้ว',
    actionFailed: 'บันทึกสถานะความเสี่ยงไม่สำเร็จ',
    scanSuccess: 'สแกนกฎความเสี่ยงแล้ว',
    latest: 'รายการล่าสุด',
    rules: 'กฎ',
    scenarios: 'สถานการณ์',
  },
  en: {
    eyebrow: 'Finance and risk',
    title: 'Money Ops control center',
    description: 'Review ledger, transfer, reconciliation, webhook, and real-money readiness',
    refresh: 'Refresh data',
    loading: 'Loading',
    scanAlerts: 'Scan risks',
    loadFailed: 'Unable to load Money Ops data',
    partialLoad: 'Some data could not be loaded. Check the related services.',
    wallets: 'Wallets',
    failedTransfers: 'Failed transfers',
    mismatch: 'Mismatches',
    openAlerts: 'Open alerts',
    allWallets: 'All wallets',
    needsReview: 'Needs review',
    reconciliation: 'Reconciliation',
    riskQueue: 'Risk queue',
    safetyState: 'Safety state',
    safetyDescription: 'Verify the gate before enabling real ledger mutations',
    realLedgerMutation: 'Real ledger mutation',
    enabled: 'Enabled',
    disabled: 'Disabled',
    queues: 'Queues',
    noQueues: 'No pending queues',
    openRiskAlerts: 'Open risk alerts',
    noOpenAlerts: 'No open risk alerts',
    resolve: 'Resolve',
    dismiss: 'Dismiss',
    recentTransfers: 'Recent transfers',
    noTransfers: 'No recent transfers',
    alertRules: 'Risk alert rules',
    noRules: 'No risk alert rules found',
    simulatorScenarios: 'Provider simulator scenarios',
    noScenarios: 'No simulator scenarios found',
    securityReadiness: 'Security readiness',
    securityDescription: 'Requirements that must be verified before real-money enablement',
    preflightRequired: 'Preflight required',
    noChecklist: 'No readiness checklist found',
    readOnly: 'Read-only access',
    readOnlyDescription: 'This account can view data but cannot scan, resolve, or dismiss alerts.',
    confirmResolve: 'Confirm risk resolution',
    confirmDismiss: 'Confirm alert dismissal',
    confirmDescription: 'This action will be recorded in the audit log.',
    note: 'Note',
    notePlaceholder: 'Add the reason or supporting evidence',
    confirm: 'Confirm',
    saving: 'Saving',
    actionSuccess: 'Risk alert status updated',
    actionFailed: 'Unable to update the risk alert',
    scanSuccess: 'Risk rules scanned',
    latest: 'latest',
    rules: 'rules',
    scenarios: 'scenarios',
  },
};

export default function MoneyOpsPage() {
  const [locale] = useAdminLocale();
  const copy = copies[locale];
  const [payload, setPayload] = useState<ControlCenter>({});
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [simulator, setSimulator] = useState<SimulatorPayload>({});
  const [security, setSecurity] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; tone: 'neutral' | 'success' | 'warning' | 'danger' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingAlert, setWorkingAlert] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAlertAction | null>(null);
  const [actionNote, setActionNote] = useState('');

  const canManage = permissions.includes('*') || permissions.includes('game.providers.manage');
  const summary = payload.summary ?? {};
  const alerts = payload.recent?.alerts ?? [];
  const transfers = payload.recent?.transfers ?? [];
  const queueEntries = useMemo(() => Object.entries(payload.queues ?? {}).filter(([, value]) => Number(value) > 0), [payload.queues]);

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setMessage(null);
    try {
      const [controlRes, rulesRes, simulatorRes, securityRes, meRes] = await Promise.all([
        adminApiFetch('/admin/money-ops/control-center'),
        adminApiFetch('/admin/money-ops/alert-rules'),
        adminApiFetch('/admin/money-ops/provider-simulator/scenarios'),
        adminApiFetch('/admin/money-ops/security-hardening'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [control, rulePayload, simPayload, securityPayload, mePayload] = await Promise.all([
        controlRes.json().catch(() => null),
        rulesRes.json().catch(() => null),
        simulatorRes.json().catch(() => null),
        securityRes.json().catch(() => null),
        meRes.json().catch(() => null),
      ]);
      if (!controlRes.ok || !control) throw new Error(copy.loadFailed);
      setPayload(control);
      setRules(rulesRes.ok && Array.isArray(rulePayload?.items) ? rulePayload.items : []);
      setSimulator(simulatorRes.ok && simPayload ? simPayload : {});
      setSecurity(securityRes.ok && Array.isArray(securityPayload?.items) ? securityPayload.items : []);
      setPermissions(meRes.ok && Array.isArray(mePayload?.permissions) ? mePayload.permissions : []);
      if (![rulesRes, simulatorRes, securityRes, meRes].every((response) => response.ok)) setMessage({ text: copy.partialLoad, tone: 'warning' });
    } catch (error) {
      setPayload({});
      setRules([]);
      setSimulator({});
      setSecurity([]);
      setPermissions([]);
      setMessage({ text: error instanceof Error ? error.message : copy.loadFailed, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function scanAlerts() {
    if (!canManage || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await adminApiFetch('/admin/money-ops/alert-rules/scan', { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? copy.actionFailed);
      setMessage({ text: `${copy.scanSuccess}: ${Number(data?.findings?.length ?? 0)} findings`, tone: 'success' });
      await loadAll();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : copy.actionFailed, tone: 'danger' });
      setLoading(false);
    }
  }

  function requestAlertAction(alert: RiskAlert, action: PendingAlertAction['action']) {
    if (!canManage) return;
    setActionNote('');
    setPendingAction({ id: alert.id, title: alert.title, action });
  }

  async function confirmAlertAction() {
    if (!pendingAction || !canManage || workingAlert) return;
    setWorkingAlert(pendingAction.id);
    setMessage(null);
    try {
      const response = await adminApiFetch(`/admin/money-ops/risk-alerts/${pendingAction.id}/${pendingAction.action}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: actionNote.trim() || undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? copy.actionFailed);
      setMessage({ text: copy.actionSuccess, tone: 'success' });
      setPendingAction(null);
      setActionNote('');
      await loadAll();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : copy.actionFailed, tone: 'danger' });
    } finally {
      setWorkingAlert('');
    }
  }

  return (
    <AdminPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      actions={
        <>
          <AdminButton onClick={() => void loadAll()} disabled={loading}>{loading ? copy.loading : copy.refresh}</AdminButton>
          {canManage && <AdminButton tone="secondary" onClick={() => void scanAlerts()} disabled={loading}>{copy.scanAlerts}</AdminButton>}
        </>
      }
    >
      {message && <AdminNotice tone={message.tone}>{message.text}</AdminNotice>}
      {!canManage && !loading && <AdminNotice tone="neutral"><strong>{copy.readOnly}</strong><br />{copy.readOnlyDescription}</AdminNotice>}
      {loading && Object.keys(summary).length === 0 ? <AdminSkeleton lines={6} /> : (
        <>
          <AdminMetricGrid>
            <AdminMetric title={copy.wallets} value={String(summary.walletCount ?? 0)} helper={copy.allWallets} />
            <AdminMetric title={copy.failedTransfers} value={String(summary.failedTransfers ?? 0)} helper={copy.needsReview} tone={Number(summary.failedTransfers ?? 0) > 0 ? 'danger' : 'neutral'} />
            <AdminMetric title={copy.mismatch} value={String(summary.mismatchSnapshots ?? 0)} helper={copy.reconciliation} tone={Number(summary.mismatchSnapshots ?? 0) > 0 ? 'warning' : 'neutral'} />
            <AdminMetric title={copy.openAlerts} value={String(summary.openRiskAlerts ?? 0)} helper={copy.riskQueue} tone={Number(summary.openRiskAlerts ?? 0) > 0 ? 'warning' : 'neutral'} />
          </AdminMetricGrid>

          <AdminCard title={copy.safetyState} description={copy.safetyDescription}>
            <AdminRow>
              <strong>{copy.realLedgerMutation}</strong>
              <AdminBadge tone={payload.realLedgerMutationEnabled ? 'danger' : 'success'}>{payload.realLedgerMutationEnabled ? copy.enabled : copy.disabled}</AdminBadge>
            </AdminRow>
          </AdminCard>

          <AdminToolbar><strong>{copy.queues}</strong><span style={mutedStyle}>{queueEntries.length} {copy.latest}</span></AdminToolbar>
          <AdminStack>
            {queueEntries.map(([key, value]) => <AdminCard key={key}><AdminRow><strong>{key}</strong><AdminBadge tone="warning">{String(value)}</AdminBadge></AdminRow></AdminCard>)}
            {queueEntries.length === 0 && <AdminEmpty>{copy.noQueues}</AdminEmpty>}
          </AdminStack>

          <AdminToolbar><strong>{copy.openRiskAlerts}</strong><span style={mutedStyle}>{alerts.length} {copy.latest}</span></AdminToolbar>
          <AdminStack>
            {alerts.map((alert) => (
              <AdminCard key={alert.id}>
                <AdminRow>
                  <div><strong>{alert.title}</strong><p style={mutedStyle}>{alert.description ?? '-'}</p><p style={smallMutedStyle}>{alert.refType ?? '-'} · {alert.refId ?? '-'}</p></div>
                  <div style={actionStackStyle}>
                    <AdminBadge tone={severityTone(alert.severity)}>{alert.severity}</AdminBadge>
                    {canManage && <AdminButton tone="secondary" disabled={workingAlert === alert.id} onClick={() => requestAlertAction(alert, 'resolve')}>{copy.resolve}</AdminButton>}
                    {canManage && <AdminButton tone="secondary" disabled={workingAlert === alert.id} onClick={() => requestAlertAction(alert, 'dismiss')}>{copy.dismiss}</AdminButton>}
                  </div>
                </AdminRow>
              </AdminCard>
            ))}
            {alerts.length === 0 && <AdminEmpty>{copy.noOpenAlerts}</AdminEmpty>}
          </AdminStack>

          <AdminToolbar><strong>{copy.recentTransfers}</strong><span style={mutedStyle}>{transfers.length} {copy.latest}</span></AdminToolbar>
          <AdminStack>
            {transfers.map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{item.type} · {item.amount} {item.currency}</strong><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.user?.username ?? item.user?.phone ?? '-'}</p></div><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow></AdminCard>)}
            {transfers.length === 0 && <AdminEmpty>{copy.noTransfers}</AdminEmpty>}
          </AdminStack>

          <AdminToolbar><strong>{copy.alertRules}</strong><span style={mutedStyle}>{rules.length} {copy.rules}</span></AdminToolbar>
          <AdminStack>
            {rules.map((rule) => <AdminCard key={rule.code}><AdminRow><div><strong>{rule.title}</strong><p style={mutedStyle}>{rule.description}</p><p style={smallMutedStyle}>{rule.queryHint}</p></div><AdminBadge tone={severityTone(rule.severity)}>{rule.severity}</AdminBadge></AdminRow></AdminCard>)}
            {rules.length === 0 && <AdminEmpty>{copy.noRules}</AdminEmpty>}
          </AdminStack>

          <AdminToolbar><strong>{copy.simulatorScenarios}</strong><span style={mutedStyle}>{simulator.scenarios?.length ?? 0} {copy.scenarios}</span></AdminToolbar>
          <AdminStack>
            {(simulator.scenarios ?? []).map((item) => <AdminCard key={item.code}><AdminRow><strong>{item.code}</strong><span style={mutedStyle}>{item.description}</span></AdminRow></AdminCard>)}
            {(simulator.scenarios ?? []).length === 0 && <AdminEmpty>{copy.noScenarios}</AdminEmpty>}
          </AdminStack>

          <AdminCard title={copy.securityReadiness} description={copy.securityDescription}>
            <AdminStack>
              {security.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge tone="warning">{copy.preflightRequired}</AdminBadge></AdminRow>)}
              {security.length === 0 && <AdminEmpty>{copy.noChecklist}</AdminEmpty>}
            </AdminStack>
          </AdminCard>
        </>
      )}

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.action === 'dismiss' ? copy.confirmDismiss : copy.confirmResolve}
        description={copy.confirmDescription}
        confirmLabel={workingAlert ? copy.saving : copy.confirm}
        tone={pendingAction?.action === 'dismiss' ? 'warning' : 'success'}
        busy={Boolean(workingAlert)}
        onCancel={() => { if (!workingAlert) { setPendingAction(null); setActionNote(''); } }}
        onConfirm={() => void confirmAlertAction()}
        details={pendingAction ? <div><p><strong>{pendingAction.title}</strong></p><label style={noteStyle}>{copy.note}<textarea value={actionNote} onChange={(event) => setActionNote(event.target.value)} placeholder={copy.notePlaceholder} rows={3} /></label></div> : null}
      />
    </AdminPage>
  );
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'SUCCESS' || status === 'MATCHED') return 'success';
  if (status === 'FAILED' || status === 'MISMATCH') return 'danger';
  if (status === 'PENDING' || status === 'UNKNOWN') return 'warning';
  return 'neutral';
}

function severityTone(severity: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  if (severity === 'LOW') return 'success';
  return 'neutral';
}

const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const actionStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const noteStyle = { display: 'grid', gap: 8, color: '#cbd5e1', fontSize: 12 } as const;
