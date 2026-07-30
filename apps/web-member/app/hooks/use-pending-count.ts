'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestJson } from '../member-api';

type MoneyRequest = { status?: string };
type ListPayload = { items?: MoneyRequest[] };

export function usePendingCount(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0);
  const pendingCountRef = useRef(0);
  const loadingRef = useRef(false);

  const commitPendingCount = useCallback((nextCount: number) => {
    if (pendingCountRef.current === nextCount) return;
    pendingCountRef.current = nextCount;
    setPendingCount(nextCount);
  }, []);

  const reload = useCallback(async () => {
    if (!enabled) {
      commitPendingCount(0);
      return;
    }
    if (loadingRef.current) return;

    loadingRef.current = true;
    try {
      const [topups, withdrawals] = await Promise.all([
        requestJson<ListPayload>('/member/topups'),
        requestJson<ListPayload>('/member/withdrawals'),
      ]);
      const items = [...(topups.items ?? []), ...(withdrawals.items ?? [])];
      commitPendingCount(items.filter((item) => item.status === 'PENDING').length);
    } catch {
      // Keep the last known count during transient failures instead of flashing zero.
    } finally {
      loadingRef.current = false;
    }
  }, [commitPendingCount, enabled]);

  useEffect(() => { void reload(); }, [reload]);

  return { pendingCount, loading: loadingRef.current, reload };
}
