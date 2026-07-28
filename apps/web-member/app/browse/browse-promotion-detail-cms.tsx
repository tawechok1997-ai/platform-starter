'use client';

import { useEffect, useMemo, useState } from 'react';
import { V47_ASSETS } from '../components/member-home/v47-asset-map';
import { useMemberSession } from '../member-session-provider';
import {
  cmsContentSetting,
  cmsResponsiveMediaUrls,
  loadPublicSiteSettings,
  promotionCampaignsSetting,
  promotionMediaUrls,
  type CmsContent,
  type PromotionCampaign,
} from '../site-settings';

type DetailItem = {
  id: string;
  kind: 'promotion' | 'activity' | 'news';
  title: string;
  summary: string;
  terms: string[];
  expiresAt: string;
  desktopImage: string;
  mobileImage: string;
  fallbackImage: string;
  badge: string;
  href: string;
};

export function BrowsePromotionDetailCms({ id }: { id: string }) {
  const { isLoggedIn, ready } = useMemberSession();
  const [content, setContent] = useState<CmsContent | null>(null);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const settings = await loadPublicSiteSettings();
      if (cancelled) return;
      setContent(cmsContentSetting(settings));
      setCampaigns(promotionCampaignsSetting(settings));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const item = useMemo(() => content ? findDetail(id, content, campaigns) : null, [campaigns, content, id]);

  function claimPromotion() {
    if (!item) return;
    if (!ready || !isLoggedIn) {
      const next = window.location.pathname + window.location.search;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    window.location.assign(item.href || '/promotions');
  }

  if (!loaded) {
    return <main className="browse-page"><section className="browse-empty"><strong>กำลังโหลดรายละเอียด...</strong><p>กำลังอ่านข้อมูลล่าสุดจาก Content Center</p></section></main>;
  }

  if (!item) {
    return <main className="browse-page"><section className="browse-empty"><strong>ไม่พบรายการที่ต้องการ</strong><p>รายการอาจถูกปิด เก็บถาวร หรือพ้นช่วงเผยแพร่แล้ว</p><a href="/browse/promotions">กลับไปหน้ารายการ</a></section></main>;
  }

  return <main className="browse-page browse-page--detail">
    <a className="browse-back" href="/browse/promotions">← กลับไปโปรโมชั่น</a>
    <article className="browse-detail">
      <ResponsiveDetailImage desktop={item.desktopImage} mobile={item.mobileImage} fallback={item.fallbackImage} alt={item.title} />
      <div className="browse-detail-copy">
        <span className="browse-eyebrow">{item.badge}</span>
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
        <section><h2>เงื่อนไข</h2><ul>{item.terms.map((term) => <li key={term}>{term}</li>)}</ul></section>
        <section><h2>วันหมดอายุ</h2><p>{item.expiresAt}</p></section>
        {item.kind === 'promotion'
          ? <button type="button" className="browse-primary-action browse-primary-action--wide" onClick={claimPromotion}>{isLoggedIn && ready ? 'ไปหน้ารับสิทธิ์' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button>
          : <a className="browse-primary-action browse-primary-action--wide" href={item.href || '/browse/promotions'}>อ่านประกาศ</a>}
      </div>
    </article>
  </main>;
}

function findDetail(id: string, content: CmsContent, campaigns: PromotionCampaign[]): DetailItem | null {
  const campaign = campaigns.find((item) => item.id === id && item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived' && inWindow(item));
  if (campaign) {
    const media = promotionMediaUrls(content, campaign);
    return {
      id: campaign.id,
      kind: 'promotion',
      title: campaign.title,
      summary: campaign.description,
      terms: [
        `ฝากขั้นต่ำ ${formatMoney(campaign.minDeposit)}`,
        `โบนัสสูงสุด ${formatMoney(campaign.maxBonus)}`,
        `ยอดเทิร์น x${campaign.turnoverMultiplier}`,
      ],
      expiresAt: campaign.endsAt || 'ตามประกาศของเว็บไซต์',
      desktopImage: media.desktop,
      mobileImage: media.mobile,
      fallbackImage: V47_ASSETS.promoBackgroundPromotion,
      badge: campaign.badgeText || (campaign.bonusType === 'percent' ? `${campaign.bonusValue}%` : formatMoney(campaign.bonusValue)),
      href: campaign.href || '/promotions',
    };
  }

  const announcement = content.announcements.find((item) => item.id === id && item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived' && item.kind !== 'system');
  if (!announcement) return null;
  const kind: DetailItem['kind'] = announcement.kind === 'event' ? 'activity' : announcement.kind === 'news' ? 'news' : 'promotion';
  const media = cmsResponsiveMediaUrls(content, announcement);
  const fallback = kind === 'activity'
    ? V47_ASSETS.promoBackgroundActivity
    : kind === 'news'
      ? V47_ASSETS.promoBackgroundNews
      : V47_ASSETS.promoBackgroundPromotion;
  return {
    id: announcement.id || id,
    kind,
    title: announcement.title,
    summary: announcement.message,
    terms: ['ตรวจสอบรายละเอียดในประกาศ', 'เงื่อนไขอาจเปลี่ยนแปลงตามช่วงเวลา', 'ติดต่อเจ้าหน้าที่เมื่อมีข้อสงสัย'],
    expiresAt: kind === 'news' ? 'ไม่มีวันหมดอายุ' : 'ตามกำหนดการประกาศ',
    desktopImage: media.desktop,
    mobileImage: media.mobile,
    fallbackImage: fallback,
    badge: kind === 'activity' ? 'ACTIVITY' : kind === 'news' ? 'NEWS' : 'PROMOTION',
    href: announcement.href || `/browse/promotions?view=${kind}`,
  };
}

function ResponsiveDetailImage({ desktop, mobile, fallback, alt }: { desktop: string; mobile: string; fallback: string; alt: string }) {
  const [sources, setSources] = useState({ desktop: desktop || fallback, mobile: mobile || desktop || fallback, fallback: false });
  useEffect(() => setSources({ desktop: desktop || fallback, mobile: mobile || desktop || fallback, fallback: false }), [desktop, fallback, mobile]);
  function handleError() {
    if (!sources.fallback && fallback) setSources({ desktop: fallback, mobile: fallback, fallback: true });
  }
  if (!sources.desktop) return <span className="browse-detail-image browse-missing-asset">MISSING ASSET</span>;
  return <picture><source media="(max-width: 640px)" srcSet={sources.mobile} /><img className="browse-detail-image" src={sources.desktop} alt={alt} loading="eager" decoding="async" onError={handleError} /></picture>;
}

function inWindow(item: PromotionCampaign) {
  const now = Date.now();
  const start = item.startsAt ? Date.parse(item.startsAt) : Number.NaN;
  const end = item.endsAt ? Date.parse(item.endsAt) : Number.NaN;
  return !(Number.isFinite(start) && now < start) && !(Number.isFinite(end) && now > end);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value);
}
