'use client';

import { createApiClient } from '@platform/api-client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileMemberPromotionsPage from '../../../components/mobile-home/mobile-member-promotions-page';
import { SOURCE_PROMOTION_PAYLOAD } from '../../../components/mobile-home/mobile-member-promotion-source';
import { API_URL } from '../../../site-settings';

type UnknownRecord = Record<string, unknown>;

const publicApiClient = createApiClient({
  baseUrl: API_URL,
  cache: 'no-store',
  defaultHeaders: { accept: 'application/json' },
});

export default function MobilePromotionsRoute() {
  const router = useRouter();
  const [payload, setPayload] = useState<unknown>(SOURCE_PROMOTION_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    publicApiClient.request<unknown>('/public/site-settings', {
      auth: false,
      cache: 'no-store',
      signal: controller.signal,
    }).then((data) => {
      setPayload(hasPromotionCampaigns(data) ? data : SOURCE_PROMOTION_PAYLOAD);
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setPayload(SOURCE_PROMOTION_PAYLOAD);
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
