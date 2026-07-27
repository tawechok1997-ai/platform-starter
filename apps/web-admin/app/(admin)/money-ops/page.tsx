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
  summary?: {
    walletCount?: number;
    failedTransfers?: number;
    mismatchSnapshots?: number;
    openRiskAlerts?: number;
  };
  queues?: Record<string, number>;
  recent?: { transfers?: Transfer[]; alerts?: RiskAlert[] };
  realLedgerMutationEnabled?: boolean;
};

type AlertRule = { code: string; title: string; severity: string; description: string; queryHint: string };
type SimulatorScenario = { code: string; description: string };
type PendingAction = { id: string; title: string; action: 'resolve' | 'dismiss' };
type NoticeState = { text: string; tone: 'neutral' | 'success' | 'warning' | 'danger' };

const copy = {
  th: {
    eyebrow: 'การเงินและความเสี่ยง',
    title: 'ศูนย์ควบคุม Money Ops',
    description: 'ตรวจ Ledger, Transfer, Reconciliation, Webhook และความพร้อมก่อนเปิดเงินจริง',
    refresh: 'อัปเดตข้อมูล', loading: 'กำลังโหลด', scan: 'สแกนความเสี่ยง',
    loadFailed: 'โหลดข้อมูล Money Ops ไม่สำเร็จ', partial: 'ข้อมูลบางส่วนโหลดไม่สำเร็จ กรุณาตรวจบริการที่เกี่ยวข้อง',
    wallets: 'กระเป๋าเงิน', failedTransfers: 'รายการโอนล้มเหลว', mismatch: 'ยอดไม่ตรงกัน', openAlerts: 'ความเสี่ยงที่เปิดอยู่',
    allWallets: 'กระเป๋าทั้งหมด', needsReview: 'ต้องตรวจสอบ', reconciliation: 'กระทบยอด', riskQueue: 'คิวความเสี่ยง',
    safety: 'สถานะความปลอดภัย', safetyDescription: 'ตรวจประตูก่อนอนุญาตให้แก้ Ledger จริง', realMutation: 'การแก้ Ledger จริง', enabled: 'เปิดใช้งาน', disabled: 'ปิดใช้งาน',
    queues: 'คิวงาน', noQueues: 'ไม่มีคิวงานค้าง', latest: 'รายการล่าสุด',
    risks: 'ความเสี่ยงที่เปิดอยู่', noRisks: 'ไม่มีความเสี่ยงที่เปิดอยู่', resolve: 'แก้ไขแล้ว', dismiss: 'ยกเลิกการแจ้งเตือน',
    transfers: 'รายการโอนล่าสุด', noTransfers: 'ยังไม่มีรายการโอนล่าสุด',
    rules: 'กฎตรวจจับความเสี่ยง', noRules: 'ไม่พบกฎตรวจจับความเสี่ยง',
    simulator: 'สถานการณ์จำลอง Provider', noSimulator: 'ไม่พบสถานการณ์จำลอง',
    security: 'ความพร้อมด้านความปลอดภัย', securityDescription: 'ข้อกำหนดที่ต้องตรวจยืนยันก่อนเปิดเงินจริง', preflight: 'ต้องยืนยันก่อนเปิดจริง', noChecklist: 'ไม่พบรายการตรวจความพร้อม',
    readOnly: 'สิทธิ์อ่านอย่างเดียว', readOnlyDescription: 'บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์สแกน แก้ไข หรือยกเลิกความเสี่ยง',
    confirmResolve: 'ยืนยันว่าแก้ไขความเสี่ยงแล้ว', confirmDismiss: 'ยืนยันการยกเลิกการแจ้งเตือน', confirmDescription: 'การดำเนินการนี้จะถูกบันทึกใน Audit Log',
    note: 'หมายเหตุ', notePlaceholder: 'ระบุเหตุผลหรือหลักฐานประกอบ', confirm: 'ยืนยัน', saving: 'กำลังบันทึก',
    scanSuccess: 'สแกนกฎความเสี่ยงแล้ว', actionSuccess: 'บันทึกสถานะความเสี่ยงแล้ว', actionFailed: 'ดำเนินการไม่สำเร็จ',
  },
  en: {
    eyebrow: 'Finance and risk',
    title: 'Money Ops control center',
    description: 'Review ledger, transfer, reconciliation, webhook, and real-money readiness',
    refresh: 'Refresh data', loading: 'Loading', scan: 'Scan risks',
    loadFailed: 'Unable to load Money Ops data', partial: 'Some data could not be loaded. Check the related services.',
    wallets: 'Wallets', failedTransfers: 'Failed transfers', mismatch: 'Mismatches', openAlerts: 'Open alerts',
    allWallets: 'All wallets', needsReview: 'Needs review', reconciliation: 'Reconciliation', riskQueue: 'Risk queue',
    safety: 'Safety state', safetyDescription: 'Verify the gate before real ledger mutations', realMutation: 'Real ledger mutation', enabled: 'Enabled', disabled: 'Disabled',
    queues: 'Queues', noQueues: 'No pending queues', latest: 'latest',
    risks: 'Open risk alerts', noRisks: 'No open risk alerts', resolve: 'Resolve', dismiss: 'Dismiss',
    transfers: 'Recent transfers', noTransfers: 'No recent transfers',
    rules: 'Risk alert rules', noRules: 'No risk alert rules found',
    simulator: 'Provider simulator scenarios', noSimulator: 'No simulator scenarios found',
    security: 'Security readiness', securityDescription: 'Requirements that must be verified before real-money enablement', preflight: 'Preflight required', noChecklist: 'No readiness checklist found',
    readOnly: 'Read-only access', readOnlyDescription: 'This account can view data but cannot scan, resolve, or dismiss alerts.',
    confirmResolve: 'Confirm risk resolution', confirmDismiss: 'Confirm alert dismissal', confirmDescription: 'This action will be recorded in the audit log.',
    note: 'Note', notePlaceholder: 'Add the reason or supporting evidence', confirm: 'Confirm', saving: 'Saving',
    scanSuccess: 'Risk rules scanned', actionSuccess: 'Risk alert status updated', actionFailed: 'Action failed',
  },
} satisfies Record<AdminLocale, Record<string, string>>;

export default function MoneyOpsPage() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const [payload, setPayload] = useState<ControlCenter>({});
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [scenarios, setScenarios] = useState<SimulatorScenario[]>([]);
  const [security, setSecurity] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingAlert, setWorkingAlert] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionNote, setActionNote] = useState('');

  const canManage = permissions.includes('*') || permissions.includes('game.providers.manage');
  const summary = payload.summary ?? {};
  const alerts = payload.recent?.alerts ?? [];
  const transfers = payload.recent?.transfers ?? [];
  const queueEntries = useMemo(
    () => Object.entries(payload.queues ?? {}).filter(([, value]) => Number(value) > 0),
    [payload.queues],
  );

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setNotice(null);
    try {
      const responses = await Promise.all([
        adminApiFetch('/admin/money-ops/control-center'),
        adminApiFetch('/admin/money-ops/alert-rules'),
        adminApiFetch('/admin/money-ops/provider-simulator/scenarios'),
        adminApiFetch('/admin/money-ops/security-hardening'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const bodies = await Promise.all(responses.map(readJson));
      const [controlResponse, rulesResponse, simulatorResponse, securityResponse, meResponse] = responses;
      const [controlBody, rulesBody, simulatorBody, securityBody, meBody] = bodies;
      if (!controlResponse?.ok || !controlBody) throw new Error(t.loadFailed);

      setPayload(controlBody as ControlCenter);
      setRules(rulesResponse?.ok ? arrayOf<AlertRule>(rulesBody?.items) : []);
      setScenarios(simulatorResponse?.ok ? arrayOf<SimulatorScenario>(simulatorBody?.scenarios) : []);
      setSecurity(securityResponse?.ok ? arrayOf<string>(securityBody?.items) : []);
      setPermissions(meResponse?.ok ? arrayOf<string>(meBody?.permissions) : []);

      if (responses.some((response) => !response.ok)) setNotice({ text: t.partial, tone: 'warning' });
    } catch (error) {
      setPayload({});
      setRules([]);
      setScenarios([]);
      setSecurity([]);
      setPermissions([]);
      setNotice({ text: error instanceof Error ? error.message : t.loadFailed, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function scanAlerts() {
    if (!canManage || loading) return;
    setLoading(true);
    setNotice(null);
    try {
      const response = await adminApiFetch('/admin/money-ops/alert-rules/scan', { method: 'POST' });
      const data = await readJson(response);
      if (!response.ok) throw new Error(stringValue(data?.message) || t.actionFailed);
      const findingCount = arrayOf<unknown>(data?.findings).length;
      await loadAll();
      setNotice({ text: `${t.scanSuccess}: ${findingCount}`, tone: 'success' });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : t.actionFailed, tone: 'danger' });
      setLoading(false);
    }
  }

  function requestAlertAction(alert: RiskAlert, action: PendingAction['action']) {
    if (!canManage) return;
    setActionNote('');
    setPendingAction({ id: alert.id, title: alert.title, action });
  }

  async function confirmAlertAction() {
    if (!pendingAction || !canManage || workingAlert) return;
    setWorkingAlert(pendingAction.id);
    setNotice(null);
    try {
      const response = await adminApiFetch(`/admin/money-ops/risk-alerts/${pendingAction.id}/${pendingAction.action}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: actionNote.trim() || undefined }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(stringValue(data?.message) || t.actionFailed);
      setPendingAction(null);
      setActionNote('');
      await loadAll();
      setNotice({ text: t.actionSuccess, tone: 'success' });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : t.actionFailed, tone: 'danger' });
    } finally {
      setWorkingAlert('');
    }
  }

  return (
    <AdminPage
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      actions={<>
        <AdminButton onClick={() => void loadAll()} disabled={loading}>{loading ? t.loading : t.refresh}</AdminButton>
        {canManage && <AdminButton tone="secondary" onClick={() => void scanAlerts()} disabled={loading}>{t.scan}</AdminButton>}
      </>}
    >
      {notice && <AdminNotice tone={notice.tone}>{notice.text}</AdminNotice>}
      {!loading && !canManage && <AdminNotice><strong>{t.readOnly}</strong><br />{t.readOnlyDescription}</AdminNotice>}

      {loading && Object.keys(summary).length === 0 ? <AdminSkeleton lines={6} /> : <>
        <AdminMetricGrid>
          <AdminMetric title={t.wallets} value={String(summary.walletCount ?? 0)} helper={t.allWallets} />
          <AdminMetric title={t.failedTransfers} value={String(summary.failedTransfers ?? 0)} helper={t.needsReview} tone={Number(summary.failedTransfers ?? 0) > 0 ? 'danger' : 'neutral'} />
          <AdminMetric title={t.mismatch} value={String(summary.mismatchSnapshots ?? 0)} helper={t.reconciliation} tone={Number(summary.mismatchSnapshots ?? 0) > 0 ? 'warning' : 'neutral'} />
          <AdminMetric title={t.openAlerts} value={String(summary.openRiskAlerts ?? 0)} helper={t.riskQueue} tone={Number(summary.openRiskAlerts ?? 0) > 0 ? 'warning' : 'neutral'} />
        </AdminMetricGrid>

        <AdminCard title={t.safety} description={t.safetyDescription}>
          <AdminRow><strong>{t.realMutation}</strong><AdminBadge tone={payload.realLedgerMutationEnabled ? 'danger' : 'success'}>{payload.realLedgerMutationEnabled ? t.enabled : t.disabled}</AdminBadge></AdminRow>
        </AdminCard>

        <AdminToolbar><strong>{t.queues}</strong><span style={mutedStyle}>{queueEntries.length} {t.latest}</span></AdminToolbar>
        <AdminStack>
          {queueEntries.map(([key, value]) => <AdminCard key={key}><AdminRow><strong>{key}</strong><AdminBadge tone="warning">{String(value)}</AdminBadge></AdminRow></AdminCard>)}
          {queueEntries.length === 0 && <AdminEmpty>{t.noQueues}</AdminEmpty>}
        </AdminStack>

        <AdminToolbar><strong>{t.risks}</strong><span style={mutedStyle}>{alerts.length} {t.latest}</span></AdminToolbar>
        <AdminStack>
          {alerts.map((alert) => <AdminCard key={alert.id}><AdminRow>
            <div><strong>{alert.title}</strong><p style={mutedStyle}>{alert.description ?? '-'}</p><p style={smallMutedStyle}>{alert.refType ?? '-'} · {alert.refId ?? '-'}</p></div>
            <div style={actionStackStyle}>
              <AdminBadge tone={severityTone(alert.severity)}>{alert.severity}</AdminBadge>
              {canManage && <AdminButton tone="secondary" disabled={workingAlert === alert.id} onClick={() => requestAlertAction(alert, 'resolve')}>{t.resolve}</AdminButton>}
              {canManage && <AdminButton tone="secondary" disabled={workingAlert === alert.id} onClick={() => requestAlertAction(alert, 'dismiss')}>{t.dismiss}</AdminButton>}
            </div>
          </AdminRow></AdminCard>)}
          {alerts.length === 0 && <AdminEmpty>{t.noRisks}</AdminEmpty>}
        </AdminStack>

        <AdminToolbar><strong>{t.transfers}</strong><span style={mutedStyle}>{transfers.length} {t.latest}</span></AdminToolbar>
        <AdminStack>
          {transfers.map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{item.type} · {item.amount} {item.currency}</strong><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.user?.username ?? item.user?.phone ?? '-'}</p></div><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow></AdminCard>)}
          {transfers.length === 0 && <AdminEmpty>{t.noTransfers}</AdminEmpty>}
        </AdminStack>

        <AdminToolbar><strong>{t.rules}</strong><span style={mutedStyle}>{rules.length}</span></AdminToolbar>
        <AdminStack>
          {rules.map((rule) => <AdminCard key={rule.code}><AdminRow><div><strong>{rule.title}</strong><p style={mutedStyle}>{rule.description}</p><p style={smallMutedStyle}>{rule.queryHint}</p></div><AdminBadge tone={severityTone(rule.severity)}>{rule.severity}</AdminBadge></AdminRow></AdminCard>)}
          {rules.length === 0 && <AdminEmpty>{t.noRules}</AdminEmpty>}
        </AdminStack>

        <AdminToolbar><strong>{t.simulator}</strong><span style={mutedStyle}>{scenarios.length}</span></AdminToolbar>
        <AdminStack>
          {scenarios.map((item) => <AdminCard key={item.code}><AdminRow><strong>{item.code}</strong><span style={mutedStyle}>{item.description}</span></AdminRow></AdminCard>)}
          {scenarios.length === 0 && <AdminEmpty>{t.noSimulator}</AdminEmpty>}
        </AdminStack>

        <AdminCard title={t.security} description={t.securityDescription}>
          <AdminStack>
            {security.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge tone="warning">{t.preflight}</AdminBadge></AdminRow>)}
            {security.length === 0 && <AdminEmpty>{t.noChecklist}</AdminEmpty>}
          </AdminStack>
        </AdminCard>
      </>}

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.action === 'dismiss' ? t.confirmDismiss : t.confirmResolve}
        description={t.confirmDescription}
        confirmLabel={workingAlert ? t.saving : t.confirm}
        tone={pendingAction?.action === 'dismiss' ? 'danger' : 'success'}
        busy={Boolean(workingAlert)}
        onCancel={() => { if (!workingAlert) { setPendingAction(null); setActionNote(''); } }}
        onConfirm={() => void confirmAlertAction()}
        details={pendingAction ? <div><p><strong>{pendingAction.title}</strong></p><label style={noteStyle}>{t.note}<textarea value={actionNote} onChange={(event) => setActionNote(event.target.value)} placeholder={t.notePlaceholder} rows={3} /></label></div> : null}
      />
    </AdminPage>
  );
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

function arrayOf<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
function stringValue(value: unknown) { return typeof value === 'string' ? value : ''; }
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
