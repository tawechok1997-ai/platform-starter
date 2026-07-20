'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type GamePlatform = 'mobile' | 'pc' | 'both';
type PlatformFilter = 'all' | GamePlatform;
type Game = { id: string; providerGameCode: string; name: string; category: string; platform: GamePlatform; status?: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: { name: string; code: string; status?: string | null }; media?: GameMedia[]; imageUrl?: string | null; iconUrl?: string | null };
type ProviderOption = { code: string; name: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
type Counts = { total: number; database: number; catalogOnly: number; mobile: number; pc: number };
type LobbyPayload = { items: Game[]; categories: string[]; providers: ProviderOption[]; featured: Game[]; newest: Game[]; popular: Game[]; pagination: Pagination; counts: Counts };
type LaunchState = { gameId?: string; message?: string };

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';
const LOBBY_FILTER_KEY = 'member_game_lobby_filters';
const PAGE_SIZE = 24;
const EMPTY_PAYLOAD: LobbyPayload = {
  items: [], categories: [], providers: [], featured: [], newest: [], popular: [],
  pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasMore: false },
  counts: { total: 0, database: 0, catalogOnly: 0, mobile: 0, pc: 0 },
};

export default function MemberGamesPage() {
  const [payload, setPayload] = useState<LobbyPayload>(EMPTY_PAYLOAD);
  const [category, setCategory] = useState('all');
  const [provider, setProvider] = useState('all');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [launching, setLaunching] = useState<LaunchState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const filters = readFilters();
    setCategory(filters.category || 'all');
    setProvider(filters.provider || 'all');
    setPlatform(filters.platform || 'all');
    setQuery(filters.query || '');
    setDebouncedQuery(filters.query || '');
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!hydrated) return;
    writeFilters({ category, provider, platform, query });
  }, [category, provider, platform, query, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setPage(1);
  }, [category, provider, platform, debouncedQuery, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function loadGames() {
      const append = page > 1;
      append ? setLoadingMore(true) : setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (platform !== 'all') params.set('platform', platform);
        if (provider !== 'all') params.set('provider', provider);
        if (category !== 'all' && category !== 'favorite') params.set('category', category);
        if (debouncedQuery) params.set('query', debouncedQuery);
        const res = await memberApiFetch(`/member/games?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) { setError(readApiMessage(data, 'โหลดเกมไม่สำเร็จ')); return; }
        const next = normalizeLobbyPayload(data);
        setPayload((current) => append ? { ...next, items: mergeGames(current.items, next.items) } : next);
      } catch {
        if (!cancelled) setError('ไม่สามารถเชื่อมต่อบริการเกมได้ กรุณาลองใหม่');
      } finally {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    }
    void loadGames();
    return () => { cancelled = true; };
  }, [page, category, provider, platform, debouncedQuery, reloadKey, hydrated]);

  const games = payload.items;
  const favoriteGames = useMemo(() => games.filter((game) => favoriteIds.includes(game.id)), [games, favoriteIds]);
  const recentGames = useMemo(() => recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[], [recentIds, games]);
  const visibleGames = useMemo(() => category === 'favorite' ? favoriteGames : games, [category, favoriteGames, games]);
  const availableCount = useMemo(() => visibleGames.filter(isGameAvailable).length, [visibleGames]);

  async function launchGame(game: Game) {
    if (!isGameAvailable(game)) { setLaunching({ gameId: game.id, message: 'เกมนี้อยู่ใน catalog แต่ยังไม่เชื่อมระบบเปิดเกม' }); return; }
    rememberRecent(game.id, setRecentIds);
    setLaunching({ gameId: game.id, message: `กำลังเปิด ${game.name}...` });
    try {
      const res = await memberApiFetch(`/member/games/${game.id}/launch`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.launchUrl) { setLaunching({ gameId: game.id, message: data?.message ?? data?.errorMessage ?? 'เปิดเกมไม่สำเร็จ' }); return; }
      const sessionId = data.session?.id;
      if (sessionId) window.location.href = `/games/session?session=${encodeURIComponent(sessionId)}&game=${encodeURIComponent(game.name)}&launchUrl=${encodeURIComponent(data.launchUrl)}`;
      else window.location.href = data.launchUrl;
    } catch {
      setLaunching({ gameId: game.id, message: 'เชื่อมต่อบริการเปิดเกมไม่สำเร็จ กรุณาลองใหม่' });
    }
  }

  function toggleFavorite(game: Game) {
    setFavoriteIds((current) => {
      const next = current.includes(game.id) ? current.filter((id) => id !== game.id) : [game.id, ...current].slice(0, 60);
      writeIds(FAVORITES_KEY, next);
      return next;
    });
  }

  function selectPlatform(next: PlatformFilter) { setPlatform(next); setProvider('all'); setCategory('all'); }
  function resetFilters() { setCategory('all'); setProvider('all'); setPlatform('all'); setQuery(''); setDebouncedQuery(''); }

  return <main className="game-lobby-page">
    <nav className="game-lobby-tabs" aria-label="เลือกแพลตฟอร์มเกม">
      <button className={platform === 'all' ? 'is-active' : ''} aria-pressed={platform === 'all'} onClick={() => selectPlatform('all')}>ทั้งหมด <span>{payload.counts.total}</span></button>
      <button className={platform === 'mobile' ? 'is-active' : ''} aria-pressed={platform === 'mobile'} onClick={() => selectPlatform('mobile')}>📱 Mobile <span>{payload.counts.mobile}</span></button>
      <button className={platform === 'pc' ? 'is-active' : ''} aria-pressed={platform === 'pc'} onClick={() => selectPlatform('pc')}>💻 PC <span>{payload.counts.pc}</span></button>
    </nav>

    <nav className="game-lobby-tabs" aria-label="หมวดเกม">
      <button className={category === 'all' ? 'is-active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>ทุกหมวด <span>{payload.pagination.total}</span></button>
      <button className={category === 'favorite' ? 'is-active' : ''} aria-pressed={category === 'favorite'} onClick={() => setCategory('favorite')}>โปรด <span>{favoriteGames.length}</span></button>
      {payload.categories.map((item) => <button key={item} className={category === item ? 'is-active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}
    </nav>

    <section className="game-lobby-toolbar" aria-label="ค้นหาและกรองเกม">
      <label className="game-lobby-search"><span className="sr-only">ค้นหาเกม</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={platform === 'pc' ? 'ค้นหาเกม PC หรือค่าย' : platform === 'mobile' ? 'ค้นหาเกม Mobile หรือค่าย' : 'ค้นหาเกมหรือค่าย'} /></label>
      <label className="game-lobby-provider"><span className="sr-only">ค่ายเกม</span><select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="all">ทุกค่าย ({payload.providers.length})</option>{payload.providers.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      {(query || provider !== 'all' || platform !== 'all' || category !== 'all') && <button type="button" className="game-lobby-clear" onClick={resetFilters}>ล้าง</button>}
    </section>

    {loading && <div className="game-lobby-notice" role="status">กำลังโหลดเกม...</div>}
    {error && <div className="game-lobby-notice" role="alert"><span>{error}</span> <button type="button" onClick={() => setReloadKey((value) => value + 1)}>ลองใหม่</button></div>}
    {launching.message && <div className="game-lobby-notice" role="status">{launching.message}</div>}

    {!loading && !error && <>
      <GameSection title={platform === 'pc' ? 'เกม PC ยอดนิยม' : platform === 'mobile' ? 'เกม Mobile ยอดนิยม' : 'เกมยอดนิยม'} items={payload.popular} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
      <GameSection title="เกมแนะนำ" items={payload.featured} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
      <GameSection title="เล่นล่าสุด" items={recentGames} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
      <GameSection title="เกมใหม่" items={payload.newest} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />

      <section className="game-lobby-section">
        <header><h2>{platform === 'pc' ? 'เกม PC ทั้งหมด' : platform === 'mobile' ? 'เกม Mobile ทั้งหมด' : category === 'favorite' ? 'เกมโปรด' : 'เกมทั้งหมด'}</h2><span>{category === 'favorite' ? favoriteGames.length : payload.pagination.total} เกม · พร้อมเล่นในหน้านี้ {availableCount}</span></header>
        <div className="game-lobby-grid">{visibleGames.map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launching.gameId === game.id} onLaunch={launchGame} onFavorite={toggleFavorite} />)}{visibleGames.length === 0 && <EmptyLobby onReset={resetFilters} />}</div>
        {category !== 'favorite' && payload.pagination.hasMore && <button type="button" className="game-lobby-clear" disabled={loadingMore} onClick={() => setPage((value) => value + 1)}>{loadingMore ? 'กำลังโหลด...' : `โหลดเพิ่มอีก ${Math.min(PAGE_SIZE, payload.pagination.total - games.length)} เกม`}</button>}
      </section>
    </>}
    <MemberBottomNav />
  </main>;
}

function GameSection({ title, items, favoriteIds, launchingGameId, onLaunch, onFavorite }: { title: string; items: Game[]; favoriteIds: string[]; launchingGameId?: string; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) {
  const visible = items.slice(0, 8);
  if (visible.length === 0) return null;
  return <section className="game-lobby-section"><header><h2>{title}</h2><span>{items.length} เกม</span></header><div className="game-lobby-grid">{visible.map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launchingGameId === game.id} onLaunch={onLaunch} onFavorite={onFavorite} />)}</div></section>;
}

function GameCard({ game, favorite, launching, onLaunch, onFavorite }: { game: Game; favorite: boolean; launching: boolean; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) {
  const available = isGameAvailable(game);
  return <article className={`game-lobby-card${available ? '' : ' is-unavailable'}`}>
    <button type="button" className="game-lobby-cover-button" onClick={() => onLaunch(game)} disabled={launching || !available} aria-label={available ? `เล่น ${game.name}` : `${game.name} ยังไม่พร้อมให้เล่น`}><GameImage game={game} /></button>
    <button type="button" aria-label={favorite ? `นำ ${game.name} ออกจากเกมโปรด` : `เพิ่ม ${game.name} เป็นเกมโปรด`} aria-pressed={favorite} className={`game-lobby-favorite${favorite ? ' is-active' : ''}`} onClick={() => onFavorite(game)}>{favorite ? '★' : '☆'}</button>
    {!available && <span className="game-lobby-maintenance">Catalog only</span>}
    <div className="game-lobby-card-body"><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode} · {platformLabel(game.platform)}</span><div className="game-lobby-badges">{game.isFeatured && <em>แนะนำ</em>}{game.isNew && <em>ใหม่</em>}{game.isPopular && <em>นิยม</em>}<em>{categoryLabel(game.category)}</em></div><button type="button" onClick={() => onLaunch(game)} disabled={launching || !available}>{launching ? 'กำลังเปิด...' : available ? 'เล่น' : 'ยังไม่เชื่อมระบบ'}</button></div>
  </article>;
}

function GameImage({ game }: { game: Game }) { const [failed, setFailed] = useState(false); const image = pickImage(game); if (!image || failed) return <div className="game-lobby-fallback" aria-hidden="true">{game.name.slice(0, 2).toUpperCase()}</div>; return <img src={image} alt={`ภาพปก ${game.name}`} loading="lazy" onError={() => setFailed(true)} />; }
function EmptyLobby({ onReset }: { onReset: () => void }) { return <div className="game-lobby-empty"><strong>ไม่เจอเกมในเงื่อนไขนี้</strong><span>ลองล้างตัวกรองหรือค้นหาด้วยชื่อค่ายหรือชื่อเกมอื่น</span><button type="button" onClick={onReset}>ล้างตัวกรอง</button></div>; }
function pickImage(game: Game) { const media = Array.isArray(game.media) ? game.media : []; return game.imageUrl ?? game.iconUrl ?? media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function isGameAvailable(game: Game) { return String(game.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && String(game.provider?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && !game.id.startsWith('catalog:'); }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', arcade: 'อาร์เคด', fps: 'FPS', moba: 'MOBA', rpg: 'RPG', casual: 'แคชชวล', lottery: 'หวย' }; return map[value?.toLowerCase?.()] ?? value; }
function platformLabel(value: GamePlatform) { return value === 'mobile' ? 'Mobile' : value === 'pc' ? 'PC' : 'Mobile / PC'; }
function readApiMessage(value: unknown, fallback: string) { if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message; return fallback; }
function normalizeLobbyPayload(value: unknown): LobbyPayload { const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}; const nested = source.data && typeof source.data === 'object' && !Array.isArray(source.data) ? source.data as Record<string, unknown> : source; const items = (Array.isArray(nested.items) ? nested.items : []).map(normalizeGame).filter(Boolean) as Game[]; const list = (key: string) => (Array.isArray(nested[key]) ? nested[key] as unknown[] : []).map(normalizeGame).filter(Boolean) as Game[]; const rawPagination = nested.pagination && typeof nested.pagination === 'object' ? nested.pagination as Record<string, unknown> : {}; const rawCounts = nested.counts && typeof nested.counts === 'object' ? nested.counts as Record<string, unknown> : {}; const providers = (Array.isArray(nested.providers) ? nested.providers : []).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).map((item) => ({ code: String(item.code ?? ''), name: String(item.name ?? item.code ?? '') })).filter((item) => item.code); return { items, categories: (Array.isArray(nested.categories) ? nested.categories : []).filter((item): item is string => typeof item === 'string'), providers, featured: list('featured'), newest: list('newest'), popular: list('popular'), pagination: { page: Number(rawPagination.page ?? 1), limit: Number(rawPagination.limit ?? PAGE_SIZE), total: Number(rawPagination.total ?? items.length), totalPages: Number(rawPagination.totalPages ?? 1), hasMore: rawPagination.hasMore === true }, counts: { total: Number(rawCounts.total ?? items.length), database: Number(rawCounts.database ?? 0), catalogOnly: Number(rawCounts.catalogOnly ?? 0), mobile: Number(rawCounts.mobile ?? 0), pc: Number(rawCounts.pc ?? 0) } }; }
function normalizeGame(value: unknown): Game | null { if (!value || typeof value !== 'object') return null; const source = value as Record<string, unknown>; const providerValue = source.provider; const provider = providerValue && typeof providerValue === 'object' ? providerValue as Record<string, unknown> : undefined; const providerCode = typeof providerValue === 'string' ? providerValue : String(provider?.code ?? 'unknown'); const media = Array.isArray(source.media) ? source.media.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).map((item) => ({ type: String(item.type ?? ''), sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : null, cachedUrl: typeof item.cachedUrl === 'string' ? item.cachedUrl : null, status: String(item.status ?? '') })) : []; const id = String(source.id ?? source.providerGameCode ?? source.code ?? ''); if (!id) return null; const rawPlatform = String(source.platform ?? 'both').toLowerCase(); const gamePlatform: GamePlatform = rawPlatform === 'mobile' || rawPlatform === 'pc' ? rawPlatform : 'both'; return { id, providerGameCode: String(source.providerGameCode ?? source.code ?? id), name: String(source.name ?? 'เกมไม่มีชื่อ'), category: String(source.category ?? 'other'), platform: gamePlatform, status: typeof source.status === 'string' ? source.status : undefined, isFeatured: source.isFeatured === true, isNew: source.isNew === true, isPopular: source.isPopular === true, provider: { name: String(provider?.name ?? providerCode), code: providerCode, status: typeof provider?.status === 'string' ? provider.status : null }, media, imageUrl: typeof source.imageUrl === 'string' ? source.imageUrl : null, iconUrl: typeof source.iconUrl === 'string' ? source.iconUrl : null }; }
function mergeGames(current: Game[], incoming: Game[]) { return [...new Map([...current, ...incoming].map((game) => [game.id, game])).values()]; }
function readIds(key: string) { try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; } catch { return []; } }
function writeIds(key: string, ids: string[]) { try { window.localStorage.setItem(key, JSON.stringify(ids)); } catch { /* storage may be blocked */ } }
function readFilters() { try { return JSON.parse(window.localStorage.getItem(LOBBY_FILTER_KEY) ?? '{}') as { category?: string; provider?: string; platform?: PlatformFilter; query?: string }; } catch { return {}; } }
function writeFilters(value: { category: string; provider: string; platform: PlatformFilter; query: string }) { try { window.localStorage.setItem(LOBBY_FILTER_KEY, JSON.stringify(value)); } catch { /* storage may be blocked */ } }
function rememberRecent(id: string, setRecentIds: (updater: (current: string[]) => string[]) => void) { setRecentIds((current) => { const next = [id, ...current.filter((item) => item !== id)].slice(0, 12); writeIds(RECENT_KEY, next); return next; }); }
