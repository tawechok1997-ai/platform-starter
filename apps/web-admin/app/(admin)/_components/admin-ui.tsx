'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode };
type CardProps = { title?: string; description?: string; action?: ReactNode; children: ReactNode; tone?: SurfaceTone; compact?: boolean };
type MetricProps = { title: string; value: string; helper?: string; tone?: SurfaceTone; trend?: string };
type SurfaceTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'compact' | 'regular';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'success';
  busy?: boolean;
  details?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

const safeTextContainerStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: '100%',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

const cardBodyStyle: CSSProperties = {
  ...safeTextContainerStyle,
  paddingInline: 'clamp(2px, 1vw, 6px)',
};

const rowStyle: CSSProperties = {
  ...safeTextContainerStyle,
  width: '100%',
  columnGap: 'clamp(12px, 3vw, 20px)',
};

const pageHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: 16,
  marginBottom: 20,
};

const pageActionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  flexWrap: 'wrap',
  minWidth: 0,
};

export function AdminPage({ eyebrow, title, description, actions, children }: PageProps) {
  return <main className="admin-ui-page"><header className="admin-ui-page__head" style={pageHeaderStyle}><div style={safeTextContainerStyle}>{eyebrow && <p className="admin-ui-eyebrow" style={{ marginBottom: 6, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>{eyebrow}</p>}<h1>{title}</h1>{description && <p className="admin-ui-page__description" style={{ maxWidth: 760, marginBottom: 0 }}>{description}</p>}</div>{actions && <div className="admin-ui-page__actions" style={pageActionStyle}>{actions}</div>}</header>{children}</main>;
}

export function AdminCard({ title, description, action, children, tone = 'neutral', compact = false }: CardProps) {
  return <section className={`admin-ui-card admin-ui-surface--${tone}${compact ? ' admin-ui-card--compact' : ''}`} style={{ ...safeTextContainerStyle, padding: compact ? 14 : undefined }}>{(title || description || action) && <header className="admin-ui-card__head" style={{ ...safeTextContainerStyle, marginBottom: compact ? 10 : undefined }}><div style={safeTextContainerStyle}>{title && <h2 style={{ marginBottom: description ? 5 : 0 }}>{title}</h2>}{description && <p style={{ marginBottom: 0, lineHeight: 1.45 }}>{description}</p>}</div>{action && <div className="admin-ui-card__action" style={safeTextContainerStyle}>{action}</div>}</header>}<div className="admin-ui-stack" style={cardBodyStyle}>{children}</div></section>;
}

export function AdminMetric({ title, value, helper, tone = 'neutral', trend }: MetricProps) {
  return <article className={`admin-ui-metric admin-ui-surface--${tone}`} style={safeTextContainerStyle}><p>{title}</p><strong>{value}</strong>{helper && <span>{helper}</span>}{trend && <em>{trend}</em>}</article>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-metric-grid">{children}</div>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-grid">{children}</div>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div className="admin-ui-stack" style={safeTextContainerStyle}>{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div className="admin-ui-row" style={rowStyle}>{children}</div>; }
export function AdminSectionRow({ children }: { children: ReactNode }) { return <div className="admin-ui-section-row" style={rowStyle}>{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <div className="admin-ui-toolbar" style={{ ...safeTextContainerStyle, gap: 10, alignItems: 'center' }}>{children}</div>; }
export function AdminNotice({ children, tone = 'neutral' }: { children: ReactNode; tone?: SurfaceTone }) { return <div className={`admin-ui-notice admin-ui-surface--${tone}`} role={tone === 'danger' ? 'alert' : 'status'} style={safeTextContainerStyle}>{children}</div>; }
export function AdminEmpty({ children }: { children: ReactNode }) { return <div className="admin-ui-empty" style={safeTextContainerStyle}>{children}</div>; }
export function AdminSkeleton({ lines = 3 }: { lines?: number }) { return <div className="admin-ui-skeleton" aria-label="กำลังโหลด" role="status"><span className="admin-ui-skeleton__block" />{Array.from({ length: lines }, (_, index) => <span key={index} className="admin-ui-skeleton__line" />)}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary', size = 'regular', ariaLabel }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: ButtonTone; size?: ButtonSize; ariaLabel?: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--${size}`} style={size === 'compact' ? { minHeight: 38, padding: '7px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.15 } : undefined}>{children}</button>;
}

export function AdminIconButton({ children, onClick, disabled, tone = 'ghost', label }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: ButtonTone; label: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--compact`} style={{ width: 40, minWidth: 40, height: 40, minHeight: 40, padding: 0, borderRadius: 11, display: 'grid', placeItems: 'center', fontSize: 18 }}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary', size = 'regular' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' | 'ghost'; size?: ButtonSize }) {
  return <a href={href} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--${size}`} style={size === 'compact' ? { minHeight: 38, padding: '7px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.15 } : undefined}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`admin-ui-badge admin-ui-badge--${tone}`}>{children}</span>;
}

export function AdminConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'ยกเลิก', tone = 'primary', busy = false, details, onConfirm, onCancel }: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const previous = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [open, busy, onCancel]);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="admin-confirm-layer" role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 'max(14px, env(safe-area-inset-top)) 12px max(14px, env(safe-area-inset-bottom))', overflow: 'hidden', overscrollBehavior: 'contain' }} onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description" style={{ width: 'min(100%, 560px)', maxHeight: 'calc(100dvh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom))', margin: 'auto', display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 14, alignItems: 'start', padding: '20px 20px 12px', background: 'inherit', position: 'sticky', top: 0, zIndex: 2 }}><div className={`admin-confirm-dialog__mark admin-confirm-dialog__mark--${tone}`} aria-hidden="true">!</div><div className="admin-confirm-dialog__copy" style={safeTextContainerStyle}><h2 id="admin-confirm-title">{title}</h2><p id="admin-confirm-description">{description}</p></div></div>
        <div style={{ minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: '0 20px 16px' }}>{details ? <div className="admin-confirm-dialog__details" style={safeTextContainerStyle}>{details}</div> : null}</div>
        <div className="admin-confirm-dialog__actions" style={{ position: 'sticky', bottom: 0, zIndex: 2, padding: '12px 20px max(16px, env(safe-area-inset-bottom))', background: 'inherit', borderTop: '1px solid rgba(148,163,184,.16)' }}><AdminButton tone="secondary" disabled={busy} onClick={onCancel}>{cancelLabel}</AdminButton><AdminButton tone={tone} disabled={busy} onClick={onConfirm}>{busy ? 'กำลังดำเนินการ...' : confirmLabel}</AdminButton></div>
      </section>
    </div>, document.body,
  );
}

export function AdminCommandPanel({ children }: { children: ReactNode }) { return <section className="admin-ui-command-panel" style={safeTextContainerStyle}>{children}</section>; }
export function AdminActionStrip({ children }: { children: ReactNode }) { return <div className="admin-ui-action-strip" style={safeTextContainerStyle}>{children}</div>; }
export function formatMoney(value: string | number) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
