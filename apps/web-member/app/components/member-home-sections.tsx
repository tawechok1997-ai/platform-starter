'use client';

import { useEffect, useState } from 'react';
import { API_URL, CmsContent, MemberFeatureFlags, SiteIconSettings, cmsAssetUrl, defaultIconSettings, isIconUrl } from '../site-settings';
import { navigationFor } from '../member-navigation';
import { MemberIcon } from './member-icon';
import type { Game, LedgerItem, MoneyRequest } from '../types/member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from './member-ui';

export function HomeHero({
  siteName,
  description,
  content,
}: {
  siteName: string;
  description: string;
  primaryColor: string;
  content: CmsContent;
}) {
  const banners = safeArray(content?.banners).filter(
    (item) => item?.enabled && (cmsAssetUrl(content, item.assetId) || item.imageUrl),
  );
  const slides = banners.length
    ? banners
    : [
        {
          title: siteName,
          subtitle: description,
          imageUrl: '/images/member-lobby/battle-arena.png',
          href: '/games',
          enabled: true,
        },
      ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);
  useEffect(() => {
    if (slides.length < 2 || isPaused || reduceMotion) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion, slides.length]);
  const slide = slides[activeIndex % slides.length] ?? slides[0];
  if (!slide) return null;
  const imageUrl = resolveCmsUrl(cmsAssetUrl(content, slide.assetId) || slide.imageUrl || '');
  const nextSlide = slides[(activeIndex + 1) % slides.length];
  const nextImageUrl = nextSlide ? resolveCmsUrl(cmsAssetUrl(content, nextSlide.assetId) || nextSlide.imageUrl || '') : '';
  return (
    <section className="member-home-hero" aria-label="โปรโมชั่น" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)}>
      {nextImageUrl && <link rel="preload" as="image" href={nextImageUrl} />}
      <a
        href={slide.href || '/promotions'}
        className="member-home-hero__slide-link"
        aria-label={slide.title || siteName}
      >
        <img src={imageUrl} alt={slide.title || siteName} className="member-home-hero__image" />
      </a>
      {slides.length > 1 && (
        <div className="member-home-hero__dots" aria-label="เลือกโปรโมชั่น">
          {slides.map((item, index) => (
            <button
              key={`${item.imageUrl || item.title || 'slide'}-${index}`}
              type="button"
              className={index === activeIndex ? 'active' : ''}
              onClick={() => setActiveIndex(index)}
              aria-label={`แสดงโปรโมชั่นที่ ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function PromotionSlotGrid({ content }: { content: CmsContent }) {
  const slots = safeArray(content?.banners)
    .filter((item) => item?.enabled && (cmsAssetUrl(content, item.assetId) || item.imageUrl))
    .slice(0, 3);
  if (!slots.length) return null;
  return (
    <section className="member-promo-slots" aria-label="โปรโมชั่นแนะนำ">
      {slots.map((slot, index) => {
        const imageUrl = resolveCmsUrl(cmsAssetUrl(content, slot.assetId) || slot.imageUrl || '');
        return (
          <a
            key={`${slot.title || 'promotion'}-${index}`}
            href={slot.href || '/promotions'}
            className="member-promo-slot"
          >
            <img src={imageUrl} alt="" loading="lazy" />
            <span>{slot.title || 'โปรโมชั่น'}</span>
          </a>
        );
      })}
    </section>
  );
}

export function LobbyTabs() {
  return (
    <nav className="member-lobby-tabs" aria-label="เมนูหน้า Lobby">
      <a className="active" href="#highlights">
        <MemberIcon name="games" /> <span>ไฮไลท์</span>
      </a>
      <a href="/promotions">
        <MemberIcon name="promotion" /> <span>โปรโมชั่นแนะนำ</span>
      </a>
      <a href="#activities">
        <MemberIcon name="bonus" /> <span>กิจกรรม</span>
      </a>
    </nav>
  );
}

export function TournamentSection() {
  return (
    <section className="member-tournament-section" id="highlights">
      <a className="member-lobby-promo-card" href="/games">
        <img src="/images/member-lobby/promotions/tournament-reference.jpeg" alt="Tournament" />
      </a>
      <div className="member-tournament-title">
        <MemberIcon name="bonus" />
        <strong>ทัวร์นาเมนต์</strong>
      </div>
      <div className="member-tournament-empty">
        <div>
          <strong>ระบบทัวร์นาเมนต์</strong>
          <span>พื้นที่นี้เตรียมไว้สำหรับเชื่อมข้อมูลการแข่งขันจริง</span>
        </div>
        <span className="member-system-pending">รอเชื่อมต่อ</span>
      </div>
    </section>
  );
}

export function AnnouncementList({ content }: { content: CmsContent }) {
  const items = safeArray(content?.announcements)
    .filter((item) => item?.enabled)
    .slice(0, 3);
  if (!items.length) return null;
  const first = items[0];
  return (
    <div className="member-announcement-strip" role="status">
      <span className="member-announcement-strip__icon"><MemberIcon name="notification" /></span>
      <div className="member-announcement-marquee">
        <span>{first?.message || first?.title || ''}</span>
      </div>
    </div>
  );
}

export function QuickActions({ icons, features }: { icons: SiteIconSettings; features: MemberFeatureFlags }) {
  const quickActionKeys = new Set(['deposit', 'withdraw', 'transactions', 'bonus']);
  const items = navigationFor('home', features)
    .filter((item) => quickActionKeys.has(item.key))
    .slice(0, 4);
  return (
    <section className="member-quick-panel">
      {items.map((item) => {
        const icon = typeof icons?.[item.iconKey] === 'string' ? icons[item.iconKey] : '';
        return (
          <a key={item.key} href={item.href} className="member-quick-action">
            <span className="member-home-quick-icon">
              {isIconUrl(icon) ? <img src={icon} alt="" /> : icon === defaultIconSettings[item.iconKey] ? <MemberIcon name={item.iconKey} /> : icon}
            </span>
            <strong>{item.shortTitle ?? item.title}</strong>
            <span>{item.description}</span>
          </a>
        );
      })}
    </section>
  );
}

export function PendingRequests({
  pendingTopups,
  pendingWithdrawals,
  features,
}: {
  pendingTopups: MoneyRequest[];
  pendingWithdrawals: MoneyRequest[];
  primaryColor: string;
  features: MemberFeatureFlags;
}) {
  const topups = safeArray(pendingTopups);
  const withdrawals = safeArray(pendingWithdrawals);
  const count = topups.length + withdrawals.length;
  if (!count) return null;
  return (
    <MemberCard tone="warning" className="member-home-panel--brand">
      <div className="member-home-section-head">
        <div>
          <p>รอดำเนินการ</p>
          <h2>{count} รายการ</h2>
        </div>
        <a href="/transactions">ดูทั้งหมด</a>
      </div>
      <div className="member-home-list">
        {features.deposit &&
          topups.map((item, index) => (
            <ActivityRow key={item?.id || `topup-${index}`} title="ฝาก" href="/deposit" item={item} />
          ))}
        {features.withdraw &&
          withdrawals.map((item, index) => (
            <ActivityRow key={item?.id || `withdrawal-${index}`} title="ถอนเงิน" href="/withdraw" item={item} />
          ))}
      </div>
    </MemberCard>
  );
}

export function GameRail({ title, href, items }: { title: string; href: string; items: Game[]; primaryColor: string }) {
  const games = safeArray(items).filter((game) => game && typeof game === 'object');
  if (!games.length) return null;
  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>{title}</h2>
        <a href={href}>ดูทั้งหมด</a>
      </div>
      <div className="member-home-game-rail">
        {games.slice(0, 8).map((game, index) => {
          const name = typeof game.name === 'string' && game.name.trim() ? game.name : 'เกม';
          const image = pickImage(game);
          return (
            <a key={game.id || `${name}-${index}`} href="/games" className="member-home-game-tile">
              {image ? (
                <img src={image} alt="" />
              ) : (
                <div className="member-home-game-fallback">{name.slice(0, 2).toUpperCase()}</div>
              )}
              <strong>{name}</strong>
              <span>{game.provider?.name ?? game.providerGameCode ?? ''}</span>
            </a>
          );
        })}
      </div>
    </MemberCard>
  );
}

export function GameRailSkeleton() {
  return <section className="member-home-game-skeleton" aria-label="กำลังโหลดเกม" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div key={index} className="member-home-game-skeleton__card"><span /><strong /><small /></div>)}</section>;
}

export function GameLobbyState({ tone, message, onRetry }: { tone: 'empty' | 'error'; message?: string; onRetry?: () => void }) {
  if (tone === 'error') return <MemberNotice tone="danger"><strong>โหลดเกมไม่สำเร็จ</strong><span>{message || 'กรุณาลองใหม่อีกครั้ง'}</span>{onRetry && <MemberButton onClick={onRetry}>ลองใหม่</MemberButton>}</MemberNotice>;
  return <MemberEmptyState compact title="ยังไม่มีเกมให้แสดง" description="เกมที่เปิดให้บริการจะแสดงในหน้านี้" actionHref="/games" actionLabel="ไปหน้าเกม" />;
}

export function CategoryList({ categories }: { categories: string[]; primaryColor: string }) {
  const safeCategories = safeArray(categories).filter((item): item is string => typeof item === 'string');
  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>หมวดเกม</h2>
        <a href="/games">ดูทั้งหมด</a>
      </div>
      <div className="member-home-categories">
        {safeCategories.slice(0, 8).map((item) => (
          <a key={item} href={`/games?category=${encodeURIComponent(item)}`} className="member-home-category-pill">
            {categoryLabel(item)}
          </a>
        ))}
        {safeCategories.length === 0 && <span className="member-home-muted">ยังไม่มีหมวดเกม</span>}
      </div>
    </MemberCard>
  );
}

export function FaqList({ content }: { content: CmsContent }) {
  const items = safeArray(content?.faqs)
    .filter((item) => item?.enabled)
    .slice(0, 4);
  if (!items.length) return null;
  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>คำถามที่พบบ่อย</h2>
      </div>
      <div className="member-home-list">
        {items.map((item, index) => (
          <details key={`${item?.question || 'faq'}-${index}`} className="member-home-faq">
            <summary>{item?.question || 'คำถาม'}</summary>
            <p className="member-home-muted">{item?.answer || ''}</p>
          </details>
        ))}
      </div>
    </MemberCard>
  );
}

export function RecentActivity({
  ledgers,
  loading,
  message,
  onRetry,
  depositEnabled,
}: {
  ledgers: LedgerItem[];
  loading: boolean;
  message: string;
  onRetry: () => void;
  primaryColor: string;
  depositEnabled: boolean;
}) {
  const items = safeArray(ledgers);
  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>ล่าสุด</h2>
        <a href="/transactions">ทั้งหมด</a>
      </div>
      {loading && <MemberNotice>กำลังโหลด...</MemberNotice>}
      {message && (
        <MemberNotice tone="danger">
          <strong>โหลดข้อมูลไม่สำเร็จ</strong>
          <span>{message}</span>
          <MemberButton onClick={onRetry}>ลองใหม่</MemberButton>
        </MemberNotice>
      )}
      <div className="member-home-list">
        {items.slice(0, 5).map((item, index) => (
          <LedgerRow key={item?.id || `ledger-${index}`} item={item} />
        ))}
        {items.length === 0 && !message && !loading && (
          <MemberEmptyState
            compact
            title="ยังไม่มีประวัติ"
            description="เมื่อมีรายการฝาก ถอน หรือปรับยอด รายการล่าสุดจะแสดงตรงนี้"
            actionHref={depositEnabled ? '/deposit' : '/'}
            actionLabel={depositEnabled ? 'ฝาก' : 'หน้าแรก'}
          />
        )}
      </div>
    </MemberCard>
  );
}

export function CmsPopup({ content, onClose }: { content: CmsContent; primaryColor: string; onClose: () => void }) {
  const popup = content?.popup;
  if (!popup || typeof popup !== 'object') return null;
  const imageUrl = resolveCmsUrl(cmsAssetUrl(content, popup.assetId) || popup.imageUrl || '');
  return (
    <div className="member-home-popup">
      <MemberCard tone="brand" className="member-home-popup__card">
        <button type="button" onClick={onClose} className="member-home-popup__close">
          ×
        </button>
        {imageUrl && <img src={imageUrl} alt="" className="member-home-popup__image" />}
        <h2>{popup.title || 'ประกาศ'}</h2>
        <p className="member-home-muted">{popup.message || ''}</p>
        <MemberLinkButton href={popup.href || '/'} tone="brand">
          {popup.ctaLabel || 'ปิด'}
        </MemberLinkButton>
      </MemberCard>
    </div>
  );
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
function resolveCmsUrl(value: string) {
  return typeof value === 'string' && value.startsWith('/public/cms-assets/')
    ? `${API_URL.replace(/\/$/, '')}${value}`
    : typeof value === 'string'
      ? value
      : '';
}
function ActivityRow({ title, href, item }: { title: string; href: string; item: MoneyRequest }) {
  return (
    <a href={href} className="member-home-row member-home-row--link">
      <div>
        <strong>{title}</strong>
        <span>{formatDate(item?.createdAt)}</span>
      </div>
      <div className="member-home-row__right">
        <strong>{formatMoney(item?.amount, item?.currency)}</strong>
        <span>{statusLabel(item?.status)}</span>
      </div>
    </a>
  );
}
function LedgerRow({ item }: { item: LedgerItem }) {
  return (
    <div className="member-home-row">
      <div>
        <strong>{ledgerTypeLabel(item?.type)}</strong>
        <span>{formatDate(item?.createdAt)}</span>
      </div>
      <div className="member-home-row__right">
        <strong>
          {item?.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item?.amount, 'THB')}
        </strong>
      </div>
    </div>
  );
}
function formatDate(value: unknown) {
  const date = new Date(typeof value === 'string' || typeof value === 'number' ? value : 0);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
}
function ledgerTypeLabel(type: unknown) {
  const upper = typeof type === 'string' ? type.toUpperCase() : '';
  if (upper.includes('DEPOSIT') || upper.includes('TOPUP')) return 'ฝาก';
  if (upper.includes('WITHDRAW')) return 'ถอนเงิน';
  if (upper.includes('TRANSFER')) return 'โยกเงิน';
  if (upper.includes('REVERSAL')) return 'คืนเงิน';
  if (upper.includes('ADJUST')) return 'ปรับยอด';
  return 'รายการ';
}
function statusLabel(status: unknown) {
  const value = typeof status === 'string' ? status : '';
  const upper = value.toUpperCase();
  if (upper === 'PENDING') return 'รอตรวจสอบ';
  if (upper === 'APPROVED' || upper === 'COMPLETED') return 'สำเร็จ';
  if (upper === 'REJECTED') return 'ไม่อนุมัติ';
  return value || '-';
}
function pickImage(game: Game) {
  const media = Array.isArray(game?.media) ? game.media : [];
  return (
    media.find((item) => item?.type === 'COVER')?.cachedUrl ??
    media.find((item) => item?.type === 'COVER')?.sourceUrl ??
    media.find((item) => item?.type === 'ICON')?.cachedUrl ??
    media.find((item) => item?.type === 'ICON')?.sourceUrl ??
    null
  );
}
function categoryLabel(value: string) {
  const map: Record<string, string> = {
    slot: 'สล็อต',
    casino: 'คาสิโน',
    sport: 'กีฬา',
    fishing: 'ตกปลา',
    popular: 'ยอดนิยม',
    new: 'ใหม่',
  };
  return map[value.toLowerCase()] ?? value;
}
function formatMoney(value: unknown, currency: unknown) {
  const amount = Number(value);
  return `${typeof currency === 'string' && currency ? currency : 'THB'} ${Number.isFinite(amount) ? amount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}`;
}
