'use client';

import { useRef, useState, type ReactNode } from 'react';
import { AdminDrawer } from './admin-drawer';
import { AdminButton, AdminCard, AdminEmpty, AdminMetricGrid, AdminSkeleton, AdminStack, AdminToolbar } from './admin-ui';
import styles from './admin-finance-queue.module.css';

type QueueStatusOption = { value: string; label: string };

export type AdminFinanceQueueLoadResult = 'loaded' | 'failed' | 'stale';
export type AdminFinanceQueueLoadOptions = { announce?: boolean; notifyFailure?: boolean };

type AdminFinanceQueueToolbarProps = {
  label: string;
  ariaLabel: string;
  value: string;
  options: readonly QueueStatusOption[];
  disabled?: boolean;
  page: number;
  pageCount: number;
  pageLabel: string;
  previousLabel: string;
  nextLabel: string;
  onValueChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

type AdminFinanceQueueFrameProps = {
  className?: string;
  metrics: ReactNode;
  toolbar: ReactNode;
  notice?: ReactNode;
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  children: ReactNode;
};

type AdminFinanceEvidenceProps = {
  src?: string | null | undefined;
  alt: string;
  openLabel: string;
  description: string;
  closeLabel: string;
};

export function useAdminFinanceQueueRequestGate() {
  const sequenceRef = useRef(0);

  return {
    begin() {
      sequenceRef.current += 1;
      return sequenceRef.current;
    },
    isCurrent(requestId: number) {
      return sequenceRef.current === requestId;
    },
  };
}

export function AdminFinanceQueueToolbar({
  label,
  ariaLabel,
  value,
  options,
  disabled = false,
  page,
  pageCount,
  pageLabel,
  previousLabel,
  nextLabel,
  onValueChange,
  onPrevious,
  onNext,
}: AdminFinanceQueueToolbarProps) {
  const safePageCount = Math.max(pageCount, 1);
  return <div className={styles.toolbar}>
    <AdminToolbar>
      <label className="admin-queue-filter">
        <span>{label}</span>
        <select aria-label={ariaLabel} value={value} disabled={disabled} onChange={(event) => onValueChange(event.target.value)}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <div className="admin-queue-pager">
        <AdminButton size="compact" tone="ghost" disabled={disabled || page <= 1} onClick={onPrevious}>{previousLabel}</AdminButton>
        <span aria-live="polite">{pageLabel} {Math.min(page, safePageCount)} / {safePageCount}</span>
        <AdminButton size="compact" tone="ghost" disabled={disabled || page >= safePageCount} onClick={onNext}>{nextLabel}</AdminButton>
      </div>
    </AdminToolbar>
  </div>;
}

export function AdminFinanceQueueFrame({ className, metrics, toolbar, notice, loading, empty, emptyLabel, children }: AdminFinanceQueueFrameProps) {
  return <div className={[styles.frame, className].filter(Boolean).join(' ')} aria-busy={loading}>
    <AdminMetricGrid>{metrics}</AdminMetricGrid>
    {toolbar}
    {notice}
    {loading ? <AdminCard><AdminSkeleton lines={5} /></AdminCard> : empty ? <AdminEmpty>{emptyLabel}</AdminEmpty> : <AdminStack>{children}</AdminStack>}
  </div>;
}

export function AdminFinanceEvidence({ src, alt, openLabel, description, closeLabel }: AdminFinanceEvidenceProps) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return <>
    <button type="button" className={`${styles.evidenceTrigger} admin-finance-evidence-trigger`} aria-label={`${openLabel} ${alt}`} onClick={() => setOpen(true)}>
      <img src={src} alt={alt} className="admin-topup-modal-slip" />
    </button>
    <AdminDrawer open={open} title={alt} description={description} closeLabel={closeLabel} onClose={() => setOpen(false)}>
      <div className={styles.evidenceCanvas}>
        <img src={src} alt={alt} className={styles.evidenceImage} />
      </div>
    </AdminDrawer>
  </>;
}
