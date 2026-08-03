'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PromotionView } from '../browse/browse-promotions-cms';
import { resolveLocalAssetOrSource } from '../lib/local-asset-by-basename';
import {
  loadPublicPromotionCampaigns,
  PROMOTION_ASSET_CAMPAIGNS,
  type MemberPromotionCampaign,
  type PromotionMemberCategory,
} from '../promotion-campaign-runtime';
import { cmsResponsiveMediaUrls, type CmsContent } from '../site-settings';
import { useSiteSettings } from '../site-settings-provider';

const CATEGORY_OPTIONS: Array<{ value: 'all' | PromotionMemberCategory; label: string }> = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'new_member', label: 'สมาชิกใหม่' },
  { value: 'daily', label: 'ประจำวัน' },
  { value: 'privilege', label: 'สิทธิพิเศษ' },
  { value: 'cashback', label: 'คืนยอดเสีย' },
];

type Props = {
  view: PromotionView;
  onDetailOpenChange?: (open: boolean) => void;
};

type ActivityItem = {
  id: string;
  title: string;
  summary: string;
  expiresAt: string;
  thumbnail: string;
  banner: string;
  terms: string[];
  statusLabel: string;
  numberPrediction: boolean;
};

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  image: string;
};

type ResponsiveSourceProps = {
  desktop: string;
  mobile?: string;
  fallback?: string;
  alt: string;
  className?: string;
};

const SOURCE_ACTIVITY_FALLBACK: ActivityItem[] = [
  {
    id: 'predict-lottery',
    title: 'ทายผลหวย',
    summary: 'กิจกรรมทายผลหวย',
    expiresAt: '2026-08-01',
    thumbnail: sourceAsset('https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg'),
    banner: sourceAsset('https://cdn.zabbet.com/event/predict/1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg'),
    terms: ['กรุณาทายผลให้ครบทั้ง 3 ตัวบน และ 2 ตัวล่าง', 'ตรวจสอบเวลาปิดรับคำทายก่อนส่งข้อมูล'],
    statusLabel: 'หมดเวลาทายผล',
    numberPrediction: true,
  },
  {
    id: 'turnover-reward',
    title: 'ทำยอด Turn รับรางวัลจุใจ',
    summary: 'ทำยอดตามเงื่อนไขเพื่อรับรางวัล',
    expiresAt: '',
    thumbnail: sourceAsset('https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png'),
    banner: sourceAsset('https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png'),
    terms: ['ยอด Turn และรางวัลเป็นไปตามประกาศของกิจกรรม'],
    statusLabel: '',
    numberPrediction: false,
  },
];

export default function MemberSourceContentPopup({ view, onDetailOpenChange }: Props) {
  const { typedSettings } = useSiteSettings();
  const content = typedSettings.features.cms_content;
  const popupRootRef = useRef<HTMLElement | null>(null);
  const [campaigns, setCampaigns] = useState<MemberPromotionCampaign[]>(PROMOTION_ASSET_CAMPAIGNS);
  const [category, setCategory] = useState<'all' | PromotionMemberCategory>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<MemberPromotionCampaign | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState('');

  const resetPopupScroll = useCallback(() => {
    const root = popupRootRef.current;
    const contentOwner = root?.closest<HTMLElement>('.member-shared-popup-content');
    contentOwner?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    root?.querySelectorAll<HTMLElement>([
      '.member-source-promotion-grid',
      '.member-source-activity-list',
      '.member-source-activity-detail',
      '.member-source-news-list',
    ].join(',')).forEach((owner) => owner.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void loadPublicPromotionCampaigns(controller.signal).then((nextCampaigns) => {
      if (!cancelled) {
        setCampaigns(nextCampaigns.length > 0 ? nextCampaigns : PROMOTION_ASSET_CAMPAIGNS);
      }
    }).catch(() => {
      if (!cancelled) setCampaigns(PROMOTION_ASSET_CAMPAIGNS);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(resetPopupScroll);
    return () => cancelAnimationFrame(frame);
  }, [category, resetPopupScroll, selectedActivityId, selectedCampaign, view]);

  const visibleCampaigns = useMemo(() => campaigns
    .filter((item) => item.enabled && item.lifecycle === 'published')
    .filter((item) => category === 'all' || item.memberCategory === category)
    .sort((left, right) => right.priority - left.priority), [campaigns, category]);

  const activities = useMemo(() => buildActivities(content), [content]);
  const newsItems = useMemo(() => buildNews(content), [content]);
  const selectedActivity = activities.find((item) => item.id === selectedActivityId) ?? activities[0] ?? null;

  if (selectedCampaign) {
    return (
      <section
        ref={popupRootRef}
        className="member-source-content-popup member-source-promotion-detail"
        data-source-popup-view="promotion-detail"
      >
        <ResponsiveSourceImage
          desktop={selectedCampaign.desktopImageUrl || selectedCampaign.imageUrl}
          mobile={selectedCampaign.mobileImageUrl}
          fallback={selectedCampaign.sourceImageUrl}
          alt={selectedCampaign.title}
        />
        <h3>{selectedCampaign.title}</h3>
        <p>{selectedCampaign.description}</p>
        <dl>
          <div><dt>ฝากขั้นต่ำ</dt><dd>{formatMoney(selectedCampaign.minDeposit)}</dd></div>
          <div><dt>โบนัสสูงสุด</dt><dd>{formatMoney(selectedCampaign.maxBonus)}</dd></div>
          <div><dt>ยอดเทิร์น</dt><dd>x{selectedCampaign.turnoverMultiplier}</dd></div>
        </dl>
        <div className="member-source-promotion-detail-copy">
          {plainText(selectedCampaign.detailHtml) ? <p>{plainText(selectedCampaign.detailHtml)}</p> : null}
          {plainText(selectedCampaign.termsHtml) ? <p>{plainText(selectedCampaign.termsHtml)}</p> : null}
        </div>
      </section>
    );
  }

  if (view === 'activity') {
    return (
      <section
        ref={popupRootRef}
        className="member-source-content-popup member-source-activity-popup"
        data-source-popup-view="activity"
      >
        <div className="member-source-activity-list" role="listbox" aria-label="รายการกิจกรรม">
          {activities.map((item) => {
            const active = item.id === selectedActivity?.id;
            return (
              <button
                type="button"
                key={item.id}
                className={active ? 'is-active' : ''}
                aria-selected={active}
                onClick={() => setSelectedActivityId(item.id)}
              >
                <SourceImage src={item.thumbnail} fallback={item.banner} alt="" />
                <span>
                  <strong>{item.title}</strong>
                  <i />
                  {item.expiresAt ? <small>หมดเขต : {item.expiresAt}</small> : null}
                </span>
              </button>
            );
          })}
        </div>
        <span className="member-source-activity-divider" aria-hidden="true" />
        {selectedActivity
          ? <ActivityDetail key={selectedActivity.id} item={selectedActivity} />
          : <EmptyState label="ยังไม่มีกิจกรรม" />}
      </section>
    );
  }

  if (view === 'news') {
    return (
      <section
        ref={popupRootRef}
        className="member-source-content-popup member-source-news-popup"
        data-source-popup-view="news"
      >
        {newsItems.length > 0 ? (
          <div className="member-source-news-list">
            {newsItems.map((item) => (
              <article key={item.id}>
                {item.image ? <SourceImage src={item.image} alt="" /> : null}
                <div><h3>{item.title}</h3><p>{item.summary}</p></div>
              </article>
            ))}
          </div>
        ) : <EmptyState label="ไม่มีข้อความใหม่" />}
      </section>
    );
  }

  return (
    <section
      ref={popupRootRef}
      className="member-source-content-popup member-source-promotion-popup"
      data-source-popup-view="promotion"
    >
      <nav className="member-source-promotion-categories" aria-label="หมวดโปรโมชั่น">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            className={category === option.value ? 'is-active' : ''}
            onClick={() => setCategory(option.value)}
          >
            {option.label}
          </button>
        ))}
      </nav>
      <div className="member-source-promotion-grid">
        {visibleCampaigns.map((campaign) => (
          <button
            type="button"
            key={campaign.id}
            className="member-source-promotion-card"
            onClick={() => {
              setSelectedCampaign(campaign);
              onDetailOpenChange?.(true);
            }}
          >
            <ResponsiveSourceImage
              desktop={campaign.desktopImageUrl || campaign.imageUrl}
              mobile={campaign.mobileImageUrl}
              fallback={campaign.sourceImageUrl}
              alt={campaign.title}
            />
            <strong>{campaign.title}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function ActivityDetail({ item }: { item: ActivityItem }) {
  return (
    <article className="member-source-activity-detail">
      <h3>{item.title}</h3>
      {item.statusLabel ? <span className="member-source-activity-status">{item.statusLabel}</span> : null}
      <SourceImage src={item.banner} fallback={item.thumbnail} alt={item.title} />
      <h4>{item.summary}</h4>
      {item.numberPrediction ? (
        <>
          <p className="member-source-activity-instruction">กรุณาทายผลให้ครบทั้ง 3 ตัวบน และ 2 ตัวล่าง</p>
          <div className="member-source-number-inputs">
            <label><strong>ระบุตัวเลขท้าย 3 ตัวบน</strong><input inputMode="numeric" maxLength={3} /></label>
            <label><strong>ระบุตัวเลขท้าย 2 ตัวล่าง</strong><input inputMode="numeric" maxLength={2} /></label>
          </div>
        </>
      ) : null}
      <details>
        <summary>เงื่อนไขเข้าร่วมกิจกรรม</summary>
        <ul>{item.terms.map((term) => <li key={term}>{term}</li>)}</ul>
      </details>
    </article>
  );
}

function SourceImage({
  src,
  fallback = '',
  alt,
  className = '',
}: {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
}) {
  const primarySource = sourceAsset(src || fallback);
  const fallbackSource = sourceAsset(fallback);
  const identity = `${primarySource}|${fallbackSource}`;
  const [failedIdentity, setFailedIdentity] = useState('');

  if (!primarySource || failedIdentity === identity) {
    return <span className={`member-source-image-placeholder ${className}`.trim()} aria-hidden="true" />;
  }

  return (
    <img
      key={identity}
      src={primarySource}
      alt={alt}
      className={className || undefined}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        const image = event.currentTarget;
        if (fallbackSource && image.dataset.fallback !== 'true') {
          image.dataset.fallback = 'true';
          image.src = fallbackSource;
          return;
        }
        setFailedIdentity(identity);
      }}
    />
  );
}

function ResponsiveSourceImage({
  desktop,
  mobile = '',
  fallback = '',
  alt,
  className = '',
}: ResponsiveSourceProps) {
  const desktopSource = sourceAsset(desktop || fallback);
  const mobileSource = sourceAsset(mobile || desktop || fallback);
  const fallbackSource = sourceAsset(fallback);
  const identity = `${desktopSource}|${mobileSource}|${fallbackSource}`;
  const [failedIdentity, setFailedIdentity] = useState('');

  if (!desktopSource || failedIdentity === identity) {
    return (
      <span
        className={`member-source-image-placeholder member-source-responsive-placeholder ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  return (
    <picture key={identity} className={className || undefined}>
      <source media="(max-width: 640px)" srcSet={mobileSource || desktopSource} />
      <img
        src={desktopSource}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          const image = event.currentTarget;
          if (fallbackSource && image.dataset.fallback !== 'true') {
            image.dataset.fallback = 'true';
            image.parentElement?.querySelector('source')?.remove();
            image.src = fallbackSource;
            return;
          }
          setFailedIdentity(identity);
        }}
      />
    </picture>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="member-source-empty-state" role="status">
      <svg xmlns="http://www.w3.org/2000/svg" width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
        <path d="M87.4313 36.6079H23.2148V72.7297C23.2148 74.8586 24.0605 76.9003 25.5659 78.4057C27.0713 79.911 29.113 80.7567 31.2419 80.7567H79.4043C81.5332 80.7567 83.5749 79.911 85.0803 78.4057C86.5856 76.9003 87.4313 74.8586 87.4313 72.7297V36.6079Z" fill="#e0b1f1" />
        <rect x="47.8984" y="46.6665" width="14.7373" height="4.91244" rx="2.45622" fill="#a800cb" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7.75354 17.3131C5.69718 17.8641 3.94392 19.2094 2.87946 21.0531C1.81501 22.8968 1.52655 25.0878 2.07756 27.1442L4.15511 34.8977C4.70611 36.9541 6.05144 38.7073 7.89513 39.7718C9.73881 40.8362 11.9298 41.1247 13.9862 40.5737L70.8455 25.3383C72.9019 24.7873 74.6552 23.442 75.7196 21.5983C76.7841 19.7546 77.0725 17.5636 76.5215 15.5072L74.444 7.75365C73.893 5.69728 72.5476 3.94402 70.7039 2.87957C68.8603 1.81511 66.6692 1.52666 64.6129 2.07766L7.75354 17.3131Z" fill="#a800cb" />
        <path d="M68.7734 34.9999C68.7734 34.9999 88.4232 29.4736 85.3529 23.3325C83.6882 20.0027 78.9134 20.2331 76.1421 22.7188C72.9487 25.5831 73.0805 33.1571 77.3702 33.1571C80.4405 33.1571 87.8092 33.7712 93.3356 30.7009C101.991 25.8924 103.775 22.1041 106.231 16.5776" stroke="#e0b1f1" strokeWidth="1.22811" strokeLinecap="round" strokeDasharray="2.46 2.46" />
        <path fillRule="evenodd" clipRule="evenodd" d="M112.255 7.82712C112.565 6.82343 111.295 6.09573 110.586 6.87357L110.558 6.90437L110.503 6.9649C110.112 7.39089 109.603 7.69103 109.04 7.82732C108.478 7.96361 107.888 7.9299 107.344 7.73046C106.326 7.3579 105.558 8.68737 106.391 9.38219C106.837 9.75445 107.162 10.2512 107.324 10.8089C107.487 11.3667 107.479 11.9602 107.303 12.5137L107.27 12.6186C106.95 13.6205 108.214 14.3572 108.929 13.5858L109.017 13.492C109.411 13.067 109.922 12.768 110.486 12.6326C111.05 12.4972 111.642 12.5314 112.186 12.7309C113.207 13.1047 113.976 11.7731 113.141 11.076C112.686 10.6957 112.355 10.1864 112.194 9.61509C112.033 9.04372 112.049 8.43699 112.239 7.87458L112.255 7.82712Z" fill="#e0b1f1" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function buildActivities(content: CmsContent): ActivityItem[] {
  const source = (content.announcements ?? []).filter((item) => item.enabled
    && item.lifecycle !== 'draft'
    && item.lifecycle !== 'archived'
    && item.kind === 'event');
  if (source.length === 0) return SOURCE_ACTIVITY_FALLBACK;

  return source.map((item, index) => {
    const media = cmsResponsiveMediaUrls(content, item);
    const raw = item as unknown as Record<string, unknown>;
    const title = item.title || `กิจกรรม ${index + 1}`;
    const expiresAt = firstText(raw.endsAt, raw.expiresAt, raw.endDate);
    const defaultImage = firstText(media.desktop, media.mobile, item.imageUrl);
    const thumbnail = sourceAsset(firstText(
      raw.thumbnailImageUrl,
      raw.thumbnailUrl,
      raw.cardImageUrl,
      raw.listImageUrl,
      defaultImage,
    ));
    const banner = sourceAsset(firstText(
      raw.bannerImageUrl,
      raw.detailImageUrl,
      raw.heroImageUrl,
      raw.coverImageUrl,
      defaultImage,
      thumbnail,
    ));
    const numberPrediction = booleanValue(raw.numberPrediction)
      || firstText(raw.activityType, raw.eventType).toLowerCase() === 'lottery'
      || /หวย|lottery/i.test(title);
    const terms = stringList(raw.terms);

    return {
      id: item.id || `activity-${index + 1}`,
      title,
      summary: item.message || title,
      expiresAt,
      thumbnail,
      banner,
      terms: terms.length > 0 ? terms : ['ตรวจสอบรายละเอียดและเงื่อนไขก่อนเข้าร่วมกิจกรรม'],
      statusLabel: firstText(raw.statusLabel, raw.statusText)
        || (expiresAt && isPastDate(expiresAt) ? 'หมดเวลาทายผล' : ''),
      numberPrediction,
    };
  });
}

function buildNews(content: CmsContent): NewsItem[] {
  const source = (content.announcements ?? []).filter((item) => item.enabled
    && item.lifecycle !== 'draft'
    && item.lifecycle !== 'archived'
    && item.kind === 'news');

  return source.map((item, index) => {
    const media = cmsResponsiveMediaUrls(content, item);
    return {
      id: item.id || `news-${index + 1}`,
      title: item.title || `ข่าวสาร ${index + 1}`,
      summary: item.message || '',
      image: sourceAsset(firstText(media.desktop, media.mobile, item.imageUrl)),
    };
  });
}

function sourceAsset(url: string) {
  return resolveLocalAssetOrSource(url, 'pc');
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      .map((item) => item.trim());
  }
  if (typeof value !== 'string') return [];
  return value.split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean);
}

function booleanValue(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function isPastDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp < Date.now();
}

function plainText(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMoney(value: number) {
  return value > 0 ? `${value.toLocaleString('th-TH')} บาท` : '-';
}
