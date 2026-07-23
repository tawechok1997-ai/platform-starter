'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import { AdminActionStrip, AdminBadge, AdminButton, AdminCard, AdminCommandPanel, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
type QuickLink = readonly [title: string, href: string];
type QuickGroup = { title: string; tone: BadgeTone; items: readonly QuickLink[] };
type ControlCenter = { summary?: Record<string, number>; queues?: Record<string, number>; recent?: { ledgers?: any[]; transfers?: any[]; snapshots?: any[]; alerts?: any[] }; realLedgerMutationEnabled?: boolean };
type QueueSummary = { topUps?: { count?: number }; withdrawals?: { count?: number } };
type QueueAging = { oldest?: Array<{ type?: 'TOPUP' | 'WITHDRAWAL'; ageMinutes?: number }> };
type TopAction = { title: string; description: string; href: string };
type PriorityFilter = 'all' | 'critical' | 'member';
type QueueTask = { id: string; title: string; count: number; href: string; tone: BadgeTone; priority: number; group: Exclude<PriorityFilter, 'all'>; helper: string; ageMinutes?: number | undefined };

type OperationsCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; loadFailed: string; primaryLabel: string; openPrimary: string;
  urgent: string; urgentHelp: string; pendingDeposits: string; depositHelp: string; pendingWithdrawals: string; withdrawalHelp: string; failedTransfers: string; transferHelp: string; riskIssues: string; reviewHelp: string; mismatches: string; mismatchHelp: string;
  realMoneyWarning: string; queueTitle: string; queueDescription: string; depositReview: string; withdrawalReview: string; failedTransferReview: string; riskReview: string; reconciliationReview: string; webhookReview: string; noPending: string; actionNeeded: string; open: string; details: string; close: string; taskDetail: string; priorityFilter: string; allPriority: string; criticalPriority: string; memberPriority: string; priorityLabel: string; oldestWaiting: string;
  providerSetup: string; providerSetupDescription: string; simpleSetup: string; simpleSetupDescription: string; addProvider: string; addProviderDescription: string; transferReview: string; transferReviewDescription: string;
  recent: string; recentDescription: string; recentTransfers: string; recentAlerts: string; recentLedger: string; allTools: string; allToolsDescription: string; noRecentData: string; view: string;
  dailyWork: string; providerTools: string; advancedTools: string; reviewDeposits: string; reviewWithdrawals: string; riskAlerts: string; ledgerHistory: string; reconciliation: string; adapterTest: string; rotateKey: string; webhookLogs: string; auditLogs: string;
  success: string; failed: string; pending: string; reversed: string; cancelled: string; critical: string; high: string; medium: string; low: string; transferIn: string; transferOut: string; rollback: string; sync: string; adjustment: string; credit: string; debit: string; deposit: string; withdrawal: string; transfer: string; bonus: string;
  topActions: { transfer: TopAction; mismatch: TopAction; risk: TopAction; withdrawal: TopAction; deposit: TopAction; webhook: TopAction; clear: TopAction };
};

const operationsCopy: Record<AdminLocale, OperationsCopy> = {
  th: {
    eyebrow: 'ศูนย์ปฏิบัติการ', title: 'งานแอดมิน', description: 'งานสำคัญ การเงิน และความเสี่ยง', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', loadFailed: 'โหลดศูนย์ปฏิบัติการไม่สำเร็จ ลองใหม่', primaryLabel: 'งานที่ควรทำตอนนี้', openPrimary: 'เปิดงานหลัก',
    urgent: 'งานที่ต้องดู', urgentHelp: 'งานค้างและปัญหา', pendingDeposits: 'ฝากรอตรวจ', depositHelp: 'สมาชิกแจ้งฝาก', pendingWithdrawals: 'ถอนรอดำเนินการ', withdrawalHelp: 'สมาชิกขอถอน', failedTransfers: 'โยกเงินมีปัญหา', transferHelp: 'เกมหรือวอลเล็ต', riskIssues: 'ปัญหาความเสี่ยง', reviewHelp: 'ต้องตรวจ', mismatches: 'ยอดไม่ตรง', mismatchHelp: 'ค่ายหรือระบบ',
    realMoneyWarning: 'โหมดเงินจริงเปิดอยู่ ตรวจสอบก่อนทำรายการเงิน', queueTitle: 'งานที่ต้องจัดการ', queueDescription: 'เรียงงานสำคัญก่อนและกรองตามประเภท', depositReview: 'ตรวจรายการฝาก', withdrawalReview: 'ตรวจรายการถอน', failedTransferReview: 'โยกเงินไม่สำเร็จ', riskReview: 'ปัญหาที่ต้องตรวจ', reconciliationReview: 'ยอดค่ายไม่ตรง', webhookReview: 'เว็บฮุกล้มเหลว', noPending: 'ไม่มีงานค้าง', actionNeeded: 'ต้องจัดการ', open: 'เปิด', details: 'รายละเอียด', close: 'ปิด', taskDetail: 'รายละเอียดงาน', priorityFilter: 'กรองลำดับงาน', allPriority: 'ทั้งหมด', criticalPriority: 'เร่งด่วน', memberPriority: 'คิวสมาชิก', priorityLabel: 'ลำดับ', oldestWaiting: 'ค้างนานสุด',
    providerSetup: 'ตั้งค่าค่ายเกม', providerSetupDescription: 'ตั้งค่าและตรวจค่าย', simpleSetup: 'ตั้งค่าง่าย', simpleSetupDescription: 'ตรวจความพร้อม ใส่คีย์ และทดสอบ', addProvider: 'เพิ่มค่ายใหม่', addProviderDescription: 'เพิ่มค่ายเป็นขั้นตอน', transferReview: 'ดูการโยกเงิน', transferReviewDescription: 'ตรวจเงินเข้าเกมและกลับวอลเล็ต',
    recent: 'ล่าสุด', recentDescription: 'รายการล่าสุดสำหรับติดตาม', recentTransfers: 'โยกเงินล่าสุด', recentAlerts: 'ปัญหาล่าสุด', recentLedger: 'รายการเงินล่าสุด', allTools: 'เมนูทั้งหมด', allToolsDescription: 'แยกเครื่องมือขั้นสูงจากงานประจำ', noRecentData: 'ยังไม่มีข้อมูล', view: 'ดู',
    dailyWork: 'งานประจำวัน', providerTools: 'ตั้งค่าค่ายเกม', advancedTools: 'เครื่องมือขั้นสูง', reviewDeposits: 'ตรวจฝาก', reviewWithdrawals: 'ตรวจถอน', riskAlerts: 'ปัญหาที่ต้องดู', ledgerHistory: 'ประวัติเงิน', reconciliation: 'ตรวจยอดค่าย', adapterTest: 'ทดสอบการเชื่อมต่อ', rotateKey: 'เปลี่ยนคีย์เชื่อมต่อ', webhookLogs: 'บันทึกเว็บฮุก', auditLogs: 'บันทึกตรวจสอบ',
    success: 'สำเร็จ', failed: 'มีปัญหา', pending: 'กำลังทำ', reversed: 'คืนแล้ว', cancelled: 'ยกเลิก', critical: 'วิกฤต', high: 'สูง', medium: 'กลาง', low: 'ต่ำ', transferIn: 'โยกเข้าเกม', transferOut: 'โยกกลับวอลเล็ต', rollback: 'คืนเงิน', sync: 'ซิงก์ยอด', adjustment: 'ปรับยอด', credit: 'เงินเข้า', debit: 'เงินออก', deposit: 'ฝาก', withdrawal: 'ถอน', transfer: 'โยกเงิน', bonus: 'โบนัส',
    topActions: {
      transfer: { title: 'ตรวจรายการโยกเงินที่มีปัญหา', description: 'กระทบยอดสมาชิกและค่ายเกมโดยตรง', href: '/game-transfers' },
      mismatch: { title: 'ตรวจยอดค่ายที่ไม่ตรงกัน', description: 'ตรวจ snapshot และรายการที่เกี่ยวข้อง', href: '/reconciliation-center' },
      risk: { title: 'ตรวจเคสความเสี่ยง', description: 'เรียงตามความรุนแรงและเวลาที่กำหนด', href: '/risk-alerts' },
      withdrawal: { title: 'ตรวจรายการถอน', description: 'ตรวจบัญชีและหลักฐานก่อนจ่ายเงิน', href: '/withdrawals' },
      deposit: { title: 'ตรวจรายการฝาก', description: 'ตรวจหลักฐานและเครดิตตามขั้นตอน', href: '/topups' },
      webhook: { title: 'ตรวจการแจ้งกลับที่ล้มเหลว', description: 'ตรวจบันทึกและผลประมวลผล', href: '/webhook-logs' },
      clear: { title: 'ไม่มีงานเร่งด่วน', description: 'ไม่มีคิวหรือเหตุการณ์ที่ต้องทำตอนนี้', href: '/simple-game-settings' },
    },
  },
  en: {
    eyebrow: 'Operations center', title: 'Admin operations', description: 'Priority work, finance, and risk', refresh: 'Refresh', loading: 'Loading...', loadFailed: 'Unable to load the operations center. Try again.', primaryLabel: 'Priority now', openPrimary: 'Open primary task',
    urgent: 'Needs review', urgentHelp: 'Pending work and issues', pendingDeposits: 'Pending deposits', depositHelp: 'Member deposits', pendingWithdrawals: 'Pending withdrawals', withdrawalHelp: 'Member withdrawals', failedTransfers: 'Failed transfers', transferHelp: 'Game or wallet', riskIssues: 'Risk issues', reviewHelp: 'Needs review', mismatches: 'Mismatches', mismatchHelp: 'Provider or system',
    realMoneyWarning: 'Real-money mode is on. Verify before any money action.', queueTitle: 'Review queue', queueDescription: 'Prioritized work with category filters', depositReview: 'Review deposits', withdrawalReview: 'Review withdrawals', failedTransferReview: 'Failed transfers', riskReview: 'Risk issues', reconciliationReview: 'Provider mismatch', webhookReview: 'Failed webhooks', noPending: 'No pending work', actionNeeded: 'Action needed', open: 'Open', details: 'Details', close: 'Close', taskDetail: 'Task details', priorityFilter: 'Priority filter', allPriority: 'All', criticalPriority: 'Critical', memberPriority: 'Member queues', priorityLabel: 'Priority', oldestWaiting: 'Oldest waiting',
    providerSetup: 'Provider setup', providerSetupDescription: 'Configure and verify providers', simpleSetup: 'Quick setup', simpleSetupDescription: 'Check readiness, add keys, and test', addProvider: 'Add provider', addProviderDescription: 'Guided provider setup', transferReview: 'Review transfers', transferReviewDescription: 'Check game and wallet transfers',
    recent: 'Recent', recentDescription: 'Latest items to follow up', recentTransfers: 'Recent transfers', recentAlerts: 'Recent issues', recentLedger: 'Recent ledger', allTools: 'All tools', allToolsDescription: 'Advanced tools separate from daily work', noRecentData: 'No data yet', view: 'View',
    dailyWork: 'Daily work', providerTools: 'Provider setup', advancedTools: 'Advanced tools', reviewDeposits: 'Review deposits', reviewWithdrawals: 'Review withdrawals', riskAlerts: 'Risk alerts', ledgerHistory: 'Ledger history', reconciliation: 'Reconciliation', adapterTest: 'API test', rotateKey: 'Rotate API key', webhookLogs: 'Webhook logs', auditLogs: 'Audit logs',
    success: 'Success', failed: 'Failed', pending: 'Pending', reversed: 'Reversed', cancelled: 'Cancelled', critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', transferIn: 'Transfer to game', transferOut: 'Transfer to wallet', rollback: 'Rollback', sync: 'Sync', adjustment: 'Adjustment', credit: 'Credit', debit: 'Debit', deposit: 'Deposit', withdrawal: 'Withdrawal', transfer: 'Transfer', bonus: 'Bonus',
    topActions: {
      transfer: { title: 'Review failed transfers', description: 'Directly affects member and provider balances', href: '/game-transfers' },
      mismatch: { title: 'Review provider mismatches', description: 'Check related snapshots and transactions', href: '/reconciliation-center' },
      risk: { title: 'Review risk cases', description: 'Prioritized by severity and SLA', href: '/risk-alerts' },
      withdrawal: { title: 'Review withdrawals', description: 'Verify the account and evidence before payment', href: '/withdrawals' },
      deposit: { title: 'Review deposits', description: 'Verify evidence and credit by workflow', href: '/topups' },
      webhook: { title: 'Review failed webhooks', description: 'Check logs and processing results', href: '/webhook-logs' },
      clear: { title: 'No urgent work', description: 'No queue or event needs action now', href: '/simple-game-settings' },
    },
  },
};

export default function OperationsPage() {
  const [locale] = useAdminLocale();
  const copy = operationsCopy[locale];
  const [control, setControl] = useState<ControlCenter>({});
  const [queues, setQueues] = useState<QueueSummary>({});
  const [aging, setAging] = useState<QueueAging>({});
  const [state, setState] = useState<'loading' | 'failed' | ''>('loading');
  const [loading, setLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedTask, setSelectedTask] = useState<QueueTask | null>(null);

  useEffect(() => { void load(); }, []);

  const summary = control.summary ?? {};
  const pendingTopUps = Number(queues.topUps?.count ?? 0);
  const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);
  const failedTransfers = Number(summary.failedTransfers ?? 0);
  const openRiskAlerts = Number(summary.openRiskAlerts ?? 0);
  const mismatchSnapshots = Number(summary.mismatchSnapshots ?? 0);
  const webhookFailed = Number(summary.webhookFailed ?? 0);
  const oldestTopUpAge = oldestAgeMinutes(aging, 'TOPUP');
  const oldestWithdrawalAge = oldestAgeMinutes(aging, 'WITHDRAWAL');
  const urgentCount = useMemo(() => pendingTopUps + pendingWithdrawals + failedTransfers + mismatchSnapshots + openRiskAlerts + webhookFailed, [pendingTopUps, pendingWithdrawals, failedTransfers, mismatchSnapshots, openRiskAlerts, webhookFailed]);
  const primaryAction = topAction({ pendingTopUps, pendingWithdrawals, failedTransfers, openRiskAlerts, mismatchSnapshots, webhookFailed }, copy);
  const quickGroups = buildQuickGroups(copy);
  const message = state === 'loading' ? copy.loading : state === 'failed' ? copy.loadFailed : '';
  const queueTasks = useMemo<QueueTask[]>(() => ([
    { id: 'transfer', title: copy.failedTransferReview, count: failedTransfers, href: '/game-transfers', tone: 'danger', priority: 100, group: 'critical', helper: copy.transferHelp },
    { id: 'mismatch', title: copy.reconciliationReview, count: mismatchSnapshots, href: '/reconciliation-center', tone: 'danger', priority: 90, group: 'critical', helper: copy.mismatchHelp },
    { id: 'risk', title: copy.riskReview, count: openRiskAlerts, href: '/risk-alerts', tone: 'danger', priority: 80, group: 'critical', helper: copy.reviewHelp },
    { id: 'webhook', title: copy.webhookReview, count: webhookFailed, href: '/webhook-logs', tone: 'warning', priority: 70, group: 'critical', helper: copy.reviewHelp },
    { id: 'withdrawal', title: copy.withdrawalReview, count: pendingWithdrawals, href: '/withdrawals', tone: 'warning', priority: 60, group: 'member', helper: copy.withdrawalHelp, ageMinutes: oldestWithdrawalAge },
    { id: 'deposit', title: copy.depositReview, count: pendingTopUps, href: '/topups', tone: 'warning', priority: 50, group: 'member', helper: copy.depositHelp, ageMinutes: oldestTopUpAge },
  ] satisfies QueueTask[]).filter((task) => priorityFilter === 'all' || task.group === priorityFilter).sort((a, b) => (b.count > 0 ? b.priority : 0) - (a.count > 0 ? a.priority : 0)), [copy, failedTransfers, mismatchSnapshots, oldestTopUpAge, oldestWithdrawalAge, openRiskAlerts, pendingTopUps, pendingWithdrawals, priorityFilter, webhookFailed]);

  async function load() {
    setLoading(true);
    setState('loading');
    try {
      const [controlRes, queueRes, agingRes] = await Promise.all([
        adminApiFetch('/admin/money-ops/control-center'),
        adminApiFetch('/admin/queues/summary'),
        adminApiFetch('/admin/reports/queue-aging'),
      ]);
      const [controlData, queueData, agingData] = await Promise.all([
        controlRes.json().catch(() => null),
        queueRes.json().catch(() => null),
        agingRes.json().catch(() => null),
      ]);
      if (controlRes.ok && controlData) setControl(controlData);
      if (queueRes.ok && queueData) setQueues(queueData);
      if (agingRes.ok && agingData) setAging(agingData);
      setState(!controlRes.ok && !queueRes.ok ? 'failed' : '');
    } catch {
      setState('failed');
    } finally {
      setLoading(false);
    }
  }

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton onClick={load} disabled={loading}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
    {message && <AdminNotice tone={state === 'loading' ? 'neutral' : 'danger'}>{message}</AdminNotice>}
    <AdminCommandPanel>
      <AdminActionStrip><div><p style={eyebrowInlineStyle}>{copy.primaryLabel}</p><h2 style={commandTitleStyle}>{primaryAction.title}</h2><p style={mutedStyle}>{primaryAction.description}</p></div><AdminLinkButton href={primaryAction.href} tone="primary">{copy.openPrimary}</AdminLinkButton></AdminActionStrip>
      <div style={{ height: 14 }} />
      <AdminMetricGrid>
        <AdminMetric tone={urgentCount > 0 ? 'danger' : 'success'} title={copy.urgent} value={formatNumber(urgentCount, locale)} helper={copy.urgentHelp} />
        <AdminMetric tone={pendingTopUps > 0 ? 'warning' : 'neutral'} title={copy.pendingDeposits} value={formatNumber(pendingTopUps, locale)} helper={oldestTopUpAge === undefined ? copy.depositHelp : `${copy.oldestWaiting} ${formatQueueAge(oldestTopUpAge, locale)}`} />
        <AdminMetric tone={pendingWithdrawals > 0 ? 'warning' : 'neutral'} title={copy.pendingWithdrawals} value={formatNumber(pendingWithdrawals, locale)} helper={oldestWithdrawalAge === undefined ? copy.withdrawalHelp : `${copy.oldestWaiting} ${formatQueueAge(oldestWithdrawalAge, locale)}`} />
        <AdminMetric tone={failedTransfers > 0 ? 'danger' : 'neutral'} title={copy.failedTransfers} value={formatNumber(failedTransfers, locale)} helper={copy.transferHelp} />
        <AdminMetric tone={openRiskAlerts > 0 ? 'danger' : 'neutral'} title={copy.riskIssues} value={formatNumber(openRiskAlerts, locale)} helper={copy.reviewHelp} />
        <AdminMetric tone={mismatchSnapshots > 0 ? 'danger' : 'neutral'} title={copy.mismatches} value={formatNumber(mismatchSnapshots, locale)} helper={copy.mismatchHelp} />
      </AdminMetricGrid>
    </AdminCommandPanel>
    {control.realLedgerMutationEnabled && <AdminNotice tone="warning">{copy.realMoneyWarning}</AdminNotice>}
    <AdminToolbar><strong>{copy.queueTitle}</strong><label style={filterLabelStyle}><span>{copy.priorityFilter}</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}><option value="all">{copy.allPriority}</option><option value="critical">{copy.criticalPriority}</option><option value="member">{copy.memberPriority}</option></select></label></AdminToolbar>
    <AdminGrid>
      <AdminCard tone="warning" title={copy.queueTitle} description={copy.queueDescription}><AdminStack>
        {queueTasks.map((task) => <QueueRow key={task.id} task={task} copy={copy} locale={locale} onDetails={() => setSelectedTask(task)} />)}
        {queueTasks.length === 0 && <AdminEmpty>{copy.noPending}</AdminEmpty>}
      </AdminStack></AdminCard>
      <AdminCard tone="success" title={copy.providerSetup} description={copy.providerSetupDescription}><AdminStack>
        <ToolRow title={copy.simpleSetup} href="/simple-game-settings" description={copy.simpleSetupDescription} copy={copy} />
        <ToolRow title={copy.addProvider} href="/provider-setup-wizard" description={copy.addProviderDescription} copy={copy} />
        <ToolRow title={copy.transferReview} href="/game-transfers" description={copy.transferReviewDescription} copy={copy} />
      </AdminStack></AdminCard>
    </AdminGrid>
    <AdminToolbar><strong>{copy.recent}</strong><span style={mutedStyle}>{copy.recentDescription}</span></AdminToolbar>
    <AdminGrid>
      <RecentCard title={copy.recentTransfers} items={control.recent?.transfers ?? []} copy={copy} render={(item) => <AdminRow key={item.id}><div><strong>{transferLabel(item.type, copy)} · {formatMoney(item.amount, item.currency ?? 'THB', locale)}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.provider?.name ?? item.provider?.code ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status, copy)}</AdminBadge><AdminLinkButton href={`/game-transfers/${item.id}`}>{copy.view}</AdminLinkButton></div></AdminRow>} />
      <RecentCard title={copy.recentAlerts} items={control.recent?.alerts ?? []} copy={copy} render={(item) => <AdminRow key={item.id}><div><strong>{item.title ?? item.type}</strong><p style={mutedStyle}>{item.refType ?? '-'} · {item.refId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={severityTone(item.severity)}>{humanSeverity(item.severity, copy)}</AdminBadge><AdminLinkButton href={`/risk-alerts/${item.id}`}>{copy.view}</AdminLinkButton></div></AdminRow>} />
      <RecentCard title={copy.recentLedger} items={(control.recent?.ledgers ?? []).slice(0, 5)} copy={copy} render={(item) => <AdminRow key={item.id}><div><strong>{item.direction === 'CREDIT' ? copy.credit : copy.debit} · {formatMoney(item.amount, 'THB', locale)}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.referenceType ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{ledgerLabel(item.type, copy)}</AdminBadge><AdminLinkButton href={`/wallet-ledgers/${item.id}`}>{copy.view}</AdminLinkButton></div></AdminRow>} />
    </AdminGrid>
    <AdminToolbar><strong>{copy.allTools}</strong><span style={mutedStyle}>{copy.allToolsDescription}</span></AdminToolbar>
    <AdminGrid>{quickGroups.map((group) => <AdminCard key={group.title} title={group.title}><AdminStack>{group.items.map(([title, href]) => <AdminRow key={href}><strong>{title}</strong><div style={rightStyle}><AdminBadge tone={group.tone}>{group.title}</AdminBadge><AdminLinkButton href={href}>{copy.open}</AdminLinkButton></div></AdminRow>)}</AdminStack></AdminCard>)}</AdminGrid>
    <AdminDrawer open={Boolean(selectedTask)} title={selectedTask?.title ?? copy.taskDetail} description={copy.taskDetail} closeLabel={copy.close} size="compact" onClose={() => setSelectedTask(null)}>
      {selectedTask && <AdminStack><AdminRow><strong>{copy.priorityLabel}</strong><AdminBadge tone={selectedTask.tone}>{selectedTask.priority}</AdminBadge></AdminRow><AdminRow><strong>{copy.urgent}</strong><span>{formatNumber(selectedTask.count, locale)}</span></AdminRow>{selectedTask.ageMinutes !== undefined && <AdminRow><strong>{copy.oldestWaiting}</strong><AdminBadge tone={ageTone(selectedTask.ageMinutes)}>{formatQueueAge(selectedTask.ageMinutes, locale)}</AdminBadge></AdminRow>}<AdminRow><strong>{copy.details}</strong><span>{selectedTask.helper}</span></AdminRow><AdminLinkButton href={selectedTask.href} tone="primary">{copy.openPrimary}</AdminLinkButton></AdminStack>}
    </AdminDrawer>
  </AdminPage>;
}

function QueueRow({ task, copy, locale, onDetails }: { task: QueueTask; copy: OperationsCopy; locale: AdminLocale; onDetails: () => void }) { return <AdminRow><div><strong>{task.title}</strong><p style={mutedStyle}>{task.count > 0 ? copy.actionNeeded : copy.noPending}</p></div><div style={rightStyle}>{task.count > 0 && task.ageMinutes !== undefined && <AdminBadge tone={ageTone(task.ageMinutes)}>{copy.oldestWaiting} {formatQueueAge(task.ageMinutes, locale)}</AdminBadge>}<AdminBadge tone={task.count > 0 ? task.tone : 'success'}>{formatNumber(task.count, locale)}</AdminBadge><AdminButton tone="secondary" onClick={onDetails}>{copy.details}</AdminButton><AdminLinkButton href={task.href} tone={task.count > 0 ? 'primary' : 'secondary'}>{copy.open}</AdminLinkButton></div></AdminRow>; }
function ToolRow({ title, description, href, copy }: { title: string; description: string; href: string; copy: OperationsCopy }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminLinkButton href={href}>{copy.open}</AdminLinkButton></AdminRow>; }
function RecentCard({ title, items, render, copy }: { title: string; items: any[]; render: (item: any) => ReactNode; copy: OperationsCopy }) { return <AdminCard title={title}>{items.length ? <AdminStack>{items.map(render)}</AdminStack> : <AdminEmpty>{copy.noRecentData}</AdminEmpty>}</AdminCard>; }

function buildQuickGroups(copy: OperationsCopy): readonly QuickGroup[] {
  return [
    { title: copy.dailyWork, tone: 'warning', items: [[copy.reviewDeposits, '/topups'], [copy.reviewWithdrawals, '/withdrawals'], [copy.riskAlerts, '/risk-alerts'], [copy.ledgerHistory, '/wallet-ledgers']] },
    { title: copy.providerTools, tone: 'success', items: [[copy.simpleSetup, '/simple-game-settings'], [copy.addProvider, '/provider-setup-wizard'], [copy.transferReview, '/game-transfers'], [copy.reconciliation, '/reconciliation-center']] },
    { title: copy.advancedTools, tone: 'neutral', items: [[copy.adapterTest, '/adapter-test'], [copy.rotateKey, '/provider-credentials'], [copy.webhookLogs, '/webhook-logs'], [copy.auditLogs, '/audit-logs']] },
  ];
}

function topAction(input: { pendingTopUps: number; pendingWithdrawals: number; failedTransfers: number; openRiskAlerts: number; mismatchSnapshots: number; webhookFailed: number }, copy: OperationsCopy) {
  if (input.failedTransfers > 0) return copy.topActions.transfer;
  if (input.mismatchSnapshots > 0) return copy.topActions.mismatch;
  if (input.openRiskAlerts > 0) return copy.topActions.risk;
  if (input.pendingWithdrawals > 0) return copy.topActions.withdrawal;
  if (input.pendingTopUps > 0) return copy.topActions.deposit;
  if (input.webhookFailed > 0) return copy.topActions.webhook;
  return copy.topActions.clear;
}

function oldestAgeMinutes(aging: QueueAging, type: 'TOPUP' | 'WITHDRAWAL') {
  const values = (aging.oldest ?? []).filter((item) => item.type === type).map((item) => Number(item.ageMinutes)).filter(Number.isFinite);
  return values.length ? Math.max(...values) : undefined;
}
function formatQueueAge(minutes: number, locale: AdminLocale) {
  const safeMinutes = Math.max(Math.floor(minutes), 0);
  if (safeMinutes >= 1440) { const days = Math.floor(safeMinutes / 1440); return locale === 'th' ? `${days} วัน` : `${days}d`; }
  if (safeMinutes >= 60) { const hours = Math.floor(safeMinutes / 60); const remainder = safeMinutes % 60; return locale === 'th' ? `${hours} ชม.${remainder ? ` ${remainder} นาที` : ''}` : `${hours}h${remainder ? ` ${remainder}m` : ''}`; }
  return locale === 'th' ? `${safeMinutes} นาที` : `${safeMinutes}m`;
}
function ageTone(minutes: number): BadgeTone { if (minutes >= 60) return 'danger'; if (minutes >= 15) return 'warning'; return 'neutral'; }
function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function formatMoney(value: string | number | null | undefined, currency: string, locale: AdminLocale) { const amount = typeof value === 'number' ? value : Number(value ?? 0); return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}`; }
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function severityTone(severity: string) { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; return 'neutral'; }
function humanStatus(status: string, copy: OperationsCopy) { const map: Record<string, string> = { SUCCESS: copy.success, FAILED: copy.failed, PENDING: copy.pending, REVERSED: copy.reversed, CANCELLED: copy.cancelled }; return map[status] ?? status ?? '-'; }
function humanSeverity(severity: string, copy: OperationsCopy) { const map: Record<string, string> = { CRITICAL: copy.critical, HIGH: copy.high, MEDIUM: copy.medium, LOW: copy.low }; return map[severity] ?? severity ?? '-'; }
function transferLabel(type: string, copy: OperationsCopy) { const map: Record<string, string> = { TRANSFER_IN: copy.transferIn, TRANSFER_OUT: copy.transferOut, ROLLBACK: copy.rollback, SYNC: copy.sync, ADJUSTMENT: copy.adjustment }; return map[type] ?? type ?? copy.transfer; }
function ledgerLabel(type: string, copy: OperationsCopy) { const map: Record<string, string> = { DEPOSIT: copy.deposit, WITHDRAWAL: copy.withdrawal, TRANSFER: copy.transfer, REVERSAL: copy.reversed, ADJUSTMENT: copy.adjustment, BONUS: copy.bonus }; return map[type] ?? type ?? '-'; }

const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
const eyebrowInlineStyle = { margin: '0 0 6px', color: '#f5c542', fontSize: 12, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase' as const } as const;
const commandTitleStyle = { margin: '0 0 6px', fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.08, fontWeight: 950, letterSpacing: -0.6 } as const;
const filterLabelStyle = { display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13, fontWeight: 800 } as const;
