'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileMemberAffiliatePage from '../../../components/mobile-home/mobile-member-affiliate-page';
import { memberApiFetch } from '../../../member-api';
import { useMemberSession } from '../../../member-session-provider';

export default function MobileAffiliateRoute() {
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
      router.replace('/?auth=login&next=/mobile/member/affiliate', { scroll: false });
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError('');
    memberApiFetch('/member/affiliate/profile', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'โหลดข้อมูลไม่สำเร็จ');
      if (!cancelled) setPayload(data);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลไม่สำเร็จ');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isLoggedIn, ready, reloadKey, router]);

  return (
    <MobileMemberAffiliatePage
      payload={payload}
      loading={!ready || loading}
      error={error}
      onBack={() => router.push('/')}
      onRefresh={() => setReloadKey((value) => value + 1)}
    />
  );
}
