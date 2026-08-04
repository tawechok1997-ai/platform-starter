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

    memberApiFetch('/public/site-settings', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
      skipAuth: true,
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'โหลดโปรโมชั่นไม่สำเร็จ');
      setPayload(hasPromotionCampaigns(data) ? data : { features: { promotion_campaigns: [] } });
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setPayload({ features: { promotion_campaigns: [] } });
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
      onBack={() => router.back()}
    />
  );
}

function hasPromotionCampaigns(value: unknown) {
  const root = asRecord(value);
  const features = asRecord(root.features);
  return [features.promotion_campaigns, features.promotionCampaigns]
    .some((campaigns) => Array.isArray(campaigns) && campaigns.length > 0);
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}
