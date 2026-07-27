from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match in {path!r}, found {count}: {old[:80]!r}")
    write(path, content.replace(old, new, 1))


layout_path = "apps/web-admin/app/layout.tsx"
layout = read(layout_path)
ux_import = "import './admin-ux-overrides.css';"
if ux_import not in layout:
    anchor = "import './admin-modernization-adoption.css';"
    if anchor not in layout:
        raise SystemExit("Admin layout import anchor is missing")
    layout = layout.replace(anchor, f"{anchor}\n{ux_import}")
    write(layout_path, layout)

write(
    "apps/web-admin/app/admin-ux-overrides.css",
    r"""/* Final UX density and mobile interaction authority.
 * Loaded after the existing Admin styles so fixes stay isolated and reversible.
 */

.admin-content-shell .admin-ui-empty {
  min-height: 112px;
  padding: 24px 18px;
  border-radius: 14px;
}

.admin-content-shell .admin-ui-page__actions {
  align-self: start;
}

.admin-content-shell .admin-ui-page__actions .admin-ui-button {
  min-width: 0;
}

.admin-content-shell .admin-ui-filter-bar__result:empty,
.admin-content-shell .admin-ui-pagination:has(button:disabled:first-child):has(button:disabled:last-child) {
  display: none;
}

.admin-content-shell input[type='date'] {
  color-scheme: dark;
}

@media (max-width: 720px) {
  .admin-content-shell {
    padding: 16px 14px max(18px, env(safe-area-inset-bottom)) !important;
  }

  .admin-content-shell .admin-ui-page {
    gap: 13px;
  }

  .admin-content-shell .admin-ui-page__head {
    gap: 9px;
  }

  .admin-content-shell .admin-ui-page__head h1 {
    margin-bottom: 5px !important;
    font-size: clamp(25px, 8vw, 32px) !important;
  }

  .admin-content-shell .admin-ui-page__description {
    max-width: 56ch;
    line-height: 1.45 !important;
  }

  .admin-content-shell .admin-ui-page__actions {
    width: auto !important;
    justify-content: flex-start;
  }

  .admin-content-shell .admin-ui-page__actions .admin-ui-button:not(.admin-ui-icon-button) {
    width: auto !important;
    flex: 0 0 auto !important;
    min-height: 38px;
    padding-inline: 12px;
  }

  .admin-content-shell .admin-ui-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 9px !important;
  }

  .admin-content-shell .admin-ui-metric {
    min-height: 86px !important;
    padding: 11px !important;
    gap: 3px !important;
    border-radius: 13px !important;
  }

  .admin-content-shell .admin-ui-metric strong {
    font-size: clamp(20px, 7vw, 27px) !important;
  }

  .admin-content-shell .admin-ui-metric p,
  .admin-content-shell .admin-ui-metric span,
  .admin-content-shell .admin-ui-metric em {
    font-size: 11px !important;
    line-height: 1.3 !important;
  }

  .admin-content-shell .admin-ui-row > div:last-child,
  .admin-content-shell .admin-ui-section-row > div:last-child {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .admin-content-shell .admin-ui-row > div:last-child .admin-ui-button,
  .admin-content-shell .admin-ui-section-row > div:last-child .admin-ui-button {
    width: auto;
    flex: 1 1 120px;
  }

  .admin-content-shell .admin-ui-filter-bar,
  .admin-content-shell .admin-ui-toolbar {
    gap: 8px;
    padding: 9px !important;
  }

  .admin-content-shell .admin-ui-empty {
    min-height: 94px;
    padding: 19px 14px;
  }
}

@media (max-width: 359px) {
  .admin-content-shell .admin-ui-metric-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-content-shell *,
  .admin-content-shell *::before,
  .admin-content-shell *::after {
    scroll-behavior: auto !important;
  }
}
""",
)

write(
    "apps/web-admin/app/(admin)/operations/operations-redesigned.tsx",
    r"""'use client';

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
    const candidates: Task[] = [
      { id: 'transfer', title: copy.failedTransfers, description: locale === 'th' ? 'กระทบยอดสมาชิกและค่ายเกมโดยตรง' : 'Direct impact on member and provider balances', href: '/game-transfers', count: Number(summary.failedTransfers ?? 0), tone: 'danger', priority: 100 },
      { id: 'mismatch', title: copy.mismatch, description: locale === 'th' ? 'ตรวจ Snapshot และรายการที่เกี่ยวข้อง' : 'Review snapshots and related records', href: '/reconciliation-center', count: Number(summary.mismatchSnapshots ?? 0), tone: 'danger', priority: 90 },
      { id: 'risk', title: copy.riskAlerts, description: locale === 'th' ? 'เรียงตามความรุนแรงและเวลาที่กำหนด' : 'Prioritized by severity and SLA', href: '/risk-alerts', count: Number(summary.openRiskAlerts ?? 0), tone: 'danger', priority: 80 },
      { id: 'webhook', title: copy.failedWebhooks, description: locale === 'th' ? 'ตรวจผลประมวลผลและการลองใหม่' : 'Review processing and retry status', href: '/webhook-logs', count: Number(summary.webhookFailed ?? 0), tone: 'warning', priority: 70 },
      { id: 'withdrawal', title: copy.pendingWithdrawals, description: locale === 'th' ? 'ตรวจบัญชีและหลักฐานก่อนจ่ายเงิน' : 'Verify account and evidence before payout', href: '/withdrawals', count: pendingWithdrawals, tone: 'warning', priority: 60, ageMinutes: oldestAge(aging, 'WITHDRAWAL') },
      { id: 'deposit', title: copy.pendingDeposits, description: locale === 'th' ? 'ตรวจสลิปและยืนยันเครดิตตามขั้นตอน' : 'Review evidence and confirm credit', href: '/topups', count: pendingTopUps, tone: 'warning', priority: 50, ageMinutes: oldestAge(aging, 'TOPUP') },
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
""",
)

write(
    "apps/web-admin/app/(admin)/operations/operations-redesigned.module.css",
    r""".allClear,
.priority,
.queue,
.tools {
  min-width: 0;
  border: 1px solid var(--admin-modern-border, rgb(148 163 184 / 14%));
  border-radius: 16px;
  background: var(--admin-modern-surface, #0f1726);
}

.allClear {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 72px;
  padding: 14px 16px;
  border-color: rgb(45 212 191 / 25%);
  background: rgb(45 212 191 / 7%);
}

.check {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: 999px;
  background: rgb(45 212 191 / 14%);
  color: #99f6e4;
  font-size: 18px;
  font-weight: 900;
}

.allClear div {
  min-width: 0;
}

.allClear strong {
  color: #ccfbf1;
  font-size: 14px;
}

.allClear p,
.priority p,
.queue header p,
.task p,
.tools small {
  margin: 3px 0 0;
  color: var(--admin-modern-muted, #94a3b8);
  font-size: 12px;
  line-height: 1.45;
}

.loading {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.loading i {
  min-height: 90px;
  border: 1px solid var(--admin-modern-border, rgb(148 163 184 / 14%));
  border-radius: 14px;
  background: linear-gradient(100deg, rgb(255 255 255 / 2%), rgb(255 255 255 / 7%), rgb(255 255 255 / 2%));
  background-size: 220% 100%;
  animation: shimmer 1.25s linear infinite;
}

.priority {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 18px;
  padding: 18px;
  overflow: hidden;
  border-left: 4px solid #f59e0b;
  background:
    radial-gradient(circle at 85% 0%, rgb(124 109 242 / 11%), transparent 28rem),
    var(--admin-modern-surface, #0f1726);
}

.priority[data-tone='danger'] {
  border-left-color: #fb7185;
}

.priorityCopy {
  min-width: 0;
}

.priorityCopy > span {
  color: #a5b4fc;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.priority h2,
.queue h2,
.task h3,
.toolGroup h3 {
  margin: 0;
  color: #fff;
}

.priority h2 {
  margin-top: 4px;
  font-size: 20px;
}

.priorityCount {
  display: grid;
  justify-items: end;
  gap: 2px;
}

.priorityCount strong {
  color: #fff;
  font-size: 32px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.priorityCount span {
  color: var(--admin-modern-muted, #94a3b8);
  font-size: 10px;
}

.queue {
  display: grid;
  gap: 13px;
  padding: 17px;
}

.queue > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.queue h2 {
  font-size: 17px;
}

.taskGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 10px;
}

.task {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
  min-height: 164px;
  padding: 14px;
  border: 1px solid var(--admin-modern-border, rgb(148 163 184 / 14%));
  border-top: 3px solid #f59e0b;
  border-radius: 13px;
  background: var(--admin-modern-surface-raised, #131e30);
}

.task[data-tone='danger'] {
  border-top-color: #fb7185;
}

.taskHead {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.task h3 {
  font-size: 14px;
}

.taskHead > strong {
  color: #fff;
  font-size: 26px;
  font-variant-numeric: tabular-nums;
}

.taskMeta {
  display: flex;
  min-height: 24px;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--admin-modern-muted, #94a3b8);
  font-size: 10px;
}

.task > a {
  align-self: end;
  justify-self: start;
}

.tools {
  overflow: hidden;
}

.tools summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  min-height: 64px;
  padding: 13px 16px;
  cursor: pointer;
  list-style: none;
}

.tools summary::-webkit-details-marker {
  display: none;
}

.tools summary span {
  display: grid;
  min-width: 0;
}

.tools summary strong {
  color: #fff;
  font-size: 14px;
}

.tools summary b {
  color: #a5b4fc;
  font-size: 20px;
  transition: transform .16s ease;
}

.tools[open] summary b {
  transform: rotate(45deg);
}

.toolGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 0 16px 16px;
}

.toolGroup {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--admin-modern-border, rgb(148 163 184 / 14%));
  border-radius: 12px;
  background: rgb(255 255 255 / 2%);
}

.toolGroup h3 {
  margin-bottom: 3px;
  font-size: 12px;
}

.toolGroup a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 7px 8px;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 11px;
  text-decoration: none;
}

.toolGroup a:hover,
.toolGroup a:focus-visible {
  background: rgb(124 109 242 / 11%);
  color: #fff;
  outline: none;
}

@media (max-width: 820px) {
  .priority {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .priority > a {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .toolGrid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .priority {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 14px;
  }

  .priority h2 {
    font-size: 17px;
  }

  .priorityCount strong {
    font-size: 27px;
  }

  .queue {
    padding: 13px;
  }

  .taskGrid {
    grid-template-columns: 1fr;
  }

  .task {
    min-height: 138px;
  }

  .allClear {
    align-items: flex-start;
  }

  .loading {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading i {
    animation: none;
  }

  .tools summary b {
    transition: none;
  }
}

@keyframes shimmer {
  to { background-position: -220% 0; }
}
""",
)

write(
    "apps/web-admin/app/(admin)/operations/page.tsx",
    "import OperationsRedesigned from './operations-redesigned';\n\nexport default OperationsRedesigned;\n",
)

# Compact data-table empty states by removing pagination/footer when there are no rows.
data_table_path = "apps/web-admin/src/features/admin-modernization/data-table.tsx"
data_table = read(data_table_path)
if "{totalItems > 0 && <footer className={styles.footer}>" not in data_table:
    data_table = data_table.replace("    <footer className={styles.footer}>", "    {totalItems > 0 && <footer className={styles.footer}>", 1)
    data_table = data_table.replace("    </footer>\n  </section>;", "    </footer>}\n  </section>;", 1)
    write(data_table_path, data_table)

# Remove avoidable English labels from Thai-only invitation copy.
invite_path = "apps/web-admin/app/(admin)/admin-invitations/page.tsx"
invite = read(invite_path)
for old, new in [
    ("โหลดรายการคำเชิญแล้ว แต่โหลด Role ไม่สำเร็จ จึงยังสร้างคำเชิญใหม่ไม่ได้", "โหลดรายการคำเชิญแล้ว แต่โหลดบทบาทไม่สำเร็จ จึงยังสร้างคำเชิญใหม่ไม่ได้"),
    ("โหลด Role แล้ว แต่โหลดรายการคำเชิญไม่สำเร็จ กรุณารีเฟรช", "โหลดบทบาทแล้ว แต่โหลดรายการคำเชิญไม่สำเร็จ กรุณารีเฟรช"),
    ('eyebrow="Security"', 'eyebrow="ความปลอดภัย"'),
    ('<AdminBadge tone="danger">PROTECTED</AdminBadge>', '<AdminBadge tone="danger">ป้องกัน</AdminBadge>'),
    ("'ไม่มี Role'", "'ไม่มีบทบาท'"),
]:
    invite = invite.replace(old, new)
write(invite_path, invite)

# Normalize Thai Audit labels and examples.
audit_path = "apps/web-admin/app/(admin)/audit/page.tsx"
audit = read(audit_path)
for old, new in [
    ("target: 'Target ID'", "target: 'รหัสเป้าหมาย'"),
    ("targetPlaceholder: 'รหัสรายการ'", "targetPlaceholder: 'รหัสรายการหรือสมาชิก'"),
    ("ip: 'IP address'", "ip: 'ที่อยู่ IP'"),
    ("modulePlaceholder: 'เช่น topups หรือ withdrawals'", "modulePlaceholder: 'เช่น รายการฝากหรือรายการถอน'"),
    ("actionPlaceholder: 'เช่น approve, reject หรือ login'", "actionPlaceholder: 'เช่น อนุมัติ ปฏิเสธ หรือเข้าสู่ระบบ'"),
]:
    audit = audit.replace(old, new)
write(audit_path, audit)

# Expand visual evidence to more owner routes while keeping permission assertions focused.
matrix_path = "tests/admin-browser-matrix/admin-route-role-viewport.spec.ts"
matrix = read(matrix_path)
matrix = matrix.replace(
    "type RouteCase = { path: string; label: string; anyOf?: readonly string[] };",
    "type RouteCase = { path: string; label: string; anyOf?: readonly string[]; ownerOnly?: boolean };",
)
route_anchor = "  { path: '/webhook-logs', label: 'Webhook logs', anyOf: ['game.providers.view'] },\n"
extra_routes = """  { path: '/wallet-ledgers', label: 'Wallet ledgers', ownerOnly: true },
  { path: '/game-transfers', label: 'Game transfers', ownerOnly: true },
  { path: '/reconciliation-center', label: 'Reconciliation', ownerOnly: true },
  { path: '/simple-game-settings', label: 'Provider quick setup', ownerOnly: true },
  { path: '/users', label: 'Members', ownerOnly: true },
  { path: '/reports', label: 'Reports', ownerOnly: true },
"""
if extra_routes.strip() not in matrix:
    matrix = matrix.replace(route_anchor, route_anchor + extra_routes)
matrix = matrix.replace(
    "    for (const routeCase of routeCases) {\n      await page.goto",
    "    for (const routeCase of routeCases) {\n      if (routeCase.ownerOnly && roleName !== 'owner') continue;\n      await page.goto",
)
matrix = matrix.replace("\n      if (roleName === 'owner' && routeCase.path === '/operations') await assertOperationsDrawerKeyboardContract(page);", "")
start = matrix.find("async function assertOperationsDrawerKeyboardContract")
end = matrix.find("function canAccess", start)
if start >= 0 and end > start:
    matrix = matrix[:start] + matrix[end:]
matrix = matrix.replace(
    "if (path.startsWith('/admin/queues/summary')) return { topUps: { count: 0 }, withdrawals: { count: 0 } };",
    "if (path.startsWith('/admin/queues/summary')) return { topUps: { count: 4 }, withdrawals: { count: 2 } };",
)
matrix = matrix.replace(
    "if (path.startsWith('/admin/reports/queue-aging')) return { oldest: [] };",
    "if (path.startsWith('/admin/reports/queue-aging')) return { oldest: [{ type: 'TOPUP', ageMinutes: 48 }, { type: 'WITHDRAWAL', ageMinutes: 132 }] };",
)
matrix = matrix.replace(
    "if (path.startsWith('/admin/money-ops/control-center')) return { summary: {}, recent: {}, realLedgerMutationEnabled: false };",
    "if (path.startsWith('/admin/money-ops/control-center')) return { summary: { failedTransfers: 2, openRiskAlerts: 1, mismatchSnapshots: 1, webhookFailed: 3 }, recent: {}, realLedgerMutationEnabled: true };",
)
write(matrix_path, matrix)

print("Admin UX/UI overhaul files prepared")
