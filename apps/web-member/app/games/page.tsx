'use client';

import { useEffect, useMemo, useState } from 'react';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from '../components/reference-asset-catalog';
import { useMemberSession } from '../member-session-provider';

const CATEGORY_SEQUENCE = ['slot', 'casino', 'fishing', 'sport', 'card', 'lottery'] as const;
type Category = 'all' | (typeof CATEGORY_SEQUENCE)[number];

type PublicGame = {
  id: string;
  name: string;
  imageUrl: string;
  category: (typeof CATEGORY_SEQUENCE)[number];
  provider: string;
  isPopular: boolean;
  isNew: boolean;
};

const GAMES: PublicGame[] = REFERENCE_GAMES.map((asset, index) => ({
  id: `reference-${index + 1}`,
  name: asset.name,
  imageUrl: asset.url,
  category: CATEGORY_SEQUENCE[index % CATEGORY_SEQUENCE.length] ?? 'slot',
  provider: REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]?.name ?? 'NOAH345',
  isPopular: index < 8,
  isNew: index >= REFERENCE_GAMES.length - 6,
}));

export default function PublicGamesPage() {
  const { isLoggedIn } = useMemberSession();
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<PublicGame | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('category');
    if (requested && CATEGORY_SEQUENCE.includes(requested as Exclude<Category, 'all'>)) {
      setCategory(requested as Exclude<Category, 'all'>);
    }
    try {
      const stored = JSON.parse(window.localStorage.getItem('member_public_favorite_games') ?? '[]');
      if (Array.isArray(stored)) setFavoriteIds(stored.filter((value): value is string => typeof value === 'string'));
    } catch {
      // Browsing still works when storage is unavailable.
    }
  }, []);

  const visibleGames = useMemo(() => {
    const search = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesCategory = category === 'all' || game.category === category;
      const matchesSearch = !search || `${game.name} ${game.provider}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  function chooseCategory(value: Category) {
    setCategory(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') params.delete('category');
    else params.set('category', value);
    const suffix = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${suffix ? `?${suffix}` : ''}`);
  }

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [id, ...current];
      try { window.localStorage.setItem('member_public_favorite_games', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function play(game: PublicGame) {
    if (!isLoggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(`/games?play=${game.id}`)}`;
      return;
    }
    setSelectedGame(game);
  }

  return (
    <main className="game-lobby-page public-game-lobby">
      <section className="game-lobby-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,8,12,.96),rgba(8,8,12,.28)),url(${JSON.stringify(GAMES[0]?.imageUrl ?? '').slice(1, -1)})` }}>
        <div className="game-lobby-hero-copy"><span className="game-lobby-kicker">NOAH345 GAME LOBBY</span><h1>เลือกเกมที่คุณชอบได้ก่อนเข้าสู่ระบบ</h1><p>คาสิโน สล็อต ยิงปลา กีฬา ไพ่ และหวย พร้อมให้ค้นหาและดูรายละเอียด</p><div className="game-lobby-hero-actions"><a className="is-primary" href={isLoggedIn ? '#game-catalog' : '/login?next=%2Fgames'}>{isLoggedIn ? 'เลือกเกม' : 'เข้าสู่ระบบเพื่อเล่น'}</a></div></div>
        <div className="game-lobby-hero-orb" aria-hidden="true"><span>{GAMES.length}</span><small>GAMES</small></div>
      </section>

      <section className="game-lobby-toolbar" aria-label="ค้นหาเกม">
        <label className="game-lobby-search"><span className="sr-only">ค้นหาเกม</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเกมหรือค่าย" /></label>
        <button type="button" className="game-lobby-clear" onClick={() => { setQuery(''); chooseCategory('all'); }}>ล้าง</button>
      </section>

      <nav className="game-lobby-tabs" aria-label="หมวดเกม">
        <button type="button" className={category === 'all' ? 'is-active' : ''} onClick={() => chooseCategory('all')}>ทั้งหมด</button>
        {CATEGORY_SEQUENCE.map((value) => <button key={value} type="button" className={category === value ? 'is-active' : ''} onClick={() => chooseCategory(value)}>{categoryLabel(value)}</button>)}
      </nav>

      <section className="game-lobby-section" id="game-catalog">
        <header><h2>{category === 'all' ? 'เกมทั้งหมด' : categoryLabel(category)}</h2><span>{visibleGames.length} เกม</span></header>
        <div className="game-lobby-grid">
          {visibleGames.map((game) => {
            const favorite = favoriteIds.includes(game.id);
            return <article className="game-lobby-card" key={game.id}>
              <button type="button" className="game-lobby-cover-button" onClick={() => play(game)}><span className="game-lobby-image is-loaded"><img src={game.imageUrl} alt={`ภาพปก ${game.name}`} loading="lazy" /></span></button>
              <button type="button" className={`game-lobby-favorite${favorite ? ' is-active' : ''}`} aria-pressed={favorite} onClick={() => toggleFavorite(game.id)}>{favorite ? '★' : '☆'}</button>
              <div className="game-lobby-card-body"><strong>{game.name}</strong><span>{game.provider}</span><button type="button" onClick={() => play(game)}>{isLoggedIn ? 'เล่น' : 'เข้าสู่ระบบเพื่อเล่น'}</button></div>
            </article>;
          })}
        </div>
      </section>

      {selectedGame && <div className="ui-overlay game-public-modal" role="presentation" onMouseDown={() => setSelectedGame(null)}><section className="ui-overlay-surface" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button type="button" onClick={() => setSelectedGame(null)} aria-label="ปิด">×</button><img src={selectedGame.imageUrl} alt={selectedGame.name} /><h2>{selectedGame.name}</h2><p>{selectedGame.provider} · {categoryLabel(selectedGame.category)}</p><p>หน้าเปิดเกมอยู่ในโหมด Frontend Preview และจะเชื่อม launch API ภายหลัง</p><button type="button" onClick={() => setSelectedGame(null)}>ปิด</button></section></div>}
    </main>
  );
}

function categoryLabel(value: Exclude<Category, 'all'>) {
  const labels: Record<Exclude<Category, 'all'>, string> = { slot: 'สล็อต', casino: 'คาสิโน', fishing: 'ยิงปลา', sport: 'กีฬา', card: 'ไพ่', lottery: 'หวย' };
  return labels[value];
}
