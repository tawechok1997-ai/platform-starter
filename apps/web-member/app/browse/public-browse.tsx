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

const BROWSE_CSS = cssFromComment(function () {/*
.browse-page{width:min(1240px,calc(100% - 32px));margin:0 auto;padding:34px 0 74px;color:#fff}.browse-hero{position:relative;display:flex;align-items:end;justify-content:space-between;gap:24px;overflow:hidden;min-height:238px;padding:38px;border:1px solid rgba(252,197,69,.34);border-radius:24px;background:radial-gradient(circle at 78% 18%,rgba(255,203,80,.28),transparent 26%),linear-gradient(128deg,#181205,#0f0f11 68%);box-shadow:0 22px 60px rgba(0,0,0,.3)}.browse-hero:after{content:"";position:absolute;right:-68px;bottom:-112px;width:322px;height:322px;border:1px solid rgba(255,219,125,.22);border-radius:50%;box-shadow:0 0 0 38px rgba(255,219,125,.04),0 0 0 78px rgba(255,219,125,.03)}.browse-hero>*,.browse-detail>*{position:relative;z-index:1}.browse-hero h1,.browse-detail h1{max-width:760px;margin:5px 0 10px;font-size:clamp(30px,4vw,54px);line-height:1.06;letter-spacing:-.045em}.browse-hero p,.browse-detail p{max-width:620px;margin:0;color:rgba(255,255,255,.69);line-height:1.6}.browse-eyebrow{color:#f8c94d;font-size:11px;font-weight:900;letter-spacing:.16em}.browse-hero-stat{display:grid;place-items:center;min-width:144px;min-height:144px;border:1px solid rgba(255,223,141,.28);border-radius:50%;background:rgba(0,0,0,.19)}.browse-hero-stat strong{font-size:38px;line-height:1}.browse-hero-stat span{margin-top:6px;color:#f8c94d;font-size:10px;font-weight:900;letter-spacing:.12em}
.browse-toolbar{display:flex;gap:12px;align-items:center;margin-top:24px}.browse-search{flex:1;position:relative}.browse-search:before{content:"⌕";position:absolute;left:17px;top:50%;transform:translateY(-50%);color:#e7bd4e;font-size:22px}.browse-search input{width:100%;min-height:50px;padding:0 18px 0 48px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:#121214;color:#fff;outline:none}.browse-search input:focus{border-color:#f8c94d;box-shadow:0 0 0 3px rgba(248,201,77,.14)}.browse-clear,.browse-filter-row button,.browse-provider-row button,.browse-primary-action,.browse-outline-action,.browse-secondary-action,.browse-empty button{border:0;cursor:pointer;font-weight:800;text-decoration:none}.browse-clear{min-height:50px;padding:0 18px;border:1px solid rgba(255,255,255,.15);border-radius:15px;background:#1b1b1d;color:#fff}.browse-filter-row,.browse-provider-row{display:flex;gap:9px;align-items:center;overflow-x:auto;padding:20px 1px 4px;scrollbar-width:thin}.browse-filter-row button,.browse-provider-row button{flex:0 0 auto;min-height:38px;padding:0 14px;border:1px solid rgba(255,255,255,.13);border-radius:999px;background:#151517;color:rgba(255,255,255,.72)}.browse-filter-row button.is-active,.browse-provider-row button.is-active{border-color:#f8c94d;background:#f8c94d;color:#191305}.browse-provider-row{padding-top:16px}.browse-provider{display:flex;align-items:center;gap:7px}.browse-provider-logo{width:24px;height:24px;object-fit:contain}.browse-provider-row button.is-active .browse-provider-logo{filter:brightness(.28)}
.browse-section-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:34px 0 15px}.browse-section-heading h2{margin:3px 0 0;font-size:27px}.browse-section-heading>span{color:rgba(255,255,255,.56);font-size:13px}.browse-game-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:13px}.browse-game-card{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#141416;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}.browse-game-card:hover{transform:translateY(-4px);border-color:rgba(248,201,77,.7);box-shadow:0 16px 30px rgba(0,0,0,.25)}.browse-game-cover{display:block;position:relative;width:100%;aspect-ratio:4/5;padding:0;border:0;background:#202024;cursor:pointer;overflow:hidden}.browse-game-image{width:100%;height:100%;object-fit:cover}.browse-game-overlay{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.52);opacity:0;transition:opacity .18s ease}.browse-game-cover:hover .browse-game-overlay,.browse-game-cover:focus-visible .browse-game-overlay{opacity:1}.browse-game-overlay b{padding:9px 12px;border-radius:999px;background:#f8c94d;color:#171205;font-size:12px}.browse-favorite{position:absolute;right:8px;top:8px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(10,10,12,.76);color:#fff;font-size:20px;cursor:pointer}.browse-favorite.is-active{color:#f8c94d}.browse-game-copy{padding:12px}.browse-game-copy>span,.browse-game-copy small{color:rgba(255,255,255,.55);font-size:11px}.browse-game-copy h3{margin:5px 0 6px;overflow:hidden;font-size:14px;line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.browse-game-copy>div{display:flex;align-items:center;gap:5px;min-height:20px}.browse-card-provider-logo{width:18px;height:18px;object-fit:contain}.browse-primary-action{display:inline-grid;place-items:center;min-height:38px;padding:0 12px;border-radius:11px;background:linear-gradient(135deg,#ffe079,#efad2f);color:#1a1305}.browse-game-copy .browse-primary-action{width:100%;margin-top:11px;font-size:12px}.browse-primary-action:hover,.browse-outline-action:hover,.browse-secondary-action:hover{filter:brightness(1.08)}.browse-primary-action--wide{width:100%;min-height:48px;font-size:14px}
.browse-empty{display:grid;justify-items:center;gap:6px;padding:70px 20px;border:1px dashed rgba(255,255,255,.19);border-radius:19px;background:rgba(255,255,255,.025);text-align:center}.browse-empty p{margin:0;color:rgba(255,255,255,.57)}.browse-empty button,.browse-empty a{margin-top:9px;padding:10px 14px;border-radius:11px;background:#f8c94d;color:#1a1305;text-decoration:none}.browse-modal-backdrop{position:fixed;z-index:100;inset:0;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.75);backdrop-filter:blur(8px)}.browse-modal{position:relative;width:min(430px,100%);padding:20px;border:1px solid rgba(248,201,77,.4);border-radius:20px;background:#171719;box-shadow:0 30px 90px rgba(0,0,0,.55)}.browse-modal-close{position:absolute;right:11px;top:11px;z-index:1;width:36px;height:36px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font-size:22px;cursor:pointer}.browse-modal-image{width:100%;aspect-ratio:16/9;margin-bottom:17px;border-radius:13px;object-fit:cover}.browse-modal h2{margin:5px 0 8px}.browse-modal p{margin:0 0 18px;color:rgba(255,255,255,.65);line-height:1.55}.browse-missing-asset{display:grid!important;place-items:center;background:repeating-linear-gradient(45deg,#271f1d,#271f1d 12px,#151416 12px,#151416 24px)!important;color:#ffc949!important;font-size:10px!important;font-weight:900!important;letter-spacing:.08em;text-align:center}
.browse-hero--promotions{align-items:center}.browse-outline-action{position:relative;z-index:1;display:inline-grid;place-items:center;min-height:44px;padding:0 16px;border:1px solid #f8c94d;border-radius:13px;background:rgba(0,0,0,.18);color:#f8c94d}.browse-filter-row--promotions{margin-bottom:20px}.browse-promotion-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.browse-promotion-card{overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:19px;background:#141416}.browse-promotion-image-link{position:relative;display:block;aspect-ratio:1.75/1;overflow:hidden;background:#202024}.browse-promotion-image{width:100%;height:100%;object-fit:cover;transition:transform .25s ease}.browse-promotion-image-link:hover .browse-promotion-image{transform:scale(1.04)}.browse-promotion-image-link>span{position:absolute;left:12px;top:12px;padding:6px 8px;border-radius:999px;background:#f8c94d;color:#211605;font-size:10px;font-weight:900;letter-spacing:.08em}.browse-promotion-copy{padding:18px}.browse-promotion-kind{color:#f8c94d;font-size:11px;font-weight:900;letter-spacing:.08em}.browse-promotion-copy h2{margin:7px 0;font-size:22px}.browse-promotion-copy>p{min-height:52px;margin:0;color:rgba(255,255,255,.62);line-height:1.55}.browse-promotion-copy dl{display:grid;gap:9px;margin:17px 0}.browse-promotion-copy dl div{display:grid;gap:3px;padding-top:9px;border-top:1px solid rgba(255,255,255,.08)}.browse-promotion-copy dt{color:rgba(255,255,255,.44);font-size:11px}.browse-promotion-copy dd{margin:0;color:#fff;font-size:12px;line-height:1.45}.browse-promotion-actions{display:grid;grid-template-columns:1fr 1.5fr;gap:9px}.browse-secondary-action{display:grid;place-items:center;min-height:38px;border:1px solid rgba(255,255,255,.2);border-radius:11px;color:#fff;font-size:12px}
.browse-back{display:inline-block;margin-bottom:20px;color:#f8c94d;text-decoration:none;font-weight:800}.browse-detail{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr);overflow:hidden;border:1px solid rgba(248,201,77,.32);border-radius:24px;background:#141416}.browse-detail-image{width:100%;height:100%;min-height:430px;object-fit:cover}.browse-detail-copy{padding:36px}.browse-detail-copy h1{font-size:42px}.browse-detail-copy section{margin:24px 0;padding-top:18px;border-top:1px solid rgba(255,255,255,.1)}.browse-detail-copy h2{margin:0 0 9px;font-size:17px}.browse-detail-copy ul{display:grid;gap:9px;margin:0;padding-left:18px;color:rgba(255,255,255,.7);line-height:1.5}
@media (max-width:1060px){.browse-game-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.browse-promotion-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:760px){.browse-page{width:min(100% - 24px,620px);padding:18px 0 38px}.browse-hero{min-height:0;padding:25px 20px;border-radius:18px;align-items:start}.browse-hero h1,.browse-detail h1{font-size:32px}.browse-hero-stat{display:none}.browse-toolbar{margin-top:16px}.browse-clear{padding:0 12px;font-size:12px}.browse-game-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.browse-game-copy{padding:9px}.browse-game-copy h3{font-size:12px}.browse-game-copy>span,.browse-game-copy small{font-size:9px}.browse-game-copy .browse-primary-action{min-height:33px;margin-top:8px;padding:0 6px;font-size:10px}.browse-favorite{right:6px;top:6px;width:29px;height:29px;font-size:17px}.browse-section-heading{margin-top:25px}.browse-section-heading h2{font-size:23px}.browse-promotion-grid{grid-template-columns:1fr;gap:14px}.browse-promotion-copy h2{font-size:20px}.browse-promotion-copy>p{min-height:0}.browse-detail{grid-template-columns:1fr;border-radius:18px}.browse-detail-image{min-height:0;aspect-ratio:1.65/1}.browse-detail-copy{padding:24px 20px}.browse-provider-row{padding-top:12px}.browse-provider-row button{min-height:35px;padding:0 10px}.browse-filter-row{padding-top:15px}.browse-modal{padding:15px}.browse-modal-image{margin-bottom:13px}}
*/});
function cssFromComment(value: () => void) {
  const text = value.toString();
  return text.slice(text.indexOf('/*') + 2, text.lastIndexOf('*/'));
}
function BrowseStyles() { return <style>{BROWSE_CSS}</style>; }
