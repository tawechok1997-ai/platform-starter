'use client';

import { useEffect, useState } from 'react';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type GameProvider = { name: string; code: string; status?: string | null; logoUrl?: string | null };
type Game = { id: string; providerGameCode: string; name: string; category: string; platform: 'mobile' | 'pc' | 'both'; status?: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: GameProvider; media?: GameMedia[]; imageUrl?: string | null; iconUrl?: string | null };
type Props = { games: Game[]; launchingGameId?: string; onLaunch: (game: Game) => void };

export default function HotGamesRail({ games, launchingGameId, onLaunch }: Props) {
  const [detailGame, setDetailGame] = useState<Game | null>(null);
  const visible = games.slice(0, 10);
  useEffect(() => {
    if (!detailGame) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setDetailGame(null); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [detailGame]);
  if (!visible.length) return null;
  return <>
    <section className="hot-games-section" aria-label="เกมกำลังมาแรง">
      <header><div><span>LIVE TREND</span><h2>🔥 เกมกำลังมาแรง</h2></div><small>{visible.length} อันดับ</small></header>
      <div className="hot-games-rail">{visible.map((game, index) => <HotGameCard key={game.id} game={game} rank={index + 1} launching={launchingGameId === game.id} onLaunch={onLaunch} onDetail={setDetailGame} />)}</div>
    </section>
    {detailGame && <GameDetailDialog game={detailGame} launching={launchingGameId === detailGame.id} onClose={() => setDetailGame(null)} onLaunch={onLaunch} />}
  </>;
}

function HotGameCard({ game, rank, launching, onLaunch, onDetail }: { game: Game; rank: number; launching: boolean; onLaunch: (game: Game) => void; onDetail: (game: Game) => void }) {
  const [failed, setFailed] = useState(false);
  const image = pickImage(game); const available = isAvailable(game); const metrics = gameMetrics(game.id);
  return <article className={`hot-game-card${available ? '' : ' is-unavailable'}`}>
    <div className="hot-game-rank"><span>TOP</span><strong>{rank}</strong></div>
    <div className="hot-game-cover">{image && !failed ? <img src={image} alt={`ภาพปก ${game.name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span>{game.name.slice(0, 2).toUpperCase()}</span>}<div className="hot-game-overlay"><button type="button" onClick={() => onDetail(game)}>รายละเอียด</button><button type="button" disabled={!available || launching} onClick={() => onLaunch(game)}>{launching ? 'กำลังเปิด...' : available ? 'เล่นทันที' : 'รอเชื่อมระบบ'}</button></div></div>
    <div className="hot-game-body"><strong title={game.name}>{game.name}</strong><span>{game.provider?.name ?? 'Game Provider'} · {platformLabel(game.platform)}</span><div className="hot-game-metrics"><small><i aria-hidden="true" /> {metrics.players.toLocaleString('th-TH')} คน</small><small>RTP {metrics.rtp}%</small></div></div>
  </article>;
}

function GameDetailDialog({ game, launching, onClose, onLaunch }: { game: Game; launching: boolean; onClose: () => void; onLaunch: (game: Game) => void }) {
  const image = pickImage(game); const available = isAvailable(game); const metrics = gameMetrics(game.id);
  return <div className="game-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="game-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="game-detail-title">
    <button type="button" className="game-detail-close" aria-label="ปิดรายละเอียดเกม" onClick={onClose}>×</button>
    <div className="game-detail-cover">{image ? <img src={image} alt={`ภาพปก ${game.name}`} /> : <span>{game.name.slice(0, 2).toUpperCase()}</span>}</div>
    <div className="game-detail-copy"><span className="game-detail-kicker">{game.provider?.name ?? game.providerGameCode}</span><h2 id="game-detail-title">{game.name}</h2><p>{categoryLabel(game.category)} · {platformLabel(game.platform)}</p>
      <div className="game-detail-metrics"><span><strong>{metrics.players.toLocaleString('th-TH')}</strong> ผู้เล่น</span><span><strong>{metrics.rtp}%</strong> RTP</span><span><strong>{available ? 'พร้อม' : 'รอเชื่อม'}</strong> สถานะ</span></div>
      <div className="game-detail-badges">{game.isPopular && <em>ยอดนิยม</em>}{game.isFeatured && <em>แนะนำ</em>}{game.isNew && <em>เกมใหม่</em>}</div>
      <button type="button" className="game-detail-play" disabled={!available || launching} onClick={() => onLaunch(game)}>{launching ? 'กำลังเปิด...' : available ? 'เล่นเกมนี้' : 'ยังไม่พร้อมให้เล่น'}</button>
    </div>
  </section></div>;
}

function pickImage(game: Game) { const media = Array.isArray(game.media) ? game.media : []; return game.imageUrl ?? game.iconUrl ?? media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function isAvailable(game: Game) { return String(game.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && String(game.provider?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE' && !game.id.startsWith('catalog:'); }
function platformLabel(value: Game['platform']) { return value === 'mobile' ? 'Mobile' : value === 'pc' ? 'PC' : 'Mobile / PC'; }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ตกปลา', arcade: 'อาร์เคด', fps: 'FPS', moba: 'MOBA', rpg: 'RPG', casual: 'แคชชวล', lottery: 'หวย' }; return map[value?.toLowerCase?.()] ?? value; }
function gameMetrics(seed: string) { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0; const value = Math.abs(hash); return { players: 120 + (value % 1880), rtp: (94.2 + ((value % 47) / 10)).toFixed(1) }; }
