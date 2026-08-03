'use client';

import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';

import {
  canShowAdminWidgetInWorkspace,
  resolveAdminCompareRange,
  resolveAdminDateRange,
  type AdminComparePeriod,
  type AdminDateRange,
  type AdminDateRangePreset,
  type AdminWidgetDefinition,
  type AdminWidgetLayoutItem,
  type AdminWidgetRegistry,
  type AdminWidgetWorkspaceId,
} from './chart-widget-contracts';
import { useAdminWidgetLayout } from './use-admin-widget-layout';
import styles from './admin-widget-workspace.module.css';

const ADMIN_WORKSPACE_CHANGE_EVENT = 'admin:workspace-change';

type AdminWorkspaceChangeDetail = {
  selection?: unknown;
};

export type AdminWidgetWorkspaceLabels = {
  dateRange: string;
  compare: string;
  editLayout: string;
  finishEditing: string;
  restoreDefault: string;
  customStart: string;
  customEnd: string;
  invalidRange: string;
  hiddenWidgets: string;
  showWidget: string;
  hideWidget: string;
  pinWidget: string;
  unpinWidget: string;
  moveEarlier: string;
  moveLater: string;
  makeNarrower: string;
  makeWider: string;
  makeShorter: string;
  makeTaller: string;
  presets: Record<AdminDateRangePreset, string>;
  comparePeriods: Record<AdminComparePeriod, string>;
};

export type AdminWidgetRenderContext = {
  definition: AdminWidgetDefinition;
  layout: AdminWidgetLayoutItem;
  dateRange: AdminDateRange;
  compareRange: AdminDateRange | null;
  comparePeriod: AdminComparePeriod;
  setPinned: (pinned: boolean) => void;
};

export type AdminWidgetWorkspaceProps = {
  registry: AdminWidgetRegistry;
  adminUserId: string;
  permissions: readonly string[];
  labels: AdminWidgetWorkspaceLabels;
  initialPreset?: AdminDateRangePreset;
  initialCompare?: AdminComparePeriod;
  renderWidget: (context: AdminWidgetRenderContext) => ReactNode;
};

export function AdminWidgetWorkspace({
  registry,
  adminUserId,
  permissions,
  labels,
  initialPreset = '30d',
  initialCompare = 'previous-period',
  renderWidget,
}: AdminWidgetWorkspaceProps) {
  const layout = useAdminWidgetLayout(registry, adminUserId);
  const [preset, setPreset] = useState<AdminDateRangePreset>(initialPreset);
  const [comparePeriod, setComparePeriod] = useState<AdminComparePeriod>(initialCompare);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState('');
  const [workspace, setWorkspace] = useState<AdminWidgetWorkspaceId | 'all'>('all');

  useEffect(() => {
    const syncFromRoot = () => {
      setWorkspace(normalizeWorkspace(document.documentElement.dataset.adminWorkspace));
    };
    const handleWorkspaceChange = (event: Event) => {
      const detail = (event as CustomEvent<AdminWorkspaceChangeDetail>).detail;
      setWorkspace(normalizeWorkspace(detail?.selection));
    };

    syncFromRoot();
    window.addEventListener(ADMIN_WORKSPACE_CHANGE_EVENT, handleWorkspaceChange);
    return () => window.removeEventListener(ADMIN_WORKSPACE_CHANGE_EVENT, handleWorkspaceChange);
  }, []);

  const accessibleIds = useMemo(() => new Set(
    registry.visibleTo(permissions)
      .filter((definition) => canShowAdminWidgetInWorkspace(definition, workspace))
      .map((definition) => definition.id),
  ), [permissions, registry, workspace]);
  const accessibleItems = useMemo(() => layout.items.filter((item) => accessibleIds.has(item.widgetId)), [accessibleIds, layout.items]);
  const visibleItems = accessibleItems.filter((item) => !item.hidden);
  const hiddenItems = accessibleItems.filter((item) => item.hidden);

  const dateRangeResult = useMemo(() => {
    try {
      return {
        range: resolveAdminDateRange(preset, { customStart, customEnd }),
        error: false,
      };
    } catch {
      return { range: null, error: true };
    }
  }, [customEnd, customStart, preset]);

  const compareRange = useMemo(() => dateRangeResult.range
    ? resolveAdminCompareRange(dateRangeResult.range, comparePeriod)
    : null, [comparePeriod, dateRangeResult.range]);

  function dropBefore(event: DragEvent<HTMLElement>, targetWidgetId: string) {
    event.preventDefault();
    if (!draggingId || draggingId === targetWidgetId) return setDraggingId('');
    const targetIndex = layout.items.findIndex((item) => item.widgetId === targetWidgetId);
    layout.move(draggingId, targetIndex);
    setDraggingId('');
  }

  function moveWithinVisibleItems(widgetId: string, visibleIndex: number, offset: number) {
    const target = visibleItems[visibleIndex + offset];
    if (!target) return;
    const targetIndex = layout.items.findIndex((item) => item.widgetId === target.widgetId);
    if (targetIndex >= 0) layout.move(widgetId, targetIndex);
  }

  return <section
    className={styles.workspace}
    data-editing={editing || undefined}
    data-admin-widget-workspace={workspace}
    aria-busy={!layout.ready}
  >
    <div className={styles.controls}>
      <div className={styles.rangeControls}>
        <label>
          <span>{labels.dateRange}</span>
          <select value={preset} onChange={(event) => setPreset(event.target.value as AdminDateRangePreset)}>
            {(Object.keys(labels.presets) as AdminDateRangePreset[]).map((value) => <option key={value} value={value}>{labels.presets[value]}</option>)}
          </select>
        </label>
        <label>
          <span>{labels.compare}</span>
          <select value={comparePeriod} onChange={(event) => setComparePeriod(event.target.value as AdminComparePeriod)}>
            {(Object.keys(labels.comparePeriods) as AdminComparePeriod[]).map((value) => <option key={value} value={value}>{labels.comparePeriods[value]}</option>)}
          </select>
        </label>
        {preset === 'custom' ? <>
          <label><span>{labels.customStart}</span><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label><span>{labels.customEnd}</span><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
        </> : null}
      </div>

      <div className={styles.layoutActions}>
        {editing ? <button type="button" onClick={layout.restoreDefault}>{labels.restoreDefault}</button> : null}
        <button type="button" data-primary="true" onClick={() => setEditing((value) => !value)}>{editing ? labels.finishEditing : labels.editLayout}</button>
      </div>
    </div>

    {dateRangeResult.error ? <div className={styles.rangeError} role="alert">{labels.invalidRange}</div> : null}

    {dateRangeResult.range ? <div className={styles.grid}>
      {visibleItems.map((item, visibleIndex) => {
        const definition = registry.get(item.widgetId);
        if (!definition) return null;
        const style = {
          '--admin-widget-columns': item.columns,
          '--admin-widget-rows': item.rows,
        } as CSSProperties;
        return <article
          key={item.widgetId}
          className={styles.gridItem}
          style={style}
          draggable={editing && !item.pinned}
          data-pinned={item.pinned || undefined}
          data-dragging={draggingId === item.widgetId || undefined}
          onDragStart={() => setDraggingId(item.widgetId)}
          onDragEnd={() => setDraggingId('')}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => dropBefore(event, item.widgetId)}
        >
          {editing ? <WidgetEditToolbar
            item={item}
            index={visibleIndex}
            total={visibleItems.length}
            labels={labels}
            onMove={(offset) => moveWithinVisibleItems(item.widgetId, visibleIndex, offset)}
            onUpdate={(patch) => layout.update(item.widgetId, patch)}
          /> : null}
          {renderWidget({
            definition,
            layout: item,
            dateRange: dateRangeResult.range,
            compareRange,
            comparePeriod,
            setPinned: (pinned) => layout.update(item.widgetId, { pinned }),
          })}
        </article>;
      })}
    </div> : null}

    {editing && hiddenItems.length > 0 ? <section className={styles.hiddenPanel}>
      <strong>{labels.hiddenWidgets}</strong>
      <div>{hiddenItems.map((item) => {
        const definition = registry.get(item.widgetId);
        return definition ? <button key={item.widgetId} type="button" onClick={() => layout.update(item.widgetId, { hidden: false })}>{labels.showWidget}: {definition.title}</button> : null;
      })}</div>
    </section> : null}
  </section>;
}

function WidgetEditToolbar({
  item,
  index,
  total,
  labels,
  onMove,
  onUpdate,
}: {
  item: AdminWidgetLayoutItem;
  index: number;
  total: number;
  labels: AdminWidgetWorkspaceLabels;
  onMove: (offset: number) => void;
  onUpdate: (patch: Partial<Omit<AdminWidgetLayoutItem, 'widgetId'>>) => void;
}) {
  return <div className={styles.editToolbar} aria-label={item.widgetId}>
    <span className={styles.dragHandle} title={item.pinned ? labels.unpinWidget : labels.moveEarlier} aria-hidden="true">⋮⋮</span>
    <button type="button" disabled={index === 0 || item.pinned} aria-label={labels.moveEarlier} title={labels.moveEarlier} onClick={() => onMove(-1)}>←</button>
    <button type="button" disabled={index >= total - 1 || item.pinned} aria-label={labels.moveLater} title={labels.moveLater} onClick={() => onMove(1)}>→</button>
    <button type="button" disabled={item.columns <= 1} aria-label={labels.makeNarrower} title={labels.makeNarrower} onClick={() => onUpdate({ columns: Math.max(1, item.columns - 1) as AdminWidgetLayoutItem['columns'] })}>−W</button>
    <button type="button" disabled={item.columns >= 4} aria-label={labels.makeWider} title={labels.makeWider} onClick={() => onUpdate({ columns: Math.min(4, item.columns + 1) as AdminWidgetLayoutItem['columns'] })}>+W</button>
    <button type="button" disabled={item.rows <= 1} aria-label={labels.makeShorter} title={labels.makeShorter} onClick={() => onUpdate({ rows: Math.max(1, item.rows - 1) as AdminWidgetLayoutItem['rows'] })}>−H</button>
    <button type="button" disabled={item.rows >= 3} aria-label={labels.makeTaller} title={labels.makeTaller} onClick={() => onUpdate({ rows: Math.min(3, item.rows + 1) as AdminWidgetLayoutItem['rows'] })}>+H</button>
    <button type="button" aria-label={item.pinned ? labels.unpinWidget : labels.pinWidget} title={item.pinned ? labels.unpinWidget : labels.pinWidget} onClick={() => onUpdate({ pinned: !item.pinned })}>{item.pinned ? '◆' : '◇'}</button>
    <button type="button" aria-label={labels.hideWidget} title={labels.hideWidget} onClick={() => onUpdate({ hidden: true })}>×</button>
  </div>;
}

function normalizeWorkspace(value: unknown): AdminWidgetWorkspaceId | 'all' {
  return value === 'finance'
    || value === 'payments'
    || value === 'growth'
    || value === 'manager'
    || value === 'system'
    || value === 'all'
    ? value
    : 'all';
}
