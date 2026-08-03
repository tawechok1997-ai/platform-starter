'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PromotionView } from '../browse/browse-promotions-cms';
import { memberApiFetch } from '../member-api';
import { resolveLocalAssetOrSource } from '../lib/local-asset-by-basename';
import {
  PROMOTION_ASSET_CAMPAIGNS,
  type MemberPromotionCampaign,
  type PromotionMemberCategory,
} from '../promotion-campaign-runtime';
import { cmsContentSetting, cmsResponsiveMediaUrls, type CmsContent } from '../site-settings';
import { useSiteSettings } from '../site-settings-provider';
import { useMemberSession } from '../member-session-provider';
import { loadLivePromotionCampaigns } from './member-source-content-runtime';

const CATEGORY_OPTIONS: Array<{ value: 'all' | PromotionMemberCategory; label: string }> = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'new_member', label: 'สมาชิกใหม่' },
  { value: 'daily', label: 'ประจำวัน' },
  { value: 'privilege', label: 'สิทธิพิเศษ' },
  { value: 'cashback', label: 'คืนยอดเสีย' },
];

type Props = {
  view: PromotionView;
  detailBackSignal?: number;
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

type CampaignLoadState = 'loading' | 'ready' | 'error';

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

export default function MemberSourceContentPopup({
  view,
  detailBackSignal = 0,
  onDetailOpenChange,
}: Props) {
  const { ready, isLoggedIn } = useMemberSession();
  const { settings, reload } = useSiteSettings();
  const content = useMemo(() => cmsContentSetting(settings), [settings]);
  const demoEnabled = settings.features?.presentation_demo_enabled === true;
  const popupRootRef = useRef<HTMLElement | null>(null);
  const [campaigns, setCampaigns] = useState<MemberPromotionCampaign[]>([]);
  const [campaignLoadState, setCampaignLoadState] = useState<CampaignLoadState>('loading');
  const [category, setCategory] = useState<'all' | PromotionMemberCategory>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<MemberPromotionCampaign | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

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
    void reload();
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setCampaignLoadState('loading');

    void loadLivePromotionCampaigns(controller.signal).then((nextCampaigns) => {
      if (cancelled) return;
      setCampaigns(nextCampaigns.length > 0
        ? nextCampaigns
        : demoEnabled
          ? PROMOTION_ASSET_CAMPAIGNS
          : []);
      setCampaignLoadState('ready');
    }).catch(() => {
      if (cancelled) return;
      setCampaigns(demoEnabled ? PROMOTION_ASSET_CAMPAIGNS : []);
      setCampaignLoadState('error');
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [demoEnabled]);

  useEffect(() => {
    setCategory('all');
    setSelectedActivityId('');
    setSelectedCampaign(null);
    setClaimMessage('');
    onDetailOpenChange?.(false);
  }, [onDetailOpenChange, view]);

  useEffect(() => {
    if (detailBackSignal <= 0) return;
    setSelectedCampaign(null);
    setClaimMessage('');
    onDetailOpenChange?.(false);
  }, [detailBackSignal, onDetailOpenChange]);

  useEffect(() => {
    const frame = requestAnimationFrame(resetPopupScroll);
    return () => cancelAnimationFrame(frame);
  }, [category, detailBackSignal, resetPopupScroll, selectedCampaign, view]);

  const visibleCampaigns = useMemo(() => campaigns
    .filter((item) => item.enabled && item.lifecycle === 'published')
    .filter((item) => category === 'all' || item.memberCategory === category)
    .sort((left, right) => right.priority - left.priority), [campaigns, category]);

  const activities = useMemo(() => buildActivities(content, demoEnabled), [content, demoEnabled]);
  const newsItems = useMemo(() => buildNews(content), [content]);
  const selectedActivity = activities.find((item) => item.id === selectedActivityId) ?? activities[0] ?? null;

  useEffect(() => {
    if (activities.length === 0) return;
    if (!activities.some((item) => item.id === selectedActivityId)) {
      setSelectedActivityId(activities[0]?.id ?? '');
    }
  }, [activities, selectedActivityId]);

  async function claimCampaign(campaign: MemberPromotionCampaign) {
    if (claiming) return;
    if (!ready || !isLoggedIn) {
      const next = `${location.pathname}${location.search}`;
      dispatchEvent(new CustomEvent('member:auth-open', { detail: { mode: 'login', next } }));
      return;
    }

    setClaiming(true);
    setClaimMessage('กำลังส่งคำขอรับโปรโมชั่น...');
    try {
      const response = await memberApiFetch('/member/promotion-claims', {
        method: 'POST',
        body: JSON.stringify({ campaignId: campaign.id, note: `ขอรับโปรโมชั่น ${campaign.title}` }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const message = response.ok
        ? campaign.claimSuccessMessage
        : text(record(payload).message, 'รับโปรโมชั่นไม่สำเร็จ กรุณาตรวจสอบเงื่อนไข');
      setClaimMessage(message);
    } catch {
      setClaimMessage('เชื่อมต่อระบบโปรโมชั่นไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setClaiming(false);
    }
  }

  if (selectedCampaign) {
    return (
      <section
        ref={popupRootRef}
        className="member-source-content-popup member-source-promotion-detail"
        data-source-popup-view="promotion-detail"
        data-content-source={demoEnabled ? 'demo' : 'api'}
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
        {claimMessage ? <p className="member-source-claim-message" role="status">{claimMessage}</p> : null}
        <button type="button" className="member-source-claim-button" disabled={claiming} onClick={() => void claimCampaign(selectedCampaign)}>
          {claiming ? 'กำลังส่งคำขอ...' : selectedCampaign.claimButtonLabel}
        </button>
      </section>
    );
  }

  if (view === 'activity') {
    return (
      <section
        ref={popupRootRef}
        className="member-source-content-popup member-source-activity-popup"
        data-source-popup-view="activity"
        data-content-source={demoEnabled ? 'demo' : 'cms'}
      >
        <div className="member-source-activity-list" role="listbox" aria-label="รายการกิจกรรม">
          {activities.map((item) => {
            const active = item.id === selectedActivity?.id;
            return (
              <button
                type="button"
                role="option"
                key={item.id}
                className={active ? 'is-active' : ''}
                aria-selected={active}
                onClick={() => setSelectedActivityId(item.id)}
              >
                <SourceImage src={item.thumbnail} fallback={item.banner} alt="" />
                <span><strong>{item.title}</strong><i />{item.expiresAt ? <small>หมดเขต : {item.expiresAt}</small> : null}</span>
              </button>
            );
          })}
        </div>
        <span className="member-source-activity-divider" aria-hidden="true" />
        {selectedActivity ? <ActivityDetail item={selectedActivity} /> : <EmptyState label="ยังไม่มีกิจกรรม" />}
      </section>
    );
  }

  if (view === 'news') {
    return (
      <section
        ref={popupRootRef}
        className="member-source-content-popup member-source-news-popup"
        data-source-popup-view="news"
        data-content-source="cms"
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
      data-content-source={demoEnabled ? 'demo' : 'api'}
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
        {visibleCampaigns.length > 0 ? visibleCampaigns.map((campaign) => (
          <button
            type="button"
            key={campaign.id}
            className="member-source-promotion-card"
            onClick={() => {
              setSelectedCampaign(campaign);
              setClaimMessage('');
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
        )) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState label={promotionEmptyLabel(campaignLoadState)} />
          </div>
        )}
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

function SourceImage({ src, fallback = '', alt, className = '' }: { src: string; fallback?: string; alt: string; className?: string }) {
  const initial = sourceAsset(src || fallback);
  const fallbackSource = sourceAsset(fallback);
  const [current, setCurrent] = useState(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(sourceAsset(src || fallback));
    setFailed(false);
  }, [fallback, src]);

  if (!current || failed) {
    return <span className={`member-source-image-placeholder ${className}`.trim()} aria-hidden="true" />;
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className || undefined}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (fallbackSource && current !== fallbackSource) setCurrent(fallbackSource);
        else setFailed(true);
      }}
    />
  );
}

function ResponsiveSourceImage({ desktop, mobile = '', fallback = '', alt, className = '' }: ResponsiveSourceProps) {
  const fallbackSource = sourceAsset(fallback);
  const [sources, setSources] = useState(() => createResponsiveSources(desktop, mobile, fallback));

  useEffect(() => {
    setSources(createResponsiveSources(desktop, mobile, fallback));
  }, [desktop, fallback, mobile]);

  if (!sources.desktop || sources.failed) {
    return <span className={`member-source-image-placeholder member-source-responsive-placeholder ${className}`.trim()} aria-hidden="true" />;
  }

  return (
    <picture className={className || undefined}>
      <source media="(max-width: 640px)" srcSet={sources.mobile || sources.desktop} />
      <img
        src={sources.desktop}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (fallbackSource && sources.desktop !== fallbackSource) {
            setSources({ desktop: fallbackSource, mobile: fallbackSource, failed: false });
          } else {
            setSources((current) => ({ ...current, failed: true }));
          }
        }}
      />
    </picture>
  );
}

function createResponsiveSources(desktop: string, mobile: string, fallback: string) {
  return {
    desktop: sourceAsset(desktop || fallback),
    mobile: sourceAsset(mobile || desktop || fallback),
    failed: false,
  };
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="member-source-empty-state" role="status">
      <svg xmlns="http://www.w3.org/2000/svg" width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
        <path d="M23 18h64v55H23z" fill="#E0B1F1" />
        <path d="M9 17 67 2l8 24-58 15z" fill="#A800CB" />
        <rect x="48" y="47" width="15" height="5" rx="2.5" fill="#A800CB" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function buildActivities(content: CmsContent, allowDemoFallback: boolean): ActivityItem[] {
  const source = (content.announcements ?? []).filter((item) => item.enabled
    && item.lifecycle !== 'draft'
    && item.lifecycle !== 'archived'
    && item.kind === 'event');
  if (source.length === 0) return allowDemoFallback ? SOURCE_ACTIVITY_FALLBACK : [];

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

function promotionEmptyLabel(state: CampaignLoadState) {
  if (state === 'loading') return 'กำลังโหลดโปรโมชั่น...';
  if (state === 'error') return 'โหลดข้อมูลโปรโมชั่นไม่สำเร็จ';
  return 'ยังไม่มีโปรโมชั่น';
}

function sourceAsset(url: string) {
  return resolveLocalAssetOrSource(url, 'pc');
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
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
