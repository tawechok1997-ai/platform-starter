import type { AdminChartPoint, AdminChartSeries } from './admin-chart';

export function buildAdminChartCsv(
  points: readonly AdminChartPoint[],
  series: readonly AdminChartSeries[],
): string {
  const header = ['label', ...series.map((item) => item.label)];
  const rows = points.map((point) => [
    point.label,
    ...series.map((item) => formatCsvNumber(point.values[item.id])),
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function createAdminChartCsvBlob(
  points: readonly AdminChartPoint[],
  series: readonly AdminChartSeries[],
): Blob {
  return new Blob([`\uFEFF${buildAdminChartCsv(points, series)}`], { type: 'text/csv;charset=utf-8' });
}

export function normalizeAdminExportFileName(value: string, extension: 'csv' | 'png'): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'admin-widget';
  const suffix = `.${extension}`;
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
}

export function serializeAdminChartSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const viewBox = svg.viewBox.baseVal;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(Math.max(1, viewBox.width || svg.clientWidth || 720)));
  clone.setAttribute('height', String(Math.max(1, viewBox.height || svg.clientHeight || 280)));
  return new XMLSerializer().serializeToString(clone);
}

export async function createAdminChartPngBlob(
  svg: SVGSVGElement,
  options: { scale?: number; background?: string } = {},
): Promise<Blob> {
  const scale = clamp(options.scale ?? 2, 1, 4);
  const viewBox = svg.viewBox.baseVal;
  const width = Math.max(1, viewBox.width || svg.clientWidth || 720);
  const height = Math.max(1, viewBox.height || svg.clientHeight || 280);
  const source = URL.createObjectURL(new Blob([serializeAdminChartSvg(svg)], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = await loadImage(source);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable');
    context.scale(scale, scale);
    if (options.background) {
      context.fillStyle = options.background;
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(source);
  }
}

function formatCsvNumber(value: unknown): string {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? String(numeric) : '0';
}

function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to render Admin chart image'));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to encode Admin chart PNG')), 'image/png');
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
