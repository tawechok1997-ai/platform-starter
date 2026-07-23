'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AdminBadge, AdminNotice } from './admin-ui';

export type AdminSaveState = 'saved' | 'dirty' | 'saving';

type UnsavedChangesOptions<T> = {
  value: T;
  savedValue: T;
  saving?: boolean;
  enabled?: boolean;
  warningMessage?: string;
};

const DEFAULT_WARNING = 'มีการแก้ไขที่ยังไม่ได้บันทึก หากออกจากหน้านี้การเปลี่ยนแปลงจะหายไป';

export function useAdminUnsavedChanges<T>({
  value,
  savedValue,
  saving = false,
  enabled = true,
  warningMessage = DEFAULT_WARNING,
}: UnsavedChangesOptions<T>) {
  const allowNavigationRef = useRef(false);
  const currentSnapshot = useMemo(() => stableSerialize(value), [value]);
  const savedSnapshot = useMemo(() => stableSerialize(savedValue), [savedValue]);
  const isDirty = enabled && currentSnapshot !== savedSnapshot;
  const saveState: AdminSaveState = saving ? 'saving' : isDirty ? 'dirty' : 'saved';

  useEffect(() => {
    if (isDirty) return;
    allowNavigationRef.current = false;
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    let resetTimer = 0;
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.href === window.location.href) return;
      if (!window.confirm(warningMessage)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
      allowNavigationRef.current = true;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => { allowNavigationRef.current = false; }, 1500);
    };
    document.addEventListener('click', onDocumentClick, true);
    return () => {
      window.clearTimeout(resetTimer);
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, [isDirty, warningMessage]);

  return { isDirty, saveState };
}

export function AdminSaveStateBadge({ state, locale = 'th' }: { state: AdminSaveState; locale?: 'th' | 'en' }) {
  const labels = locale === 'th'
    ? { saved: 'บันทึกแล้ว', dirty: 'ยังไม่บันทึก', saving: 'กำลังบันทึก' }
    : { saved: 'Saved', dirty: 'Unsaved', saving: 'Saving' };
  return <AdminBadge tone={state === 'saved' ? 'success' : state === 'dirty' ? 'warning' : 'neutral'}>{labels[state]}</AdminBadge>;
}

export function AdminUnsavedChangesNotice({
  isDirty,
  children,
}: {
  isDirty: boolean;
  children?: ReactNode;
}) {
  if (!isDirty) return null;
  return <AdminNotice tone="warning">{children ?? 'มีการแก้ไขที่ยังไม่ได้บันทึก กดบันทึกก่อนออกจากหน้านี้'}</AdminNotice>;
}

function stableSerialize(value: unknown) {
  try {
    return JSON.stringify(value, (_key, entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
      return Object.keys(entry as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
        result[key] = (entry as Record<string, unknown>)[key];
        return result;
      }, {});
    });
  } catch {
    return String(value);
  }
}
