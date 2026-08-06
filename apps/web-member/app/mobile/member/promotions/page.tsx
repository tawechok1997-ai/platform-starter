'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileMemberPromotionsLivePage from '../../../components/mobile-home/mobile-member-promotions-live-page';
import { memberApiFetch } from '../../../member-api';

type UnknownRecord = Record<string, unknown>;

export default function MobilePromotionsRoute() {
  const router = useRouter();
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    void Promise.allSettled([
      loadJson('/public/promotions', controller.signal),
      loadJson('/public/site-settings', controller.signal),
    ]).then(([promotionsResult, settingsResult]) => {
      if (controller.signal.aborted) return;

      const promotionsPayload = promotionsResult.status === 'fulfilled'
        ? asRecord(promotionsResult.value)
        : {};
      const settingsPayload = settingsResult.status === 'fulfilled'
        ? asRecord(settingsResult.value)
        : {};

      const mergedPayload = {
        ...settingsPayload,
        items: Array.isArray(promotionsPayload.items) ? promotionsPayload.items : [],
      };

      setPayload(mergedPayload);
      if (promotionsResult.status === 'rejected' && settingsResult.status === 'rejected') {
        setError('โหลดโปรโมชั่นไม่สำเร็จ');
      }
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setPayload({ items: [], features: { promotion_campaigns: [] } });
      setError(reason instanceof Error ? reason.message : 'โหลดโปรโมชั่นไม่สำเร็จ');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, []);

  return (
    <MobileMemberPromotionsLivePage
      payload={payload}
      loading={loading}
      error={error}
      onBack={() => {
        if (window.history.length > 1) router.back();
        else router.replace('/');
      }}
    />
  );
}

async function loadJson(path: string, signal: AbortSignal) {
  const response = await memberApiFetch(path, {
    cache: 'no-store',
    credentials: 'omit',
    headers: { accept: 'application/json' },
    signal,
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = asRecord(data).message;
    throw new Error(typeof message === 'string' ? message : `โหลด ${path} ไม่สำเร็จ`);
  }
  return data;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}
