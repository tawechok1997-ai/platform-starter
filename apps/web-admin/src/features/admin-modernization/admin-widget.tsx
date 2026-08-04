'use client';

import { useEffect, useState, type ReactNode } from 'react';

import type { AdminWidgetDataState, AdminWidgetExportFormat } from './chart-widget-contracts';
import styles from './admin-widget.module.css';

export type AdminWidgetLabels = {
  loading: string;
  empty: string;
  error: string;
  partial: string;
  retry: string;
  pin: string;
  unpin: string;
  fullscreen: string;
  exitFullscreen: string;
  drillDown: string;
  exportCsv: string;
  exportPng: string;
};

export type AdminWidgetProps = {
  widgetId: string;
  title: string;
  description?: string | undefined;
  state?: AdminWidgetDataState | undefined;
  labels: AdminWidgetLabels;
  pinned?: boolean | undefined;
  emptyMessage?: string | undefined;
  errorMessage?: string | undefined;
  partialMessage?: string | undefined;
  exportFormats?: readonly AdminWidgetExportFormat[] | undefined;
  allowFullscreen?: boolean | undefined;
  allowDrillDown?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  onPinnedChange?: ((pinned: boolean) => void) | undefined;
  onDrillDown?: (() => void) | undefined;
  onExport?: ((format: AdminWidgetExportFormat) => void) | undefined;
  actions?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  children: ReactNode;
};

export function AdminWidget({
  widgetId,
  title,
  description,
  state = 'ready',
  labels,
  pinned = false,
  emptyMessage,
  errorMessage,
  partialMessage,
  exportFormats = [],
  allowFullscreen = false,
  allowDrillDown = false,
  onRetry,
  onPinnedChange,
  onDrillDown,
  onExport,
  actions,
  footer,
  children,
}: AdminWidgetProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const hasToolbar = Boolean(
    actions ||
    onPinnedChange ||
    allowFullscreen ||
    (allowDrillDown && onDrillDown) ||
    (onExport && exportFormats.length > 0),
  );

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [fullscreen]);

  return <article
    className={styles.widget}
    data-widget-id={widgetId}
    data-state={state}
    data-fullscreen={fullscreen || undefined}
    aria-busy={state === 'loading'}
  >
    <header className={styles.header}>
      <div className={styles.heading}>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>

      {hasToolbar ? <div className={styles.toolbar} aria-label={title}>
        {actions}
        {onPinnedChange ? <ToolbarButton
          label={pinned ? labels.unpin : labels.pin}
          pressed={pinned}
          onClick={() => onPinnedChange(!pinned)}
        ><PinIcon /></ToolbarButton> : null}
        {allowDrillDown && onDrillDown ? <ToolbarButton label={labels.drillDown} onClick={onDrillDown}><DrillDownIcon /></ToolbarButton> : null}
        {onExport && exportFormats.includes('csv') ? <ToolbarButton label={labels.exportCsv} onClick={() => onExport('csv')}><CsvIcon /></ToolbarButton> : null}
        {onExport && exportFormats.includes('png') ? <ToolbarButton label={labels.exportPng} onClick={() => onExport('png')}><ImageIcon /></ToolbarButton> : null}
        {allowFullscreen ? <ToolbarButton
          label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
          pressed={fullscreen}
          onClick={() => setFullscreen((value) => !value)}
        >{fullscreen ? <MinimizeIcon /> : <MaximizeIcon />}</ToolbarButton> : null}
      </div> : null}
    </header>

    {state === 'partial' ? <div className={styles.partial} role="status">{partialMessage ?? labels.partial}</div> : null}

    <div className={styles.body}>
      {state === 'loading' ? <WidgetLoading label={labels.loading} /> : null}
      {state === 'empty' ? <WidgetState title={emptyMessage ?? labels.empty} /> : null}
      {state === 'error' ? <WidgetState title={errorMessage ?? labels.error} action={onRetry ? <button type="button" onClick={onRetry}>{labels.retry}</button> : null} /> : null}
      {state === 'ready' || state === 'partial' ? children : null}
    </div>

    {footer && (state === 'ready' || state === 'partial') ? <footer className={styles.footer}>{footer}</footer> : null}
  </article>;
}

function ToolbarButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean | undefined;
  onClick: () => void;
  children: ReactNode;
}) {
  return <button
    type="button"
    className={styles.toolButton}
    aria-label={label}
    title={label}
    aria-pressed={pressed}
    onClick={onClick}
  >{children}</button>;
}

function WidgetLoading({ label }: { label: string }) {
  return <div className={styles.loading} role="status" aria-label={label}>
    <span />
    <span />
    <span />
    <span />
  </div>;
}

function WidgetState({ title, action }: { title: string; action?: ReactNode | undefined }) {
  return <div className={styles.state} role="status">
    <StateIcon />
    <strong>{title}</strong>
    {action}
  </div>;
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 8 0-1 5 3 3v2h-5v6l-1 1-1-1v-6H6v-2l3-3-1-5Z" /></svg>;
}

function DrillDownIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h6v6H5V5Zm8 8h6v6h-6v-6Zm-2-5h4a2 2 0 0 1 2 2v3M8 11v4a2 2 0 0 0 2 2h3" /></svg>;
}

function CsvIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Zm8 0v5h5M9 12h6M9 16h6" /></svg>;
}

function ImageIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5Zm3 11 3-3 2 2 2-2 3 3M9 9h.01" /></svg>;
}

function MaximizeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" /></svg>;
}

function MinimizeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" /></svg>;
}

function StateIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5Zm4 9 2-2 2 2 4-4" /></svg>;
}
