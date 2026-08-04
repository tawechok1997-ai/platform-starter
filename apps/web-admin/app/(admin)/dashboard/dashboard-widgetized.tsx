'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminEmpty, AdminPage, formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import {
  AdminChart,
  type AdminChartPoint,
  type AdminChartSelection,
  type AdminChartSeries,
} from '../../../src/features/admin-modernization/admin-chart';
import { ADMIN_DASHBOARD_WIDGET_DEFINITIONS } from '../../../src/features/admin-modernization/admin-dashboard-widget-registry';
import { AdminWidget, type AdminWidgetProps } from '../../../src/features/admin-modernization/admin-widget';
import {
  AdminWidgetWorkspace,
  type AdminWidgetRenderContext,
} from '../../../src/features/admin-modernization/admin-widget-workspace';
import {
  buildAdminChartCsv,
  createAdminChartPngBlob,
  normalizeAdminExportFileName,
} from '../../../src/features/admin-modernization/chart-export';
import {
  createAdminWidgetRegistry,
  type AdminDateRange,
  type AdminWidgetDataState,
} from '../../../src/features/admin-modernization/chart-widget-contracts';
import styles from './dashboard-widgetized.module.css';

type WidgetId = (typeof ADMIN_DASHBOARD_WIDGET_DEFINITIONS)[number]['id'];
type WidgetCommon = Pick<
  AdminWidgetProps,
  | 'widgetId'
  | 'title'
  | 'description'
  | 'labels'
  | 'pinned'
  | 'onPinnedChange'
  | 'allowFullscreen'
  | 'allowDrillDown'
  | 'exportFormats'
>;

type QueueItem = {
  id: string;
  shortUserId: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  createdAt: string;
  user?: { username?: string | null; shortId?: string | null } | null;
};

type LedgerItem = {
  id: string;
  type: string;
  direction: string;
  amount: string;
  createdAt: string;
  user?: { username?: string | null; shortId?: string | null } | null;
};

type FinanceSummary = {
  totals: {
    walletCount: number;
    totalBalance: string;
    totalLockedBalance: string;
    totalAvailableBalance: string;
    pendingTopUps: number;
    pendingWithdrawals: number;
  };
  today?: {
    date: string;
    topUpAmount: string;
    topUpCount: number;
    withdrawalAmount: string;
    withdrawalCount: number;
    netFlow: string;
  };
  queues: { topUps: QueueItem[]; withdrawals: QueueItem[] };
  recentLedgers: LedgerItem[];
  generatedAt: string;
};

type RiskAlert = {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  title: string;
  memberId?: string | null;
  createdAt: string;
};

type RiskResponse = {
  items?: RiskAlert[];
  summary?: { openCount?: number; criticalCount?: number };
};

type MeResponse = {
  id?: string;
  adminUserId?: string;
  email?: string;
  permissions?: string[];
  user?: { id?: string; email?: string } | null;
};

type DashboardData = {
  summary: FinanceSummary | null;
  riskItems: RiskAlert[];
  riskSummary: { openCount: number; criticalCount: number };
  permissions: string[];
  adminUserId: string;
  financeError: boolean;
  riskError: boolean;
  identityError: boolean;
  loadedAt: string | null;
};

type DashboardAccess = {
  finance: boolean;
  wallet: boolean;
  topUps: boolean;
  withdrawals: boolean;
  risk: boolean;
};

type PriorityItem = {
  id: string;
  label: string;
  helper: string;
  value: number;
  href: string;
  tone: 'warning' | 'danger';
};

type Copy = ReturnType<typeof getCopy>;

const SEVERITIES: readonly RiskAlert['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const EMPTY_DATA: DashboardData = {
  summary: null,
  riskItems: [],
  riskSummary: { openCount: 0, criticalCount: 0 },
  permissions: [],
  adminUserId: '',
  financeError: false,
  riskError: false,
  identityError: false,
  loadedAt: null,
};

export default function WidgetizedAdminDashboard() {
  const router = useRouter();
  const [locale] = useAdminLocale();
  const text = useMemo(() => getCopy(locale), [locale]);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState('');
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setExportNotice('');

    try {
      const meResponse = await adminApiFetch('/admin/auth/me');
      const mePayload = await meResponse.json().catch(() => null) as MeResponse | null;
      if (!meResponse.ok || !mePayload || !Array.isArray(mePayload.permissions)) {
        setData({ ...EMPTY_DATA, identityError: true });
        return;
      }

      const permissions = mePayload.permissions;
      const access = buildAccess(permissions);
      const needsFinance = access.finance || access.wallet || access.topUps || access.withdrawals;
      const needsRisk = access.risk;
      const [financeResponse, riskResponse] = await Promise.all([
        needsFinance ? adminApiFetch('/admin/finance/summary') : Promise.resolve(null),
        needsRisk ? adminApiFetch('/admin/risk-alerts?status=OPEN') : Promise.resolve(null),
      ]);
      const [financePayload, riskPayload] = await Promise.all([
        financeResponse ? financeResponse.json().catch(() => null) as Promise<FinanceSummary | null> : Promise.resolve(null),
        riskResponse ? riskResponse.json().catch(() => null) as Promise<RiskResponse | null> : Promise.resolve(null),
      ]);

      setData({
        summary: financeResponse?.ok && financePayload ? financePayload : null,
        riskItems: riskResponse?.ok && riskPayload ? riskPayload.items ?? [] : [],
        riskSummary: riskResponse?.ok && riskPayload ? {
          openCount: Number(riskPayload.summary?.openCount ?? 0),
          criticalCount: Number(riskPayload.summary?.criticalCount ?? 0),
        } : { openCount: 0, criticalCount: 0 },
        permissions,
        adminUserId: resolveAdminIdentity(mePayload),
        financeError: needsFinance && (!financeResponse?.ok || !financePayload),
        riskError: needsRisk && (!riskResponse?.ok || !riskPayload),
        identityError: false,
        loadedAt: new Date().toISOString(),
      });
    } catch {
      setData((current) => ({ ...current, financeError: true, riskError: true, identityError: true }));
    } finally {
      setLoading(false);
    }
  }

  const localizedRegistry = useMemo(() => createAdminWidgetRegistry(
    ADMIN_DASHBOARD_WIDGET_DEFINITIONS.map((definition) => {
      const localized = text.widgetCopy[definition.id as WidgetId];
      return {
        ...definition,
        title: localized.title,
        description: localized.description,
      };
    }),
  ), [text]);
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const access = useMemo(() => buildAccess(data.permissions), [data.permissions]);
  const priorityItems = useMemo(() => buildPriorityItems(metrics, text, access), [access, metrics, text]);
  const canViewAnything = localizedRegistry.visibleTo(data.permissions).length > 0;
  const hasRelevantError = data.identityError
    || (access.finance && data.financeError)
    || (access.risk && data.riskError);

  return <AdminPage
    eyebrow={text.page.eyebrow}
    title={text.page.title}
    description={text.page.description}
    actions={<AdminButton onClick={() => void loadDashboard()} disabled={loading}>{loading ? text.page.refreshing : text.page.refresh}</AdminButton>}
  >
    <section className={styles.statusBar} data-tone={hasRelevantError ? 'warning' : priorityItems.length > 0 ? 'warning' : 'success'}>
      <span className={styles.statusDot} aria-hidden="true" />
      <div>
        <small>{text.page.status}</small>
        <strong>{hasRelevantError ? text.page.partial : priorityItems.length > 0 ? text.page.actionRequired : text.page.healthy}</strong>
        <p>{hasRelevantError ? text.page.partialDescription : priorityItems.length > 0 ? text.page.actionDescription : text.page.healthyDescription}</p>
      </div>
      <span className={styles.updated}>{data.loadedAt ? `${text.page.updated} ${new Date(data.loadedAt).toLocaleTimeString(numberLocale(locale))}` : text.page.waiting}</span>
    </section>

    {exportNotice ? <div className={styles.notice} role="status">{exportNotice}</div> : null}
    {!loading && !canViewAnything ? <AdminEmpty>{text.page.noAccess}</AdminEmpty> : null}

    {canViewAnything ? <AdminWidgetWorkspace
      registry={localizedRegistry}
      adminUserId={data.adminUserId || 'admin-session-layout'}
      permissions={data.permissions}
      labels={text.workspace}
      initialPreset="today"
      initialCompare="previous-period"
      renderWidget={(context) => renderDashboardWidget({
        context,
        data,
        access,
        loading,
        locale,
        text,
        metrics,
        priorityItems,
        navigate: (href) => router.push(href),
        retry: () => void loadDashboard(),
        notify: setExportNotice,
      })}
    /> : null}
  </AdminPage>;
}

function renderDashboardWidget({
  context,
  data,
  access,
  loading,
  locale,
  text,
  metrics,
  priorityItems,
  navigate,
  retry,
  notify,
}: {
  context: AdminWidgetRenderContext;
  data: DashboardData;
  access: DashboardAccess;
  loading: boolean;
  locale: AdminLocale;
  text: Copy;
  metrics: ReturnType<typeof buildMetrics>;
  priorityItems: PriorityItem[];
  navigate: (href: string) => void;
  retry: () => void;
  notify: (message: string) => void;
}) {
  const id = context.definition.id as WidgetId;
  const snapshotPartial = !isTodayRange(context.dateRange);
  const common: WidgetCommon = {
    widgetId: id,
    title: context.definition.title,
    description: context.definition.description,
    labels: text.widget,
    pinned: context.layout.pinned,
    onPinnedChange: context.setPinned,
    allowFullscreen: context.definition.allowFullscreen,
    allowDrillDown: context.definition.allowDrillDown,
    exportFormats: context.definition.exportFormats,
  };

  if (id === 'operations.priority-work') {
    const sourceErrors = [
      access.risk ? data.riskError : null,
      access.topUps || access.withdrawals ? data.financeError : null,
    ].filter(isBoolean);
    const allFailed = sourceErrors.length > 0 && sourceErrors.every(Boolean);
    const someFailed = sourceErrors.some(Boolean);
    const state = resolveState(loading, allFailed, priorityItems.length === 0, someFailed);
    return <AdminWidget
      {...common}
      state={state}
      emptyMessage={text.empty.priority}
      errorMessage={text.error.priority}
      partialMessage={text.partial.source}
      onRetry={retry}
      onDrillDown={() => navigate(priorityItems[0]?.href ?? '/dashboard')}
      footer={<RangeFooter range={context.dateRange} compareRange={context.compareRange} text={text} />}
    >
      <div className={styles.priorityList}>
        {priorityItems.map((item) => <button type="button" key={item.id} data-tone={item.tone} onClick={() => navigate(item.href)}>
          <span><strong>{item.label}</strong><small>{item.helper}</small></span>
          <b>{item.value.toLocaleString(numberLocale(locale))}</b>
        </button>)}
      </div>
    </AdminWidget>;
  }

  if (id === 'finance.cash-flow') {
    const series: AdminChartSeries[] = [
      { id: 'deposit', label: text.series.deposit, tone: 'success' },
      { id: 'withdrawal', label: text.series.withdrawal, tone: 'danger' },
      { id: 'net', label: text.series.net, tone: 'brand' },
    ];
    const points: AdminChartPoint[] = [{
      id: data.summary?.today?.date ?? context.dateRange.end,
      label: data.summary?.today?.date ?? text.series.today,
      values: { deposit: metrics.deposit, withdrawal: metrics.withdrawal, net: metrics.net },
    }];
    return <ChartWidget
      common={common}
      state={resolveState(loading, data.financeError, metrics.deposit === 0 && metrics.withdrawal === 0 && metrics.net === 0, snapshotPartial)}
      points={points}
      series={series}
      chartKind="bar"
      locale={locale}
      text={text}
      range={context.dateRange}
      compareRange={context.compareRange}
      onRetry={retry}
      onDrillDown={() => navigate('/reports')}
      onDatumSelect={() => navigate('/reports')}
      onExport={(format) => void exportChartWidget(id, format, points, series, notify, text)}
      emptyMessage={text.empty.cashFlow}
      errorMessage={text.error.finance}
      partialMessage={text.partial.snapshot}
    />;
  }

  if (id === 'wallet.balance-composition') {
    const series: AdminChartSeries[] = [
      { id: 'available', label: text.series.available, tone: 'success' },
      { id: 'locked', label: text.series.locked, tone: 'warning' },
      { id: 'variance', label: text.series.variance, tone: 'info' },
    ];
    const points: AdminChartPoint[] = [{
      id: 'wallet',
      label: text.series.wallet,
      values: { available: metrics.available, locked: metrics.locked, variance: Math.max(0, metrics.variance) },
    }];
    return <ChartWidget
      common={common}
      state={resolveState(loading, data.financeError, metrics.total <= 0, snapshotPartial)}
      points={points}
      series={series}
      chartKind="donut"
      locale={locale}
      text={text}
      range={context.dateRange}
      compareRange={context.compareRange}
      onRetry={retry}
      onDrillDown={() => navigate('/wallet-ledgers')}
      onDatumSelect={() => navigate('/wallet-ledgers')}
      onExport={(format) => void exportChartWidget(id, format, points, series, notify, text)}
      emptyMessage={text.empty.wallet}
      errorMessage={text.error.finance}
      partialMessage={text.partial.snapshot}
    />;
  }

  if (id === 'risk.open-severity') {
    const series: AdminChartSeries[] = SEVERITIES.map((severity) => ({
      id: severity,
      label: text.severity[severity],
      tone: severity === 'CRITICAL' ? 'danger' : severity === 'HIGH' ? 'warning' : severity === 'MEDIUM' ? 'brand' : 'success',
    }));
    const points: AdminChartPoint[] = [{ id: 'open-risk', label: text.series.openRisk, values: metrics.riskCounts }];
    return <ChartWidget
      common={common}
      state={resolveState(loading, data.riskError, metrics.openRiskTotal === 0, snapshotPartial)}
      points={points}
      series={series}
      chartKind="donut"
      locale={locale}
      text={text}
      range={context.dateRange}
      compareRange={context.compareRange}
      onRetry={retry}
      onDrillDown={() => navigate('/risk-alerts')}
      onDatumSelect={() => navigate('/risk-alerts')}
      onExport={(format) => void exportChartWidget(id, format, points, series, notify, text)}
      emptyMessage={text.empty.risk}
      errorMessage={text.error.risk}
      partialMessage={text.partial.snapshot}
    />;
  }

  if (id === 'finance.pending-queues') {
    const queueRows = [
      ...(access.topUps ? (data.summary?.queues.topUps ?? []).map((item) => ({ ...item, queueType: text.series.deposit, href: '/topups' })) : []),
      ...(access.withdrawals ? (data.summary?.queues.withdrawals ?? []).map((item) => ({ ...item, queueType: text.series.withdrawal, href: '/withdrawals' })) : []),
    ].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    return <AdminWidget
      {...common}
      state={resolveState(loading, data.financeError, queueRows.length === 0, snapshotPartial)}
      emptyMessage={text.empty.queues}
      errorMessage={text.error.finance}
      partialMessage={text.partial.snapshot}
      onRetry={retry}
      onDrillDown={() => navigate(access.withdrawals && metrics.pendingWithdrawals > 0 ? '/withdrawals' : '/topups')}
      onExport={() => exportTableCsv(id, [
        [text.table.type, text.table.member, text.table.amount, text.table.status, text.table.createdAt],
        ...queueRows.map((item) => [item.queueType, memberLabel(item), item.amount, item.status, item.createdAt]),
      ], notify, text)}
      footer={<RangeFooter range={context.dateRange} compareRange={context.compareRange} text={text} />}
    >
      <div className={styles.queueList}>
        {queueRows.slice(0, 10).map((item) => <button type="button" key={`${item.queueType}:${item.id}`} onClick={() => navigate(item.href)}>
          <span><strong>{item.queueType}</strong><small>{memberLabel(item)} · {new Date(item.createdAt).toLocaleString(numberLocale(locale))}</small></span>
          <b>{formatMoney(Number(item.amount))}</b>
          <em>{item.status}</em>
        </button>)}
      </div>
    </AdminWidget>;
  }

  const activityRows = [
    ...(access.risk ? data.riskItems.map((item) => ({
      id: `risk:${item.id}`,
      label: item.title,
      helper: `${text.severity[item.severity]} · ${new Date(item.createdAt).toLocaleString(numberLocale(locale))}`,
      value: item.status,
      href: '/risk-alerts',
      createdAt: item.createdAt,
    })) : []),
    ...(access.wallet ? (data.summary?.recentLedgers ?? []).map((item) => ({
      id: `ledger:${item.id}`,
      label: `${item.type} · ${memberLabel(item)}`,
      helper: new Date(item.createdAt).toLocaleString(numberLocale(locale)),
      value: formatMoney(Number(item.amount)),
      href: '/wallet-ledgers',
      createdAt: item.createdAt,
    })) : []),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const sourceErrors = [access.risk ? data.riskError : null, access.wallet ? data.financeError : null].filter(isBoolean);
  const allFailed = sourceErrors.length > 0 && sourceErrors.every(Boolean);
  const someFailed = sourceErrors.some(Boolean);
  return <AdminWidget
    {...common}
    state={resolveState(loading, allFailed, activityRows.length === 0, someFailed || snapshotPartial)}
    emptyMessage={text.empty.activity}
    errorMessage={text.error.activity}
    partialMessage={someFailed ? text.partial.source : text.partial.snapshot}
    onRetry={retry}
    onDrillDown={() => navigate(activityRows[0]?.href ?? '/dashboard')}
    onExport={() => exportTableCsv(id, [
      [text.table.activity, text.table.details, text.table.value, text.table.createdAt],
      ...activityRows.map((item) => [item.label, item.helper, item.value, item.createdAt]),
    ], notify, text)}
    footer={<RangeFooter range={context.dateRange} compareRange={context.compareRange} text={text} />}
  >
    <div className={styles.activityList}>
      {activityRows.slice(0, 10).map((item) => <button type="button" key={item.id} onClick={() => navigate(item.href)}>
        <span><strong>{item.label}</strong><small>{item.helper}</small></span><b>{item.value}</b>
      </button>)}
    </div>
  </AdminWidget>;
}

function ChartWidget({
  common,
  state,
  points,
  series,
  chartKind,
  locale,
  text,
  range,
  compareRange,
  onRetry,
  onDrillDown,
  onDatumSelect,
  onExport,
  emptyMessage,
  errorMessage,
  partialMessage,
}: {
  common: WidgetCommon;
  state: AdminWidgetDataState;
  points: AdminChartPoint[];
  series: AdminChartSeries[];
  chartKind: 'bar' | 'donut';
  locale: AdminLocale;
  text: Copy;
  range: AdminDateRange;
  compareRange: AdminDateRange | null;
  onRetry: () => void;
  onDrillDown: () => void;
  onDatumSelect: (selection: AdminChartSelection) => void;
  onExport: (format: 'csv' | 'png') => void;
  emptyMessage: string;
  errorMessage: string;
  partialMessage: string;
}) {
  return <AdminWidget
    {...common}
    state={state}
    emptyMessage={emptyMessage}
    errorMessage={errorMessage}
    partialMessage={partialMessage}
    onRetry={onRetry}
    onDrillDown={onDrillDown}
    onExport={onExport}
    footer={<RangeFooter range={range} compareRange={compareRange} text={text} />}
  >
    <AdminChart
      ariaLabel={common.title}
      legendAriaLabel={`${common.title} ${text.chart.legend}`}
      totalLabel={text.chart.total}
      kind={chartKind}
      points={points}
      series={series}
      valueFormatter={(value) => chartKind === 'bar' ? formatMoney(value) : value.toLocaleString(numberLocale(locale))}
      onDatumSelect={onDatumSelect}
    />
  </AdminWidget>;
}

function RangeFooter({ range, compareRange, text }: { range: AdminDateRange; compareRange: AdminDateRange | null; text: Copy }) {
  return <div className={styles.rangeFooter}>
    <span>{text.footer.range}: {range.start} – {range.end}</span>
    <span>{text.footer.compare}: {compareRange ? `${compareRange.start} – ${compareRange.end}` : text.footer.none}</span>
  </div>;
}

function buildMetrics(data: DashboardData) {
  const deposit = Math.max(0, Number(data.summary?.today?.topUpAmount ?? 0));
  const withdrawal = Math.max(0, Number(data.summary?.today?.withdrawalAmount ?? 0));
  const net = Number(data.summary?.today?.netFlow ?? deposit - withdrawal);
  const total = Math.max(0, Number(data.summary?.totals.totalBalance ?? 0));
  const available = Math.max(0, Number(data.summary?.totals.totalAvailableBalance ?? 0));
  const locked = Math.max(0, Number(data.summary?.totals.totalLockedBalance ?? 0));
  const variance = total - available - locked;
  const pendingTopUps = Number(data.summary?.totals.pendingTopUps ?? 0);
  const pendingWithdrawals = Number(data.summary?.totals.pendingWithdrawals ?? 0);
  const riskCounts = SEVERITIES.reduce<Record<RiskAlert['severity'], number>>((result, severity) => {
    result[severity] = data.riskItems.filter((item) => item.severity === severity).length;
    return result;
  }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
  if (riskCounts.CRITICAL === 0 && data.riskSummary.criticalCount > 0) riskCounts.CRITICAL = data.riskSummary.criticalCount;
  const countedRiskTotal = SEVERITIES.reduce((sum, severity) => sum + riskCounts[severity], 0);
  return {
    deposit,
    withdrawal,
    net,
    total,
    available,
    locked,
    variance,
    pendingTopUps,
    pendingWithdrawals,
    riskCounts,
    openRiskTotal: Math.max(countedRiskTotal, data.riskSummary.openCount),
  };
}

function buildAccess(permissions: readonly string[]): DashboardAccess {
  return {
    finance: hasAnyPermission(permissions, ['reports.view', 'wallet.view', 'topups.view', 'deposit.view', 'withdraw.view']),
    wallet: hasAnyPermission(permissions, ['wallet.view']),
    topUps: hasAnyPermission(permissions, ['topups.view', 'deposit.view']),
    withdrawals: hasAnyPermission(permissions, ['withdraw.view']),
    risk: hasAnyPermission(permissions, ['risk.view']),
  };
}

function buildPriorityItems(metrics: ReturnType<typeof buildMetrics>, text: Copy, access: DashboardAccess): PriorityItem[] {
  const items: PriorityItem[] = [];
  if (access.risk && metrics.openRiskTotal > 0) items.push({
    id: 'risk',
    label: metrics.riskCounts.CRITICAL > 0 ? text.priority.criticalRisk : text.priority.openRisk,
    helper: `${metrics.riskCounts.CRITICAL} ${text.severity.CRITICAL}`,
    value: metrics.openRiskTotal,
    href: '/risk-alerts',
    tone: metrics.riskCounts.CRITICAL > 0 ? 'danger' : 'warning',
  });
  if (access.withdrawals && metrics.pendingWithdrawals > 0) items.push({
    id: 'withdrawals', label: text.priority.withdrawals, helper: text.priority.review,
    value: metrics.pendingWithdrawals, href: '/withdrawals', tone: 'danger',
  });
  if (access.topUps && metrics.pendingTopUps > 0) items.push({
    id: 'topups', label: text.priority.deposits, helper: text.priority.review,
    value: metrics.pendingTopUps, href: '/topups', tone: 'warning',
  });
  return items;
}

function hasAnyPermission(permissions: readonly string[], required: readonly string[]): boolean {
  const held = new Set(permissions);
  return held.has('*') || required.some((permission) => held.has(permission));
}

function resolveState(loading: boolean, error: boolean, empty: boolean, partial: boolean): AdminWidgetDataState {
  if (loading) return 'loading';
  if (error) return 'error';
  if (empty) return 'empty';
  return partial ? 'partial' : 'ready';
}

function resolveAdminIdentity(payload: MeResponse): string {
  return payload.adminUserId?.trim()
    || payload.id?.trim()
    || payload.user?.id?.trim()
    || payload.email?.trim()
    || payload.user?.email?.trim()
    || '';
}

function isTodayRange(range: AdminDateRange): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return range.start === today && range.end === today;
}

function isBoolean(value: boolean | null): value is boolean {
  return value !== null;
}

function numberLocale(locale: AdminLocale): string {
  return locale === 'th' ? 'th-TH' : 'en-US';
}

async function exportChartWidget(
  widgetId: string,
  format: 'csv' | 'png',
  points: AdminChartPoint[],
  series: AdminChartSeries[],
  notify: (message: string) => void,
  text: Copy,
) {
  try {
    if (format === 'csv') {
      downloadBlob(new Blob([`\uFEFF${buildAdminChartCsv(points, series)}`], { type: 'text/csv;charset=utf-8' }), normalizeAdminExportFileName(widgetId, 'csv'));
    } else {
      const svg = document.querySelector<SVGSVGElement>(`[data-widget-id="${widgetId}"] svg`);
      if (!svg) throw new Error('chart-not-found');
      downloadBlob(await createAdminChartPngBlob(svg, { background: readExportBackground() }), normalizeAdminExportFileName(widgetId, 'png'));
    }
    notify(text.export.success);
  } catch {
    notify(text.export.error);
  }
}

function exportTableCsv(widgetId: string, rows: string[][], notify: (message: string) => void, text: Copy) {
  try {
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), normalizeAdminExportFileName(widgetId, 'csv'));
    notify(text.export.success);
  } catch {
    notify(text.export.error);
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeCsv(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function readExportBackground(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-surface-raised').trim() || '#ffffff';
}

function memberLabel(item: { shortUserId?: string; user?: { username?: string | null; shortId?: string | null } | null }): string {
  return item.user?.username || item.user?.shortId || item.shortUserId || '-';
}

function getCopy(locale: AdminLocale) {
  const pick = (thai: string, english: string) => locale === 'th' ? thai : english;
  return {
    page: {
      eyebrow: pick('ศูนย์ปฏิบัติการ', 'Operations center'),
      title: pick('แดชบอร์ดแบบปรับแต่งได้', 'Customizable operations dashboard'),
      description: pick('กราฟและวิดเจ็ตใช้ระบบกลาง พร้อมบันทึกเลย์เอาต์แยกตามผู้ดูแล', 'Charts and widgets share one system with a per-admin saved layout.'),
      refresh: pick('อัปเดตข้อมูล', 'Refresh data'),
      refreshing: pick('กำลังอัปเดต', 'Refreshing'),
      status: pick('สถานะข้อมูล', 'Data status'),
      healthy: pick('ข้อมูลพร้อมใช้งาน', 'Data is ready'),
      healthyDescription: pick('แหล่งข้อมูลที่บัญชีนี้มีสิทธิ์โหลดสำเร็จ', 'Authorized data sources loaded successfully.'),
      actionRequired: pick('มีงานที่ต้องดำเนินการ', 'Work requires attention'),
      actionDescription: pick('เปิดวิดเจ็ตงานเร่งด่วนเพื่อดำเนินการ', 'Open the priority widget to continue.'),
      partial: pick('ข้อมูลบางส่วนยังไม่พร้อม', 'Some data is unavailable'),
      partialDescription: pick('วิดเจ็ตที่เกี่ยวข้องแสดงสถานะ Error หรือ Partial โดยไม่ปิดทั้งหน้า', 'Affected widgets show Error or Partial without blocking the whole page.'),
      updated: pick('อัปเดตล่าสุด', 'Last updated'),
      waiting: pick('กำลังรอข้อมูล', 'Waiting for data'),
      noAccess: pick('บัญชีนี้ไม่มีสิทธิ์ดูวิดเจ็ตในแดชบอร์ด', 'This account cannot view dashboard widgets.'),
    },
    workspace: {
      dateRange: pick('ช่วงวันที่', 'Date range'), compare: pick('เปรียบเทียบ', 'Compare'),
      editLayout: pick('จัดวางวิดเจ็ต', 'Edit layout'), finishEditing: pick('เสร็จสิ้น', 'Finish editing'),
      restoreDefault: pick('คืนค่าเริ่มต้น', 'Restore default'), customStart: pick('วันเริ่มต้น', 'Start date'),
      customEnd: pick('วันสิ้นสุด', 'End date'), invalidRange: pick('ช่วงวันที่ไม่ถูกต้อง', 'The selected date range is invalid.'),
      hiddenWidgets: pick('วิดเจ็ตที่ซ่อน', 'Hidden widgets'), showWidget: pick('แสดง', 'Show'),
      hideWidget: pick('ซ่อนวิดเจ็ต', 'Hide widget'), pinWidget: pick('ปักหมุด', 'Pin widget'),
      unpinWidget: pick('ยกเลิกปักหมุด', 'Unpin widget'), moveEarlier: pick('เลื่อนก่อนหน้า', 'Move earlier'),
      moveLater: pick('เลื่อนถัดไป', 'Move later'), makeNarrower: pick('ลดความกว้าง', 'Make narrower'),
      makeWider: pick('เพิ่มความกว้าง', 'Make wider'), makeShorter: pick('ลดความสูง', 'Make shorter'),
      makeTaller: pick('เพิ่มความสูง', 'Make taller'),
      presets: {
        today: pick('วันนี้', 'Today'), '7d': pick('7 วัน', '7 days'), '30d': pick('30 วัน', '30 days'),
        '90d': pick('90 วัน', '90 days'), custom: pick('กำหนดเอง', 'Custom'),
      },
      comparePeriods: {
        none: pick('ไม่เปรียบเทียบ', 'No comparison'),
        'previous-period': pick('ช่วงก่อนหน้า', 'Previous period'),
        'previous-year': pick('ปีก่อน', 'Previous year'),
      },
    },
    widget: {
      loading: pick('กำลังโหลดวิดเจ็ต', 'Loading widget'), empty: pick('ไม่มีข้อมูล', 'No data'),
      error: pick('โหลดข้อมูลไม่สำเร็จ', 'Unable to load data'), partial: pick('ข้อมูลบางส่วน', 'Partial data'),
      retry: pick('ลองใหม่', 'Retry'), pin: pick('ปักหมุด', 'Pin'), unpin: pick('ยกเลิกปักหมุด', 'Unpin'),
      fullscreen: pick('เต็มหน้าจอ', 'Fullscreen'), exitFullscreen: pick('ออกจากเต็มหน้าจอ', 'Exit fullscreen'),
      drillDown: pick('ดูรายละเอียด', 'Drill down'), exportCsv: pick('ส่งออก CSV', 'Export CSV'),
      exportPng: pick('ส่งออก PNG', 'Export PNG'),
    },
    widgetCopy: {
      'operations.priority-work': { title: pick('งานเร่งด่วน', 'Priority work'), description: pick('คิวและความเสี่ยงที่ต้องให้เจ้าหน้าที่ดำเนินการ', 'Queues and risks requiring operator action.') },
      'finance.cash-flow': { title: pick('กระแสเงิน', 'Cash flow'), description: pick('ยอดฝาก ถอน และกระแสเงินสุทธิจากข้อมูลล่าสุด', 'Deposits, withdrawals, and net flow from the latest snapshot.') },
      'wallet.balance-composition': { title: pick('องค์ประกอบยอดกระเป๋า', 'Wallet balance composition'), description: pick('ยอดใช้ได้ ยอดล็อก และส่วนต่าง', 'Available, locked, and variance balances.') },
      'risk.open-severity': { title: pick('ระดับความเสี่ยงที่เปิดอยู่', 'Open risk severity'), description: pick('กระจายรายการความเสี่ยงตามระดับ', 'Open alerts distributed by severity.') },
      'finance.pending-queues': { title: pick('คิวการเงินค้าง', 'Pending finance queues'), description: pick('รายการฝากและถอนที่รอการตัดสินใจ', 'Deposits and withdrawals awaiting a decision.') },
      'activity.recent': { title: pick('กิจกรรมล่าสุด', 'Recent activity'), description: pick('ความเสี่ยงและรายการกระเป๋าเงินล่าสุด', 'Latest risk and wallet events.') },
    },
    series: {
      deposit: pick('ฝาก', 'Deposits'), withdrawal: pick('ถอน', 'Withdrawals'), net: pick('สุทธิ', 'Net flow'),
      available: pick('ใช้ได้', 'Available'), locked: pick('ล็อก', 'Locked'), variance: pick('ส่วนต่าง', 'Variance'),
      wallet: pick('ยอดกระเป๋า', 'Wallet balance'), openRisk: pick('ความเสี่ยงเปิดอยู่', 'Open risk'), today: pick('วันนี้', 'Today'),
    },
    severity: {
      CRITICAL: pick('วิกฤต', 'Critical'), HIGH: pick('สูง', 'High'), MEDIUM: pick('กลาง', 'Medium'), LOW: pick('ต่ำ', 'Low'),
    },
    priority: {
      criticalRisk: pick('ความเสี่ยงวิกฤต', 'Critical risks'), openRisk: pick('ความเสี่ยงที่เปิดอยู่', 'Open risks'),
      withdrawals: pick('รายการถอนรอดำเนินการ', 'Withdrawals awaiting action'), deposits: pick('รายการฝากรอตรวจ', 'Deposits awaiting review'),
      review: pick('ต้องตรวจสอบ', 'Review required'),
    },
    empty: {
      priority: pick('ไม่มีงานเร่งด่วน', 'No priority work'), cashFlow: pick('ยังไม่มีรายการฝากหรือถอน', 'No deposit or withdrawal activity'),
      wallet: pick('ยังไม่มียอดกระเป๋า', 'No wallet balance data'), risk: pick('ไม่มีความเสี่ยงเปิดอยู่', 'No open risks'),
      queues: pick('ไม่มีรายการในคิว', 'No pending queue items'), activity: pick('ไม่มีกิจกรรมล่าสุด', 'No recent activity'),
    },
    error: {
      priority: pick('โหลดงานเร่งด่วนไม่สำเร็จ', 'Unable to load priority work'), finance: pick('โหลดข้อมูลการเงินไม่สำเร็จ', 'Unable to load finance data'),
      risk: pick('โหลดข้อมูลความเสี่ยงไม่สำเร็จ', 'Unable to load risk data'), activity: pick('โหลดกิจกรรมล่าสุดไม่สำเร็จ', 'Unable to load recent activity'),
    },
    partial: {
      snapshot: pick('API ปัจจุบันส่งข้อมูล Snapshot ล่าสุด วิดเจ็ตจึงยังไม่ใช่ข้อมูลสะสมเต็มช่วงวันที่', 'The current API returns the latest snapshot, so this widget is not yet a full range aggregate.'),
      source: pick('แหล่งข้อมูลบางส่วนโหลดไม่สำเร็จ แต่ข้อมูลที่เหลือยังแสดงได้', 'One data source failed; available data remains visible.'),
    },
    footer: { range: pick('ช่วง', 'Range'), compare: pick('เทียบกับ', 'Compare'), none: pick('ไม่มี', 'None') },
    table: {
      type: pick('ประเภท', 'Type'), member: pick('สมาชิก', 'Member'), amount: pick('จำนวนเงิน', 'Amount'),
      status: pick('สถานะ', 'Status'), createdAt: pick('เวลา', 'Created at'), activity: pick('กิจกรรม', 'Activity'),
      details: pick('รายละเอียด', 'Details'), value: pick('ค่า', 'Value'),
    },
    chart: { total: pick('รวม', 'Total'), legend: pick('คำอธิบายกราฟ', 'legend') },
    export: { success: pick('ส่งออกไฟล์แล้ว', 'Export completed'), error: pick('ส่งออกไฟล์ไม่สำเร็จ', 'Export failed') },
  };
}
