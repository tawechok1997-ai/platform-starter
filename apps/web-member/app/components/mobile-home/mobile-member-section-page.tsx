'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, memberApiFetch } from '../../member-api';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import styles from './mobile-member-section-page.module.css';

type Props = { section: string };
type UnknownRecord = Record<string, unknown>;

type SectionConfig = {
  title: string;
  endpoint: string;
  publicEndpoint?: boolean;
  fallbackImage: string;
};

const SECTION_CONFIG: Record<string, SectionConfig> = {
  vip: { title: 'ระดับสมาชิก VIP', endpoint: '/member/auth/profile', fallbackImage: '/images/avatar/7.webp' },
  profile: { title: 'ข้อมูลสมาชิก', endpoint: '/member/auth/profile', fallbackImage: '/images/avatar/7.webp' },
  affiliate: { title: 'แนะนำเพื่อน', endpoint: '/member/affiliate/summary', fallbackImage: '/assets/asset-pc/images/เเนะนำเพื่อน.png' },
  live: { title: 'ถ่ายทอดสด', endpoint: '/games/catalog?category=live&limit=40', fallbackImage: '/assets/asset-pc/images/ถ่ายถอดสด.png' },
  promotions: { title: 'โปรโมชั่น', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/โปรโมชั้น.png' },
  news: { title: 'ข่าวสาร', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/ข่าวสาร.png' },
  activity: { title: 'กิจกรรม', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/กิจกรรม.png' },
  history: { title: 'ประวัติ', endpoint: '/member/transactions?limit=50', fallbackImage: '/assets/asset-pc/images/ประวัติ.png' },
  notifications: { title: 'แจ้งเตือน', endpoint: '/member/notifications?limit=50', fallbackImage: '/assets/asset-pc/images/เเจ้งเตือน.png' },
  video: { title: 'วีดีโอแนะนำ', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/วิดีโอเเนะนำ.png' },
  guide: { title: 'แนะนำการใช้งาน', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/เเนะนำการใช้งาน.png' },
};

export default function MobileMemberSectionPage({ section }: Props) {
  const router = useRouter();
  const config = SECTION_CONFIG[section] ?? SECTION_CONFIG.profile;
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const request = config.publicEndpoint
      ? fetch(`${API_URL}${config.endpoint}`, { cache: 'no-store', headers: { accept: 'application/json' } })
      : memberApiFetch(config.endpoint);

    request.then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'โหลดข้อมูลไม่สำเร็จ');
      if (!cancelled) setPayload(data);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลไม่สำเร็จ');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [config.endpoint, config.publicEndpoint]);

  const items = useMemo(() => normalizeItems(section, payload), [payload, section]);

  return (
    <main className={styles.page} data-mobile-member-page={section}>
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}><BackIcon /></button>
        <h1>{config.title}</h1>
      </header>

      <section className={styles.body}>
        {section === 'vip' || section === 'profile' ? <ProfileSummary payload={payload} fallbackImage={config.fallbackImage} /> : null}
        {loading ? <div className={styles.state}>กำลังโหลดข้อมูล...</div> : null}
        {!loading && error ? <div className={styles.error}>{error}</div> : null}
        {!loading && !error && items.length === 0 && section !== 'vip' && section !== 'profile' ? (
          <div className={styles.state}>ยังไม่มีข้อมูลในส่วนนี้</div>
        ) : null}
        {items.length > 0 ? (
          <div className={section === 'live' ? styles.gameGrid : styles.list}>
            {items.map((item, index) => (
              <article className={styles.card} key={item.id || `${section}-${index}`}>
                <img src={resolveImage(item.image, config.fallbackImage)} alt="" onError={(event) => {
                  event.currentTarget.src = config.fallbackImage;
                }} />
                <div><strong>{item.title}</strong>{item.subtitle ? <span>{item.subtitle}</span> : null}</div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ProfileSummary({ payload, fallbackImage }: { payload: unknown; fallbackImage: string }) {
  const profile = asRecord(payload);
  const wallet = asRecord(profile?.wallet);
  const image = firstString(profile?.avatarUrl, fallbackImage);
  return (
    <div className={styles.profileCard}>
      <img src={resolveImage(image, fallbackImage)} alt="รูปโปรไฟล์สมาชิก" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
      <div>
        <strong>{firstString(profile?.displayName, profile?.username, 'สมาชิก')}</strong>
        <span>{firstString(profile?.phone, profile?.email, '')}</span>
        <b>{formatMoney(wallet?.availableBalance)} THB</b>
      </div>
    </div>
  );
}

type NormalItem = { id: string; title: string; subtitle: string; image: string };

function normalizeItems(section: string, payload: unknown): NormalItem[] {
  if (section === 'vip' || section === 'profile') return [];
  const root = asRecord(payload);
  let source: unknown[] = [];

  if (section === 'promotions') source = cmsArray(root, 'banners');
  else if (section === 'activity') source = cmsArray(root, 'announcements').filter((item) => firstString(asRecord(item)?.kind).toLowerCase() === 'event');
  else if (section === 'news') source = cmsArray(root, 'announcements').filter((item) => ['news', 'system'].includes(firstString(asRecord(item)?.kind).toLowerCase()));
  else if (section === 'guide') source = cmsArray(root, 'faqs');
  else if (section === 'video') source = cmsArray(root, 'videos');
  else source = arrayFromPayload(payload);

  return source.map((value, index) => {
    const item = asRecord(value) ?? {};
    const title = firstString(item.title, item.name, item.question, item.label, `รายการ ${index + 1}`);
    const subtitle = firstString(item.subtitle, item.message, item.description, item.answer, item.status, item.providerName, '');
    const image = firstString(item.mobileImageUrl, item.imageUrl, item.image, item.thumbnailUrl, item.iconUrl, item.logoUrl, '');
    return { id: firstString(item.id, item.code, String(index)), title, subtitle: stripHtml(subtitle), image };
  });
}

function cmsArray(root: UnknownRecord | null, key: string) {
  const features = asRecord(root?.features);
  const cms = asRecord(features?.cms_content ?? features?.cmsContent);
  const value = cms?.[key];
  return Array.isArray(value) ? value : [];
}

function arrayFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  for (const key of ['items', 'data', 'results', 'transactions', 'notifications', 'games']) {
    const value = root?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function resolveImage(value: string, fallback: string) {
  if (!value) return fallback;
  if (value.startsWith('/')) return value;
  return resolveLocalAssetByBasename(value, 'mobile') || resolveLocalAssetByBasename(value, 'pc') || value;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatMoney(value: unknown) {
  const number = Number(value ?? 0);
  return (Number.isFinite(number) ? number : 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>;
}
