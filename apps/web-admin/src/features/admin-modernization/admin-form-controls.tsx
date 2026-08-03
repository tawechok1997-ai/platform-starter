'use client';

import { useEffect, useId, type ReactNode } from 'react';

import type { AdminFieldError, AdminValueDiff } from './form-state';
import styles from './admin-form-controls.module.css';

export type AdminFormFieldProps = {
  label: string;
  children: ReactNode;
  description?: string;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
};

export function AdminFormField({ label, children, description, error, required = false, htmlFor }: AdminFormFieldProps) {
  const generatedDescriptionId = useId();
  const generatedErrorId = useId();
  const descriptionId = description ? generatedDescriptionId : undefined;
  const errorId = error ? generatedErrorId : undefined;

  return <div className={styles.field} data-invalid={Boolean(error)}>
    <label className={styles.label} htmlFor={htmlFor}>
      <span>{label}</span>
      {required ? <small aria-hidden="true">*</small> : null}
    </label>
    <div className={styles.control} aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}>
      {children}
    </div>
    {description ? <p id={descriptionId} className={styles.description}>{description}</p> : null}
    {error ? <p id={errorId} className={styles.error} role="alert">{error}</p> : null}
  </div>;
}

export function AdminFieldErrorSummary({ errors, title }: { errors: readonly AdminFieldError[]; title: string }) {
  if (errors.length === 0) return null;
  return <section className={styles.errorSummary} role="alert" aria-live="assertive">
    <strong>{title}</strong>
    <ul>{errors.map((error, index) => <li key={`${error.field}-${index}`}><a href={`#${encodeURIComponent(error.field)}`}>{error.message}</a></li>)}</ul>
  </section>;
}

export function AdminSaveBar({
  dirty,
  saving = false,
  saveLabel,
  savingLabel,
  discardLabel,
  status,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving?: boolean;
  saveLabel: string;
  savingLabel: string;
  discardLabel: string;
  status?: ReactNode;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!dirty && !saving && !status) return null;
  return <div className={styles.saveBar} role="region" aria-label={saveLabel} data-dirty={dirty}>
    <div className={styles.saveStatus}>{status}</div>
    <div className={styles.saveActions}>
      <button type="button" className={styles.secondaryButton} disabled={saving || !dirty} onClick={onDiscard}>{discardLabel}</button>
      <button type="button" className={styles.primaryButton} disabled={saving || !dirty} onClick={onSave}>{saving ? savingLabel : saveLabel}</button>
    </div>
  </div>;
}

export function AdminDiffList({ diffs, emptyLabel }: { diffs: readonly AdminValueDiff[]; emptyLabel: string }) {
  if (diffs.length === 0) return <p className={styles.diffEmpty}>{emptyLabel}</p>;
  return <dl className={styles.diffList}>
    {diffs.map((diff) => <div key={diff.path} className={styles.diffRow}>
      <dt>{diff.path}</dt>
      <dd><span>{formatDiffValue(diff.before)}</span><span aria-hidden="true">→</span><strong>{formatDiffValue(diff.after)}</strong></dd>
    </div>)}
  </dl>;
}

export function useAdminUnsavedChangesGuard(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty, message]);
}

function formatDiffValue(value: unknown) {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'string') return value || '""';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
