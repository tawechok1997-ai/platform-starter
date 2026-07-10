'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type Game = { id: string; providerGameCode: string; name: string; category: string; status?: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: { name: string; code: string; status?: string | null }; media?: GameMedia[] };
type LobbyPayload = { items?: Game[]; categories?: string[]; featured?: Game[]; newest?: Game[]; popular?: Game[] };
type LaunchState = { gameId?: string; message?: string };

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';
const LOBBY_FILTER_KEY = 'member_game_lobby_filters';

export default function MemberGamesPage() {
  const [payload, setPayload] = useState<LobbyPayload>({});
  const [category, setCategory] = useState('all');
  const [provider, setProvider] = useState('all');
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [message, setMessage] = useState('กำลังโหลดเกม...');
  const [launching, setLaunching] = useState<LaunchState>({});

  useEffect(() => {
    const filters = readFilters();
    setCategory(filters.category || 'all');
    setProvider(filters.provider || 'all');
    setQuery(filters.query || '');
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    let cancelled = false;
    async function loadGames() {
      const res = await memberApiFetch('/member/games');
      const data = await res.json().catch(() => null);
      if (cancelled) return;
      if (!res.ok) { setMessage(data?.message ?? 'โหลดเกมไม่สำเร็จ'); return; }
      setPayload(data ?? {});
      setMessage('');
    }
    loadGames();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { writeFilters({ category, provider, query }); }, [category, provider, query]);

  const games = payload.items ?? [];
  const providers = useMemo(() => Array.from(new Map(games.map((game) => [game.provider?.code ?? 'unknown', game.provider?.name ?? game.provider?.code ?? 'ไม่ระบุค่าย'])).entries()).sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'th')), [games]);
  const providerCounts = useMemo(() => countBy(games, (game) => game.provider?.code ?? 'unknown'), [games]);
  const categoryCounts = useMemo(() => countBy(games, (game) => game.category || 'other'), [games]);
  const favoriteGames = useMemo(() => favoriteIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[], [favoriteIds, games]);
  const recentGames = useMemo(() => recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[], [recentIds, games]);
  const filtered = useMemo(() => games.filter((item) => {
    const matchesCategory = category === 'all' || category === 'favorite' ? true : item.category === category;
    const matchesProvider = provider === 'all' || (item.provider?.code ?? 'unknown') === provider;
    const text = `${item.name} ${item.providerGameCode} ${item.provider?.name ?? ''} ${item.category}`.toLowerCase();
    const matchesSearch = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesFavorite = category !== 'favorite' || favoriteIds.includes(item.id);
    return matchesCategory && matchesProvider && matchesSearch && matchesFavorite;
  }), [games, category, provider, query, favoriteIds]);
  const filteredAvailable = useMemo(() => filtered.filter(isGameAvailable), [filtered]);

  async function launchGame(game: Game) {
    if (!isGameAvailable(game)) { setLaunching({ gameId: game.id, message: 'เกมนี้ยังไม่พร้อมให้เล่น' }); return; }
    rememberRecent(game.id, setRecentIds);
    setLaunching({ gameId: game.id, message: `กำลังเปิด ${game.name}...` });
    const res = await memberApiFetch(`/member/games/${game.id}/launch`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || !data?.launchUrl) { setLaunching({ gameId: game.id, message: data?.message ?? data?.errorMessage ?? 'เปิดเกมไม่สำเร็จ' }); return; }
    const sessionId = data.session?.id;
    setLaunching({ gameId: game.id, message: 'เปิดเกมแล้ว กำลังไปหน้าจัดการ session...' });
    if (sessionId) window.location.href = `/games/session?session=${encodeURIComponent(sessionId)}&game=${encodeURIComponent(game.name)}&launchUrl=${encodeURIComponent(data.launchUrl)}`;
    else window.location.href = data.launchUrl;
  }

  function toggleFavorite(game: Game) {
    setFavoriteIds((current) => {
      const next = current.includes(game.id) ? current.filter((id) => id !== game.id) : [game.id, ...current].slice(0, 60);
      writeIds(FAVORITES_KEY, next);
      return next;
    });
  }

  function resetFilters() { setCategory('all'); setProvider('all'); setQuery(''); }

  return <main className="game-lobby-page">
    <section className="game-lobby-hero">
      <span className="game-lobby-eyebrow">Game Lobby</span>
      <h1>เลือกเกม</h1>
      <p>ค้นหา เลือกค่าย กดหัวใจเก็บเกมโปรด แล้วเปิด session เพื่อโยกเงินเข้า/ออกเกมจากหน้าเดียว</p>
      <div className="game-lobby-search-row">
        <label><span>ค้นหาเกม</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเกมหรือค่าย" /></label>
        <label><span>ค่ายเกม</span><select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="all">ทุกค่าย ({games.length})</option>{providers.map(([code, name]) => <option key={code} value={code}>{name} ({providerCounts.get(code) ?? 0})</option>)}</select></label>
      </div>
      <div className="game-lobby-stats"><span>{games.length} เกมทั้งหมด</span><span>{filteredAvailable.length} พร้อมเล่น</span><span>{favoriteIds.length} เกมโปรด</span></div>
    </section>

    {message && <div className="game-lobby-notice" role="status">{message}</div>}
    {launching.message && <div className="game-lobby-notice" role="status">{launching.message}</div>}

    <nav className="game-lobby-tabs" aria-label="หมวดเกม">
      <button className={category === 'all' ? 'is-active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>ทั้งหมด ({games.length})</button>
      <button className={category === 'favorite' ? 'is-active' : ''} aria-pressed={category === 'favorite'} onClick={() => setCategory('favorite')}>โปรด ({favoriteGames.length})</button>
      {(payload.categories ?? []).map((item) => <button key={item} className={category === item ? 'is-active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{categoryLabel(item)} ({categoryCounts.get(item) ?? 0})</button>)}
      <button className="is-reset" onClick={resetFilters}>ล้างตัวกรอง</button>
    </nav>

    <GameSection title="เล่นล่าสุด" items={recentGames} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
    <GameSection title="เกมโปรด" items={favoriteGames} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
    <GameSection title="เกมแนะนำ" items={payload.featured ?? []} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
    <GameSection title="มาใหม่" items={payload.newest ?? []} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />
    <GameSection title="ยอดนิยม" items={payload.popular ?? []} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} />

    <section className="game-lobby-section">
      <header><h2>เกมทั้งหมด</h2><span>{filtered.length} เกม · พร้อมเล่น {filteredAvailable.length}</span></header>
      <div className="game-lobby-grid">{filtered.map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launching.gameId === game.id} onLaunch={launchGame} onFavorite={toggleFavorite} />)}{!message && filtered.length === 0 && <EmptyLobby onReset={resetFilters} />}</div>
    </section>
    <MemberBottomNav />
  </main>;
}

function GameSection({ title, items, favoriteIds, launchingGameId, onLaunch, onFavorite }: { title: string; items: Game[]; favoriteIds: string[]; launchingGameId?: string; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) {
  const visible = items.slice(0, 8);
  if (visible.length === 0) return null;
  return <section className="game-lobby-section"><header><h2>{title}</h2><span>{items.length} เกม</span></header><div className="game-lobby-grid">{visible.map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launchingGameId === game.id} onLaunch={onLaunch} onFavorite={onFavorite} />)}</div></section>;
}

function GameCard({ game, favorite, launching, onLaunch, onFavorite }: { game: Game; favorite: boolean; launching: boolean; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) {
  const image = pickImage(game);
  const available = isGameAvailable(game);
  return <article className={`game-lobby-card${available ? '' : ' is-unavailable'}`}>
    {image ? <img src={image} alt={`ภาพปก ${game.name}`} loading="lazy" /> : <div className="game-lobby-fallback" aria-hidden="true">{game.name.slice(0, 2).toUpperCase()}</div>}
    <button type="button" aria-label={favorite ? `นำ ${game.name} ออกจากเกมโปรด` : `เพิ่ม ${game.name} เป็นเกมโปรด`} aria-pressed={favorite} className={`game-lobby-favorite${favorite ? ' is-active' : ''}`} onClick={() => onFavorite(game)}>{favorite ? '★' : '☆'}</button>
    {!available && <span className="game-lobby-maintenance">ปิดปรับปรุง</span>}
    <div className="game-lobby-card-body"><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode}</span><div className="game-lobby-badges">{game.isFeatured && <em>แนะนำ</em>}{game.isNew && <em>ใหม่</em>}{game.isPopular && <em>นิยม</em>}<em>{categoryLabel(game.category)}</em></div><button type="button" onClick={() => onLaunch(game)} disabled={launching || !available}>{launching ? 'กำลังเปิด...' : available ? 'เล่น' : 'ยังไม่พร้อม'}</button></div>
  </article>;
}

function EmptyLobby({ onReset }: { onReset: () => void }) { return <div className="game-lobby-empty"><strong>ไม่เจอเกมในเงื่อนไขนี้</strong><span>ลองล้างตัวกรองหรือค้นหาด้วยชื่อค่ายหรือชื่อเกมอื่น</span><button type="button" onClick={onReset}>ล้างตัวกรอง</button></div>; }
function pickImage(game: Game) { const media = game.media ?? []; return media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function isGameAvailable(game: Game) { const gameStatus = String(game.status ?? 'ACTIVE').toUpperCase(); const providerStatus = String(game.provider?.status ?? 'ACTIVE').toUpperCase(); return gameStatus === 'ACTIVE' && providerStatus === 'ACTIVE'; }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', popular: 'ยอดนิยม', new: 'ใหม่' }; return map[value?.toLowerCase?.()] ?? value; }
function readIds(key: string) { try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; } catch { return []; } }
function writeIds(key: string, ids: string[]) { window.localStorage.setItem(key, JSON.stringify(ids)); }
function readFilters() { try { return JSON.parse(window.localStorage.getItem(LOBBY_FILTER_KEY) ?? '{}') as { category?: string; provider?: string; query?: string }; } catch { return {}; } }
function writeFilters(value: { category: string; provider: string; query: string }) { window.localStorage.setItem(LOBBY_FILTER_KEY, JSON.stringify(value)); }
function rememberRecent(id: string, setRecentIds: (updater: (current: string[]) => string[]) => void) { setRecentIds((current) => { const next = [id, ...current.filter((item) => item !== id)].slice(0, 12); writeIds(RECENT_KEY, next); return next; }); }
function countBy<T>(items: T[], pick: (item: T) => string) { const map = new Map<string, number>(); for (const item of items) { const key = pick(item); map.set(key, (map.get(key) ?? 0) + 1); } return map; }
