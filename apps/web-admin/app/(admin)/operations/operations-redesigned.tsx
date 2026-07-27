'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminLinkButton, AdminNotice, AdminPage } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import styles from './operations-redesigned.module.css';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
type ControlCenter = {
  summary?: Record<string, number>;
  realLedgerMutationEnabled?: boolean;
};
type QueueSummary = { topUps?: { count?: number }; withdrawals?: { count?: number } };
type QueueAging = { oldest?: Array<{ type?: 'TOPUP' | 'WITHDRAWAL'; ageMinutes?: number }> };
type Task = {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  tone: BadgeTone;
  priority: number;
  ageMinutes?: number;
};

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  loading: string;
  loadFailed: string;
  realMoneyWarning: string;
  allClear: string;
  allClearHelp: string;
  priorityTitle: string;
  priorityHelp: string;
  openTask: string;
  pendingDeposits: string;
  pendingWithdrawals: string;
  failedTransfers: string;
  riskAlerts: string;
  mismatch: string;
  failedWebhooks: string;
  waiting: string;
  items: string;
  tools: string;
  toolsHelp: string;
  daily: string;
  providers: string;
  advanced: string;
};

const copies: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'ศูนย์ปฏิบัติการ',
    title: 'งานแอดมิน',
    description: 'แสดงเฉพาะงานที่ต้องลงมือทำ ลดเมนูซ้ำและข้อมูลว่าง',
    refresh: 'รีเฟรช',
    loading: 'กำลังโหลด...',
    loadFailed: 'โหลดงานปฏิบัติการไม่สำเร็จ กรุณาลองใหม่',
    realMoneyWarning: 'โหมดเงินจริงเปิดอยู่ ตรวจสอบสมาชิก ยอดเงิน และหลักฐานก่อนยืนยันทุกครั้ง',
    allClear: 'ไม่มีงานเร่งด่วน',
    allClearHelp: 'คิวการเงิน ความเสี่ยง การเชื่อมต่อ และยอดคงเหลือไม่มีรายการที่ต้องจัดการตอนนี้',
    priorityTitle: 'งานที่ต้องจัดการ',
    priorityHelp: 'เรียงจากงานที่กระทบยอดสมาชิกและระบบมากที่สุด',
    openTask: 'เปิดงาน',
    pendingDeposits: 'ฝากรอตรวจ',
    pendingWithdrawals: 'ถอนรอดำเนินการ',
    failedTransfers: 'โยกเงินมีปัญหา',
    riskAlerts: 'ความเสี่ยงต้องตรวจ',
    mismatch: 'ยอดค่ายไม่ตรง',
    failedWebhooks: 'เว็บฮุกล้มเหลว',
    waiting: 'ค้างนานสุด',
    items: 'รายการ',
    tools: 'เครื่องมือเพิ่มเติม',
    toolsHelp: 'เปิดเมื่อต้องตั้งค่าค่าย ตรวจประวัติ หรือแก้ปัญหาเชิงเทคนิค',
    daily: 'งานประจำวัน',
    providers: 'ตั้งค่าค่ายเกม',
    advanced: 'เครื่องมือขั้นสูง',
  },
  en: {
    eyebrow: 'Operations center',
    title: 'Admin operations',
    description: 'Shows only actionable work while hiding duplicate and empty sections.',
    refresh: 'Refresh',
    loading: 'Loading...',
    loadFailed: 'Unable to load operations. Please try again.',
    realMoneyWarning: 'Real-money mode is active. Verify the member, amount, and evidence before confirming any action.',
    allClear: 'No urgent work',
    allClearHelp: 'Finance, risk, provider, and reconciliation queues have no actionable items right now.',
    priorityTitle: 'Action queue',
    priorityHelp: 'Ordered by potential impact to member balances and platform operations.',
    openTask: 'Open task',
    pendingDeposits: 'Pending deposits',
    pendingWithdrawals: 'Pending withdrawals',
    failedTransfers: 'Failed transfers',
    riskAlerts: 'Risk alerts',
    mismatch: 'Provider mismatch',
    failedWebhooks: 'Failed webhooks',
    waiting: 'Oldest waiting',
    items: 'items',
    tools: 'Additional tools',
    toolsHelp: 'Open for provider setup, history, or technical troubleshooting.',
    daily: 'Daily work',
    providers: 'Provider setup',
    advanced: 'Advanced tools',
  },
};

const toolGroups = {
  daily: [
    ['/topups', 'ตรวจรายการฝาก', 'Review deposits'],
    ['/withdrawals', 'ตรวจรายการถอน', 'Review withdrawals'],
    ['/risk-alerts', 'ตรวจความเสี่ยง', 'Review risk alerts'],
    ['/wallet-ledgers', 'ประวัติเงิน', 'Wallet ledger'],
  ],
  providers: [
    ['/simple-game-settings', 'ตั้งค่าค่ายแบบง่าย', 'Quick provider setup'],
    ['/provider-setup-wizard', 'เพิ่มค่ายเกม', 'Add provider'],
    ['/game-transfers', 'ตรวจการโยกเงิน', 'Review transfers'],
    ['/reconciliation-center', 'ตรวจยอดค่าย', 'Reconciliation'],
  ],
  advanced: [
    ['/adapter-test', 'ทดสอบการเชื่อมต่อ', 'Connection test'],
    ['/provider-credentials', 'จัดการคีย์เชื่อมต่อ', 'Provider credentials'],
    ['/webhook-logs', 'บันทึกเว็บฮุก', 'Webhook logs'],
    ['/audit-logs', 'บันทึกตรวจสอบ', 'Audit logs'],
  ],
} as const;

export default function OperationsRedesigned() {
  const [locale] = useAdminLocale();
  const copy = copies[locale];
  const [control, setControl] = useState<ControlCenter>({});
  const [queues, setQueues] = useState<QueueSummary>({});
  const [aging, setAging] = useState<QueueAging>({});
  const [state, setState] = useState<'loading' | 'failed' | 'ready'>('loading');

  const load = useCallback(async () => {
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
      if (!controlRes.ok && !queueRes.ok) throw new Error('operations');
      setControl(controlRes.ok && controlData ? controlData : {});
      setQueues(queueRes.ok && queueData ? queueData : {});
      setAging(agingRes.ok && agingData ? agingData : {});
      setState('ready');
    } catch {
      setState('failed');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const summary = control.summary ?? {};
  const tasks = useMemo<Task[]>(() => {
    const pendingTopUps = Number(queues.topUps?.count ?? 0);
    const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);
    const withdrawalAge = oldestAge(aging, 'WITHDRAWAL');
    const depositAge = oldestAge(aging, 'TOPUP');
    const candidates: Task[] = [
      { id: 'transfer', title: copy.failedTransfers, description: locale === 'th' ? 'กระทบยอดสมาชิกและค่ายเกมโดยตรง' : 'Direct impact on member and provider balances', href: '/game-transfers', count: Number(summary.failedTransfers ?? 0), tone: 'danger', priority: 100 },
      { id: 'mismatch', title: copy.mismatch, description: locale === 'th' ? 'ตรวจ Snapshot และรายการที่เกี่ยวข้อง' : 'Review snapshots and related records', href: '/reconciliation-center', count: Number(summary.mismatchSnapshots ?? 0), tone: 'danger', priority: 90 },
      { id: 'risk', title: copy.riskAlerts, description: locale === 'th' ? 'เรียงตามความรุนแรงและเวลาที่กำหนด' : 'Prioritized by severity and SLA', href: '/risk-alerts', count: Number(summary.openRiskAlerts ?? 0), tone: 'danger', priority: 80 },
      { id: 'webhook', title: copy.failedWebhooks, description: locale === 'th' ? 'ตรวจผลประมวลผลและการลองใหม่' : 'Review processing and retry status', href: '/webhook-logs', count: Number(summary.webhookFailed ?? 0), tone: 'warning', priority: 70 },
      { id: 'withdrawal', title: copy.pendingWithdrawals, description: locale === 'th' ? 'ตรวจบัญชีและหลักฐานก่อนจ่ายเงิน' : 'Verify account and evidence before payout', href: '/withdrawals', count: pendingWithdrawals, tone: 'warning', priority: 60, ...(withdrawalAge === undefined ? {} : { ageMinutes: withdrawalAge }) },
      { id: 'deposit', title: copy.pendingDeposits, description: locale === 'th' ? 'ตรวจสลิปและยืนยันเครดิตตามขั้นตอน' : 'Review evidence and confirm credit', href: '/topups', count: pendingTopUps, tone: 'warning', priority: 50, ...(depositAge === undefined ? {} : { ageMinutes: depositAge }) },
    ];
    return candidates.filter((task) => task.count > 0).sort((a, b) => b.priority - a.priority);
  }, [aging, copy, locale, queues, summary]);

  const total = tasks.reduce((sum, task) => sum + task.count, 0);
  const primary = tasks[0];

  return <AdminPage
    eyebrow={copy.eyebrow}
    title={copy.title}
    description={copy.description}
    actions={<AdminButton size="compact" disabled={state === 'loading'} onClick={() => void load()}>{state === 'loading' ? copy.loading : copy.refresh}</AdminButton>}
  >
    {state === 'failed' && <AdminNotice tone="danger">{copy.loadFailed}</AdminNotice>}
    {control.realLedgerMutationEnabled && <AdminNotice tone="warning">{copy.realMoneyWarning}</AdminNotice>}

    {state !== 'loading' && tasks.length === 0 ? <section className={styles.allClear} aria-live="polite">
      <span className={styles.check} aria-hidden="true">✓</span>
      <div><strong>{copy.allClear}</strong><p>{copy.allClearHelp}</p></div>
    </section> : null}

    {state === 'loading' ? <section className={styles.loading} aria-label={copy.loading}><i /><i /><i /></section> : null}

    {primary ? <section className={styles.priority} data-tone={primary.tone}>
      <div className={styles.priorityCopy}>
        <span>{copy.priorityTitle}</span>
        <h2>{primary.title}</h2>
        <p>{primary.description}</p>
      </div>
      <div className={styles.priorityCount}><strong>{formatNumber(total, locale)}</strong><span>{copy.items}</span></div>
      <AdminLinkButton href={primary.href} tone="primary">{copy.openTask}</AdminLinkButton>
    </section> : null}

    {tasks.length > 0 ? <section className={styles.queue} aria-labelledby="operations-queue-title">
      <header><div><h2 id="operations-queue-title">{copy.priorityTitle}</h2><p>{copy.priorityHelp}</p></div><AdminBadge tone={total > 0 ? 'danger' : 'success'}>{formatNumber(total, locale)}</AdminBadge></header>
      <div className={styles.taskGrid}>
        {tasks.map((task) => <article key={task.id} className={styles.task} data-tone={task.tone}>
          <div className={styles.taskHead}><div><h3>{task.title}</h3><p>{task.description}</p></div><strong>{formatNumber(task.count, locale)}</strong></div>
          <div className={styles.taskMeta}>
            <AdminBadge tone={task.tone}>{task.tone === 'danger' ? (locale === 'th' ? 'เร่งด่วน' : 'Critical') : (locale === 'th' ? 'ต้องตรวจ' : 'Review')}</AdminBadge>
            {task.ageMinutes !== undefined ? <span>{copy.waiting} {formatAge(task.ageMinutes, locale)}</span> : null}
          </div>
          <AdminLinkButton href={task.href} tone={task === primary ? 'primary' : 'secondary'}>{copy.openTask}</AdminLinkButton>
        </article>)}
      </div>
    </section> : null}

    <details className={styles.tools}>
      <summary><span><strong>{copy.tools}</strong><small>{copy.toolsHelp}</small></span><b aria-hidden="true">+</b></summary>
      <div className={styles.toolGrid}>
        <ToolGroup title={copy.daily} items={toolGroups.daily} locale={locale} />
        <ToolGroup title={copy.providers} items={toolGroups.providers} locale={locale} />
        <ToolGroup title={copy.advanced} items={toolGroups.advanced} locale={locale} />
      </div>
    </details>
  </AdminPage>;
}

function ToolGroup({ title, items, locale }: { title: string; items: readonly (readonly [string, string, string])[]; locale: AdminLocale }) {
  return <section className={styles.toolGroup}><h3>{title}</h3>{items.map(([href, th, en]) => <a href={href} key={href}>{locale === 'th' ? th : en}<span aria-hidden="true">›</span></a>)}</section>;
}

function oldestAge(aging: QueueAging, type: 'TOPUP' | 'WITHDRAWAL') {
  const values = (aging.oldest ?? []).filter((item) => item.type === type).map((item) => Number(item.ageMinutes)).filter(Number.isFinite);
  return values.length ? Math.max(...values) : undefined;
}

function formatAge(minutes: number, locale: AdminLocale) {
  const value = Math.max(0, Math.floor(minutes));
  if (value < 60) return locale === 'th' ? `${value} นาที` : `${value} min`;
  const hours = Math.floor(value / 60);
  if (hours < 24) return locale === 'th' ? `${hours} ชม.` : `${hours} hr`;
  const days = Math.floor(hours / 24);
  return locale === 'th' ? `${days} วัน` : `${days} d`;
}

function formatNumber(value: number, locale: AdminLocale) {
  return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US');
}
