'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AdminTableQueryState, AdminTableSort } from './data-query-state';
import {
  buildAdminDataViewStorageKey,
  emptyEnvelope,
  normalizeColumnPreferences,
  parseAdminDataViewEnvelope,
  removeAdminSavedView,
  serializeAdminDataViewEnvelope,
  upsertAdminSavedView,
  visibleColumnIds,
  type AdminDataViewEnvelope,
  type AdminSavedView,
} from './data-view-preferences';
import styles from './data-table-view-controls.module.css';

export type AdminDataTableViewColumn = {
  id: string;
  label: ReactNode;
  required?: boolean;
};

export type AdminDataTableViewControlsProps = {
  ariaLabel: string;
  columns: readonly AdminDataTableViewColumn[];
  query: AdminTableQueryState;
  visibleColumns: readonly string[];
  userId?: string;
  workspaceId?: string;
  disabled?: boolean;
  onVisibleColumnsChange: (columnIds: readonly string[]) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sort: AdminTableSort | null) => void;
};

export function AdminDataTableViewControls({
  ariaLabel,
  columns,
  query,
  visibleColumns,
  userId = 'browser',
  workspaceId,
  disabled = false,
  onVisibleColumnsChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: AdminDataTableViewControlsProps) {
  const [envelope, setEnvelope] = useState<AdminDataViewEnvelope>(() => emptyEnvelope());
  const [viewName, setViewName] = useState('');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('');
  const locale = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'th';
  const copy = locale === 'en' ? EN_COPY : TH_COPY;
  const availableColumnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const requiredColumnIds = useMemo(() => columns.filter((column) => column.required).map((column) => column.id), [columns]);
  const normalizedVisible = useMemo(() => visibleColumnIds(normalizeColumnPreferences(
    availableColumnIds,
    availableColumnIds.map((columnId, order) => ({ columnId, visible: visibleColumns.includes(columnId), order })),
    requiredColumnIds,
  )), [availableColumnIds, requiredColumnIds, visibleColumns]);
  const storageKey = useMemo(() => buildAdminDataViewStorageKey(userId, workspaceId ?? slugify(ariaLabel)), [ariaLabel, userId, workspaceId]);
  const activeView = envelope.views.find((view) => view.id === envelope.activeViewId) ?? null;

  useEffect(() => {
    try {
      const parsed = parseAdminDataViewEnvelope(window.localStorage.getItem(storageKey));
      setEnvelope(parsed);
      const active = parsed.views.find((view) => view.id === parsed.activeViewId);
      if (active) applyView(active);
    } catch {
      setEnvelope(emptyEnvelope());
      setStatus(copy.storageUnavailable);
    } finally {
      setReady(true);
    }
    // Loading must happen once per storage scope; callbacks intentionally use the current table contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, serializeAdminDataViewEnvelope(envelope));
    } catch {
      setStatus(copy.storageUnavailable);
    }
  }, [copy.storageUnavailable, envelope, ready, storageKey]);

  function applyView(view: AdminSavedView) {
    const nextVisible = visibleColumnIds(normalizeColumnPreferences(availableColumnIds, view.columns, requiredColumnIds));
    onVisibleColumnsChange(nextVisible);
    if (onPageSizeChange && view.query.pageSize !== query.pageSize) onPageSizeChange(view.query.pageSize);
    if (onSortChange && !sameSort(view.query.sort, query.sort)) onSortChange(view.query.sort);
    if (view.query.page !== query.page) onPageChange(view.query.page);
    setStatus(copy.applied(view.name));
  }

  function chooseView(viewId: string) {
    if (!viewId) {
      setEnvelope({ ...envelope, activeViewId: null });
      setStatus(copy.defaultView);
      return;
    }
    const selected = envelope.views.find((view) => view.id === viewId);
    if (!selected) return;
    setEnvelope({ ...envelope, activeViewId: selected.id });
    setViewName(selected.name);
    applyView(selected);
  }

  function saveView() {
    const name = viewName.trim();
    if (!name) {
      setStatus(copy.nameRequired);
      return;
    }
    const id = activeView?.id ?? createViewId();
    const preferences = normalizeColumnPreferences(
      availableColumnIds,
      availableColumnIds.map((columnId, order) => ({ columnId, visible: normalizedVisible.includes(columnId), order })),
      requiredColumnIds,
    );
    const next = upsertAdminSavedView(envelope, {
      id,
      name,
      query,
      columns: preferences,
      updatedAt: new Date().toISOString(),
    });
    setEnvelope(next);
    setStatus(copy.saved(name));
  }

  function deleteView() {
    if (!activeView) return;
    const name = activeView.name;
    setEnvelope(removeAdminSavedView(envelope, activeView.id));
    setViewName('');
    setStatus(copy.deleted(name));
  }

  function toggleColumn(columnId: string, checked: boolean) {
    if (requiredColumnIds.includes(columnId)) return;
    const next = checked
      ? [...new Set([...normalizedVisible, columnId])]
      : normalizedVisible.filter((id) => id !== columnId);
    const firstColumn = availableColumnIds[0];
    const fallback = requiredColumnIds.length > 0
      ? requiredColumnIds
      : firstColumn
        ? [firstColumn]
        : [];
    onVisibleColumnsChange(next.length > 0 ? next : fallback);
    setStatus(copy.columnsUpdated);
  }

  if (columns.length < 2) return null;

  return <div className={styles.toolbar} aria-label={`${ariaLabel} ${copy.views}`}>
    <label className={styles.field}>
      <span>{copy.views}</span>
      <select value={envelope.activeViewId ?? ''} disabled={disabled || !ready} onChange={(event) => chooseView(event.target.value)}>
        <option value="">{copy.defaultView}</option>
        {envelope.views.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
      </select>
    </label>

    <label className={styles.field}>
      <span>{copy.viewName}</span>
      <input value={viewName} maxLength={120} disabled={disabled || !ready} placeholder={copy.viewPlaceholder} onChange={(event) => setViewName(event.target.value)} />
    </label>

    <div className={styles.actions}>
      <button type="button" className={styles.button} disabled={disabled || !ready} onClick={saveView}>{activeView ? copy.update : copy.save}</button>
      <button type="button" className={styles.button} disabled={disabled || !activeView} onClick={deleteView}>{copy.delete}</button>
    </div>

    <details className={styles.columns}>
      <summary>{copy.columns}</summary>
      <div className={styles.columnMenu}>
        {columns.map((column) => <label key={column.id}>
          <input
            type="checkbox"
            checked={normalizedVisible.includes(column.id)}
            disabled={disabled || column.required}
            onChange={(event) => toggleColumn(column.id, event.target.checked)}
          />
          <span>{stringifyLabel(column.label)}</span>
        </label>)}
      </div>
    </details>

    <span className={styles.status} role="status" aria-live="polite">{status}</span>
  </div>;
}

const TH_COPY = {
  views: 'มุมมองที่บันทึก',
  defaultView: 'ค่าเริ่มต้น',
  viewName: 'ชื่อมุมมอง',
  viewPlaceholder: 'เช่น งานตรวจวันนี้',
  save: 'บันทึก',
  update: 'อัปเดต',
  delete: 'ลบ',
  columns: 'คอลัมน์',
  nameRequired: 'ระบุชื่อมุมมองก่อนบันทึก',
  columnsUpdated: 'อัปเดตคอลัมน์แล้ว',
  storageUnavailable: 'อุปกรณ์นี้ไม่อนุญาตให้บันทึกมุมมอง',
  applied: (name: string) => `ใช้มุมมอง ${name} แล้ว`,
  saved: (name: string) => `บันทึกมุมมอง ${name} แล้ว`,
  deleted: (name: string) => `ลบมุมมอง ${name} แล้ว`,
};

const EN_COPY = {
  views: 'Saved views',
  defaultView: 'Default view',
  viewName: 'View name',
  viewPlaceholder: 'For example Today review',
  save: 'Save',
  update: 'Update',
  delete: 'Delete',
  columns: 'Columns',
  nameRequired: 'Enter a view name before saving.',
  columnsUpdated: 'Columns updated.',
  storageUnavailable: 'This device does not allow saved views.',
  applied: (name: string) => `Applied ${name}.`,
  saved: (name: string) => `Saved ${name}.`,
  deleted: (name: string) => `Deleted ${name}.`,
};

function sameSort(left: AdminTableSort | null, right: AdminTableSort | null) {
  return left?.columnId === right?.columnId && left?.direction === right?.direction;
}

function stringifyLabel(label: ReactNode) {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : 'Column';
}

function createViewId() {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'table';
}
