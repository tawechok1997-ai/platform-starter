'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { adminApiFetch } from '../../../app/admin-api';
import { AdminChart, type AdminChartPoint, type AdminChartSeries } from './admin-chart';
import { AdminWidget } from './admin-widget';
import { createAdminChartCsvBlob, createAdminChartPngBlob, normalizeAdminExportFileName } from './chart-export';
import type {
  AdminComparePeriod,
  AdminDateRange,
  AdminWidgetDefinition,
  AdminWidgetExportFormat,
  AdminWidgetLayoutItem,
} from './chart-widget-contracts';
import styles from './admin-dashboard-finance-trends.module.css';

type TrendRow = {
  date: string;
  topUpAmount: string;
  topUpCount: number;
  withdrawalAmount: string;
  withdrawalCount: number;
  netFlow: string;
};

type TrendResponse = {
  range: { days: number; from: string; to: string };
  totals: {
    topUpAmount: string;
    topUpCount: number;
    withdrawalAmount: string;
    withdrawalCount: number;
    netFlow: string;
  };
  daily: TrendRow[];
  generatedAt: string;
};

type Props = {
  definition: AdminWidgetDefinition;
  layout: AdminWidgetLayoutItem;
  dateRange: AdminDateRange;
  compareRange: AdminDateRange | null;
  comparePeriod: AdminComparePeriod;
  setPinned: (pinned: boolean) => void;
};

const SERIES: readonly AdminChartSeries[] = [
  { id: 'topUp', label: 'ฝาก', tone: 'success' },
  { id: 'withdrawal', label: 'ถอน', tone: 'danger' },
];

export function AdminDashboardFinanceTrends({
  definition,
  layout,
  dateRange,
  compareRange,
  comparePeriod,
  setPinned,
}: Props) {
  const router = useRouter();
  const [locale, setLocale] = useState<'th' | 'en'>('th');
  const [primary, setPrimary] = useState<TrendResponse | null>(null);
  const [comparison, setComparison] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLocale(window.localStorage.getItem('admin_locale') === 'en' ? 'en' : 'th');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const ranges = [dateRange, compareRange].filter((range): range is AdminDateRange => Boolean(range));
        const responses = await Promise.all(ranges.map((range) =>
          adminApiFetch(`/admin/dashboard/finance-trends?from=${encodeURIComponent(range.start)}&to=${encodeURIComponent(range.end)}`, {
            signal: controller.signal,
          }),
        ));
        const payloads = await Promise.all(responses.map((response) => response.json().catch(() => null)));
        const failedIndex = responses.findIndex((response) => !response.ok);
        if (failedIndex >= 0) {
          throw new Error(String(payloads[failedIndex]?.message ?? 'Unable to load finance trends'));
        }
        if (controller.signal.aborted) return;
        setPrimary(payloads[0] as TrendResponse);
        setComparison(compareRange ? payloads[1] as TrendResponse : null);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load finance trends');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [compareRange, dateRange, reloadKey]);

  const copy = locale === 'en' ? EN_COPY : TH_COPY;
  const dailyPoints = useMemo(() => toDailyPoints(primary?.daily ?? [], locale), [locale, primary]);
  const chartPoints = useMemo(() => aggregateTrendPoints(primary?.daily ?? [], locale), [locale, primary]);
  const state = loading && !primary ? 'loading' : error ? 'error' : chartPoints.length === 0 ? 'empty' : 'ready';
  const money = useMemo(() => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }), [locale]);

  function drillDown(date?: string) {
    const from = date ?? dateRange.start;
    const to = date ?? dateRange.end;
    router.push(`/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }

  async function exportChart(format: AdminWidgetExportFormat) {
    if (!primary) return;
    if (format === 'csv') {
      downloadBlob(
        createAdminChartCsvBlob(dailyPoints, SERIES),
        normalizeAdminExportFileName(`finance-trends-${dateRange.start}-${dateRange.end}`, 'csv'),
      );
      return;
    }
    const svg = document.querySelector<SVGSVGElement>('[data-widget-id="finance.cash-flow"] svg');
    if (!svg) return;
    const blob = await createAdminChartPngBlob(svg, { background: readSurfaceColor() });
    downloadBlob(blob, normalizeAdminExportFileName(`finance-trends-${dateRange.start}-${dateRange.end}`, 'png'));
  }

  return <AdminWidget
    widgetId={definition.id}
    title={copy.title}
    description={copy.description}
    state={state}
    labels={copy.widgetLabels}
    pinned={layout.pinned}
    emptyMessage={copy.empty}
    errorMessage={error || copy.error}
    exportFormats={definition.exportFormats}
    allowFullscreen={definition.allowFullscreen}
    allowDrillDown={definition.allowDrillDown}
    onRetry={() => setReloadKey((value) => value + 1)}
    onPinnedChange={setPinned}
    onDrillDown={() => drillDown()}
    onExport={(format) => void exportChart(format)}
    footer={primary ? <div className={styles.footer}>
      <span>{copy.range}: {formatRange(dateRange, locale)}</span>
      <span>{copy.updated}: {new Date(primary.generatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'th-TH')}</span>
    </div> : undefined}
  >
    {primary ? <>
      <div className={styles.summary}>
        <Metric label={copy.deposits} value={money.format(Number(primary.totals.topUpAmount))} detail={`${primary.totals.topUpCount.toLocaleString()} ${copy.items}`} />
        <Metric label={copy.withdrawals} value={money.format(Number(primary.totals.withdrawalAmount))} detail={`${primary.totals.withdrawalCount.toLocaleString()} ${copy.items}`} />
        <Metric label={copy.net} value={money.format(Number(primary.totals.netFlow))} detail={comparison ? comparisonDelta(primary.totals.netFlow, comparison.totals.netFlow, locale) : copy.noComparison} />
      </div>
      {comparison ? <div className={styles.comparison} role="status">
        <strong>{copy.compareLabel[comparePeriod]}</strong>
        <span>{copy.deposits} {comparisonDelta(primary.totals.topUpAmount, comparison.totals.topUpAmount, locale)}</span>
        <span>{copy.withdrawals} {comparisonDelta(primary.totals.withdrawalAmount, comparison.totals.withdrawalAmount, locale)}</span>
        <span>{copy.net} {comparisonDelta(primary.totals.netFlow, comparison.totals.netFlow, locale)}</span>
      </div> : null}
      <AdminChart
        ariaLabel={`${copy.title} ${formatRange(dateRange, locale)}`}
        kind="bar"
        series={SERIES.map((item) => ({ ...item, label: item.id === 'topUp' ? copy.deposits : copy.withdrawals }))}
        points={chartPoints}
        valueFormatter={(value) => money.format(value)}
        height={layout.rows >= 2 ? 360 : 280}
        legendAriaLabel={copy.legend}
        onDatumSelect={(selection) => drillDown(selection.pointId.slice(0, 10))}
      />
    </> : null}
  </AdminWidget>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function toDailyPoints(rows: readonly TrendRow[], locale: 'th' | 'en'): AdminChartPoint[] {
  return rows.map((row) => ({
    id: row.date,
    label: new Date(`${row.date}T00:00:00.000Z`).toLocaleDateString(locale === 'en' ? 'en-US' : 'th-TH'),
    values: { topUp: Number(row.topUpAmount), withdrawal: Number(row.withdrawalAmount) },
  }));
}

function aggregateTrendPoints(rows: readonly TrendRow[], locale: 'th' | 'en'): AdminChartPoint[] {
  if (rows.length <= 31) return toDailyPoints(rows, locale);
  const mode = rows.length <= 120 ? 'week' : 'month';
  const buckets = new Map<string, { start: string; end: string; topUp: number; withdrawal: number }>();
  for (const row of rows) {
    const date = new Date(`${row.date}T00:00:00.000Z`);
    const key = mode === 'week' ? weekKey(date) : row.date.slice(0, 7);
    const bucket = buckets.get(key) ?? { start: row.date, end: row.date, topUp: 0, withdrawal: 0 };
    bucket.end = row.date;
    bucket.topUp += Number(row.topUpAmount);
    bucket.withdrawal += Number(row.withdrawalAmount);
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries()).map(([key, bucket]) => ({
    id: bucket.start,
    label: mode === 'week'
      ? `${shortDate(bucket.start, locale)}–${shortDate(bucket.end, locale)}`
      : new Date(`${key}-01T00:00:00.000Z`).toLocaleDateString(locale === 'en' ? 'en-US' : 'th-TH', { month: 'short', year: '2-digit' }),
    values: { topUp: bucket.topUp, withdrawal: bucket.withdrawal },
  }));
}

function weekKey(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

function shortDate(value: string, locale: 'th' | 'en') {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString(locale === 'en' ? 'en-US' : 'th-TH', { day: 'numeric', month: 'short' });
}

function formatRange(range: AdminDateRange, locale: 'th' | 'en') {
  return `${shortDate(range.start, locale)} – ${shortDate(range.end, locale)}`;
}

function comparisonDelta(currentValue: string, previousValue: string, locale: 'th' | 'en') {
  const current = Number(currentValue);
  const previous = Number(previousValue);
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return locale === 'en' ? 'unavailable' : 'ไม่มีข้อมูล';
  if (previous === 0) return current === 0 ? '0.0%' : locale === 'en' ? 'new activity' : 'มีรายการใหม่';
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function readSurfaceColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#ffffff';
}

const TH_COPY = {
  title: 'กระแสเงินย้อนหลัง',
  description: 'ยอดฝาก ถอน และกระแสเงินสุทธิตามช่วงวันที่ที่เลือกจากข้อมูลจริง',
  deposits: 'ฝาก',
  withdrawals: 'ถอน',
  net: 'สุทธิ',
  items: 'รายการ',
  range: 'ช่วงข้อมูล',
  updated: 'อัปเดต',
  legend: 'คำอธิบายกราฟกระแสเงิน',
  empty: 'ยังไม่มีรายการในช่วงวันที่นี้',
  error: 'โหลดกระแสเงินไม่สำเร็จ',
  noComparison: 'ไม่ได้เลือกช่วงเปรียบเทียบ',
  compareLabel: {
    none: '',
    'previous-period': 'เทียบช่วงก่อนหน้า',
    'previous-year': 'เทียบปีก่อน',
  },
  widgetLabels: {
    loading: 'กำลังโหลดข้อมูล', empty: 'ไม่มีข้อมูล', error: 'เกิดข้อผิดพลาด', partial: 'ข้อมูลบางส่วน', retry: 'ลองใหม่', pin: 'ปักหมุด', unpin: 'เลิกปักหมุด', fullscreen: 'เต็มจอ', exitFullscreen: 'ออกจากเต็มจอ', drillDown: 'ดูรายละเอียด', exportCsv: 'ส่งออก CSV', exportPng: 'ส่งออก PNG',
  },
} as const;

const EN_COPY = {
  title: 'Historical cash flow',
  description: 'Deposits, withdrawals, and net cash flow for the selected real-data period',
  deposits: 'Deposits',
  withdrawals: 'Withdrawals',
  net: 'Net flow',
  items: 'items',
  range: 'Range',
  updated: 'Updated',
  legend: 'Cash-flow chart legend',
  empty: 'No transactions in this period',
  error: 'Unable to load cash flow',
  noComparison: 'No comparison selected',
  compareLabel: {
    none: '',
    'previous-period': 'Compared with previous period',
    'previous-year': 'Compared with previous year',
  },
  widgetLabels: {
    loading: 'Loading data', empty: 'No data', error: 'Something went wrong', partial: 'Partial data', retry: 'Retry', pin: 'Pin', unpin: 'Unpin', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', drillDown: 'View details', exportCsv: 'Export CSV', exportPng: 'Export PNG',
  },
} as const;
