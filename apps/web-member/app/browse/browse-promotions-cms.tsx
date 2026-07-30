'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { V47_ASSETS } from '../components/member-home/v47-asset-map';
import { useMemberSession } from '../member-session-provider';
import {
  cmsContentSetting,
  cmsResponsiveMediaUrls,
  loadPublicSiteSettings,
  promotionCampaignsSetting,
  promotionMediaUrls,
  type CmsContent,
} from '../site-settings';

export type PromotionView = 'all' | 'promotion' | 'activity' | 'news';

type BrowsePromotionsCmsProps = {
  embedded?: boolean;
  initialView?: PromotionView;
  onViewChange?: (view: PromotionView) => void;
};

type BrowsePromotion = {
  id: string;
  kind: Exclude<PromotionView, 'all'>;
  title: string;
  summary: string;
  terms: string[];
  expiresAt: string;
  desktopImage: string;
  mobileImage: string;
  fallbackImage: string;
  badge: string;
  href: string;
  priority: number;
};

const FALLBACK_ITEMS: BrowsePromotion[] = [
  {
    id: 'welcome-offer', kind: 'promotion', title: 'โปรโมชั่นพิเศษ', summary: 'รวมสิทธิพิเศษและโบนัสสำหรับสมาชิก ตรวจสอบรายละเอียดก่อนรับสิทธิ์ทุกครั้ง', terms: ['ใช้ได้ตามเงื่อนไขที่ประกาศ', 'ตรวจสอบยอดฝากขั้นต่ำก่อนรับสิทธิ์', 'สิทธิ์ขึ้นกับสถานะบัญชีสมาชิก'], expiresAt: 'ตามประกาศของเว็บไซต์', desktopImage: V47_ASSETS.promoBackgroundPromotion, mobileImage: V47_ASSETS.promoBackgroundPromotion, fallbackImage: V47_ASSETS.promoBackgroundPromotion, badge: 'PROMOTION', href: '/promotions', priority: 30,
  },
  {
    id: 'daily-activity', kind: 'activity', title: 'กิจกรรมประจำวัน', summary: 'ร่วมกิจกรรมและภารกิจที่เปิดให้สนุกตลอด 24 ชั่วโมง พร้อมรางวัลตามเงื่อนไข', terms: ['ทำตามภารกิจที่ระบุในกิจกรรม', 'รางวัลและจำนวนสิทธิ์เป็นไปตามประกาศ', 'ต้องเข้าสู่ระบบก่อนร่วมกิจกรรม'], expiresAt: 'ตามกำหนดการกิจกรรม', desktopImage: V47_ASSETS.promoBackgroundActivity, mobileImage: V47_ASSETS.promoBackgroundActivity, fallbackImage: V47_ASSETS.promoBackgroundActivity, badge: 'ACTIVITY', href: '/browse/promotions?view=activity', priority: 20,
  },
  {
    id: 'member-news', kind: 'news', title: 'ข่าวสารล่าสุด', summary: 'ติดตามประกาศ เกมใหม่ โปรโมชั่น และข้อมูลบริการสำคัญจาก NOAH345', terms: ['ข้อมูลอาจมีการปรับปรุงได้', 'ตรวจสอบวันมีผลในแต่ละประกาศ', 'ติดต่อเจ้าหน้าที่หากต้องการความช่วยเหลือ'], expiresAt: 'ไม่มีวันหมดอายุ', desktopImage: V47_ASSETS.promoBackgroundNews, mobileImage: V47_ASSETS.promoBackgroundNews, fallbackImage: V47_ASSETS.promoBackgroundNews, badge: 'NEWS', href: '/browse/promotions?view=news', priority: 10,
  },
];

export function BrowsePromotionsCms({
  embedded = false,
  initialView: initialViewOverride,
  onViewChange,
}: BrowsePromotionsCmsProps = {}) {
  const { isLoggedIn, ready } = useMemberSession();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const routeInitialView: PromotionView = requestedView === 'promotion' || requestedView === 'activity' || requestedView === 'news'
    ? requestedView
    : 'all';
  const resolvedInitialView = initialViewOverride ?? routeInitialView;
  const [view, setView] = useState<PromotionView>(resolvedInitialView);
  const [content, setContent] = useState<CmsContent | null>(null);
  const [items, setItems] = useState<BrowsePromotion[]>(FALLBACK_ITEMS);

  useEffect(() => {
    setView(initialViewOverride ?? routeInitialView);
  }, [initialViewOverride, routeInitialView]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const settings = await loadPublicSiteSettings();
      if (cancelled) return;
      const cms = cmsContentSetting(settings);
      const next = buildItems(cms, promotionCampaignsSetting(settings));
      setContent(cms);
      setItems(next.length ? next : FALLBACK_ITEMS);
    })();
    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(
    () => view === 'all' ? items : items.filter((item) => item.kind === view),
    [items, view],
  );
  const shortcuts = useMemo(
    () => (['promotion', 'activity', 'news'] as const).map((kind) => items.find((item) => item.kind === kind) ?? FALLBACK_ITEMS.find((item) => item.kind === kind)!),
    [items],
  );

  function selectView(nextView: PromotionView) {
    setView(nextView);
    onViewChange?.(nextView);
    if (embedded) return;
    const query = nextView === 'all' ? '' : `?view=${encodeURIComponent(nextView)}`;
    window.history.replaceState(null, '', `/browse/promotions${query}`);
  }

  function claimPromotion(item: BrowsePromotion) {
    if (!ready || !isLoggedIn) return redirectToLogin();
    window.location.assign(item.kind === 'promotion' ? item.href || '/promotions' : item.href || '/browse/promotions');
  }

  return (
    <main className={`browse-page browse-page--promotions${embedded ? ' browse-page--embedded' : ''}`}>
      {!embedded ? (
        <>
          <SourceHero title="โปรโมชั่นและกิจกรรม" description="รวมสิทธิพิเศษ กิจกรรม และข่าวสารที่อัปเดตจาก Content Center" />
          <AnnouncementStrip text={content?.announcements.find((item) => item.enabled)?.message || 'ดูรายละเอียดได้โดยไม่ต้องเข้าสู่ระบบ และเข้าสู่ระบบเฉพาะตอนรับสิทธิ์'} />

          <nav className="browse-source-shortcuts" aria-label="ประเภทเนื้อหา">
            {shortcuts.map((item) => (
              <button key={item.kind} type="button" className={view === item.kind ? 'is-active' : ''} onClick={() => selectView(item.kind)}>
                <ResponsiveAsset desktop={item.desktopImage} mobile={item.mobileImage} fallback={item.fallbackImage} alt="" className="browse-source-shortcut-background" />
                <AssetImage src={promotionIcon(item.kind)} alt="" className="browse-source-shortcut-icon" />
                <span><strong>{promotionKindLabel(item.kind)}</strong><small>{item.summary}</small></span>
              </button>
            ))}
          </nav>
        </>
      ) : null}

      <section className="browse-source-promotion-panel">
        <header className="browse-source-panel-heading browse-source-panel-heading--promotion">
          <span><AssetImage src={V47_ASSETS.menuPromotion} alt="" className="browse-source-heading-icon" /><strong>{promotionViewLabel(view)}</strong></span>
          <div className="browse-source-promotion-tabs">
            <button type="button" className={view === 'all' ? 'is-active' : ''} onClick={() => selectView('all')}>ทั้งหมด</button>
            <button type="button" className={view === 'promotion' ? 'is-active' : ''} onClick={() => selectView('promotion')}>โปรโมชั่น</button>
            <button type="button" className={view === 'activity' ? 'is-active' : ''} onClick={() => selectView('activity')}>กิจกรรม</button>
            <button type="button" className={view === 'news' ? 'is-active' : ''} onClick={() => selectView('news')}>ข่าวสาร</button>
          </div>
        </header>

        {visibleItems.length ? (
          <div className="browse-source-promotion-grid">
            {visibleItems.map((item) => (
              <article key={`${item.kind}-${item.id}`} className="browse-source-promotion-card">
                <a href={safeBrowseHref(item)} className="browse-source-promotion-image-link" aria-label={`ดูรายละเอียด ${item.title}`}>
                  <ResponsiveAsset desktop={item.desktopImage} mobile={item.mobileImage} fallback={item.fallbackImage} alt={item.title} className="browse-source-promotion-image" />
                  <span>{item.badge}</span>
                </a>
                <div className="browse-source-promotion-copy">
                  <span>{promotionKindLabel(item.kind)}</span>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <dl><div><dt>เงื่อนไข</dt><dd>{item.terms[0]}</dd></div><div><dt>วันหมดอายุ</dt><dd>{item.expiresAt}</dd></div></dl>
                  <footer>
                    <a href={safeBrowseHref(item)}>รายละเอียด</a>
                    {item.kind === 'promotion'
                      ? <button type="button" onClick={() => claimPromotion(item)}>{isLoggedIn && ready ? 'ไปหน้ารับสิทธิ์' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button>
                      : <a href={item.href || safeBrowseHref(item)}>อ่านต่อ</a>}
                  </footer>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="browse-empty"><strong>ยังไม่มีรายการที่เผยแพร่</strong><p>รายการ Draft และ Archived จะไม่แสดงในหน้า Member</p></section>
        )}
      </section>
    </main>
  );
}

function buildItems(content: CmsContent, campaigns: ReturnType<typeof promotionCampaignsSetting>): BrowsePromotion[] {
  const promotionItems: BrowsePromotion[] = campaigns
    .filter((item) => item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived')
    .map((item) => {
      const media = promotionMediaUrls(content, item);
      return {
        id: item.id,
        kind: 'promotion',
        title: item.title,
        summary: item.description,
        terms: [
          `ฝากขั้นต่ำ ${formatMoney(item.minDeposit)}`,
          `โบนัสสูงสุด ${formatMoney(item.maxBonus)}`,
          `ยอดเทิร์น x${item.turnoverMultiplier}`,
        ],
        expiresAt: item.endsAt || 'ตามประกาศของเว็บไซต์',
        desktopImage: media.desktop,
        mobileImage: media.mobile,
        fallbackImage: V47_ASSETS.promoBackgroundPromotion,
        badge: item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : formatMoney(item.bonusValue)),
        href: item.href || '/promotions',
        priority: Number(item.priority ?? 0),
      };
    });

  const contentItems: BrowsePromotion[] = content.announcements
    .filter((item) => item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived' && item.kind !== 'system')
    .map((item, index) => {
      const kind: BrowsePromotion['kind'] = item.kind === 'event' ? 'activity' : item.kind === 'news' ? 'news' : 'promotion';
      const media = cmsResponsiveMediaUrls(content, item);
      const fallback = kind === 'activity'
        ? V47_ASSETS.promoBackgroundActivity
        : kind === 'news'
          ? V47_ASSETS.promoBackgroundNews
          : V47_ASSETS.promoBackgroundPromotion;
      return {
        id: item.id || `content-${index + 1}`,
        kind,
        title: item.title,
        summary: item.message,
        terms: ['ตรวจสอบรายละเอียดในประกาศ', 'เงื่อนไขอาจเปลี่ยนแปลงตามช่วงเวลา', 'ติดต่อเจ้าหน้าที่เมื่อมีข้อสงสัย'],
        expiresAt: kind === 'news' ? 'ไม่มีวันหมดอายุ' : 'ตามกำหนดการประกาศ',
        desktopImage: media.desktop,
        mobileImage: media.mobile,
        fallbackImage: fallback,
        badge: kind === 'activity' ? 'ACTIVITY' : kind === 'news' ? 'NEWS' : 'PROMOTION',
        href: item.href || `/browse/promotions?view=${kind}`,
        priority: 1000 - index,
      };
    });

  return [...promotionItems, ...contentItems]
    .sort((a, b) => b.priority - a.priority)
    .filter((item, index, all) => all.findIndex((candidate) => `${candidate.kind}:${candidate.id}` === `${item.kind}:${item.id}`) === index);
}

function ResponsiveAsset({ desktop, mobile, fallback, alt, className }: { desktop: string; mobile: string; fallback: string; alt: string; className: string }) {
  const [source, setSource] = useState({ desktop: desktop || fallback, mobile: mobile || desktop || fallback, fallback: false });
  useEffect(() => setSource({ desktop: desktop || fallback, mobile: mobile || desktop || fallback, fallback: false }), [desktop, mobile, fallback]);
  const onError = () => {
    if (!source.fallback && fallback) setSource({ desktop: fallback, mobile: fallback, fallback: true });
  };
  if (!source.desktop) return <span className={`${className} browse-missing-asset`}>MISSING ASSET</span>;
  return <picture><source media="(max-width: 640px)" srcSet={source.mobile} /><img className={className} src={source.desktop} alt={alt} loading="lazy" decoding="async" onError={onError} /></picture>;
}

function SourceHero({ title, description }: { title: string; description: string }) {
  return <section className="browse-source-hero"><div className="browse-source-hero__copy"><span>NOAH345 PUBLIC LOBBY</span><h1>{title}</h1><p>{description}</p></div><div className="browse-source-jackpot" aria-label="Jackpot"><small>JACKPOTS</small><strong>195,574,797</strong><span>ลุ้นแจ็คพอตได้ทุกวัน</span></div></section>;
}

function AnnouncementStrip({ text }: { text: string }) {
  return <div className="browse-source-announcement"><AssetImage src={V47_ASSETS.announcement} alt="" className="browse-source-announcement-icon" /><div><span>{text}</span><span aria-hidden="true">{text}</span></div></div>;
}

function AssetImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [missing, setMissing] = useState(false);
  if (missing || !src) return <span className={`${className} browse-missing-asset`}>MISSING ASSET</span>;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setMissing(true)} />;
}

function promotionKindLabel(kind: BrowsePromotion['kind']) { return kind === 'activity' ? 'กิจกรรม' : kind === 'news' ? 'ข่าวสาร' : 'โปรโมชั่น'; }
function promotionViewLabel(view: PromotionView) { return view === 'activity' ? 'กิจกรรม' : view === 'news' ? 'ข่าวสาร' : view === 'promotion' ? 'โปรโมชั่น' : 'โปรโมชั่น กิจกรรม และข่าวสาร'; }
function promotionIcon(kind: BrowsePromotion['kind']) { return kind === 'activity' ? V47_ASSETS.menuActivity : kind === 'news' ? V47_ASSETS.menuNews : V47_ASSETS.menuPromotion; }
function safeBrowseHref(item: BrowsePromotion) { return item.href.startsWith('/') ? item.href : `/browse/promotions?view=${item.kind}`; }
function redirectToLogin() { const next = window.location.pathname + window.location.search; window.location.assign(`/login?next=${encodeURIComponent(next)}`); }
function formatMoney(value: number) { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value); }
