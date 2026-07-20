'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; stickyActions?: boolean; children: ReactNode };
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

export function AdminPage({ eyebrow, title, description, actions, stickyActions = false, children }: PageProps) {
  return <main className="admin-ui-page"><header className="admin-ui-page__head"><div className="admin-ui-page__copy">{eyebrow && <p className="admin-ui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="admin-ui-page__description">{description}</p>}</div>{actions && <div className={`admin-ui-page__actions${stickyActions ? ' admin-ui-page__actions--sticky' : ''}`}>{actions}</div>}</header>{children}</main>;
}

export function AdminCard({ title, description, action, children, tone = 'neutral', compact = false }: CardProps) {
  return <section className={`admin-ui-card admin-ui-surface--${tone}${compact ? ' admin-ui-card--compact' : ''}`}>{(title || description || action) && <header className="admin-ui-card__head"><div className="admin-ui-card__copy">{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action && <div className="admin-ui-card__action">{action}</div>}</header>}<div className="admin-ui-card__body">{children}</div></section>;
}

export function AdminMetric({ title, value, helper, tone = 'neutral', trend }: MetricProps) {
  return <article className={`admin-ui-metric admin-ui-surface--${tone}`}><p>{title}</p><strong>{value}</strong>{helper && <span>{helper}</span>}{trend && <em>{trend}</em>}</article>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-metric-grid">{children}</div>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-grid">{children}</div>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div className="admin-ui-stack">{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div className="admin-ui-row">{children}</div>; }
export function AdminSectionRow({ children }: { children: ReactNode }) { return <div className="admin-ui-section-row">{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <div className="admin-ui-toolbar">{children}</div>; }
export function AdminNotice({ children, tone = 'neutral' }: { children: ReactNode; tone?: SurfaceTone }) { return <div className={`admin-ui-notice admin-ui-surface--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>{children}</div>; }
export function AdminEmpty({ children }: { children: ReactNode }) { return <div className="admin-ui-empty">{children}</div>; }
export function AdminSkeleton({ lines = 3 }: { lines?: number }) { return <div className="admin-ui-skeleton" aria-label="กำลังโหลด" role="status"><span className="admin-ui-skeleton__block" />{Array.from({ length: lines }, (_, index) => <span key={index} className="admin-ui-skeleton__line" />)}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary', size = 'regular', ariaLabel }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: ButtonTone; size?: ButtonSize; ariaLabel?: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--${size}`}>{children}</button>;
}

export function AdminIconButton({ children, onClick, disabled, tone = 'ghost', label }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: ButtonTone; label: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--icon`}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary', size = 'regular' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' | 'ghost'; size?: ButtonSize }) {
  return <a href={href} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--${size}`}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`admin-ui-badge admin-ui-badge--${tone}`}>{children}</span>;
}

export function AdminConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'ยกเลิก', tone = 'primary', busy = false, details, onConfirm, onCancel }: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollY = window.scrollY;
    const previous = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const focusFirstControl = () => dialogRef.current?.querySelector<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus();
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { onCancel(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (controls.length === 0) { event.preventDefault(); return; }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const focusTimer = window.setTimeout(focusFirstControl, 0);
    window.addEventListener('keydown', keepFocusInDialog);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', keepFocusInDialog);
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
      previousFocusRef.current?.focus();
    };
  }, [open, busy, onCancel]);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="admin-confirm-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section ref={dialogRef} className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description">
        <div className="admin-confirm-dialog__header"><div className={`admin-confirm-dialog__mark admin-confirm-dialog__mark--${tone}`} aria-hidden="true">!</div><div className="admin-confirm-dialog__copy"><h2 id="admin-confirm-title">{title}</h2><p id="admin-confirm-description">{description}</p></div></div>
        <div className="admin-confirm-dialog__content">{details ? <div className="admin-confirm-dialog__details">{details}</div> : null}</div>
        <div className="admin-confirm-dialog__actions"><AdminButton tone="secondary" disabled={busy} onClick={onCancel}>{cancelLabel}</AdminButton><AdminButton tone={tone} disabled={busy} onClick={onConfirm}>{busy ? 'กำลังดำเนินการ...' : confirmLabel}</AdminButton></div>
      </section>
    </div>, document.body,
  );
}

export function AdminCommandPanel({ children }: { children: ReactNode }) { return <section className="admin-ui-command-panel">{children}</section>; }
export function AdminActionStrip({ children }: { children: ReactNode }) { return <div className="admin-ui-action-strip">{children}</div>; }
export function formatMoney(value: string | number) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
