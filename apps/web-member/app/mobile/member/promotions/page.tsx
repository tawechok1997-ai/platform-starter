'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileMemberPromotionsPage from '../../../components/mobile-home/mobile-member-promotions-page';
import { API_URL } from '../../../site-settings';

export default function MobilePromotionsRoute() {
  const router = useRouter();
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch(`${API_URL}/public/site-settings`, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'โหลดโปรโมชั่นไม่สำเร็จ');
      setPayload(data);
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : 'โหลดโปรโมชั่นไม่สำเร็จ');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, []);

  return (
    <MobileMemberPromotionsPage
      payload={payload}
      loading={loading}
      error={error}
      onBack={() => router.back()}
    />
  );
}
