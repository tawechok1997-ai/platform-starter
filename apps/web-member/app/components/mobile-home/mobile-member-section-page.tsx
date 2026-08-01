'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberApiFetch } from '../../member-api';
import { useMemberSession } from '../../member-session-provider';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import MobileMemberVipPage from './mobile-member-vip-page';
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
  affiliate: { title: 'แนะนำเพื่อน', endpoint: '/member/affiliate/profile', fallbackImage: '/assets/asset-pc/images/เเนะนำเพื่อน.png' },
  live: { title: 'ถ่ายทอดสด', endpoint: '/games/catalog?category=live&limit=40', fallbackImage: '/assets/asset-pc/images/ถ่ายถอดสด.png' },
  promotions: { title: 'โปรโมชั่น', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/โปรโมชั้น.png' },
  news: { title: 'ข่าวสาร', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/ข่าวสาร.png' },
  activity: { title: 'กิจกรรม', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/กิจกรรม.png' },
  history: { title: 'ประวัติ', endpoint: '/member/wallet/ledger?limit=100', fallbackImage: '/assets/asset-pc/images/ประวัติ.png' },
  notifications: { title: 'แจ้งเตือน', endpoint: '/member/notifications', fallbackImage: '/assets/asset-pc/images/เเจ้งเตือน.png' },
  video: { title: 'วีดีโอแนะนำ', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/วิดีโอเเนะนำ.png' },
  guide: { title: 'แนะนำการใช้งาน', endpoint: '/public/site-settings', publicEndpoint: true, fallbackImage: '/assets/asset-pc/images/เเนะนำการใช้งาน.png' },
};

const DEFAULT_SECTION = SECTION_CONFIG.profile!;

export default function MobileMemberSectionPage({ section }: Props) {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const config = SECTION_CONFIG[section] ?? DEFAULT_SECTION;
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!ready) {
      setLoading(true);
      setError('');
      return () => { cancelled = true; };
    }

    // The VIP row is public before login. It may show the static tier programme,
    // but it must never request or expose profile, turnover, wallet, or VIP state.
    if (section === 'vip' && !isLoggedIn) {
      setPayload(null);
      setLoading(false);
      setError('');
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError('');
    const request = memberApiFetch(config.endpoint, config.publicEndpoint ? {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
    } : undefined);

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
  }, [config.endpoint, config.publicEndpoint, isLoggedIn, ready, section]);

  const items = useMemo(() => normalizeItems(section, payload), [payload, section]);
  const isNews = section === 'news';

  if (section === 'vip') {
    return (
      <MobileMemberVipPage
        payload={isLoggedIn ? payload : null}
        loading={!ready || (isLoggedIn && loading)}
        error={isLoggedIn ? error : ''}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <main className={styles.page} data-mobile-member-page={section}>
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}><BackIcon /></button>
        <h1>{config.title}</h1>
      </header>

      <section className={`${styles.body} ${isNews ? styles.newsBody : ''}`} aria-busy={loading}>
        {section === 'profile' ? <ProfileSummary payload={payload} fallbackImage={config.fallbackImage} /> : null}
        {loading ? <div className={styles.state}>กำลังโหลดข้อมูล...</div> : null}
        {!loading && error ? <div className={styles.error}>{error}</div> : null}
        {!loading && !error && items.length === 0 && section !== 'profile' ? (
          isNews ? <NewsEmptyState /> : <div className={styles.state}>ยังไม่มีข้อมูลในส่วนนี้</div>
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

function NewsEmptyState() {
  return (
    <div className={styles.newsEmpty} role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
        <path d="M87.4313 36.6079H23.2148V72.7297C23.2148 74.8586 24.0605 76.9003 25.5659 78.4057C27.0713 79.911 29.113 80.7567 31.2419 80.7567H79.4043C81.5332 80.7567 83.5749 79.911 85.0803 78.4057C86.5856 76.9003 87.4313 74.8586 87.4313 72.7297V36.6079Z" fill="#E0B1F1" />
        <rect x="47.8984" y="46.6665" width="14.7373" height="4.91244" rx="2.45622" fill="#A800CB" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7.75354 17.3131C5.69718 17.8641 3.94392 19.2094 2.87946 21.0531C1.81501 22.8968 1.52655 25.0878 2.07756 27.1442L4.15511 34.8977C4.70611 36.9541 6.05144 38.7073 7.89513 39.7718C9.73881 40.8362 11.9298 41.1247 13.9862 40.5737L70.8455 25.3383C72.9019 24.7873 74.6552 23.442 75.7196 21.5983C76.7841 19.7546 77.0725 17.5636 76.5215 15.5072L74.444 7.75365C73.893 5.69728 72.5476 3.94402 70.7039 2.87957C68.8603 1.81511 66.6692 1.52666 64.6129 2.07766L7.75354 17.3131Z" fill="#A800CB" />
        <path d="M68.7734 34.9999C68.7734 34.9999 88.4232 29.4736 85.3529 23.3325C83.6882 20.0027 78.9134 20.2331 76.1421 22.7188C72.9487 25.5831 73.0805 33.1571 77.3702 33.1571C80.4405 33.1571 87.8092 33.7712 93.3356 30.7009C101.991 25.8924 103.775 22.1041 106.231 16.5776" stroke="#E0B1F1" strokeWidth="1.22811" strokeLinecap="round" strokeDasharray="2.46 2.46" />
        <path fillRule="evenodd" clipRule="evenodd" d="M112.255 7.82712C112.565 6.82343 111.295 6.09573 110.586 6.87357L110.558 6.90437L110.503 6.9649C110.112 7.39089 109.603 7.69103 109.04 7.82732C108.478 7.96361 107.888 7.9299 107.344 7.73046C106.326 7.3579 105.558 8.68737 106.391 9.38219C106.837 9.75445 107.162 10.2512 107.324 10.8089C107.487 11.3667 107.479 11.9602 107.303 12.5137L107.27 12.6186C106.95 13.6205 108.214 14.3572 108.929 13.5858L109.017 13.492C109.411 13.067 109.922 12.768 110.486 12.6326C111.05 12.4972 111.642 12.5314 112.186 12.7309C113.207 13.1047 113.976 11.7731 113.141 11.076C112.686 10.6957 112.355 10.1864 112.194 9.61509C112.033 9.04372 112.049 8.43699 112.239 7.87458L112.255 7.82712Z" fill="#E0B1F1" />
      </svg>
      <span>ไม่มีข้อความใหม่</span>
    </div>
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
  const root = unwrapPayloadRecord(payload);
  let source: unknown[] = [];

  if (section === 'promotions') source = cmsArray(root, 'banners');
  else if (section === 'activity') {
    source = cmsArray(root, 'announcements').filter((value) => {
      const item = asRecord(value);
      const kind = announcementKind(item);
      return isPublished(item) && (kind === 'event' || kind === 'activity');
    });
  } else if (section === 'news') {
    source = cmsArray(root, 'announcements').filter((value) => {
      const item = asRecord(value);
      const kind = announcementKind(item);
      return isPublished(item) && kind !== 'event' && kind !== 'activity';
    });
  } else if (section === 'guide') source = cmsArray(root, 'faqs').filter((value) => isPublished(asRecord(value)));
  else if (section === 'video') source = cmsArray(root, 'videos').filter((value) => isPublished(asRecord(value)));
  else source = arrayFromPayload(payload);

  return source.map((value, index) => {
    const item = asRecord(value) ?? {};
    const title = firstString(item.title, item.name, item.question, item.label, transactionTitle(item), `รายการ ${index + 1}`);
    const subtitle = firstString(item.subtitle, item.message, item.description, item.answer, item.status, item.providerName, transactionSubtitle(item), '');
    const image = firstString(item.mobileImageUrl, item.imageUrl, item.image, item.thumbnailUrl, item.iconUrl, item.logoUrl, '');
    return { id: firstString(item.id, item.code, String(index)), title, subtitle: stripHtml(subtitle), image };
  });
}

function transactionTitle(item: UnknownRecord) {
  const type = firstString(item.type).toUpperCase();
  if (type.includes('DEPOSIT') || type.includes('TOPUP')) return 'ฝากเงิน';
  if (type.includes('WITHDRAW')) return 'ถอนเงิน';
  if (type.includes('ADJUST')) return 'ปรับยอด';
  return '';
}

function transactionSubtitle(item: UnknownRecord) {
  const amount = Number(item.amount);
  if (!Number.isFinite(amount)) return '';
  const direction = firstString(item.direction).toUpperCase() === 'CREDIT' ? '+' : '-';
  return `${direction} ${formatMoney(amount)} THB`;
}

function cmsArray(root: UnknownRecord | null, key: string) {
  const features = asRecord(root?.features);
  const cms = asRecord(features?.cms_content ?? features?.cmsContent);
  const value = cms?.[key];
  return Array.isArray(value) ? value : [];
}

function unwrapPayloadRecord(payload: unknown) {
  const root = asRecord(payload);
  return asRecord(root?.data) ?? root;
}

function announcementKind(item: UnknownRecord | null) {
  return firstString(item?.kind, item?.type, item?.category).toLowerCase();
}

function isPublished(item: UnknownRecord | null) {
  if (!item) return false;
  if (item.enabled === false || item.active === false) return false;
  const lifecycle = firstString(item.lifecycle, item.status).toLowerCase();
  return lifecycle !== 'draft' && lifecycle !== 'archived' && lifecycle !== 'disabled';
}

function arrayFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = unwrapPayloadRecord(payload);
  for (const key of ['items', 'data', 'results', 'transactions', 'notifications', 'games', 'commissions']) {
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
