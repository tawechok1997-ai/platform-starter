'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';
import HotGamesRail from './hot-games-rail';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type GamePlatform = 'mobile' | 'pc' | 'both';
type PlatformFilter = 'all' | GamePlatform;
type GameProvider = { name: string; code: string; status?: string | null; logoUrl?: string | null };
type Game = { id: string; providerGameCode: string; name: string; category: string; platform: GamePlatform; status?: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: GameProvider; media?: GameMedia[]; imageUrl?: string | null; iconUrl?: string | null };
type ProviderOption = { code: string; name: string; logoUrl?: string | null };
type Pagination = { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
type Counts = { total: number; database: number; catalogOnly: number; mobile: number; pc: number };
type LobbyPayload = { items: Game[]; categories: string[]; providers: ProviderOption[]; featured: Game[]; newest: Game[]; popular: Game[]; pagination: Pagination; counts: Counts };

const PAGE_SIZE = 24;
const FAVORITES_KEY = 'member_favorite_game_ids';
const EMPTY_PAYLOAD: LobbyPayload = { items: [], categories: [], providers: [], featured: [], newest: [], popular: [], pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasMore: false }, counts: { total: 0, database: 0, catalogOnly: 0, mobile: 0, pc: 0 } };

export default function MemberGamesPage() {
  const [payload, setPayload] = useState<LobbyPayload>(EMPTY_PAYLOAD);
  const [category, setCategory] = useState('all');
  const [provider, setProvider] = useState('all');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [launchingId, setLaunchingId] = useState<string>();
  const [message, setMessage] = useState('');

  useEffect(() => { setFavoriteIds(readIds()); }, []);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { setPage(1); }, [category, provider, platform, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const append = page > 1;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (platform !== 'all') params.set('platform', platform);
        if (provider !== 'all') params.set('provider', provider);
        if (category !== 'all' && category !== 'favorite') params.set('category', category);
        if (debouncedQuery) params.set('query', debouncedQuery);
        const response = await memberApiFetch(`/member/games?${params.toString()}`);
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) throw new Error(readMessage(data, 'โหลดเกมไม่สำเร็จ'));
        const next = normalizePayload(data);
        setPayload((current) => append ? { ...next, items: mergeGames(current.items, next.items) } : next);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'โหลดเกมไม่สำเร็จ');
      } finally {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [page, category, provider, platform, debouncedQuery]);

  const favoriteGames = useMemo(() => payload.items.filter((game) => favoriteIds.includes(game.id)), [payload.items, favoriteIds]);
  const visibleGames = category === 'favorite' ? favoriteGames : payload.items;
  const heroGame = payload.featured[0] ?? payload.popular[0] ?? payload.items[0];

  async function launchGame(game: Game) {
    if (!isAvailable(game)) return setMessage('เกมนี้ยังไม่พร้อมให้เล่น');
    setLaunchingId(game.id); setMessage(`กำลังเปิด ${game.name}...`);
    try {
      const response = await memberApiFetch(`/member/games/${game.id}/launch`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.launchUrl) throw new Error(data?.message ?? 'เปิดเกมไม่สำเร็จ');
      const sessionId = data.session?.id;
      window.location.href = sessionId ? `/games/session?session=${encodeURIComponent(sessionId)}&game=${encodeURIComponent(game.name)}&launchUrl=${encodeURIComponent(data.launchUrl)}` : data.launchUrl;
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'เปิดเกมไม่สำเร็จ');
      setLaunchingId(undefined);
    }
  }

  function toggleFavorite(game: Game) {
    setFavoriteIds((current) => {
      const next = current.includes(game.id) ? current.filter((id) => id !== game.id) : [game.id, ...current].slice(0, 60);
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Storage may be blocked in privacy mode; keep the in-memory state.
      }
      return next;
    });
  }

  function resetFilters() { setCategory('all'); setProvider('all'); setPlatform('all'); setQuery(''); setDebouncedQuery(''); }

  return <main className="game-lobby-page">
    <LobbyHero game={heroGame} counts={payload.counts} loading={loading} onLaunch={launchGame} />
    <nav className="game-lobby-tabs" aria-label="เลือกแพลตฟอร์มเกม">
      {(['all', 'mobile', 'pc'] as PlatformFilter[]).map((value) => <button key={value} type="button" aria-pressed={platform === value} className={platform === value ? 'is-active' : ''} onClick={() => setPlatform(value)}>{value === 'all' ? 'ทั้งหมด' : value === 'mobile' ? '📱 Mobile' : '💻 PC'}</button>)}
    </nav>
    <section className="game-lobby-toolbar" aria-label="ค้นหาและกรองเกม">
      <label className="game-lobby-search"><span className="sr-only">ค้นหาเกม</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเกมหรือค่าย" /></label>
      <label className="game-lobby-provider"><span className="sr-only">ค่ายเกม</span><select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="all">ทุกค่าย</option>{payload.providers.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <button type="button" className="game-lobby-clear" onClick={resetFilters}>ล้าง</button>
    </section>
    <nav className="game-lobby-tabs" aria-label="หมวดเกม">
      <button type="button" className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>ทุกหมวด</button>
      <button type="button" className={category === 'favorite' ? 'is-active' : ''} onClick={() => setCategory('favorite')}>โปรด ({favoriteGames.length})</button>
      {payload.categories.map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}
    </nav>
    {message && <div className="game-lobby-notice" role="status">{message}</div>}
    {error && <div className="game-lobby-notice" role="alert">{error}</div>}
    {loading ? <LobbySkeleton /> : <>
      <HotGamesRail games={payload.popular.length ? payload.popular : payload.items} launchingGameId={launchingId} onLaunch={launchGame} />
      <section className="game-lobby-section" id="game-catalog"><header><h2>{category === 'favorite' ? 'เกมโปรด' : 'เกมทั้งหมด'}</h2><span>{visibleGames.length} เกม</span></header><div className="game-lobby-grid">{visibleGames.map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launchingId === game.id} onLaunch={launchGame} onFavorite={toggleFavorite} />)}{visibleGames.length === 0 && <div className="game-lobby-empty"><strong>ไม่พบเกม</strong><button type="button" onClick={resetFilters}>ล้างตัวกรอง</button></div>}</div>{payload.pagination.hasMore && category !== 'favorite' && <button type="button" className="game-lobby-clear" disabled={loadingMore} onClick={() => setPage((value) => value + 1)}>{loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}</button>}</section>
    </>}
    <MemberBottomNav />
  </main>;
}

function LobbyHero({ game, counts, loading, onLaunch }: { game?: Game; counts: Counts; loading: boolean; onLaunch: (game: Game) => void }) {
  const image = game ? pickImage(game) : null;
  return <section className="game-lobby-hero" style={image ? { backgroundImage: `linear-gradient(90deg,rgba(8,8,12,.96),rgba(8,8,12,.3)),url(${JSON.stringify(image).slice(1, -1)})` } : undefined}><div className="game-lobby-hero-copy"><span className="game-lobby-kicker">MEMBER GAME LOBBY</span><h1>{loading ? 'กำลังเตรียมเกมให้คุณ' : game?.name ?? 'เกมทั้งหมดในที่เดียว'}</h1><p>{game ? `${game.provider?.name ?? 'Game Provider'} · ${categoryLabel(game.category)}` : `${counts.total} เกม`}</p>{game && isAvailable(game) && <div className="game-lobby-hero-actions"><button type="button" className="is-primary" onClick={() => onLaunch(game)}>เล่นเกมแนะนำ</button></div>}</div><div className="game-lobby-hero-orb" aria-hidden="true"><span>{loading ? '…' : counts.total}</span><small>GAMES</small></div></section>;
}

function LobbySkeleton() { return <section className="game-lobby-section" aria-busy="true"><div className="game-lobby-grid">{Array.from({ length: 12 }, (_, index) => <article className="game-lobby-card game-lobby-card-skeleton" key={index}><div className="game-lobby-skeleton-cover" /></article>)}</div></section>; }

function GameCard({ game, favorite, launching, onLaunch, onFavorite }: { game: Game; favorite: boolean; launching: boolean; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) {
  const [failed, setFailed] = useState(false); const image = pickImage(game); const available = isAvailable(game);
  return <article className={`game-lobby-card${available ? '' : ' is-unavailable'}`}><button type="button" className="game-lobby-cover-button" disabled={!available || launching} onClick={() => onLaunch(game)}>{image && !failed ? <span className="game-lobby-image is-loaded"><img src={image} alt={`ภาพปก ${game.name}`} loading="lazy" onError={() => setFailed(true)} /></span> : <div className="game-lobby-fallback">{game.name.slice(0, 2).toUpperCase()}</div>}</button><button type="button" className={`game-lobby-favorite${favorite ? ' is-active' : ''}`} aria-pressed={favorite} onClick={() => onFavorite(game)}>{favorite ? '★' : '☆'}</button><div className="game-lobby-card-body"><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode}</span><button type="button" disabled={!available || launching} onClick={() => onLaunch(game)}>{launching ? 'กำลังเปิด...' : available ? 'เล่น' : 'ยังไม่พร้อม'}</button></div></article>;
}

function pickImage(game: Game) { const media = game.media ?? []; return game.imageUrl ?? game.iconUrl ?? media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? null; }
function isAvailable(game: Game) { return String(game.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && String(game.provider?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && !game.id.startsWith('catalog:'); }
function categoryLabel(value: string) { const labels: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', arcade: 'อาร์เคด', fps: 'FPS', moba: 'MOBA', rpg: 'RPG', casual: 'แคชชวล', lottery: 'หวย' }; return labels[value.toLowerCase()] ?? value; }
function mergeGames(current: Game[], incoming: Game[]) { return [...new Map([...current, ...incoming].map((game) => [game.id, game])).values()]; }
function readIds() { try { const value = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; } catch { return []; } }
function readMessage(value: unknown, fallback: string) { return value && typeof value === 'object' && 'message' in value && typeof value.message === 'string' ? value.message : fallback; }
function normalizePayload(value: unknown): LobbyPayload {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const nested = source.data && typeof source.data === 'object' && !Array.isArray(source.data) ? source.data as Record<string, unknown> : source;
  const normalizeList = (key: string) => (Array.isArray(nested[key]) ? nested[key] as unknown[] : []).map(normalizeGame).filter((item): item is Game => item !== null);
  const items = normalizeList('items'); const rawPagination = nested.pagination && typeof nested.pagination === 'object' ? nested.pagination as Record<string, unknown> : {}; const rawCounts = nested.counts && typeof nested.counts === 'object' ? nested.counts as Record<string, unknown> : {};
  const providers = (Array.isArray(nested.providers) ? nested.providers : []).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).map((item) => ({ code: String(item.code ?? ''), name: String(item.name ?? item.code ?? ''), logoUrl: typeof item.logoUrl === 'string' ? item.logoUrl : null })).filter((item) => item.code);
  return { items, categories: (Array.isArray(nested.categories) ? nested.categories : []).filter((item): item is string => typeof item === 'string'), providers, featured: normalizeList('featured'), newest: normalizeList('newest'), popular: normalizeList('popular'), pagination: { page: Number(rawPagination.page ?? 1), limit: Number(rawPagination.limit ?? PAGE_SIZE), total: Number(rawPagination.total ?? items.length), totalPages: Number(rawPagination.totalPages ?? 1), hasMore: rawPagination.hasMore === true }, counts: { total: Number(rawCounts.total ?? items.length), database: Number(rawCounts.database ?? 0), catalogOnly: Number(rawCounts.catalogOnly ?? 0), mobile: Number(rawCounts.mobile ?? 0), pc: Number(rawCounts.pc ?? 0) } };
}
function normalizeGame(value: unknown): Game | null {
  if (!value || typeof value !== 'object') return null; const source = value as Record<string, unknown>; const id = String(source.id ?? source.providerGameCode ?? source.code ?? ''); if (!id) return null;
  const providerRaw = source.provider && typeof source.provider === 'object' ? source.provider as Record<string, unknown> : {}; const rawPlatform = String(source.platform ?? 'both').toLowerCase(); const platform: GamePlatform = rawPlatform === 'mobile' || rawPlatform === 'pc' ? rawPlatform : 'both';
  const media = Array.isArray(source.media) ? source.media.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).map((item) => ({ type: String(item.type ?? ''), sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : null, cachedUrl: typeof item.cachedUrl === 'string' ? item.cachedUrl : null, status: String(item.status ?? '') })) : [];
  return { id, providerGameCode: String(source.providerGameCode ?? source.code ?? id), name: String(source.name ?? 'เกมไม่มีชื่อ'), category: String(source.category ?? 'other'), platform, status: typeof source.status === 'string' ? source.status : undefined, isFeatured: source.isFeatured === true, isNew: source.isNew === true, isPopular: source.isPopular === true, provider: { name: String(providerRaw.name ?? providerRaw.code ?? 'Game Provider'), code: String(providerRaw.code ?? 'unknown'), status: typeof providerRaw.status === 'string' ? providerRaw.status : null, logoUrl: typeof providerRaw.logoUrl === 'string' ? providerRaw.logoUrl : null }, media, imageUrl: typeof source.imageUrl === 'string' ? source.imageUrl : null, iconUrl: typeof source.iconUrl === 'string' ? source.iconUrl : null };
}
