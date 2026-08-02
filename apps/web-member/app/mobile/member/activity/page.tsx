'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileMemberActivityPage, {
  type MobileActivityContentItem,
} from '../../../components/mobile-home/mobile-member-activity-page';
import { memberApiFetch } from '../../../member-api';

type UnknownRecord = Record<string, unknown>;

export default function MobileActivityRoute() {
  const router = useRouter();
  const [items, setItems] = useState<MobileActivityContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    memberApiFetch('/public/activities', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
      skipAuth: true,
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) return;
      setItems(extractActivities(payload));
    }).catch(() => {
      // Source cards remain available while the API is unavailable or before the migration is deployed.
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, []);

  return (
    <MobileMemberActivityPage
      items={items}
      loading={loading}
      onBack={() => router.push('/')}
    />
  );
}

function extractActivities(payload: unknown): MobileActivityContentItem[] {
  const root = asRecord(payload);
  const source = Array.isArray(root.items) ? root.items : [];

  return source.flatMap((value, index) => {
    const item = asRecord(value);
    if (!isVisible(item)) return [];
    const image = firstString(item.mobileImageUrl, item.imageUrl, item.image, item.bannerUrl, item.thumbnailUrl);
    const href = safeHref(firstString(item.href, item.url, item.link, item.actionUrl));
    if (!image || !href) return [];

    return [{
      id: firstString(item.id, item.code, `activity-${index + 1}`),
      title: firstString(item.title, item.name, `กิจกรรม ${index + 1}`),
      image,
      href,
    } satisfies MobileActivityContentItem];
  });
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() ?? '';
}

function isVisible(item: UnknownRecord) {
  const status = firstString(item.status, item.lifecycle).toLowerCase();
  return item.enabled !== false
    && status !== 'draft'
    && status !== 'archived'
    && status !== 'disabled';
}

function safeHref(value: string) {
  return value.startsWith('/') || /^https?:\/\//i.test(value) ? value : '';
}
