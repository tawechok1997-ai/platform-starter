'use client';

import Link from 'next/link';
import { useEffect, useId, useRef } from 'react';
import type {
  FinanceActionBarProps,
  FinanceCardProps,
  FinanceConfirmDialogProps,
  FinanceEmptyStateProps,
  FinanceFlowShellProps,
  FinanceInfoRowProps,
  FinanceStatusBadgeProps,
  FinanceStepIndicatorProps,
} from './finance-component-contracts';

export function FinanceFlowShell({ title, description, children, aside }: FinanceFlowShellProps) {
  return <main className="finance-flow-page"><header className="finance-flow-header"><Link href="/" className="finance-flow-back">← หน้าแรก</Link><div><h1>{title}</h1>{description && <p>{description}</p>}</div></header><div className={aside ? 'finance-flow-layout finance-flow-layout--with-aside' : 'finance-flow-layout'}><section className="finance-flow-main">{children}</section>{aside && <aside className="finance-flow-aside">{aside}</aside>}</div></main>;
}

export function FinanceStepIndicator({ current, steps }: FinanceStepIndicatorProps) {
  const currentIndex = Math.max(steps.findIndex((step) => step.key === current), 0);
  return <ol className="finance-step-indicator" aria-label="ขั้นตอนดำเนินการ">{steps.map((step, index) => <li key={step.key} className={index < currentIndex ? 'is-complete' : index === currentIndex ? 'is-current' : ''}><span>{index + 1}</span><strong>{step.label}</strong></li>)}</ol>;
}

export function FinanceCard({ title, description, children, tone = 'default' }: FinanceCardProps) {
  return <section className={`finance-card finance-card--${tone}`}>{(title || description) && <header className="finance-card-header">{title && <h2>{title}</h2>}{description && <p>{description}</p>}</header>}<div className="finance-card-body">{children}</div></section>;
}

export function FinanceInfoRow({ label, value, action }: FinanceInfoRowProps) {
  return <div className="finance-info-row"><div><span>{label}</span><strong>{value}</strong></div>{action}</div>;
}

export function FinanceActionBar({ children }: FinanceActionBarProps) {
  return <div className="finance-action-bar">{children}</div>;
}

export function FinanceEmptyState({ title, description, action }: FinanceEmptyStateProps) {
  return <div className="finance-empty-state"><strong>{title}</strong><span>{description}</span>{action}</div>;
}

export function FinanceConfirmDialog({ open, title, description, children, onClose, onConfirm, loading, confirmLabel = 'ยืนยัน' }: FinanceConfirmDialogProps) {
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
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) { event.preventDefault(); dialogRef.current?.focus(); return; }
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
  return <div className="finance-dialog-backdrop ui-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}><section ref={dialogRef} tabIndex={-1} className="finance-dialog ui-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}><header className="ui-overlay-surface__header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" onClick={onClose} disabled={loading} className="finance-icon-button" aria-label="ปิด">×</button></header><div className="finance-dialog-body ui-overlay-surface__body">{children}</div><div className="ui-overlay-surface__actions"><FinanceActionBar><button type="button" onClick={onClose} disabled={loading} className="finance-button finance-button--secondary ui-button ui-button--secondary">แก้ไข</button><button type="button" onClick={onConfirm} disabled={loading} className="finance-button finance-button--primary ui-button ui-button--primary">{loading ? 'กำลังดำเนินการ...' : confirmLabel}</button></FinanceActionBar></div></section></div>;
}

export function FinanceStatusBadge({ status }: FinanceStatusBadgeProps) {
  const normalized = String(status || '').toUpperCase();
  const successStatuses = ['APPROVED', 'COMPLETED', 'ACTIVE', 'SLIP_APPROVED', 'CREDIT_CONFIRMED', 'PAYMENT_VERIFIED'];
  const dangerStatuses = ['REJECTED', 'CANCELLED', 'DUPLICATE', 'FAILED', 'LOCKED', 'SUSPENDED'];
  const tone = successStatuses.includes(normalized) ? 'success' : dangerStatuses.includes(normalized) ? 'danger' : 'warning';
  const labels: Record<string, string> = {
    PENDING: 'รอตรวจสอบ',
    PENDING_SLIP_REVIEW: 'รอตรวจสลิป',
    SLIP_APPROVED: 'ตรวจสลิปแล้ว',
    PENDING_CREDIT: 'รอเพิ่มเครดิต',
    CREDIT_CONFIRMED: 'เพิ่มเครดิตแล้ว',
    PENDING_REVIEW: 'รอตรวจสอบ',
    APPROVED_FOR_PAYMENT: 'รอโอนเงิน',
    PAYMENT_PROOF_UPLOADED: 'รอตรวจหลักฐาน',
    PAYMENT_VERIFIED: 'ตรวจหลักฐานแล้ว',
    APPROVED: 'อนุมัติแล้ว',
    COMPLETED: 'สำเร็จ',
    REJECTED: 'ไม่อนุมัติ',
    CANCELLED: 'ยกเลิก',
    DUPLICATE: 'สลิปซ้ำ',
    ACTIVE: 'ใช้งานได้',
    REVIEWING: 'กำลังตรวจ',
  };
  return <span className={`finance-status finance-status--${tone}`}>{labels[normalized] ?? status}</span>;
}
