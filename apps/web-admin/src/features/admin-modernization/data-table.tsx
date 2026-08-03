'use client';

import type { CSSProperties, Key, KeyboardEvent, ReactNode } from 'react';

import { clampPage, getPageCount, getPaginationTokens, getVisibleItemRange } from './pagination';
import styles from './data-table.module.css';

export type AdminDataColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  mobileLabel?: ReactNode;
  align?: 'start' | 'center' | 'end';
  priority?: 'primary' | 'secondary' | 'tertiary';
  width?: string;
};

export type AdminDataTableLabels = {
  loading: string;
  empty: string;
  previousPage: string;
  nextPage: string;
  page: (page: number) => string;
  rowsPerPage: string;
  range: (from: number, to: number, total: number) => string;
};

const DEFAULT_ADMIN_DATA_TABLE_LABELS: AdminDataTableLabels = {
  loading: 'Loading data',
  empty: 'No data',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: (page) => `Page ${page}`,
  rowsPerPage: 'Rows per page',
  range: (from, to, total) => `${from}–${to} of ${total}`,
};

export type AdminDataTableProps<T> = {
  ariaLabel: string;
  columns: readonly AdminDataColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => Key;
  labels?: AdminDataTableLabels;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: T) => void;
  caption?: ReactNode;
};

export function AdminDataTable<T>({
  ariaLabel,
  columns,
  rows,
  rowKey,
  labels = DEFAULT_ADMIN_DATA_TABLE_LABELS,
  loading = false,
  loadingRows = 5,
  emptyTitle,
  emptyDescription,
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
  onRowClick,
  caption,
}: AdminDataTableProps<T>) {
  const pageCount = getPageCount(totalItems, pageSize);
  const currentPage = clampPage(page, pageCount);
  const tokens = getPaginationTokens({ page: currentPage, pageSize, totalItems });
  const range = getVisibleItemRange(currentPage, pageSize, totalItems);
  const clickable = typeof onRowClick === 'function';

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!clickable || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onRowClick?.(row);
  }

  return <section className={styles.surface} aria-busy={loading}>
    <div className={styles.desktopScroller}>
      <table className={styles.table} aria-label={ariaLabel}>
        {caption && <caption>{caption}</caption>}
        <colgroup>
          {columns.map((column) => <col key={column.id} style={column.width ? { width: column.width } : undefined} />)}
        </colgroup>
        <thead>
          <tr>{columns.map((column) => <th key={column.id} scope="col" data-align={column.align ?? 'start'} data-priority={column.priority ?? 'secondary'}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? Array.from({ length: Math.max(1, loadingRows) }, (_, rowIndex) => <tr key={`loading-${rowIndex}`} className={styles.loadingRow}>
            {columns.map((column) => <td key={column.id}><span className={styles.skeleton} /></td>)}
          </tr>) : rows.map((row) => <tr
            key={rowKey(row)}
            className={clickable ? styles.clickableRow : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onRowClick?.(row) : undefined}
            onKeyDown={clickable ? (event) => handleRowKeyDown(event, row) : undefined}
          >
            {columns.map((column) => <td key={column.id} data-align={column.align ?? 'start'} data-priority={column.priority ?? 'secondary'}>{column.cell(row)}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>

    <ul className={styles.mobileList} aria-label={ariaLabel}>
      {loading ? Array.from({ length: Math.max(1, Math.min(loadingRows, 5)) }, (_, index) => <li key={`mobile-loading-${index}`} className={styles.mobileSkeleton}><span /><span /><span /></li>) : rows.map((row) => {
        const content = columns.map((column) => <span key={column.id} className={styles.mobileField} data-priority={column.priority ?? 'secondary'} data-align={column.align ?? 'start'}>
          <small>{column.mobileLabel ?? column.header}</small>
          <strong>{column.cell(row)}</strong>
        </span>);
        return <li key={rowKey(row)}>
          {clickable ? <button type="button" className={styles.mobileRow} onClick={() => onRowClick?.(row)}>{content}</button> : <div className={styles.mobileRow}>{content}</div>}
        </li>;
      })}
    </ul>

    {!loading && rows.length === 0 && <div className={styles.empty} role="status">
      <strong>{emptyTitle ?? labels.empty}</strong>
      {emptyDescription && <p>{emptyDescription}</p>}
    </div>}

    {totalItems > 0 && <footer className={styles.footer}>
      <span className={styles.range}>{labels.range(range.from, range.to, totalItems)}</span>
      <div className={styles.pagination} aria-label={ariaLabel}>
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={loading || currentPage <= 1} aria-label={labels.previousPage}>‹</button>
        <div className={styles.pages}>
          {tokens.map((token) => typeof token === 'number' ? <button
            key={token}
            type="button"
            onClick={() => onPageChange(token)}
            disabled={loading}
            aria-current={token === currentPage ? 'page' : undefined}
            aria-label={labels.page(token)}
          >{token}</button> : <span key={token} aria-hidden="true">…</span>)}
        </div>
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={loading || currentPage >= pageCount} aria-label={labels.nextPage}>›</button>
      </div>
      {onPageSizeChange && <label className={styles.pageSize}>
        <span>{labels.rowsPerPage}</span>
        <select value={pageSize} disabled={loading} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </label>}
    </footer>}
  </section>;
}

export function columnWidth(width: string): CSSProperties {
  return { width };
}
