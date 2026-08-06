'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import { cmsContentSetting, cmsResponsiveMediaUrls } from '../../site-settings';
import { useSiteSettings } from '../../site-settings-provider';

type UnknownRecord = Record<string, unknown>;
export type MobileContentStatus = 'loading' | 'ready' | 'error';

export type MobileMemberContentItem = {
  id: string;
  title: string;
  summary: string;
  image: string;
  href: string;
  endsAt?: string;
};

export type MobileActivitySourceItem = {
  id: string;
  title: string;
  image: string;
  href?: string;
  date?: string;
  disabled?: boolean;
  disabledLabel?: string;
};

export function useMobilePromotionsSource() {
  const [payload, setPayload] = useState<unknown>(null);
  const [status, setStatus] = useState<MobileContentStatus>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');

    void Promise.allSettled([
      loadJson('/public/promotions', controller.signal),
      loadJson('/public/site-settings', controller.signal),
    ]).then(([promotionsResult, settingsResult]) => {
      if (controller.signal.aborted) return;
      const promotionsPayload = promotionsResult.status === 'fulfilled' ? asRecord(promotionsResult.value) : {};
      const settingsPayload = settingsResult.status === 'fulfilled' ? asRecord(settingsResult.value) : {};
      const settingsFeatures = asRecord(settingsPayload.features);
      const liveItems = asArray(promotionsPayload.items).map(mapPublicPromotion);
      const cmsCampaigns = firstArray(settingsFeatures.promotion_campaigns, settingsFeatures.promotionCampaigns).map(asRecord);
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
        setStatus('error');
      } else {
        setStatus('ready');
      }
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setPayload({ features: { promotion_campaigns: [], promotionCampaigns: [] } });
      setError(reason instanceof Error ? reason.message : 'โหลดโปรโมชั่นไม่สำเร็จ');
      setStatus('error');
    });

    return () => controller.abort();
  }, []);

  const items = useMemo(() => promotionSummaryItems(payload), [payload]);
  return { payload, items, status, loading: status === 'loading', error };
}

export function useMobileActivitiesSource() {
  const [items, setItems] = useState<MobileActivitySourceItem[]>([]);
  const [status, setStatus] = useState<MobileContentStatus>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');

    void loadJson('/public/activities', controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setItems(extractActivities(payload));
        setStatus('ready');
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(reason instanceof Error ? reason.message : 'โหลดกิจกรรมไม่สำเร็จ');
        setStatus('error');
      });

    return () => controller.abort();
  }, []);

  const summaries = useMemo<MobileMemberContentItem[]>(() => items.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.disabledLabel ?? '',
    image: item.image,
    href: item.href ?? '/mobile/member/activity',
    ...(item.date ? { endsAt: item.date } : {}),
  })), [items]);

  return { items, summaries, status, loading: status === 'loading', error };
}

export function useMobileNewsSource() {
  const { settings, ready } = useSiteSettings();
  const items = useMemo<MobileMemberContentItem[]>(() => {
    const content = cmsContentSetting(settings);
    return content.announcements
      .filter((item) => item.kind === 'news' && item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived')
      .map((item) => {
        const media = cmsResponsiveMediaUrls(content, item);
        return {
          id: item.id || item.title,
          title: item.title.trim(),
          summary: item.message.trim(),
          image: media.mobile || media.desktop || media.legacy || item.thumbnailImageUrl || '',
          href: safeHref(item.href) || '/mobile/member/news',
        };
      })
      .filter((item) => item.title);
  }, [settings]);

  return { items, status: ready ? 'ready' as const : 'loading' as const, loading: !ready, error: '' };
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

function promotionSummaryItems(payload: unknown): MobileMemberContentItem[] {
  const features = asRecord(asRecord(payload).features);
  return firstArray(features.promotion_campaigns, features.promotionCampaigns).flatMap((raw, index) => {
    const item = asRecord(raw);
    if (!isPublished(item)) return [];
    const id = firstString(item.id, item.code, `promotion-${index + 1}`);
    const title = firstString(item.title, item.name, `โปรโมชั่น ${index + 1}`);
    const image = firstString(item.mobileImageUrl, item.mobile_image_url, item.imageUrl, item.sourceImageUrl, item.desktopImageUrl, item.desktop_image_url, item.image, item.bannerUrl);
    if (!image) return [];
    const endsAt = firstString(item.endsAt, item.endDate, item.expiresAt, item.expiredAt);
    return [{
      id,
      title,
      summary: firstString(item.description, item.summary, item.message, item.details),
      image,
      href: `/browse/promotions/${encodeURIComponent(id)}`,
      ...(endsAt ? { endsAt } : {}),
    }];
  });
}

function mapPublicPromotion(value: unknown, index: number): UnknownRecord {
  const item = asRecord(value);
  const title = firstString(item.title, item.name, `โปรโมชั่น ${index + 1}`);
  const mobileImageUrl = firstString(item.mobileImageUrl, item.mobile_image_url, item.imageUrl, item.sourceImageUrl, item.image, item.bannerUrl);
  const desktopImageUrl = firstString(item.desktopImageUrl, item.desktop_image_url, item.imageUrl, item.sourceImageUrl, item.image, item.bannerUrl);
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
    terms: Array.isArray(item.terms) ? item.terms : Array.isArray(item.conditions) ? item.conditions : undefined,
  };
}

function dedupeCampaigns(campaigns: UnknownRecord[]) {
  const result: UnknownRecord[] = [];
  const keyToIndex = new Map<string, number>();
  campaigns.forEach((campaign) => {
    const keys = campaignKeys(campaign);
    const existingIndex = keys.map((key) => keyToIndex.get(key)).find((index): index is number => typeof index === 'number');
    const existing = typeof existingIndex === 'number' ? result[existingIndex] : undefined;
    if (existing && typeof existingIndex === 'number') {
      const merged = mergeCampaign(existing, campaign);
      result[existingIndex] = merged;
      campaignKeys(merged).forEach((key) => keyToIndex.set(key, existingIndex));
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
    mobileImageUrl: firstString(primary.mobileImageUrl, primary.mobile_image_url, secondary.mobileImageUrl, secondary.mobile_image_url),
    desktopImageUrl: firstString(primary.desktopImageUrl, primary.desktop_image_url, secondary.desktopImageUrl, secondary.desktop_image_url),
    imageUrl: firstString(primary.imageUrl, secondary.imageUrl),
    description: firstString(primary.description, primary.message, primary.details, secondary.description, secondary.message, secondary.details),
    category: firstString(primary.category, primary.promotionCategory, primary.type, secondary.category, secondary.promotionCategory, secondary.type),
    endsAt: firstString(primary.endsAt, primary.endDate, primary.expiresAt, secondary.endsAt, secondary.endDate, secondary.expiresAt),
    terms: primaryTerms.length > 0 ? primaryTerms : secondaryTerms,
  };
}

function campaignKeys(item: UnknownRecord) {
  const id = normalizeText(firstString(item.id, item.code));
  const title = normalizeText(firstString(item.title, item.name));
  const image = normalizeAsset(firstString(item.mobileImageUrl, item.mobile_image_url, item.desktopImageUrl, item.desktop_image_url, item.imageUrl, item.image, item.bannerUrl, item.sourceImageUrl));
  return [image ? `image:${image}` : '', title ? `title:${title}` : '', id ? `id:${id}` : ''].filter(Boolean);
}

function extractActivities(payload: unknown): MobileActivitySourceItem[] {
  const root = asRecord(payload);
  const source = firstArray(root.items, root.activities, root.data);
  const normalized = source.flatMap((value, index) => {
    const item = asRecord(value);
    if (!isPublished(item)) return [];
    const title = firstString(item.title, item.name, `กิจกรรม ${index + 1}`);
    const image = firstString(item.mobileImageUrl, item.mobile_image_url, item.imageUrl, item.image, item.bannerUrl, item.thumbnailUrl, item.coverImageUrl);
    if (!image) return [];
    const href = safeHref(firstString(item.href, item.url, item.link, item.actionUrl, item.joinUrl));
    const state = firstString(item.status, item.lifecycle, item.state).toLowerCase();
    const disabled = item.disabled === true || item.joinEnabled === false || item.isOpen === false || item.available === false || !href || ['upcoming', 'pending', 'inactive', 'disabled', 'closed', 'ended', 'expired', 'not_open'].includes(state);
    const date = formatActivityDate(firstString(item.eventDate, item.date, item.startsAt, item.startDate, item.endsAt, item.endDate));
    const disabledLabel = disabled ? firstString(item.disabledLabel, item.statusLabel, item.unavailableMessage) || defaultDisabledLabel(title, state) : '';
    return [{
      id: firstString(item.id, item.code, `activity-${index + 1}`),
      title,
      image,
      disabled,
      ...(href ? { href } : {}),
      ...(date ? { date } : {}),
      ...(disabledLabel ? { disabledLabel } : {}),
    }];
  });
  const seen = new Set<string>();
  return normalized.filter((item) => {
    const key = [item.id, item.image, item.title].map(normalizeText).find(Boolean) ?? '';
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isPublished(item: UnknownRecord) {
  const state = firstString(item.status, item.lifecycle, item.state).toLowerCase();
  return item.enabled !== false && item.published !== false && item.visible !== false && !['draft', 'archived', 'hidden', 'deleted', 'disabled'].includes(state);
}

function normalizeAsset(value: string) {
  if (!value) return '';
  try {
    const url = new URL(value, 'https://member.local');
    const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '').toLowerCase();
    return pathname.split('/').pop() ?? pathname;
  } catch {
    const pathWithoutQuery = value.split(/[?#]/, 1)[0] ?? '';
    return pathWithoutQuery.trim().toLowerCase().split('/').pop() ?? '';
  }
}

function safeHref(value: string | undefined) {
  const href = value?.trim() ?? '';
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
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
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
}
