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
      credentials: 'omit',
      headers: { accept: 'application/json' },
      signal: controller.signal,
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
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

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace('/');
  };

  return (
    <MobileMemberActivityPage
      items={items}
      loading={loading}
      error={error}
      onBack={goBack}
    />
  );
}

function extractActivities(payload: unknown): MobileActivityContentItem[] {
  const root = asRecord(payload);
  const source = firstArray(root.items, root.activities, root.data);
  const normalized = source.flatMap((value, index) => {
    const item = asRecord(value);
    if (!isPublished(item)) return [];

    const title = firstString(item.title, item.name, `กิจกรรม ${index + 1}`);
    const image = firstString(
      item.mobileImageUrl,
      item.mobile_image_url,
      item.imageUrl,
      item.image,
      item.bannerUrl,
      item.thumbnailUrl,
      item.coverImageUrl,
    );
    if (!image) return [];

    const href = safeHref(firstString(item.href, item.url, item.link, item.actionUrl, item.joinUrl));
    const state = firstString(item.status, item.lifecycle, item.state).toLowerCase();
    const disabled = isActivityDisabled(item, state, href);
    const date = formatActivityDate(firstString(
      item.eventDate,
      item.date,
      item.startsAt,
      item.startDate,
      item.endsAt,
      item.endDate,
    ));
    const disabledLabel = disabled
      ? firstString(item.disabledLabel, item.statusLabel, item.unavailableMessage)
        || defaultDisabledLabel(title, state)
      : '';

    return [{
      id: firstString(item.id, item.code, `activity-${index + 1}`),
      title,
      image,
      disabled,
      ...(href ? { href } : {}),
      ...(date ? { date } : {}),
      ...(disabledLabel ? { disabledLabel } : {}),
    } satisfies MobileActivityContentItem];
  });

  const seen = new Set<string>();
  return normalized.filter((item) => {
    const key = [item.id, item.image, item.title].map(normalizeKey).find(Boolean) ?? '';
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isPublished(item: UnknownRecord) {
  const state = firstString(item.status, item.lifecycle, item.state).toLowerCase();
  return item.published !== false
    && item.visible !== false
    && !['draft', 'archived', 'hidden', 'deleted'].includes(state);
}

function isActivityDisabled(item: UnknownRecord, state: string, href: string) {
  return item.disabled === true
    || item.joinEnabled === false
    || item.isOpen === false
    || item.available === false
    || !href
    || ['upcoming', 'pending', 'inactive', 'disabled', 'closed', 'ended', 'expired', 'not_open'].includes(state);
}

function defaultDisabledLabel(title: string, state: string) {
  if (/ทาย|predict|lottery/i.test(`${title} ${state}`)) return 'ยังไม่เปิดให้ทายผล';
  if (['closed', 'ended', 'expired'].includes(state)) return 'สิ้นสุดกิจกรรม';
  return 'ยังไม่เปิดให้เข้าร่วม';
}

function formatActivityDate(value: string) {
  if (!value) return '';
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstArray(...values: unknown[]) {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? [];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() ?? '';
}

function safeHref(value: string) {
  return value.startsWith('/') || /^https?:\/\//i.test(value) ? value : '';
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[?#].*$/, '');
}
