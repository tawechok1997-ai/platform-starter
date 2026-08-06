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
      const settingsFeatures = asRecord(settingsPayload.features);
      const liveItems = asArray(promotionsPayload.items).map(mapPublicPromotion);
      const cmsCampaigns = firstArray(
        settingsFeatures.promotion_campaigns,
        settingsFeatures.promotionCampaigns,
      ).map(asRecord);
      const campaigns = dedupeCampaigns([...liveItems, ...cmsCampaigns]);

      setPayload({
        ...settingsPayload,
        features: {
          ...settingsFeatures,
          promotion_campaigns: campaigns,
          promotionCampaigns: campaigns,
        },
        promotionSource: {
          publicPromotions: liveItems.length,
          siteSettings: cmsCampaigns.length,
          rendered: campaigns.length,
        },
      });

      if (promotionsResult.status === 'rejected' && settingsResult.status === 'rejected') {
        setError('โหลดโปรโมชั่นไม่สำเร็จ');
      }
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setPayload({ features: { promotion_campaigns: [], promotionCampaigns: [] } });
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

function mapPublicPromotion(value: unknown, index: number): UnknownRecord {
  const item = asRecord(value);
  const title = firstString(item.title, item.name, `โปรโมชั่น ${index + 1}`);
  const mobileImageUrl = firstString(
    item.mobileImageUrl,
    item.mobile_image_url,
    item.imageUrl,
    item.sourceImageUrl,
    item.image,
    item.bannerUrl,
  );
  const desktopImageUrl = firstString(
    item.desktopImageUrl,
    item.desktop_image_url,
    item.imageUrl,
    item.sourceImageUrl,
    item.image,
    item.bannerUrl,
  );

  return {
    ...item,
    id: firstString(item.id, item.code, `public-promotion-${index + 1}`),
    title,
    name: title,
    enabled: item.enabled !== false,
    lifecycle: firstString(item.lifecycle, item.status, 'published'),
    mobileImageUrl,
    desktopImageUrl,
    imageUrl: firstString(item.imageUrl, mobileImageUrl, desktopImageUrl),
    description: firstString(item.description, item.summary, item.message, item.details),
    endsAt: firstString(item.endsAt, item.endDate, item.expiresAt, item.expiredAt),
    category: firstString(item.category, item.promotionCategory, item.type),
    tags: item.tags,
    terms: Array.isArray(item.terms)
      ? item.terms
      : Array.isArray(item.conditions)
        ? item.conditions
        : undefined,
  };
}

function dedupeCampaigns(campaigns: UnknownRecord[]) {
  const result: UnknownRecord[] = [];
  const keyToIndex = new Map<string, number>();

  campaigns.forEach((campaign) => {
    const keys = campaignKeys(campaign);
    const existingIndex = keys
      .map((key) => keyToIndex.get(key))
      .find((index): index is number => typeof index === 'number');

    if (typeof existingIndex === 'number') {
      result[existingIndex] = mergeCampaign(result[existingIndex], campaign);
      campaignKeys(result[existingIndex]).forEach((key) => keyToIndex.set(key, existingIndex));
      return;
    }

    const index = result.length;
    result.push(campaign);
    keys.forEach((key) => keyToIndex.set(key, index));
  });

  return result;
}

function mergeCampaign(primary: UnknownRecord, secondary: UnknownRecord): UnknownRecord {
  const primaryTerms = firstArray(primary.terms, primary.conditions);
  const secondaryTerms = firstArray(secondary.terms, secondary.conditions);

  return {
    ...secondary,
    ...primary,
    id: firstString(primary.id, secondary.id),
    title: firstString(primary.title, primary.name, secondary.title, secondary.name),
    mobileImageUrl: firstString(
      primary.mobileImageUrl,
      primary.mobile_image_url,
      secondary.mobileImageUrl,
      secondary.mobile_image_url,
    ),
    desktopImageUrl: firstString(
      primary.desktopImageUrl,
      primary.desktop_image_url,
      secondary.desktopImageUrl,
      secondary.desktop_image_url,
    ),
    imageUrl: firstString(primary.imageUrl, secondary.imageUrl),
    description: firstString(
      primary.description,
      primary.message,
      primary.details,
      secondary.description,
      secondary.message,
      secondary.details,
    ),
    category: firstString(
      primary.category,
      primary.promotionCategory,
      primary.type,
      secondary.category,
      secondary.promotionCategory,
      secondary.type,
    ),
    endsAt: firstString(
      primary.endsAt,
      primary.endDate,
      primary.expiresAt,
      secondary.endsAt,
      secondary.endDate,
      secondary.expiresAt,
    ),
    terms: primaryTerms.length > 0 ? primaryTerms : secondaryTerms,
  };
}

function campaignKeys(item: UnknownRecord) {
  const id = normalizeText(firstString(item.id, item.code));
  const title = normalizeText(firstString(item.title, item.name));
  const image = normalizeAsset(firstString(
    item.mobileImageUrl,
    item.mobile_image_url,
    item.desktopImageUrl,
    item.desktop_image_url,
    item.imageUrl,
    item.image,
    item.bannerUrl,
    item.sourceImageUrl,
  ));

  return [
    image ? `image:${image}` : '',
    title ? `title:${title}` : '',
    id ? `id:${id}` : '',
  ].filter(Boolean);
}

function normalizeAsset(value: string) {
  if (!value) return '';
  try {
    const url = new URL(value, 'https://member.local');
    const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '').toLowerCase();
    return pathname.split('/').pop() ?? pathname;
  } catch {
    return value.split(/[?#]/, 1)[0].trim().toLowerCase().split('/').pop() ?? '';
  }
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function firstArray(...values: unknown[]) {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? [];
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() ?? '';
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}
