'use client';

import type { ReactNode } from 'react';
import { AdminButton, AdminCard, AdminEmpty, AdminMetricGrid, AdminSkeleton, AdminStack, AdminToolbar } from './admin-ui';

type QueueStatusOption = { value: string; label: string };

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
  return <AdminToolbar>
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
  </AdminToolbar>;
}

export function AdminFinanceQueueFrame({ className, metrics, toolbar, notice, loading, empty, emptyLabel, children }: AdminFinanceQueueFrameProps) {
  return <div className={className}>
    <AdminMetricGrid>{metrics}</AdminMetricGrid>
    {toolbar}
    {notice}
    {loading ? <AdminCard><AdminSkeleton lines={5} /></AdminCard> : empty ? <AdminEmpty>{emptyLabel}</AdminEmpty> : <AdminStack>{children}</AdminStack>}
  </div>;
}

export function AdminFinanceEvidence({ src, alt }: { src?: string | null | undefined; alt: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className="admin-topup-modal-slip" />;
}
