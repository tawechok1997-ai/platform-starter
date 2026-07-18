'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminButton, AdminEmpty, AdminNotice } from './admin-ui';

export type AdminDataColumn<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  searchValue?: (row: T) => string;
  defaultVisible?: boolean;
  align?: 'left' | 'center' | 'right';
};

type SavedView = { name: string; visible: string[]; density: 'comfortable' | 'compact'; pageSize: number };

type Props<T> = {
  id: string;
  rows: T[];
  columns: AdminDataColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  emptyText?: string;
  searchPlaceholder?: string;
};

export function AdminDataTable<T>({ id, rows, columns, rowKey, loading = false, error = '', emptyText = 'ไม่พบข้อมูล', searchPlaceholder = 'ค้นหาในตาราง' }: Props<T>) {
  const storageKey = `admin_table_${id}`;
  const defaultVisible = columns.filter((column) => column.defaultVisible !== false).map((column) => column.key);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(columns.find((column) => column.sortValue)?.key ?? '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [visible, setVisible] = useState<string[]>(defaultVisible);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const value = JSON.parse(raw) as { visible?: string[]; density?: 'comfortable' | 'compact'; pageSize?: number; savedViews?: SavedView[] };
      if (Array.isArray(value.visible)) setVisible(value.visible);
      if (value.density) setDensity(value.density);
      if (Number.isFinite(value.pageSize)) setPageSize(Number(value.pageSize));
      if (Array.isArray(value.savedViews)) setSavedViews(value.savedViews);
    } catch {
      // Ignore broken local preferences and keep safe defaults.
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ visible, density, pageSize, savedViews }));
  }, [density, pageSize, savedViews, storageKey, visible]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('th');
    const result = normalized ? rows.filter((row) => columns.some((column) => (column.searchValue?.(row) ?? String(column.sortValue?.(row) ?? '')).toLocaleLowerCase('th').includes(normalized))) : [...rows];
    const column = columns.find((item) => item.key === sortKey && item.sortValue);
    if (column?.sortValue) result.sort((a, b) => compare(column.sortValue!(a), column.sortValue!(b)) * (sortDirection === 'asc' ? 1 : -1));
    return result;
  }, [columns, query, rows, sortDirection, sortKey]);

  const pageCount = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeColumns = columns.filter((column) => visible.includes(column.key));

  function toggleSort(key: string) {
    const column = columns.find((item) => item.key === key);
    if (!column?.sortValue) return;
    if (sortKey === key) setSortDirection((value) => value === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection('asc'); }
  }

  function saveView() {
    const name = window.prompt('ชื่อ Saved View');
    if (!name?.trim()) return;
    setSavedViews((views) => [...views.filter((view) => view.name !== name.trim()), { name: name.trim(), visible, density, pageSize }]);
  }

  function applyView(name: string) {
    const view = savedViews.find((item) => item.name === name);
    if (!view) return;
    setVisible(view.visible); setDensity(view.density); setPageSize(view.pageSize); setPage(1);
  }

  return <section className="admin-data-table" data-density={density}>
    <div className="admin-data-table__toolbar">
      <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
      <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="จำนวนรายการต่อหน้า"><option value={10}>10 / หน้า</option><option value={20}>20 / หน้า</option><option value={50}>50 / หน้า</option></select>
      <select value="" onChange={(event) => applyView(event.target.value)} aria-label="Saved Views"><option value="">Saved Views</option>{savedViews.map((view) => <option key={view.name} value={view.name}>{view.name}</option>)}</select>
      <AdminButton tone="secondary" onClick={() => setDensity((value) => value === 'compact' ? 'comfortable' : 'compact')}>{density === 'compact' ? 'Comfortable' : 'Compact'}</AdminButton>
      <AdminButton tone="secondary" onClick={saveView}>บันทึก View</AdminButton>
    </div>
    <details className="admin-data-table__columns"><summary>คอลัมน์ที่แสดง</summary><div>{columns.map((column) => <label key={column.key}><input type="checkbox" checked={visible.includes(column.key)} onChange={() => setVisible((current) => current.includes(column.key) ? current.filter((key) => key !== column.key) : [...current, column.key])} />{column.title}</label>)}</div></details>
    {error && <AdminNotice tone="danger">{error}</AdminNotice>}
    <div className="admin-data-table__scroll"><table><thead><tr>{activeColumns.map((column) => <th key={column.key} data-align={column.align ?? 'left'}><button type="button" disabled={!column.sortValue} onClick={() => toggleSort(column.key)}>{column.title}{sortKey === column.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>)}</tr></thead><tbody>{paged.map((row) => <tr key={rowKey(row)}>{activeColumns.map((column) => <td key={column.key} data-align={column.align ?? 'left'}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>
    {loading && <AdminNotice>กำลังโหลดข้อมูล...</AdminNotice>}
    {!loading && paged.length === 0 && <AdminEmpty>{emptyText}</AdminEmpty>}
    <footer className="admin-data-table__footer"><span>{filtered.length.toLocaleString('th-TH')} รายการ · หน้า {currentPage}/{pageCount}</span><div><AdminButton disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton><AdminButton disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton></div></footer>
  </section>;
}

function compare(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'th', { numeric: true, sensitivity: 'base' });
}
