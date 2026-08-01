'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileMemberHistoryPage from '../../../components/mobile-home/mobile-member-history-page';
import { memberApiFetch } from '../../../member-api';
import { useMemberSession } from '../../../member-session-provider';

export default function MobileHistoryRoute() {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!ready) {
      setLoading(true);
      return () => { cancelled = true; };
    }

    if (!isLoggedIn) {
      router.replace('/?auth=login&next=/mobile/member/history', { scroll: false });
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError('');
    memberApiFetch('/member/wallet/ledger?limit=100', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'โหลดประวัติไม่สำเร็จ');
      if (!cancelled) setPayload(data);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'โหลดประวัติไม่สำเร็จ');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isLoggedIn, ready, reloadKey, router]);

  return (
    <MobileMemberHistoryPage
      payload={payload}
      loading={!ready || loading}
      error={error}
      onBack={() => router.push('/')}
      onRefresh={() => setReloadKey((value) => value + 1)}
    />
  );
}
