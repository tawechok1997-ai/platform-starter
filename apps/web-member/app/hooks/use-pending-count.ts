'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestJson } from '../member-api';

type MoneyRequest = { status?: string };
type ListPayload = { items?: MoneyRequest[] };

export function usePendingCount(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) { setPendingCount(0); return; }
    setLoading(true);
    try {
      const [topups, withdrawals] = await Promise.all([
        requestJson<ListPayload>('/member/topups'),
        requestJson<ListPayload>('/member/withdrawals'),
      ]);
      const items = [...(topups.items ?? []), ...(withdrawals.items ?? [])];
      setPendingCount(items.filter((item) => item.status === 'PENDING').length);
    } catch {
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { void reload(); }, [reload]);

  return { pendingCount, loading, reload };
}
