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

type CategoryMeta = { label: string; icon: string };

const CATEGORY_META: Record<BrowseCategory, CategoryMeta> = {
  all: { label: 'ทั้งหมด', icon: V47_ASSETS.menuHome },
  casino: { label: 'คาสิโน', icon: V47_ASSETS.menuCasino },
  slot: { label: 'สล็อต', icon: V47_ASSETS.menuSlot },
  fishing: { label: 'ยิงปลา', icon: V47_ASSETS.menuFishing },
  sport: { label: 'กีฬา', icon: V47_ASSETS.menuSport },
  card: { label: 'ไพ่', icon: V47_ASSETS.menuCard },
  lottery: { label: 'หวย', icon: V47_ASSETS.menuLottery },
  favorite: { label: 'รายการโปรด', icon: V47_ASSETS.star },
};

const CATEGORY_SEQUENCE: Exclude<BrowseCategory, 'all' | 'favorite'>[] = [
  'slot', 'slot', 'slot', 'casino', 'slot', 'casino', 'slot', 'card', 'slot', 'slot', 'casino', 'sport',
  'slot', 'casino', 'slot', 'slot', 'slot', 'card', 'lottery', 'fishing', 'slot', 'slot',
];

const BROWSE_GAMES: BrowseGame[] = REFERENCE_GAMES.map((game, index) => ({
  ...game,
  id: `reference-${index + 1}`,
  category: CATEGORY_SEQUENCE[index] || 'slot',
  provider: REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!,
}));

export const BROWSE_PROMOTIONS: BrowsePromotion[] = [
  {
    id: 'welcome-offer',
    kind: 'promotion',
    title: 'โปรโมชั่นพิเศษ',
    summary: 'รวมสิทธิพิเศษและโบนัสสำหรับสมาชิก ตรวจสอบรายละเอียดก่อนรับสิทธิ์ทุกครั้ง',
    terms: ['ใช้ได้ตามเงื่อนไขที่ประกาศ', 'ตรวจสอบยอดฝากขั้นต่ำก่อนรับสิทธิ์', 'สิทธิ์ขึ้นกับสถานะบัญชีสมาชิก'],
    expiresAt: 'ตามประกาศของเว็บไซต์',
    image: V47_ASSETS.promoBackgroundPromotion,
    badge: 'PROMOTION',
  },
  {
    id: 'daily-activity',
    kind: 'activity',
    title: 'กิจกรรมประจำวัน',
    summary: 'ร่วมกิจกรรมและภารกิจที่เปิดให้สนุกตลอด 24 ชั่วโมง พร้อมรางวัลตามเงื่อนไข',
    terms: ['ทำตามภารกิจที่ระบุในกิจกรรม', 'รางวัลและจำนวนสิทธิ์เป็นไปตามประกาศ', 'ต้องเข้าสู่ระบบก่อนร่วมกิจกรรม'],
    expiresAt: 'ตามกำหนดการกิจกรรม',
    image: V47_ASSETS.promoBackgroundActivity,
    badge: 'ACTIVITY',
  },
  {
    id: 'member-news',
    kind: 'news',
    title: 'ข่าวสารล่าสุด',
    summary: 'ติดตามประกาศ เกมใหม่ โปรโมชั่น และข้อมูลบริการสำคัญจาก NOAH345',
    terms: ['ข้อมูลอาจมีการปรับปรุงได้', 'ตรวจสอบวันมีผลในแต่ละประกาศ', 'ติดต่อเจ้าหน้าที่หากต้องการความช่วยเหลือ'],
    expiresAt: 'ไม่มีวันหมดอายุ',
    image: V47_ASSETS.promoBackgroundNews,
    badge: 'NEWS',
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
    const matchingQuery = !deferredQuery
      || game.name.toLocaleLowerCase().includes(deferredQuery)
      || game.provider.name.toLocaleLowerCase().includes(deferredQuery)
      || CATEGORY_META[game.category].label.toLocaleLowerCase().includes(deferredQuery);
    return matchingCategory && matchingProvider && matchingQuery;
  }), [category, deferredQuery, favoriteSet, providerName]);

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((currentId) => currentId !== id) : [id, ...current].slice(0, 60);
      writeFavorites(next);
      return next;
    });
  }

  function resetFilters() {
    setQuery('');
    setCategory('all');
    setProviderName('all');
    window.history.replaceState(null, '', '/browse/games');
  }

  function selectCategory(value: BrowseCategory) {
    setCategory(value);
    const queryString = value === 'all' ? '' : `?category=${encodeURIComponent(value)}`;
    window.history.replaceState(null, '', `/browse/games${queryString}`);
  }

  function playGame() {
    if (!ready || !isLoggedIn) return redirectToLogin();
    window.location.assign('/games');
  }

  return (
    <main className="browse-page browse-page--games">
      <SourceHero title="เกมทั้งหมด" description="เลือกเล่นเกมยอดนิยมจากทุกค่ายในหน้าตาเดียวกับล็อบบี้ NOAH345" />
      <AnnouncementStrip text="เกมใหม่และเกมยอดนิยมอัปเดตตลอด 24 ชั่วโมง เลือกดูรายการได้ก่อนเข้าสู่ระบบ" />

      <nav className="browse-source-category-nav" aria-label="หมวดเกม">
        {(Object.keys(CATEGORY_META) as BrowseCategory[]).map((value) => (
          <button
            key={value}
            type="button"
            className={category === value ? 'is-active' : ''}
            aria-pressed={category === value}
            onClick={() => selectCategory(value)}
          >
            <AssetImage src={CATEGORY_META[value].icon} alt="" className="browse-source-category-icon" />
            <span>{CATEGORY_META[value].label}</span>
            {value === 'favorite' && favoriteIds.length ? <small>{favoriteIds.length}</small> : null}
          </button>
        ))}
      </nav>

      <section className="browse-source-filter-panel" aria-label="ค้นหาและกรองเกม">
        <label className="browse-source-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">ค้นหาเกมหรือค่าย</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเกม หรือค่ายเกม" />
        </label>
        <button type="button" className="browse-source-reset" onClick={resetFilters}>ล้างตัวกรอง</button>
      </section>

      <section className="browse-source-provider-panel" aria-label="ค่ายเกม">
        <header className="browse-source-panel-heading">
          <span><AssetImage src={V47_ASSETS.star} alt="" className="browse-source-heading-icon" /><strong>ค่ายเกม</strong></span>
          <small>{REFERENCE_PROVIDERS.length} ค่าย</small>
        </header>
        <div className="browse-source-provider-row">
          <button type="button" className={providerName === 'all' ? 'is-active' : ''} onClick={() => setProviderName('all')}>ทุกค่าย</button>
          {REFERENCE_PROVIDERS.map((provider) => (
            <button key={provider.name} type="button" className={providerName === provider.name ? 'is-active' : ''} onClick={() => setProviderName(provider.name)}>
              <AssetImage src={provider.url} alt="" className="browse-source-provider-logo" />
              <span>{provider.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="browse-source-games-panel">
        <header className="browse-source-panel-heading browse-source-panel-heading--games">
          <span><AssetImage src={V47_ASSETS.gameHit} alt="" className="browse-source-heading-icon" /><strong>{CATEGORY_META[category].label}</strong><em>HOT</em></span>
          <small>{visibleGames.length} เกม</small>
        </header>

        {visibleGames.length ? (
          <div className="browse-source-game-grid" aria-live="polite">
            {visibleGames.map((game, index) => (
              <article key={game.id} className={index === 0 && category === 'all' && !query && providerName === 'all' ? 'browse-source-game-card is-featured' : 'browse-source-game-card'}>
                <button type="button" className="browse-source-game-cover" onClick={() => setSelectedGame(game)} aria-label={`ดูรายละเอียด ${game.name}`}>
                  <AssetImage src={game.url} alt={`ภาพเกม ${game.name}`} className="browse-source-game-image" />
                  <span className="browse-source-game-hover"><b>เล่นเกม</b><small>ดูรายละเอียด</small></span>
                </button>
                <button type="button" className={favoriteSet.has(game.id) ? 'browse-source-favorite is-active' : 'browse-source-favorite'} onClick={() => toggleFavorite(game.id)} aria-label={favoriteSet.has(game.id) ? 'ลบจากรายการโปรด' : 'เพิ่มในรายการโปรด'} aria-pressed={favoriteSet.has(game.id)}>{favoriteSet.has(game.id) ? '★' : '☆'}</button>
                <footer>
                  <span><strong>{game.name}</strong><small>{game.provider.name}</small></span>
                  <button type="button" onClick={playGame} aria-label={`เล่น ${game.name}`}>›</button>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <section className="browse-empty"><strong>ไม่พบเกมที่ตรงกับตัวกรอง</strong><p>ลองล้างตัวกรองหรือใช้คำค้นหาอื่น</p><button type="button" onClick={resetFilters}>แสดงเกมทั้งหมด</button></section>
        )}
      </section>

      {selectedGame ? (
        <div className="browse-modal-backdrop" role="presentation">
          <button type="button" className="browse-modal-dismiss" onClick={() => setSelectedGame(null)} aria-label="ปิดรายละเอียดเกม" />
          <section className="browse-modal" role="dialog" aria-modal="true" aria-labelledby="browse-game-title">
            <button type="button" className="browse-modal-close" onClick={() => setSelectedGame(null)} aria-label="ปิด">×</button>
            <AssetImage src={selectedGame.url} alt={`ภาพเกม ${selectedGame.name}`} className="browse-modal-image" />
            <span className="browse-eyebrow">{CATEGORY_META[selectedGame.category].label} · {selectedGame.provider.name}</span>
            <h2 id="browse-game-title">{selectedGame.name}</h2>
            <p>รายการเกมจากชุด Reference Asset สำหรับเลือกดูก่อนเข้าสู่ระบบ</p>
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
    const query = nextView === 'all' ? '' : `?view=${encodeURIComponent(nextView)}`;
    window.history.replaceState(null, '', `/browse/promotions${query}`);
  }

  function claimPromotion() {
    if (!ready || !isLoggedIn) return redirectToLogin();
    window.location.assign('/promotions');
  }

  return (
    <main className="browse-page browse-page--promotions">
      <SourceHero title="โปรโมชั่นและกิจกรรม" description="รวมสิทธิพิเศษ กิจกรรม และข่าวสารในรูปแบบเดียวกับหน้าแรก NOAH345" />
      <AnnouncementStrip text="ดูรายละเอียดได้โดยไม่ต้องเข้าสู่ระบบ และเข้าสู่ระบบเฉพาะตอนรับสิทธิ์" />

      <nav className="browse-source-shortcuts" aria-label="ประเภทเนื้อหา">
        {BROWSE_PROMOTIONS.map((item) => (
          <button key={item.id} type="button" className={view === item.kind ? 'is-active' : ''} onClick={() => selectView(item.kind)}>
            <AssetImage src={item.image} alt="" className="browse-source-shortcut-background" />
            <AssetImage src={promotionIcon(item.kind)} alt="" className="browse-source-shortcut-icon" />
            <span><strong>{item.title}</strong><small>{item.summary}</small></span>
          </button>
        ))}
      </nav>

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

        <div className="browse-source-promotion-grid">
          {visibleItems.map((item) => (
            <article key={item.id} className="browse-source-promotion-card">
              <a href={`/browse/promotions/${item.id}`} className="browse-source-promotion-image-link" aria-label={`ดูรายละเอียด ${item.title}`}>
                <AssetImage src={item.image} alt={item.title} className="browse-source-promotion-image" />
                <span>{item.badge}</span>
              </a>
              <div className="browse-source-promotion-copy">
                <span>{promotionKindLabel(item.kind)}</span>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <dl>
                  <div><dt>เงื่อนไข</dt><dd>{item.terms[0]}</dd></div>
                  <div><dt>วันหมดอายุ</dt><dd>{item.expiresAt}</dd></div>
                </dl>
                <footer>
                  <a href={`/browse/promotions/${item.id}`}>รายละเอียด</a>
                  <button type="button" onClick={claimPromotion}>{isLoggedIn && ready ? 'ไปหน้ารับสิทธิ์' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button>
                </footer>
              </div>
            </article>
          ))}
        </div>
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

  if (!item) {
    return <main className="browse-page"><section className="browse-empty"><strong>ไม่พบรายการที่ต้องการ</strong><p>รายการอาจถูกย้ายหรือไม่มีข้อมูลสาธารณะ</p><a href="/browse/promotions">กลับไปหน้ารายการ</a></section></main>;
  }

  return (
    <main className="browse-page browse-page--detail">
      <a className="browse-back" href="/browse/promotions">← กลับไปโปรโมชั่น</a>
      <article className="browse-detail">
        <AssetImage src={item.image} alt={item.title} className="browse-detail-image" />
        <div className="browse-detail-copy">
          <span className="browse-eyebrow">{item.badge}</span>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <section><h2>เงื่อนไข</h2><ul>{item.terms.map((term) => <li key={term}>{term}</li>)}</ul></section>
          <section><h2>วันหมดอายุ</h2><p>{item.expiresAt}</p></section>
          <button type="button" className="browse-primary-action browse-primary-action--wide" onClick={claimPromotion}>{isLoggedIn && ready ? 'ไปหน้ารับสิทธิ์' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</button>
        </div>
      </article>
    </main>
  );
}

function SourceHero({ title, description }: { title: string; description: string }) {
  return (
    <section className="browse-source-hero">
      <div className="browse-source-hero__copy"><span>NOAH345 PUBLIC LOBBY</span><h1>{title}</h1><p>{description}</p></div>
      <div className="browse-source-jackpot" aria-label="Jackpot"><small>JACKPOTS</small><strong>195,574,797</strong><span>ลุ้นแจ็คพอตได้ทุกวัน</span></div>
    </section>
  );
}

function AnnouncementStrip({ text }: { text: string }) {
  return <div className="browse-source-announcement"><AssetImage src={V47_ASSETS.announcement} alt="" className="browse-source-announcement-icon" /><div><span>{text}</span><span aria-hidden="true">{text}</span></div></div>;
}

function isBrowseCategory(value: string | null): value is BrowseCategory {
  return value === 'all' || value === 'casino' || value === 'slot' || value === 'fishing' || value === 'sport' || value === 'card' || value === 'lottery' || value === 'favorite';
}

function promotionKindLabel(kind: BrowsePromotion['kind']) {
  if (kind === 'activity') return 'กิจกรรม';
  if (kind === 'news') return 'ข่าวสาร';
  return 'โปรโมชั่น';
}

function promotionViewLabel(view: PromotionView) {
  if (view === 'activity') return 'กิจกรรม';
  if (view === 'news') return 'ข่าวสาร';
  if (view === 'promotion') return 'โปรโมชั่น';
  return 'โปรโมชั่น กิจกรรม และข่าวสาร';
}

function promotionIcon(kind: BrowsePromotion['kind']) {
  if (kind === 'activity') return V47_ASSETS.menuActivity;
  if (kind === 'news') return V47_ASSETS.menuNews;
  return V47_ASSETS.menuPromotion;
}

function redirectToLogin() {
  const next = window.location.pathname + window.location.search;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

function readFavorites() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 60) : [];
  } catch {
    return [];
  }
}

function writeFavorites(value: string[]) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

function AssetImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [missing, setMissing] = useState(false);
  if (missing || !src) return <span className={`${className} browse-missing-asset`}>MISSING ASSET</span>;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setMissing(true)} />;
}
