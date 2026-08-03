'use client';

import { useMemo, type KeyboardEvent } from 'react';

import type { AdminChartKind } from './chart-widget-contracts';
import styles from './admin-chart.module.css';

export type AdminChartTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type AdminChartSeries = {
  id: string;
  label: string;
  tone?: AdminChartTone | undefined;
};

export type AdminChartPoint = {
  id: string;
  label: string;
  values: Readonly<Record<string, number>>;
};

export type AdminChartSelection = {
  pointId: string;
  pointLabel: string;
  seriesId: string;
  seriesLabel: string;
  value: number;
};

export type AdminChartProps = {
  ariaLabel: string;
  kind: AdminChartKind;
  series: readonly AdminChartSeries[];
  points: readonly AdminChartPoint[];
  valueFormatter?: ((value: number) => string) | undefined;
  height?: number | undefined;
  totalLabel?: string | undefined;
  legendAriaLabel?: string | undefined;
  onDatumSelect?: ((selection: AdminChartSelection) => void) | undefined;
};

type NormalizedAdminChartSeries = AdminChartSeries & { tone: AdminChartTone };

type ChartModel = {
  width: number;
  height: number;
  left: number;
  top: number;
  plotWidth: number;
  plotHeight: number;
  minimum: number;
  maximum: number;
  range: number;
  zeroY: number;
  groupWidth: number;
  y: (value: number) => number;
};

const DEFAULT_TONES: readonly AdminChartTone[] = ['brand', 'success', 'warning', 'danger', 'info', 'neutral'];

export function AdminChart({
  ariaLabel,
  kind,
  series,
  points,
  valueFormatter = defaultValueFormatter,
  height = 280,
  totalLabel = 'Total',
  legendAriaLabel = `${ariaLabel} legend`,
  onDatumSelect,
}: AdminChartProps) {
  const normalizedSeries = useMemo<NormalizedAdminChartSeries[]>(() => series.map((item, index) => ({
    ...item,
    tone: item.tone ?? DEFAULT_TONES[index % DEFAULT_TONES.length] ?? 'brand',
  })), [series]);
  const model = useMemo(() => buildChartModel(kind, points, normalizedSeries, height), [height, kind, normalizedSeries, points]);
  const hasData = points.length > 0 && normalizedSeries.length > 0;

  if (!hasData) return null;

  return <div className={styles.chart} data-kind={kind}>
    <svg
      className={styles.svg}
      viewBox={`0 0 ${model.width} ${model.height}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{ariaLabel}</title>
      {kind === 'donut'
        ? <DonutChart model={model} points={points} series={normalizedSeries} valueFormatter={valueFormatter} totalLabel={totalLabel} onDatumSelect={onDatumSelect} />
        : <CartesianChart model={model} kind={kind} points={points} series={normalizedSeries} valueFormatter={valueFormatter} onDatumSelect={onDatumSelect} />}
    </svg>

    <div className={styles.legend} aria-label={legendAriaLabel}>
      {normalizedSeries.map((item) => <span key={item.id}><i data-tone={item.tone} />{item.label}</span>)}
    </div>

    <ul className={styles.screenReaderData}>
      {points.flatMap((point) => normalizedSeries.map((item) => <li key={`${point.id}:${item.id}`}>
        {point.label}, {item.label}: {valueFormatter(readValue(point, item.id))}
      </li>))}
    </ul>
  </div>;
}

function CartesianChart({
  model,
  kind,
  points,
  series,
  valueFormatter,
  onDatumSelect,
}: {
  model: ChartModel;
  kind: Exclude<AdminChartKind, 'donut'>;
  points: readonly AdminChartPoint[];
  series: readonly NormalizedAdminChartSeries[];
  valueFormatter: (value: number) => string;
  onDatumSelect?: ((selection: AdminChartSelection) => void) | undefined;
}) {
  const ticks = Array.from({ length: 5 }, (_, index) => model.maximum - (model.range * index) / 4);
  const lineLike = kind === 'line' || kind === 'area';

  return <>
    <g className={styles.grid} aria-hidden="true">
      {ticks.map((tick, index) => {
        const y = model.top + (model.plotHeight * index) / 4;
        return <g key={index}>
          <line x1={model.left} x2={model.left + model.plotWidth} y1={y} y2={y} />
          <text x={model.left - 10} y={y + 4} textAnchor="end">{compactNumber(tick)}</text>
        </g>;
      })}
      <line className={styles.zeroLine} x1={model.left} x2={model.left + model.plotWidth} y1={model.zeroY} y2={model.zeroY} />
    </g>

    {lineLike ? series.map((item) => {
      const path = buildLinePath(model, points, item.id);
      const areaPath = `${path} L ${model.left + model.plotWidth - model.groupWidth / 2} ${model.zeroY} L ${model.left + model.groupWidth / 2} ${model.zeroY} Z`;
      return <g key={item.id} data-tone={item.tone}>
        {kind === 'area' ? <path className={styles.area} d={areaPath} /> : null}
        <path className={styles.line} d={path} />
        {points.map((point, pointIndex) => {
          const value = readValue(point, item.id);
          const x = pointCenterX(model, pointIndex);
          const y = model.y(value);
          return <g
            key={point.id}
            className={onDatumSelect ? styles.interactiveDatum : undefined}
            role={onDatumSelect ? 'button' : undefined}
            tabIndex={onDatumSelect ? 0 : undefined}
            aria-label={`${point.label}, ${item.label}: ${valueFormatter(value)}`}
            onClick={onDatumSelect ? () => onDatumSelect(toSelection(point, item, value)) : undefined}
            onKeyDown={onDatumSelect ? (event) => activateDatum(event, () => onDatumSelect(toSelection(point, item, value))) : undefined}
          >
            <circle className={styles.pointHalo} cx={x} cy={y} r={10} />
            <circle className={styles.point} cx={x} cy={y} r={4} />
          </g>;
        })}
      </g>;
    }) : null}

    {kind === 'bar' ? points.map((point, pointIndex) => {
      const gap = 4;
      const usableWidth = Math.max(8, model.groupWidth * 0.72);
      const barWidth = Math.max(4, (usableWidth - gap * Math.max(0, series.length - 1)) / Math.max(series.length, 1));
      const groupStart = pointCenterX(model, pointIndex) - usableWidth / 2;
      return <g key={point.id}>
        {series.map((item, seriesIndex) => {
          const value = readValue(point, item.id);
          const valueY = model.y(value);
          const y = Math.min(valueY, model.zeroY);
          const barHeight = Math.max(1, Math.abs(model.zeroY - valueY));
          return <rect
            key={item.id}
            className={onDatumSelect ? styles.interactiveBar : styles.bar}
            data-tone={item.tone}
            x={groupStart + seriesIndex * (barWidth + gap)}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={4}
            role={onDatumSelect ? 'button' : undefined}
            tabIndex={onDatumSelect ? 0 : undefined}
            aria-label={`${point.label}, ${item.label}: ${valueFormatter(value)}`}
            onClick={onDatumSelect ? () => onDatumSelect(toSelection(point, item, value)) : undefined}
            onKeyDown={onDatumSelect ? (event) => activateDatum(event, () => onDatumSelect(toSelection(point, item, value))) : undefined}
          />;
        })}
      </g>;
    }) : null}

    {kind === 'stacked-bar' ? points.map((point, pointIndex) => {
      const barWidth = Math.max(8, model.groupWidth * 0.58);
      let positive = 0;
      let negative = 0;
      return <g key={point.id}>
        {series.map((item) => {
          const value = readValue(point, item.id);
          const start = value >= 0 ? positive : negative;
          const end = start + value;
          if (value >= 0) positive = end;
          else negative = end;
          const startY = model.y(start);
          const endY = model.y(end);
          return <rect
            key={item.id}
            className={onDatumSelect ? styles.interactiveBar : styles.bar}
            data-tone={item.tone}
            x={pointCenterX(model, pointIndex) - barWidth / 2}
            y={Math.min(startY, endY)}
            width={barWidth}
            height={Math.max(1, Math.abs(startY - endY))}
            rx={3}
            role={onDatumSelect ? 'button' : undefined}
            tabIndex={onDatumSelect ? 0 : undefined}
            aria-label={`${point.label}, ${item.label}: ${valueFormatter(value)}`}
            onClick={onDatumSelect ? () => onDatumSelect(toSelection(point, item, value)) : undefined}
            onKeyDown={onDatumSelect ? (event) => activateDatum(event, () => onDatumSelect(toSelection(point, item, value))) : undefined}
          />;
        })}
      </g>;
    }) : null}

    <g className={styles.xAxis} aria-hidden="true">
      {points.map((point, index) => <text key={point.id} x={pointCenterX(model, index)} y={model.top + model.plotHeight + 24} textAnchor="middle">{truncateLabel(point.label)}</text>)}
    </g>
  </>;
}

function DonutChart({
  model,
  points,
  series,
  valueFormatter,
  totalLabel,
  onDatumSelect,
}: {
  model: ChartModel;
  points: readonly AdminChartPoint[];
  series: readonly NormalizedAdminChartSeries[];
  valueFormatter: (value: number) => string;
  totalLabel: string;
  onDatumSelect?: ((selection: AdminChartSelection) => void) | undefined;
}) {
  const totals = series.map((item) => ({
    series: item,
    value: points.reduce((sum, point) => sum + Math.max(0, readValue(point, item.id)), 0),
  }));
  const rawTotal = totals.reduce((sum, item) => sum + item.value, 0);
  const denominator = Math.max(1, rawTotal);
  const radius = Math.min(model.plotHeight, model.plotWidth) * 0.3;
  const circumference = 2 * Math.PI * radius;
  const centerX = model.left + model.plotWidth / 2;
  const centerY = model.top + model.plotHeight / 2;
  let offset = 0;

  return <>
    <circle className={styles.donutTrack} cx={centerX} cy={centerY} r={radius} />
    {totals.map(({ series: item, value }) => {
      const length = (value / denominator) * circumference;
      const currentOffset = offset;
      offset += length;
      const point = points[0] ?? { id: item.id, label: item.label, values: {} };
      return <circle
        key={item.id}
        className={onDatumSelect ? styles.interactiveDonut : styles.donutSegment}
        data-tone={item.tone}
        cx={centerX}
        cy={centerY}
        r={radius}
        strokeDasharray={`${length} ${Math.max(0, circumference - length)}`}
        strokeDashoffset={-currentOffset}
        transform={`rotate(-90 ${centerX} ${centerY})`}
        role={onDatumSelect ? 'button' : undefined}
        tabIndex={onDatumSelect ? 0 : undefined}
        aria-label={`${item.label}: ${valueFormatter(value)}`}
        onClick={onDatumSelect ? () => onDatumSelect(toSelection(point, item, value)) : undefined}
        onKeyDown={onDatumSelect ? (event) => activateDatum(event, () => onDatumSelect(toSelection(point, item, value))) : undefined}
      />;
    })}
    <text className={styles.donutValue} x={centerX} y={centerY - 2} textAnchor="middle">{compactNumber(rawTotal)}</text>
    <text className={styles.donutLabel} x={centerX} y={centerY + 20} textAnchor="middle">{totalLabel}</text>
  </>;
}

function buildChartModel(
  kind: AdminChartKind,
  points: readonly AdminChartPoint[],
  series: readonly AdminChartSeries[],
  height: number,
): ChartModel {
  const width = 720;
  const safeHeight = Math.max(220, Math.min(560, Math.trunc(height)));
  const left = 66;
  const right = 20;
  const top = 20;
  const bottom = 50;
  const values = points.flatMap((point) => series.map((item) => readValue(point, item.id)));
  const positiveStacks = kind === 'stacked-bar'
    ? points.map((point) => series.reduce((sum, item) => sum + Math.max(0, readValue(point, item.id)), 0))
    : [];
  const negativeStacks = kind === 'stacked-bar'
    ? points.map((point) => series.reduce((sum, item) => sum + Math.min(0, readValue(point, item.id)), 0))
    : [];
  const minimum = Math.min(0, ...values, ...negativeStacks);
  const maximum = Math.max(0, ...values, ...positiveStacks, 1);
  const range = Math.max(1, maximum - minimum);
  const plotWidth = width - left - right;
  const plotHeight = safeHeight - top - bottom;
  const y = (value: number) => top + ((maximum - value) / range) * plotHeight;

  return {
    width,
    height: safeHeight,
    left,
    top,
    plotWidth,
    plotHeight,
    minimum,
    maximum,
    range,
    zeroY: y(0),
    groupWidth: plotWidth / Math.max(points.length, 1),
    y,
  };
}

function buildLinePath(model: ChartModel, points: readonly AdminChartPoint[], seriesId: string): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${pointCenterX(model, index)} ${model.y(readValue(point, seriesId))}`).join(' ');
}

function pointCenterX(model: ChartModel, index: number): number {
  return model.left + model.groupWidth * (index + 0.5);
}

function readValue(point: AdminChartPoint, seriesId: string): number {
  const value = Number(point.values[seriesId] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function toSelection(point: AdminChartPoint, series: AdminChartSeries, value: number): AdminChartSelection {
  return {
    pointId: point.id,
    pointLabel: point.label,
    seriesId: series.id,
    seriesLabel: series.label,
    value,
  };
}

function activateDatum(event: KeyboardEvent<SVGElement>, action: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

function truncateLabel(value: string): string {
  return value.length > 12 ? `${value.slice(0, 11)}…` : value;
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function defaultValueFormatter(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}
