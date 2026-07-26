'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS, type ReferenceAsset } from '../components/reference-asset-catalog';
import { V47_ASSETS } from '../components/member-home/v47-asset-map';
import { useMemberSession } from '../member-session-provider';

type BrowseCategory = 'all' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery' | 'favorite';
type PromotionView = 'all' | 'promotion' | 'activity' | 'news';
type BrowseGame = ReferenceAsset & { id: string; category: Exclude<BrowseCategory, 'all' | 'favorite'>; provider: ReferenceAsset };
type BrowsePromotion = { id: string; kind: Exclude<PromotionView, 'all'>; title: string; summary: string; terms: string[]; expiresAt: string; image: string; badge: string };

const CATEGORY_LABELS: Record<BrowseCategory, string> = {
  all: 'ทั้งหมด', casino: 'คาสิโน', slot: 'สล็อต', fishing: 'ยิงปลา', sport: 'กีฬา', card: 'ไพ่', lottery: 'หวย', favorite: 'รายการโปรด',
};
const CATEGORY_SEQUENCE: Exclude<BrowseCategory, 'all' | 'favorite'>[] = [
  'slot', 'slot', 'slot', 'casino', 'slot', 'casino', 'slot', 'card', 'slot', 'slot', 'casino', 'sport',
  'slot', 'casino', 'slot', 'slot', 'slot', 'card', 'lottery', 'fishing', 'slot', 'slot',
];
const BROWSE_GAMES: BrowseGame[] = REFERENCE_GAMES.map((game, index) => ({
  ...game, id: 'reference-' + String(index + 1), category: CATEGORY_SEQUENCE[index] || 'slot',
  provider: REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!,
}));
export const BROWSE_PROMOTIONS: BrowsePromotion[] = [
  {
    id: 'welcome-offer', kind: 'promotion', title: 'โปรโมชั่นพิเศษ',
    summary: 'ดูรายละเอียดสิทธิ์และเงื่อนไขก่อนเข้าสู่ระบบเพื่อรับโปรโมชั่น',
    terms: ['ใช้ได้ตามเงื่อนไขที่ประกาศ', 'ตรวจสอบยอดฝากขั้นต่ำก่อนรับสิทธิ์', 'สิทธิ์ขึ้นกับสถานะบัญชีสมาชิก'],
    expiresAt: 'ตามประกาศของเว็บไซต์', image: V47_ASSETS.promoBackgroundPromotion, badge: 'PROMOTION',
  },
  {
    id: 'daily-activity', kind: 'activity', title: 'กิจกรรมประจำวัน',
    summary: 'รวมกิจกรรมและภารกิจที่เปิดให้ร่วมสนุกในช่วงเวลานี้',
    terms: ['ทำตามภารกิจที่ระบุในกิจกรรม', 'รางวัลและจำนวนสิทธิ์เป็นไปตามประกาศ', 'ต้องเข้าสู่ระบบก่อนร่วมกิจกรรม'],
    expiresAt: 'ตามกำหนดการกิจกรรม', image: V47_ASSETS.promoBackgroundActivity, badge: 'ACTIVITY',
  },
  {
    id: 'member-news', kind: 'news', title: 'ข่าวสารล่าสุด',
    summary: 'ประกาศเกี่ยวกับเกมใหม่ โปรโมชั่น และการให้บริการ',
    terms: ['ข้อมูลอาจมีการปรับปรุงได้', 'ตรวจสอบวันมีผลในแต่ละประกาศ', 'ติดต่อเจ้าหน้าที่หากต้องการความช่วยเหลือ'],
    expiresAt: 'ไม่มีวันหมดอายุ', image: V47_ASSETS.promoBackgroundNews, badge: 'NEWS',
  },
];
const FAVORITES_KEY = 'member_public_browse_favorite_games_v1';

export function BrowseGames() {
  const { isLoggedIn, ready } = useMemberSession();
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get('category');
  const initialCategory: BrowseCategory = isBrowseCategory(requestedCategory) ? requestedCategory : 'all';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BrowseCategory>(initialCategory);
  const [providerName, setProviderName] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<BrowseGame | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  useEffect(() => { setFavoriteIds(readFavorites()); }, []);
  useEffect(() => { setCategory(initialCategory); }, [initialCategory]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const visibleGames = useMemo(() => BROWSE_GAMES.filter((game) => {
    const matchingCategory = category === 'all' || (category === 'favorite' ? favoriteSet.has(game.id) : game.category === category);
    const matchingProvider = providerName === 'all' || game.provider.name === providerName;
    const matchingQuery = !deferredQuery || game.name.toLocaleLowerCase().includes(deferredQuery)
      || game.provider.name.toLocaleLowerCase().includes(deferredQuery)
      || CATEGORY_LABELS[game.category].toLocaleLowerCase().includes(deferredQuery);
    return matchingCategory && matchingProvider && matchingQuery;
  }), [category, deferredQuery, favoriteSet, providerName]);

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((currentId) => currentId !== id) : [id, ...current].slice(0, 60);
      writeFavorites(next);
      return next;
    });
  }

  function playGame() {
    if (!ready || !isLoggedIn) return redirectToLogin();
    window.location.assign('/games');
  }

  return (
    <main className="browse-page">
      <BrowseStyles />
      <section className="browse-hero">
        <div><span className="browse-eyebrow">NOAH345 GAME LOBBY</span><h1>เกมครบทุกหมวด</h1><p>ค้นหา เลือกหมวด และบันทึกรายการโปรดได้ทันทีโดยไม่ต้องเข้าสู่ระบบ</p></div>
        <div className="browse-hero-stat"><strong>{BROWSE_GAMES.length}</strong><span>REFERENCE GAMES</span></div>
      </section>

      <section className="browse-toolbar" aria-label="ค้นหาและกรองเกม">
        <label className="browse-search"><span className="sr-only">ค้นหาเกมหรือค่าย</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเกมหรือค่าย" /></label>
        <button type="button" className="browse-clear" onClick={() => { setQuery(''); setCategory('all'); setProviderName('all'); }}>ล้างตัวกรอง</button>
      </section>

      <nav className="browse-filter-row" aria-label="หมวดเกม">
        {(Object.keys(CATEGORY_LABELS) as BrowseCategory[]).map((value) => (
          <button key={value} type="button" className={category === value ? 'is-active' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>
            {CATEGORY_LABELS[value]}{value === 'favorite' ? ' (' + String(favoriteIds.length) + ')' : ''}
          </button>
        ))}
      </nav>

      <nav className="browse-provider-row" aria-label="ค่ายเกม">
        <button type="button" className={providerName === 'all' ? 'is-active' : ''} aria-pressed={providerName === 'all'} onClick={() => setProviderName('all')}>ทุกค่าย</button>
        {REFERENCE_PROVIDERS.map((provider) => (
          <button key={provider.name} type="button" className={providerName === provider.name ? 'is-active browse-provider' : 'browse-provider'} aria-pressed={providerName === provider.name} onClick={() => setProviderName(provider.name)}>
            <AssetImage src={provider.url} alt="" className="browse-provider-logo" /><span>{provider.name}</span>
          </button>
        ))}
      </nav>

      <div className="browse-section-heading"><div><span className="browse-eyebrow">PUBLIC CATALOG</span><h2>{CATEGORY_LABELS[category]}</h2></div><span>{visibleGames.length} เกม</span></div>

      {visibleGames.length ? (
        <section className="browse-game-grid" aria-live="polite">
          {visibleGames.map((game) => (
            <article key={game.id} className="browse-game-card">
              <button type="button" className="browse-game-cover" onClick={() => setSelectedGame(game)} aria-label={'ดูรายละเอียด ' + game.name}>
                <AssetImage src={game.url} alt={'ภาพเกม ' + game.name} className="browse-game-image" /><span className="browse-game-overlay"><b>ดูรายละเอียด</b></span>
              </button>
              <button type="button" className={favoriteSet.has(game.id) ? 'browse-favorite is-active' : 'browse-favorite'} onClick={() => toggleFavorite(game.id)} aria-label={favoriteSet.has(game.id) ? 'ลบจากรายการโปรด' : 'เพิ่มในรายการโปรด'} aria-pressed={favoriteSet.has(game.id)}>{favoriteSet.has(game.id) ? '★' : '☆'}</button>
              <div className="browse-game-copy"><span>{CATEGORY_LABELS[game.category]}</span><h3>{game.name}</h3><div><AssetImage src={game.provider.url} alt="" className="browse-card-provider-logo" /><small>{game.provider.name}</small></div><button type="button" className="browse-primary-action" onClick={playGame}>เล่นเกม</button></div>
            </article>
          ))}
        </section>
      ) : <section className="browse-empty"><strong>ไม่พบเกมที่ตรงกับตัวกรอง</strong><p>ลองล้างตัวกรองหรือใช้คำค้นหาอื่น</p><button type="button" onClick={() => { setQuery(''); setCategory('all'); setProviderName('all'); }}>แสดงเกมทั้งหมด</button></section>}

      {selectedGame ? (
        <div className="browse-modal-backdrop" role="presentation" onMouseDown={() => setSelectedGame(null)}>
          <section className="browse-modal" role="dialog" aria-modal="true" aria-labelledby="browse-game-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="browse-modal-close" onClick={() => setSelectedGame(null)} aria-label="ปิด">×</button>
            <AssetImage src={selectedGame.url} alt={'ภาพเกม ' + selectedGame.name} className="browse-modal-image" />
            <span className="browse-eyebrow">{CATEGORY_LABELS[selectedGame.category]} · {selectedGame.provider.name}</span><h2 id="browse-game-title">{selectedGame.name}</h2>
            <p>รายการเกมจากชุด Reference Asset สำหรับดูรายการก่อนเข้าสู่ระบบ</p>
            <button type="button" className="browse-primary-action browse-primary-action--wide" onClick={playGame}>{isLoggedIn && ready ? 'ไปยังเกมสมาชิก' : 'เข้าสู่ระบบเพื่อเล่นเกม'}</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export function BrowsePromotions() {
  const { isLoggedIn, ready } = useMemberSession();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const initialView: PromotionView = requestedView === 'promotion' || requestedView === 'activity' || requestedView === 'news' ? requestedView : 'all';
  const [view, setView] = useState<PromotionView>(initialView);

  useEffect(() => { setView(initialView); }, [initialView]);
  const visibleItems = view === 'all' ? BROWSE_PROMOTIONS : BROWSE_PROMOTIONS.filter((item) => item.kind === view);

  function selectView(nextView: PromotionView) {
    setView(nextView);
    const query = nextView === 'all' ? '' : '?view=' + encodeURIComponent(nextView);
    window.history.replaceState(null, '', '/browse/promotions' + query);
  }
  function claimPromotion() {
    if (!ready || !isLoggedIn) return redirectToLogin();
    window.location.assign('/promotions');
  }

  return (
    <main className="browse-page">
      <BrowseStyles />
      <section className="browse-hero browse-hero--promotions"><div><span className="browse-eyebrow">PUBLIC INFORMATION</span><h1>โปรโมชั่น กิจกรรม และข่าวสาร</h1><p>ดูข้อมูลสาธารณะได้ทันที รับสิทธิ์จริงหลังเข้าสู่ระบบเท่านั้น</p></div><a href="/browse/games" className="browse-outline-action">ดูรายการเกม</a></section>
      <nav className="browse-filter-row browse-filter-row--promotions" aria-label="ประเภทเนื้อหา">
        <button type="button" className={view === 'all' ? 'is-active' : ''} onClick={() => selectView('all')}>ทั้งหมด</button>
        <button type="button" className={view === 'promotion' ? 'is-active' : ''} onClick={() => selectView('promotion')}>โปรโมชั่น</button>
        <button type="button" className={view === 'activity' ? 'is-active' : ''} onClick={() => selectView('activity')}>กิจกรรม</button>
        <button type="button" className={view === 'news' ? 'is-active' : ''} onClick={() => selectView('news')}>ข่าวสาร</button>
      </nav>
      <section className="browse-promotion-grid">
        {visibleItems.map((item) => (
          <article key={item.id} className="browse-promotion-card">
            <a href={'/browse/promotions/' + item.id} className="browse-promotion-image-link" aria-label={'ดูรายละเอียด ' + item.title}><AssetImage src={item.image} alt={item.title} className="browse-promotion-image" /><span>{item.badge}</span></a>
            <div className="browse-promotion-copy"><span className="browse-promotion-kind">{promotionKindLabel(item.kind)}</span><h2>{item.title}</h2><p>{item.summary}</p>
              <dl><div><dt>เงื่อนไข</dt><dd>{item.terms[0]}</dd></div><div><dt>วันหมดอายุ</dt><dd>{item.expiresAt}</dd></div></dl>
              <div className="browse-promotion-actions"><a href={'/browse/promotions/' + item.id} className="browse-secondary-action">รายละเอียด</a><button type="button" className="browse-primary-action" onClick={claimPromotion}>{isLoggedIn && ready ? 'ไปหน้ารับสิทธิ์' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button></div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export function BrowsePromotionDetail({ id }: { id: string }) {
  const { isLoggedIn, ready } = useMemberSession();
  const item = BROWSE_PROMOTIONS.find((promotion) => promotion.id === id);
  function claimPromotion() {
    if (!ready || !isLoggedIn) return redirectToLogin();
    window.location.assign('/promotions');
  }
  if (!item) return <main className="browse-page"><BrowseStyles /><section className="browse-empty"><strong>ไม่พบรายการที่ต้องการ</strong><p>รายการอาจถูกย้ายหรือไม่มีข้อมูลสาธารณะ</p><a href="/browse/promotions">กลับไปหน้ารายการ</a></section></main>;
  return (
    <main className="browse-page">
      <BrowseStyles /><a className="browse-back" href="/browse/promotions">← กลับไปโปรโมชั่น</a>
      <article className="browse-detail"><AssetImage src={item.image} alt={item.title} className="browse-detail-image" /><div className="browse-detail-copy"><span className="browse-eyebrow">{item.badge}</span><h1>{item.title}</h1><p>{item.summary}</p><section><h2>เงื่อนไข</h2><ul>{item.terms.map((term) => <li key={term}>{term}</li>)}</ul></section><section><h2>วันหมดอายุ</h2><p>{item.expiresAt}</p></section><button type="button" className="browse-primary-action browse-primary-action--wide" onClick={claimPromotion}>{isLoggedIn && ready ? 'ไปหน้ารับสิทธิ์' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button></div></article>
    </main>
  );
}

function isBrowseCategory(value: string | null): value is BrowseCategory {
  return value === 'all' || value === 'casino' || value === 'slot' || value === 'fishing' || value === 'sport' || value === 'card' || value === 'lottery' || value === 'favorite';
}

function promotionKindLabel(kind: BrowsePromotion['kind']) {
  if (kind === 'activity') return 'กิจกรรม';
  if (kind === 'news') return 'ข่าวสาร';
  return 'โปรโมชั่น';
}
function redirectToLogin() {
  const next = window.location.pathname + window.location.search;
  window.location.assign('/login?next=' + encodeURIComponent(next));
}
function readFavorites() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 60) : [];
  } catch { return []; }
}
function writeFavorites(value: string[]) {
  try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(value)); } catch { /* Storage can be unavailable in private browsing. */ }
}
function AssetImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [missing, setMissing] = useState(false);
  if (missing || !src) return <span className={className + ' browse-missing-asset'}>MISSING ASSET</span>;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setMissing(true)} />;
}

function BrowseStyles() { return null; }
