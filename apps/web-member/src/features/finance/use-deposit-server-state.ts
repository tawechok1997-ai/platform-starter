'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReceivingAccount, TopUpItem } from '../../../app/types/member-finance';
import { financeQueryKeys } from './query-keys';

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

type DepositServerState = {
  accounts: ReceivingAccount[];
  history: TopUpItem[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  prependHistory: (item: TopUpItem) => void;
};

export function useDepositServerState(fetcher: Fetcher): DepositServerState {
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [history, setHistory] = useState<TopUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    const [historyRes, accountRes] = await Promise.all([
      fetcher(financeQueryKeys.topUpList().endpoint),
      fetcher(financeQueryKeys.receivingAccounts().endpoint),
    ]);
    const historyData = await historyRes.json().catch(() => null);
    const accountData = await accountRes.json().catch(() => null);
    if (historyRes.ok) setHistory(historyData?.items ?? []);
    if (accountRes.ok) setAccounts(accountData?.items ?? []);
    setError(!historyRes.ok || !accountRes.ok
      ? historyData?.message ?? accountData?.message ?? 'โหลดข้อมูลไม่สำเร็จ'
      : '');
    setLoading(false);
  }, [fetcher]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const prependHistory = useCallback((item: TopUpItem) => {
    setHistory((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
  }, []);

  return { accounts, history, loading, error, reload, prependHistory };
}
