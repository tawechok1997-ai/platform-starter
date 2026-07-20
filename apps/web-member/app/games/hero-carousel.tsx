'use client';

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
  const current = games.find(Boolean);
  const image = current ? pickImage(current) : null;
  const available = current ? isAvailable(current) : false;

  return <section
    className="game-hero-carousel"
    aria-label="เกมแนะนำ"
    style={image ? { backgroundImage: `linear-gradient(90deg,rgba(8,8,12,.97),rgba(8,8,12,.72) 50%,rgba(8,8,12,.22)),url(${JSON.stringify(image).slice(1, -1)})` } : undefined}
  >
    <div className="game-hero-carousel-copy">
      <span className="game-lobby-kicker">FEATURED GAME</span>
      <h1>{loading ? 'กำลังเตรียมเกมให้คุณ' : current?.name ?? 'เกมทั้งหมดในที่เดียว'}</h1>
      <p>{current ? `${current.provider?.name ?? 'Game Provider'} · ${categoryLabel(current.category)} · ${platformLabel(current.platform)}` : `เลือกจาก ${counts.total} เกม และ ${providerCount} ค่าย`}</p>
      <div className="game-lobby-hero-actions">
        {current && available ? <button type="button" className="is-primary" onClick={() => onLaunch(current)}>เล่นเกมนี้</button> : null}
        <button type="button" onClick={onExplore}>ดูเกมทั้งหมด</button>
      </div>
    </div>
    <div className="game-hero-carousel-side">
      <div className="game-lobby-hero-orb" aria-hidden="true"><span>{loading ? '…' : counts.total}</span><small>GAMES</small></div>
    </div>
  </section>;
}

function pickImage(game: Game) {
  const media = Array.isArray(game.media) ? game.media : [];
  return game.imageUrl ?? game.iconUrl ?? media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null;
}

function isAvailable(game: Game) {
  return String(game.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && String(game.provider?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && !game.id.startsWith('catalog:');
}

function categoryLabel(value: string) {
  const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', arcade: 'อาร์เคด', fps: 'FPS', moba: 'MOBA', rpg: 'RPG', casual: 'แคชชวล', lottery: 'หวย' };
  return map[value.toLowerCase()] ?? value;
}

function platformLabel(value: Game['platform']) {
  return value === 'mobile' ? 'Mobile' : value === 'pc' ? 'PC' : 'Mobile / PC';
}
