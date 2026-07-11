'use client';

import { CmsContent, MemberFeatureFlags, SiteIconSettings, cmsAssetUrl, isIconUrl } from '../site-settings';
import { navigationFor } from '../member-navigation';
import type { Game, LedgerItem, MoneyRequest } from '../types/member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from './member-ui';

export function HomeHero({ siteName, description, content }: { siteName: string; description: string; primaryColor: string; content: CmsContent }) {
  const banner = content.banners.find((item) => item.enabled);
  const imageUrl = banner ? cmsAssetUrl(content, banner.assetId) || banner.imageUrl : '';
  return <section className="member-home-hero">{imageUrl ? <img src={imageUrl} alt="" className="member-home-hero__image" /> : <div className="member-home-hero__fallback" aria-hidden="true" />}<div className="member-home-hero__copy"><span className="member-home-hero__eyebrow">พร้อมเล่น</span><h1>{banner?.title || siteName}</h1><p>{banner?.subtitle || description || 'ฝาก ถอน เล่นเกม และดูประวัติได้ในมือถือเครื่องเดียว'}</p></div><MemberLinkButton href={banner?.href || '/games'} tone="brand">เข้าเล่นเกม</MemberLinkButton></section>;
}

export function LobbyTabs() {
  return <nav className="member-lobby-tabs" aria-label="เมนูหน้า Lobby"><a className="active" href="#highlights">✦ <span>ไฮไลท์</span></a><a href="/promotions">♔ <span>โปรโมชั่นแนะนำ</span></a><a href="#activities">♜ <span>กิจกรรม</span></a></nav>;
}

export function TournamentSection() {
  return <section className="member-tournament-section" id="highlights"><div className="member-lobby-promo-card"><img src="/images/member-lobby/battle-arena.png" alt="" /><div><strong>TOURNAMENT</strong><span>เข้าร่วมชิงความเป็นที่ 1</span></div><span className="member-lobby-promo-arrow">›</span></div><div className="member-tournament-title"><span>♜</span><strong>ทัวร์นาเมนต์</strong></div><div className="member-tournament-empty"><div><strong>ระบบทัวร์นาเมนต์</strong><span>พื้นที่นี้เตรียมไว้สำหรับเชื่อมข้อมูลการแข่งขันจริง</span></div><span className="member-system-pending">รอเชื่อมต่อ</span></div></section>;
}

export function AnnouncementList({ content }: { content: CmsContent }) {
  const items = content.announcements.filter((item) => item.enabled).slice(0, 3);
  if (!items.length) return null;
  return <div className="member-announcement-strip" role="status"><span className="member-announcement-strip__icon">⌁</span><span>{items[0].message || items[0].title}</span></div>;
}

export function QuickActions({ icons, features }: { icons: SiteIconSettings; features: MemberFeatureFlags }) {
  const items = navigationFor('home', features);
  return <section className="member-quick-panel">{items.map((item) => <a key={item.key} href={item.href} className="member-quick-action"><span className="member-home-quick-icon">{isIconUrl(icons[item.iconKey]) ? <img src={icons[item.iconKey]} alt="" /> : icons[item.iconKey]}</span><strong>{item.shortTitle ?? item.title}</strong><span>{item.description}</span></a>)}</section>;
}

export function PendingRequests({ pendingTopups, pendingWithdrawals, features }: { pendingTopups: MoneyRequest[]; pendingWithdrawals: MoneyRequest[]; primaryColor: string; features: MemberFeatureFlags }) {
  const count = pendingTopups.length + pendingWithdrawals.length;
  if (!count) return null;
  return <MemberCard tone="warning" className="member-home-panel--brand"><div className="member-home-section-head"><div><p>รอดำเนินการ</p><h2>{count} รายการ</h2></div><a href="/transactions">ดูทั้งหมด</a></div><div className="member-home-list">{features.deposit && pendingTopups.map((item) => <ActivityRow key={item.id} title="ฝาก" href="/deposit" item={item} />)}{features.withdraw && pendingWithdrawals.map((item) => <ActivityRow key={item.id} title="ถอนเงิน" href="/withdraw" item={item} />)}</div></MemberCard>;
}

export function GameRail({ title, href, items }: { title: string; href: string; items: Game[]; primaryColor: string }) {
  if (!items.length) return null;
  return <MemberCard><div className="member-home-section-head"><h2>{title}</h2><a href={href}>ดูทั้งหมด</a></div><div className="member-home-game-rail">{items.slice(0, 8).map((game) => <a key={game.id} href="/games" className="member-home-game-tile">{pickImage(game) ? <img src={pickImage(game) ?? ''} alt="" /> : <div className="member-home-game-fallback">{game.name.slice(0, 2).toUpperCase()}</div>}<strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode}</span></a>)}</div></MemberCard>;
}

export function CategoryList({ categories }: { categories: string[]; primaryColor: string }) {
  return <MemberCard><div className="member-home-section-head"><h2>หมวดเกม</h2><a href="/games">ดูทั้งหมด</a></div><div className="member-home-categories">{categories.slice(0, 8).map((item) => <a key={item} href={`/games?category=${encodeURIComponent(item)}`} className="member-home-category-pill">{categoryLabel(item)}</a>)}{categories.length === 0 && <span className="member-home-muted">ยังไม่มีหมวดเกม</span>}</div></MemberCard>;
}

export function FaqList({ content }: { content: CmsContent }) {
  const items = content.faqs.filter((item) => item.enabled).slice(0, 4);
  if (!items.length) return null;
  return <MemberCard><div className="member-home-section-head"><h2>คำถามที่พบบ่อย</h2></div><div className="member-home-list">{items.map((item, index) => <details key={`${item.question}-${index}`} className="member-home-faq"><summary>{item.question}</summary><p className="member-home-muted">{item.answer}</p></details>)}</div></MemberCard>;
}

export function RecentActivity({ ledgers, loading, message, onRetry, depositEnabled }: { ledgers: LedgerItem[]; loading: boolean; message: string; onRetry: () => void; primaryColor: string; depositEnabled: boolean }) {
  return <MemberCard><div className="member-home-section-head"><h2>ล่าสุด</h2><a href="/transactions">ทั้งหมด</a></div>{loading && <MemberNotice>กำลังโหลด...</MemberNotice>}{message && <MemberNotice tone="danger"><strong>โหลดข้อมูลไม่สำเร็จ</strong><span>{message}</span><MemberButton onClick={onRetry}>ลองใหม่</MemberButton></MemberNotice>}<div className="member-home-list">{ledgers.slice(0, 5).map((item) => <LedgerRow key={item.id} item={item} />)}{ledgers.length === 0 && !message && !loading && <MemberEmptyState compact title="ยังไม่มีประวัติ" description="เมื่อมีรายการฝาก ถอน หรือปรับยอด รายการล่าสุดจะแสดงตรงนี้" actionHref={depositEnabled ? '/deposit' : '/'} actionLabel={depositEnabled ? 'ฝาก' : 'หน้าแรก'} />}</div></MemberCard>;
}

export function CmsPopup({ content, onClose }: { content: CmsContent; primaryColor: string; onClose: () => void }) {
  const popup = content.popup;
  const imageUrl = cmsAssetUrl(content, popup.assetId) || popup.imageUrl || '';
  return <div className="member-home-popup"><MemberCard tone="brand" className="member-home-popup__card"><button type="button" onClick={onClose} className="member-home-popup__close">×</button>{imageUrl && <img src={imageUrl} alt="" className="member-home-popup__image" />}<h2>{popup.title}</h2><p className="member-home-muted">{popup.message}</p><MemberLinkButton href={popup.href} tone="brand">{popup.ctaLabel}</MemberLinkButton></MemberCard></div>;
}

function ActivityRow({ title, href, item }: { title: string; href: string; item: MoneyRequest }) { return <a href={href} className="member-home-row member-home-row--link"><div><strong>{title}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><div className="member-home-row__right"><strong>{formatMoney(item.amount, item.currency)}</strong><span>{statusLabel(item.status)}</span></div></a>; }
function LedgerRow({ item }: { item: LedgerItem }) { return <div className="member-home-row"><div><strong>{ledgerTypeLabel(item.type)}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><div className="member-home-row__right"><strong>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount, 'THB')}</strong></div></div>; }
function ledgerTypeLabel(type: string) { const upper = type.toUpperCase(); if (upper.includes('DEPOSIT') || upper.includes('TOPUP')) return 'ฝาก'; if (upper.includes('WITHDRAW')) return 'ถอนเงิน'; if (upper.includes('TRANSFER')) return 'โยกเงิน'; if (upper.includes('REVERSAL')) return 'คืนเงิน'; if (upper.includes('ADJUST')) return 'ปรับยอด'; return 'รายการ'; }
function statusLabel(status: string) { const upper = status.toUpperCase(); if (upper === 'PENDING') return 'รอตรวจสอบ'; if (upper === 'APPROVED' || upper === 'COMPLETED') return 'สำเร็จ'; if (upper === 'REJECTED') return 'ไม่อนุมัติ'; return status; }
function pickImage(game: Game) { const media = game.media ?? []; return media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', popular: 'ยอดนิยม', new: 'ใหม่' }; return map[value?.toLowerCase?.()] ?? value; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
