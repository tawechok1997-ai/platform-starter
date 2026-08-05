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
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    memberApiFetch('/public/activities', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
      skipAuth: true,
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = firstString(asRecord(payload).message) || 'โหลดกิจกรรมไม่สำเร็จ';
        throw new Error(message);
      }
      setItems(extractActivities(payload));
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setItems([]);
      setError(reason instanceof Error ? reason.message : 'โหลดกิจกรรมไม่สำเร็จ');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, []);

  return (
    <MobileMemberActivityPage
      items={items}
      loading={loading}
      error={error}
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
