'use client';

import { useMemo } from 'react';
import type { CmsAnnouncement, CmsContent } from './site-settings';
import { useSiteSettings } from './site-settings-provider';
import type { ContactSettings } from './site-settings-types';

export type MemberContactChannelKey =
  | 'line'
  | 'live_chat'
  | 'telegram'
  | 'facebook'
  | 'phone'
  | 'email'
  | 'youtube'
  | 'tiktok'
  | 'x';

export type MemberContactChannel = {
  key: MemberContactChannelKey;
  label: string;
  value: string;
  href: string;
  iconUrl: string;
  external: boolean;
};

export type MemberContactRuntime = {
  channels: MemberContactChannel[];
  primary: MemberContactChannel;
  supportHours: string;
  companyName: string;
  address: string;
  lineQrUrl: string;
};

export type MemberAnnouncementSurface = 'desktop' | 'mobile' | 'all';

const LINE_ICON_URL = '/assets/asset-pc/images/line.png';
const CONTACT_ICON_URL = '/assets/asset-pc/images/footer/contact/icon-open-gold.webp';
const DEFAULT_LINE_ID = '@774uinsb';
const DEFAULT_LINE_URL = 'https://lin.ee/UYkP0OC';

export function useMemberContactRuntime() {
  const { typedSettings } = useSiteSettings();
  return useMemo(() => buildMemberContactRuntime(typedSettings.contact), [typedSettings.contact]);
}

export function buildMemberContactRuntime(contact: ContactSettings): MemberContactRuntime {
  const lineOa = text(contact.line_oa);
  const configuredValues = [
    contact.line_id,
    contact.line_url,
    contact.line_link,
    contact.telegram,
    contact.telegram_url,
    contact.facebook,
    contact.facebook_url,
    contact.email,
    contact.phone,
    contact.live_chat_url,
    contact.youtube,
    contact.youtube_url,
    contact.tiktok,
    contact.tiktok_url,
    contact.x,
    contact.x_url,
    contact.twitter,
    contact.twitter_url,
    lineOa,
  ];
  const hasConfiguredChannel = configuredValues.some((value) => Boolean(text(value)));
  const lineValue = firstText(
    contact.line_id,
    isHttpUrl(lineOa) ? '' : lineOa,
    hasConfiguredChannel ? '' : DEFAULT_LINE_ID,
  );
  const lineHref = firstHttpUrl(
    contact.line_url,
    contact.line_link,
    isHttpUrl(lineOa) ? lineOa : '',
    hasConfiguredChannel ? '' : DEFAULT_LINE_URL,
  );

  const channels = [
    channel('line', 'LINE', lineValue || 'LINE', lineHref, LINE_ICON_URL),
    channel('live_chat', 'Live Chat', 'Live Chat', firstHttpUrl(contact.live_chat_url), CONTACT_ICON_URL),
    channel(
      'telegram',
      'Telegram',
      firstText(contact.telegram, 'Telegram'),
      firstHttpUrl(contact.telegram_url, contact.telegram),
      CONTACT_ICON_URL,
    ),
    channel(
      'facebook',
      'Facebook',
      firstText(contact.facebook, 'Facebook'),
      firstHttpUrl(contact.facebook_url, contact.facebook),
      CONTACT_ICON_URL,
    ),
    phoneChannel(text(contact.phone)),
    emailChannel(text(contact.email)),
    channel(
      'youtube',
      'YouTube',
      firstText(contact.youtube, 'YouTube'),
      firstHttpUrl(contact.youtube_url, contact.youtube),
      CONTACT_ICON_URL,
    ),
    channel(
      'tiktok',
      'TikTok',
      firstText(contact.tiktok, 'TikTok'),
      firstHttpUrl(contact.tiktok_url, contact.tiktok),
      CONTACT_ICON_URL,
    ),
    channel(
      'x',
      'X',
      firstText(contact.x, contact.twitter, 'X'),
      firstHttpUrl(contact.x_url, contact.twitter_url, contact.x, contact.twitter),
      CONTACT_ICON_URL,
    ),
  ].filter((item): item is MemberContactChannel => item !== null);

  const fallback = channel('line', 'LINE', DEFAULT_LINE_ID, DEFAULT_LINE_URL, LINE_ICON_URL)!;
  return {
    channels: channels.length ? channels : [fallback],
    primary: channels[0] ?? fallback,
    supportHours: text(contact.support_hours),
    companyName: text(contact.company_name),
    address: text(contact.address),
    lineQrUrl: firstHttpUrl(contact.line_qr_url),
  };
}

export function memberAnnouncementsRuntime(
  content: CmsContent,
  surface: MemberAnnouncementSurface = 'all',
  now = Date.now(),
): CmsAnnouncement[] {
  const announcements = Array.isArray(content.announcements) ? content.announcements : [];
  return announcements
    .filter((item) => item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived')
    .filter((item) => announcementInWindow(item, now))
    .filter((item) => announcementMatchesSurface(item, surface))
    .sort((left, right) => announcementPriority(right) - announcementPriority(left));
}

export function memberAnnouncementText(
  content: CmsContent,
  surface: MemberAnnouncementSurface,
  fallback: string,
) {
  const announcement = memberAnnouncementsRuntime(content, surface)[0];
  return firstText(announcement?.message, announcement?.title, fallback);
}

function channel(
  key: MemberContactChannelKey,
  label: string,
  value: string,
  href: string,
  iconUrl: string,
): MemberContactChannel | null {
  const normalizedValue = text(value);
  const normalizedHref = safeHref(href);
  if (!normalizedValue && !normalizedHref) return null;
  return {
    key,
    label,
    value: normalizedValue || label,
    href: normalizedHref || '/contact',
    iconUrl,
    external: /^https?:\/\//i.test(normalizedHref),
  };
}

function phoneChannel(phone: string) {
  if (!phone) return null;
  const dial = phone.replace(/[^+\d]/g, '');
  return channel('phone', 'Phone', phone, dial ? `tel:${dial}` : '/contact', CONTACT_ICON_URL);
}

function emailChannel(email: string) {
  if (!email) return null;
  return channel('email', 'Email', email, `mailto:${email}`, CONTACT_ICON_URL);
}

function announcementInWindow(item: CmsAnnouncement, now: number) {
  const metadata = item as CmsAnnouncement & Record<string, unknown>;
  const startsAt = dateValue(metadata.startsAt ?? metadata.startAt ?? metadata.start_date);
  const endsAt = dateValue(metadata.endsAt ?? metadata.endAt ?? metadata.end_date);
  return !(startsAt !== null && now < startsAt) && !(endsAt !== null && now > endsAt);
}

function announcementMatchesSurface(item: CmsAnnouncement, surface: MemberAnnouncementSurface) {
  if (surface === 'all') return true;
  const metadata = item as CmsAnnouncement & Record<string, unknown>;
  const target = firstText(metadata.surface, metadata.target, metadata.audience).toLowerCase();
  if (!target || target === 'all' || target === 'both') return true;
  return target.split(/[\s,|]+/).includes(surface);
}

function announcementPriority(item: CmsAnnouncement) {
  const metadata = item as CmsAnnouncement & Record<string, unknown>;
  const value = Number(metadata.priority ?? metadata.sequence ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function dateValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeHref(value: unknown) {
  const href = text(value);
  if (/^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }
  return '';
}

function firstHttpUrl(...values: unknown[]) {
  return values.map(text).find(isHttpUrl) ?? '';
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function firstText(...values: unknown[]) {
  return values.map(text).find(Boolean) ?? '';
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
