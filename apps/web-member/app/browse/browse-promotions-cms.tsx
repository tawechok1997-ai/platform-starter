'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberApiFetch } from '../member-api';
import { V47_ASSETS } from '../components/member-home/v47-asset-map';
import { useMemberSession } from '../member-session-provider';
import {
  loadPublicPromotionCampaigns,
  PROMOTION_ASSET_CAMPAIGNS,
  type MemberPromotionCampaign,
  type PromotionMemberCategory,
} from '../promotion-campaign-runtime';
import {
  cmsContentSetting,
  cmsResponsiveMediaUrls,
  loadPublicSiteSettings,
  type CmsContent,
} from '../site-settings';

export type PromotionView = 'all' | 'promotion' | 'activity' | 'news';

type BrowsePromotionsCmsProps = {
  embedded?: boolean;
  initialView?: PromotionView;
  onViewChange?: (view: PromotionView) => void;
  detailBackSignal?: number;
  onDetailOpenChange?: (open: boolean) => void;
};

type PromotionClaimStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | string;
type PromotionClaim = { id?: string; campaignId?: string; status?: PromotionClaimStatus; createdAt?: string };

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
  campaign?: MemberPromotionCampaign | undefined;
};

const PROMOTION_CATEGORY_OPTIONS: Array<{ value: 'all' | PromotionMemberCategory; label: string }> = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'new_member', label: 'สมาชิกใหม่' },
  { value: 'daily', label: 'ประจำวัน' },
  { value: 'privilege', label: 'สิทธิพิเศษ' },
  { value: 'cashback', label: 'คืนยอดเสีย' },
];

const FALLBACK_CONTENT_ITEMS: BrowsePromotion[] = [
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
  detailBackSignal = 0,
  onDetailOpenChange,
}: BrowsePromotionsCmsProps = {}) {
  const { isLoggedIn, ready } = useMemberSession();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const routeInitialView: PromotionView = requestedView === 'promotion' || requestedView === 'activity' || requestedView === 'news'
    ? requestedView
    : 'all';
  const resolvedInitialView = initialViewOverride ?? routeInitialView;
  const [view, setView] = useState<PromotionView>(resolvedInitialView);
  const [category, setCategory] = useState<'all' | PromotionMemberCategory>('all');
  const [content, setContent] = useState<CmsContent | null>(null);
  const [items, setItems] = useState<BrowsePromotion[]>(buildItems(null, PROMOTION_ASSET_CAMPAIGNS));
  const [selectedItem, setSelectedItem] = useState<BrowsePromotion | null>(null);
  const [claims, setClaims] = useState<PromotionClaim[]>([]);
  const [claimingId, setClaimingId] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [detailExpanded, setDetailExpanded] = useState(true);

  const closeDetail = useCallback(() => {
    setSelectedItem(null);
    setClaimMessage('');
    onDetailOpenChange?.(false);
  }, [onDetailOpenChange]);

  useEffect(() => {
    setView(initialViewOverride ?? routeInitialView);
    closeDetail();
  }, [closeDetail, initialViewOverride, routeInitialView]);

  useEffect(() => {
    if (detailBackSignal > 0) closeDetail();
  }, [closeDetail, detailBackSignal]);

  useEffect(() => () => onDetailOpenChange?.(false), [onDetailOpenChange]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    void (async () => {
      const [settings, campaigns] = await Promise.all([
        loadPublicSiteSettings(),
        loadPublicPromotionCampaigns(controller.signal),
      ]);
      if (cancelled) return;
      const cms = cmsContentSetting(settings);
      setContent(cms);
      setItems(buildItems(cms, campaigns));
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!ready || !isLoggedIn) {
      setClaims([]);
      return;
    }
    const controller = new AbortController();
    void memberApiFetch('/member/promotion-claims', {
      signal: controller.signal,
      suppressSessionExpiryRedirect: true,
    })
      .then(async (response) => response.ok ? response.json().catch(() => null) : null)
      .then((payload) => {
        if (!controller.signal.aborted) setClaims(Array.isArray(payload?.items) ? payload.items as PromotionClaim[] : []);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [isLoggedIn, ready]);

  const visibleItems = useMemo(() => {
    const byView = view === 'all' ? items : items.filter((item) => item.kind === view);
    if ((view === 'promotion' || view === 'all') && category !== 'all') {
      return byView.filter((item) => item.kind !== 'promotion' || item.campaign?.memberCategory === category);
    }
    return byView;
  }, [category, items, view]);

  const shortcuts = useMemo(() => (['promotion', 'activity', 'news'] as const).map((kind) => (
    items.find((item) => item.kind === kind)
    ?? FALLBACK_CONTENT_ITEMS.find((item) => item.kind === kind)
    ?? buildItems(null, PROMOTION_ASSET_CAMPAIGNS).find((item) => item.kind === kind)!
  )), [items]);

  const latestClaimByCampaign = useMemo(() => {
    const map = new Map<string, PromotionClaim>();
    for (const claim of claims) {
      const campaignId = String(claim.campaignId ?? '');
      if (!campaignId || map.has(campaignId)) continue;
      map.set(campaignId, claim);
    }
    return map;
  }, [claims]);

  function selectView(nextView: PromotionView) {
    closeDetail();
    setView(nextView);
    if (nextView !== 'promotion' && nextView !== 'all') setCategory('all');
    onViewChange?.(nextView);
    if (embedded) return;
    const query = nextView === 'all' ? '' : `?view=${encodeURIComponent(nextView)}`;
    window.history.replaceState(null, '', `/browse/promotions${query}`);
  }

  function openDetail(item: BrowsePromotion) {
    if (item.kind !== 'promotion' || !item.campaign) {
      window.location.assign(item.href || `/browse/promotions?view=${item.kind}`);
      return;
    }
    setSelectedItem(item);
    setDetailExpanded(true);
    setClaimMessage('');
    onDetailOpenChange?.(true);
  }

  async function claimPromotion(item: BrowsePromotion) {
    const campaign = item.campaign;
    if (!campaign || claimingId) return;
    if (!ready || !isLoggedIn) {
      redirectToLogin();
      return;
    }

    const existingStatus = latestClaimByCampaign.get(campaign.id)?.status;
    if (existingStatus === 'PENDING' || existingStatus === 'REVIEWING' || existingStatus === 'APPROVED') return;

    setClaimingId(campaign.id);
    setClaimMessage('กำลังส่งคำขอรับโปรโมชั่น...');
    try {
      const response = await memberApiFetch('/member/promotion-claims', {
        method: 'POST',
        body: JSON.stringify({ campaignId: campaign.id, note: `ขอรับโปรโมชั่น ${campaign.title}` }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setClaimMessage(String(payload?.message ?? 'รับโปรโมชั่นไม่สำเร็จ กรุณาตรวจสอบเงื่อนไข'));
        return;
      }
      const nextClaim = payload?.item as PromotionClaim | undefined;
      setClaims((current) => [nextClaim ?? { campaignId: campaign.id, status: 'PENDING' }, ...current]);
      setClaimMessage(campaign.claimSuccessMessage);
    } catch {
      setClaimMessage('เชื่อมต่อระบบโปรโมชั่นไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setClaimingId('');
    }
  }

  if (selectedItem?.campaign) {
    const status = latestClaimByCampaign.get(selectedItem.campaign.id)?.status;
    return (
      <PromotionDetail
        item={selectedItem}
        status={status}
        expanded={detailExpanded}
        claiming={claimingId === selectedItem.campaign.id}
        message={claimMessage}
        onToggle={() => setDetailExpanded((current) => !current)}
        onClaim={() => void claimPromotion(selectedItem)}
      />
    );
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

        {(view === 'promotion' || view === 'all') ? (
          <nav className="browse-promotion-category-tabs" aria-label="หมวดโปรโมชั่น">
            {PROMOTION_CATEGORY_OPTIONS.map((option) => (
              <button key={option.value} type="button" className={category === option.value ? 'is-active' : ''} onClick={() => setCategory(option.value)}>{option.label}</button>
            ))}
          </nav>
        ) : null}

        {visibleItems.length ? (
          <div className="browse-source-promotion-grid">
            {visibleItems.map((item) => (
              <article key={`${item.kind}-${item.id}`} className="browse-source-promotion-card">
                <button type="button" className="browse-source-promotion-image-link" aria-label={`ดูรายละเอียด ${item.title}`} onClick={() => openDetail(item)}>
                  <ResponsiveAsset desktop={item.desktopImage} mobile={item.mobileImage} fallback={item.fallbackImage} alt={item.title} className="browse-source-promotion-image" />
                  <span>{item.badge}</span>
                </button>
                <div className="browse-source-promotion-copy">
                  <span>{promotionKindLabel(item.kind)}</span>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <dl><div><dt>เงื่อนไข</dt><dd>{item.terms[0]}</dd></div><div><dt>วันหมดอายุ</dt><dd>{item.expiresAt}</dd></div></dl>
                  <footer>
                    <button type="button" onClick={() => openDetail(item)}>รายละเอียด</button>
                    {item.kind === 'promotion'
                      ? <button type="button" onClick={() => openDetail(item)}>{isLoggedIn && ready ? 'รับโปรโมชั่น' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button>
                      : <a href={item.href || `/browse/promotions?view=${item.kind}`}>อ่านต่อ</a>}
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

function PromotionDetail({
  item,
  status,
  expanded,
  claiming,
  message,
  onToggle,
  onClaim,
}: {
  item: BrowsePromotion;
  status: PromotionClaimStatus | undefined;
  expanded: boolean;
  claiming: boolean;
  message: string;
  onToggle: () => void;
  onClaim: () => void;
}) {
  const campaign = item.campaign!;
  const disabled = claiming || status === 'PENDING' || status === 'REVIEWING' || status === 'APPROVED';
  const buttonLabel = claiming ? 'กำลังส่งคำขอ...'
    : status === 'PENDING' || status === 'REVIEWING' ? 'รอตรวจสอบโปรโมชั่น'
      : status === 'APPROVED' ? 'รับโปรโมชั่นแล้ว'
        : campaign.claimButtonLabel;
  const detailHtml = sanitizePromotionHtml(campaign.detailHtml || `<p>${escapeHtml(campaign.description)}</p>`);
  const termsHtml = sanitizePromotionHtml(campaign.termsHtml);

  return (
    <main className="browse-promotion-detail-popup">
      <ResponsiveAsset
        desktop={item.desktopImage}
        mobile={item.mobileImage}
        fallback={item.fallbackImage}
        alt={item.title}
        className="browse-promotion-detail-popup__image"
      />
      <h1>{item.title}</h1>
      <div className="browse-promotion-detail-popup__meta">
        {campaign.minDeposit > 0 ? <span>ฝากขั้นต่ำ <strong>{formatMoney(campaign.minDeposit)}</strong></span> : null}
        {campaign.maxBonus > 0 ? <span>โบนัสสูงสุด <strong>{formatMoney(campaign.maxBonus)}</strong></span> : null}
        {campaign.turnoverMultiplier > 0 ? <span>เทิร์น <strong>x{campaign.turnoverMultiplier}</strong></span> : null}
      </div>
      <section className="browse-promotion-detail-popup__accordion">
        <button type="button" aria-expanded={expanded} onClick={onToggle}>
          <strong>รายละเอียด</strong>
          <svg viewBox="0 0 512 512" aria-hidden="true" className={expanded ? 'is-open' : ''}><path d="M256 217.9 383 345c9.4 9.4 24.6 9.4 33.9 0 9.4-9.4 9.3-24.6 0-34L273 167c-9.1-9.1-23.7-9.3-33.1-.7L95 310.9c-4.7 4.7-7 10.9-7 17s2.3 12.3 7 17c9.4 9.4 24.6 9.4 33.9 0L256 217.9Z" /></svg>
        </button>
        {expanded ? (
          <div className="browse-promotion-detail-popup__rich-text">
            <div dangerouslySetInnerHTML={{ __html: detailHtml }} />
            {termsHtml ? <div dangerouslySetInnerHTML={{ __html: termsHtml }} /> : null}
            {campaign.allowedGames ? <p><strong>เกมที่ร่วมรายการ:</strong> {campaign.allowedGames}</p> : null}
            {campaign.excludedGames ? <p><strong>เกมที่ไม่ร่วมรายการ:</strong> {campaign.excludedGames}</p> : null}
            {campaign.maxWithdrawal > 0 ? <p><strong>ถอนสูงสุด:</strong> {formatMoney(campaign.maxWithdrawal)}</p> : null}
          </div>
        ) : null}
      </section>
      {message ? <p className={`browse-promotion-detail-popup__message${status === 'APPROVED' ? ' is-success' : ''}`} role="status">{message}</p> : null}
      <button type="button" className="browse-promotion-detail-popup__claim" disabled={disabled} onClick={onClaim}>{buttonLabel}</button>
    </main>
  );
}

function buildItems(content: CmsContent | null, campaigns: MemberPromotionCampaign[]): BrowsePromotion[] {
  const promotionItems: BrowsePromotion[] = campaigns.map((item) => ({
    id: item.id,
    kind: 'promotion',
    title: item.title,
    summary: item.description,
    terms: [
      item.minDeposit > 0 ? `ฝากขั้นต่ำ ${formatMoney(item.minDeposit)}` : 'ตรวจสอบรายละเอียดโปรโมชั่น',
      item.maxBonus > 0 ? `โบนัสสูงสุด ${formatMoney(item.maxBonus)}` : 'รางวัลตามเงื่อนไข',
      item.turnoverMultiplier > 0 ? `ยอดเทิร์น x${item.turnoverMultiplier}` : 'ตรวจสอบเงื่อนไขก่อนรับสิทธิ์',
    ],
    expiresAt: item.endsAt ? formatDate(item.endsAt) : 'ตามประกาศของเว็บไซต์',
    desktopImage: item.desktopImageUrl || item.imageUrl,
    mobileImage: item.mobileImageUrl || item.desktopImageUrl || item.imageUrl,
    fallbackImage: item.sourceImageUrl || V47_ASSETS.promoBackgroundPromotion,
    badge: item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : formatMoney(item.bonusValue)),
    href: item.href,
    priority: item.priority,
    campaign: item,
  }));

  const sourceContent = content?.announcements ?? [];
  const contentItems: BrowsePromotion[] = sourceContent
    .filter((item) => item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived' && item.kind !== 'system')
    .map((item, index) => {
      const kind: BrowsePromotion['kind'] = item.kind === 'event' ? 'activity' : item.kind === 'news' ? 'news' : 'promotion';
      const media = content ? cmsResponsiveMediaUrls(content, item) : { desktop: '', mobile: '' };
      const fallback = kind === 'activity' ? V47_ASSETS.promoBackgroundActivity : kind === 'news' ? V47_ASSETS.promoBackgroundNews : V47_ASSETS.promoBackgroundPromotion;
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

  return [...promotionItems, ...contentItems, ...FALLBACK_CONTENT_ITEMS]
    .sort((a, b) => b.priority - a.priority)
    .filter((item, index, all) => all.findIndex((candidate) => `${candidate.kind}:${candidate.id}` === `${item.kind}:${item.id}`) === index);
}

function ResponsiveAsset({ desktop, mobile, fallback, alt, className }: { desktop: string; mobile: string; fallback: string; alt: string; className: string }) {
  const [source, setSource] = useState({ desktop: desktop || fallback, mobile: mobile || desktop || fallback, fallback: false });
  useEffect(() => setSource({ desktop: desktop || fallback, mobile: mobile || desktop || fallback, fallback: false }), [desktop, fallback, mobile]);
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
function redirectToLogin() { const next = window.location.pathname + window.location.search; window.location.assign(`/login?next=${encodeURIComponent(next)}`); }
function formatMoney(value: number) { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(date); }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] ?? character)); }

function sanitizePromotionHtml(value: string) {
  const withoutDangerousBlocks = value
    .replace(/<(script|style|iframe|object|embed|form|textarea|select|button)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|select|option|button|link|meta)[^>]*\/?>/gi, '');
  const allowed = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 'span', 'ul', 'ol', 'li', 'blockquote']);
  return withoutDangerousBlocks.replace(/<[^>]+>/g, (tag) => {
    const match = tag.match(/^<\s*(\/?)\s*([a-z0-9]+)/i);
    if (!match) return '';
    const closing = match[1] === '/';
    const name = match[2]?.toLowerCase() ?? '';
    if (!allowed.has(name)) return '';
    if (closing) return `</${name}>`;
    if (name === 'br' || name === 'hr') return `<${name}>`;
    if (name === 'span') {
      const color = tag.match(/color\s*:\s*(hsl\([^;"']+\)|#[0-9a-f]{3,8}|rgb\([^;"']+\))/i)?.[1];
      return color ? `<span style="color:${color.replace(/[<>]/g, '')}">` : '<span>';
    }
    return `<${name}>`;
  });
}
