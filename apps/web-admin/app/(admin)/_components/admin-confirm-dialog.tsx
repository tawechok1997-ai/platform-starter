'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { AdminButton } from './admin-ui';

type ConfirmTone = 'success' | 'danger' | 'warning';

type ConfirmDialogProps = {
  open: boolean;
  tone?: ConfirmTone;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  details?: ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({ open, tone = 'warning', title, description, confirmLabel, cancelLabel = 'ยกเลิก', details, loading, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) { event.preventDefault(); onCancel(); return; }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;
  return <div style={overlayStyle} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel(); }}>
    <section ref={dialogRef} tabIndex={-1} style={dialogStyle} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onMouseDown={(event) => event.stopPropagation()}>
      <div style={headerStyle}>
        <span aria-hidden="true" style={{ ...iconStyle, ...iconToneStyle[tone] }}>{tone === 'success' ? '✓' : tone === 'danger' ? '!' : '?'}</span>
        <div style={{ minWidth: 0 }}>
          <h2 id={titleId} style={titleStyle}>{title}</h2>
          <p id={descriptionId} style={descriptionStyle}>{description}</p>
        </div>
      </div>
      {details && <div style={detailsStyle}>{details}</div>}
      <div style={actionsStyle}>
        <AdminButton tone="secondary" disabled={loading} onClick={onCancel}>{cancelLabel}</AdminButton>
        <AdminButton tone={tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : 'primary'} disabled={loading} onClick={onConfirm}>{loading ? 'กำลังทำรายการ...' : confirmLabel}</AdminButton>
      </div>
    </section>
  </div>;
}

export function ConfirmDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return <div style={detailRowStyle}><strong>{label}</strong><span>{value}</span></div>;
}

const overlayStyle = { position: 'fixed' as const, inset: 0, zIndex: 200, background: 'rgba(0,0,0,.68)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', padding: 16 };
const dialogStyle = { width: 'min(100%, 520px)', maxHeight: 'min(90dvh, 760px)', overflowY: 'auto' as const, border: '1px solid rgba(148,163,184,.22)', borderRadius: 22, background: '#111a24', color: '#f8fafc', padding: 18, boxShadow: '0 30px 90px rgba(0,0,0,.5)', display: 'grid', gap: 14 };
const headerStyle = { display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 };
const iconStyle = { width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', fontWeight: 950, flex: '0 0 42px', border: '1px solid rgba(255,255,255,.16)' } as const;
const iconToneStyle = { success: { background: 'rgba(34,197,94,.16)', color: '#bbf7d0' }, danger: { background: 'rgba(239,68,68,.16)', color: '#fecaca' }, warning: { background: 'rgba(245,197,66,.16)', color: '#fde68a' } } as const;
const titleStyle = { margin: 0, fontSize: 24, lineHeight: 1.1, overflowWrap: 'anywhere' as const };
const descriptionStyle = { margin: '6px 0 0', color: '#94a3b8', lineHeight: 1.55 } as const;
const detailsStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, background: 'rgba(15,23,42,.55)', padding: 12, display: 'grid', gap: 8, minWidth: 0 };
const detailRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const, color: '#cbd5e1', minWidth: 0 };
const actionsStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;