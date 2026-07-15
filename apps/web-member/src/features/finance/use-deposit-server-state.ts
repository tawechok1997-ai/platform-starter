'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReceivingAccount, TopUpItem } from '../../../app/types/member-finance';

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

const TOP_UP_HISTORY_ENDPOINT = '/member/topups';
const RECEIVING_ACCOUNTS_ENDPOINT = '/member/receiving-bank-accounts';

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
      fetcher(TOP_UP_HISTORY_ENDPOINT),
      fetcher(RECEIVING_ACCOUNTS_ENDPOINT),
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
