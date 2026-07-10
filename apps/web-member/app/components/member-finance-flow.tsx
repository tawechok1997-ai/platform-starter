'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

type FinanceStep = {
  key: string;
  label: string;
};

export function FinanceFlowShell({ title, description, children, aside }: { title: string; description?: string; children: ReactNode; aside?: ReactNode }) {
  return <main className="finance-flow-page"><header className="finance-flow-header"><a href="/" className="finance-flow-back">← หน้าแรก</a><div><h1>{title}</h1>{description && <p>{description}</p>}</div></header><div className={aside ? 'finance-flow-layout finance-flow-layout--with-aside' : 'finance-flow-layout'}><section className="finance-flow-main">{children}</section>{aside && <aside className="finance-flow-aside">{aside}</aside>}</div></main>;
}

export function FinanceStepIndicator({ current, steps }: { current: string; steps: FinanceStep[] }) {
  const currentIndex = Math.max(steps.findIndex((step) => step.key === current), 0);
  return <ol className="finance-step-indicator" aria-label="ขั้นตอนดำเนินการ">{steps.map((step, index) => <li key={step.key} className={index < currentIndex ? 'is-complete' : index === currentIndex ? 'is-current' : ''}><span>{index + 1}</span><strong>{step.label}</strong></li>)}</ol>;
}

export function FinanceCard({ title, description, children, tone = 'default' }: { title?: string; description?: string; children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  return <section className={`finance-card finance-card--${tone}`}>{(title || description) && <header className="finance-card-header">{title && <h2>{title}</h2>}{description && <p>{description}</p>}</header>}<div className="finance-card-body">{children}</div></section>;
}

export function FinanceInfoRow({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return <div className="finance-info-row"><div><span>{label}</span><strong>{value}</strong></div>{action}</div>;
}

export function FinanceActionBar({ children }: { children: ReactNode }) {
  return <div className="finance-action-bar">{children}</div>;
}

export function FinanceEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="finance-empty-state"><strong>{title}</strong><span>{description}</span>{action}</div>;
}

export function FinanceConfirmDialog({ open, title, description, children, onClose, onConfirm, loading, confirmLabel = 'ยืนยัน' }: { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void; onConfirm: () => void; loading?: boolean; confirmLabel?: string }) {
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
      if (event.key === 'Escape' && !loading) { event.preventDefault(); onClose(); return; }
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
  }, [open, loading, onClose]);

  if (!open) return null;
  return <div className="finance-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}><section ref={dialogRef} tabIndex={-1} className="finance-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}><header><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" onClick={onClose} disabled={loading} className="finance-icon-button" aria-label="ปิด">×</button></header><div className="finance-dialog-body">{children}</div><FinanceActionBar><button type="button" onClick={onClose} disabled={loading} className="finance-button finance-button--secondary">แก้ไข</button><button type="button" onClick={onConfirm} disabled={loading} className="finance-button finance-button--primary">{loading ? 'กำลังดำเนินการ...' : confirmLabel}</button></FinanceActionBar></section></div>;
}

export function FinanceStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone = normalized === 'APPROVED' || normalized === 'COMPLETED' || normalized === 'ACTIVE' ? 'success' : normalized === 'REJECTED' ? 'danger' : 'warning';
  const label = normalized === 'PENDING' ? 'รอตรวจสอบ' : normalized === 'APPROVED' || normalized === 'COMPLETED' ? 'สำเร็จ' : normalized === 'REJECTED' ? 'ไม่อนุมัติ' : normalized === 'ACTIVE' ? 'ใช้งานได้' : status;
  return <span className={`finance-status finance-status--${tone}`}>{label}</span>;
}