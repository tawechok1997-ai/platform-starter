'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type GameProvider = { name: string; code: string; status?: string | null; logoUrl?: string | null };
type Game = { id: string; providerGameCode: string; name: string; category: string; platform: 'mobile' | 'pc' | 'both'; status?: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: GameProvider; media?: GameMedia[]; imageUrl?: string | null; iconUrl?: string | null };
type Counts = { total: number; database: number; catalogOnly: number; mobile: number; pc: number };

type Props = {
  games: Game[];
  counts: Counts;
  providerCount: number;
  loading: boolean;
  onExplore: () => void;
  onLaunch: (game: Game) => void;
};

export default function HeroCarousel({ games, counts, providerCount, loading, onExplore, onLaunch }: Props) {
  const slides = useMemo(() => uniqueGames(games).slice(0, 5), [games]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const current = slides[active];

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  function move(direction: number) {
    if (slides.length < 2) return;
    setActive((value) => (value + direction + slides.length) % slides.length);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart.current = event.clientX;
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start === null) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
  }

  const image = current ? pickImage(current) : null;
  const available = current ? isAvailable(current) : false;

  return <section
    className="game-hero-carousel"
    aria-roledescription="carousel"
    aria-label="เกมแนะนำ"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={() => setPaused(false)}
    onPointerDown={handlePointerDown}
    onPointerUp={handlePointerUp}
    onPointerCancel={() => { pointerStart.current = null; }}
    style={image ? { backgroundImage: `linear-gradient(90deg,rgba(8,8,12,.97),rgba(8,8,12,.72) 50%,rgba(8,8,12,.22)),url(${JSON.stringify(image).slice(1, -1)})` } : undefined}
  >
    <div className="game-hero-carousel-copy" aria-live="polite">
      <span className="game-lobby-kicker">FEATURED GAME {slides.length > 1 ? `${active + 1}/${slides.length}` : ''}</span>
      <h1>{loading ? 'กำลังเตรียมเกมให้คุณ' : current?.name ?? 'เกมทั้งหมดในที่เดียว'}</h1>
      <p>{current ? `${current.provider?.name ?? 'Game Provider'} · ${categoryLabel(current.category)} · ${platformLabel(current.platform)}` : `เลือกจาก ${counts.total} เกม และ ${providerCount} ค่าย`}</p>
      <div className="game-lobby-hero-actions">
        {current && available && <button type="button" className="is-primary" onClick={() => onLaunch(current)}>เล่นเกมนี้</button>}
        <button type="button" onClick={onExplore}>ดูเกมทั้งหมด</button>
      </div>
    </div>

    <div className="game-hero-carousel-side">
      <div className="game-lobby-hero-orb" aria-hidden="true"><span>{loading ? '…' : counts.total}</span><small>GAMES</small></div>
      {slides.length > 1 && <div className="game-hero-carousel-arrows">
        <button type="button" aria-label="สไลด์ก่อนหน้า" onClick={() => move(-1)}>‹</button>
        <button type="button" aria-label="สไลด์ถัดไป" onClick={() => move(1)}>›</button>
      </div>}
    </div>

    {slides.length > 1 && <div className="game-hero-carousel-dots" role="tablist" aria-label="เลือกสไลด์">
      {slides.map((game, index) => <button key={game.id} type="button" role="tab" aria-selected={active === index} aria-label={`สไลด์ ${index + 1}: ${game.name}`} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}><span /></button>)}
    </div>}
    {slides.length > 1 && !paused && <span key={active} className="game-hero-carousel-progress" aria-hidden="true" />}
  </section>;
}

function uniqueGames(games: Game[]) { return [...new Map(games.map((game) => [game.id, game])).values()]; }
function pickImage(game: Game) { const media = Array.isArray(game.media) ? game.media : []; return game.imageUrl ?? game.iconUrl ?? media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function isAvailable(game: Game) { return String(game.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && String(game.provider?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && !game.id.startsWith('catalog:'); }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', arcade: 'อาร์เคด', fps: 'FPS', moba: 'MOBA', rpg: 'RPG', casual: 'แคชชวล', lottery: 'หวย' }; return map[value.toLowerCase()] ?? value; }
function platformLabel(value: Game['platform']) { return value === 'mobile' ? 'Mobile' : value === 'pc' ? 'PC' : 'Mobile / PC'; }
