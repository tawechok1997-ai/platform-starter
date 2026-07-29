'use client';

import { useEffect, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import { applyMemberImageFallback, hideDecorativeImage } from '../image-fallback';
import { V47_ASSETS } from './v47-asset-map';

type LobbyGame = {
  id: string;
  name: string;
  imageUrl: string;
  providerLogo: string;
  badge: 'HOT' | 'NEW' | '';
  category: string;
  provider: string;
  players: number;
};

type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  code?: string | null;
  name?: string | null;
  providerId?: string | null;
  provider?: string | { code?: string | null; logoUrl?: string | null } | null;
  providerLogoUrl?: string | null;
  category?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  onlinePlayers?: number | null;
  playerCount?: number | null;
  rawPayload?: { assetSource?: string | null } | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
  data?: CatalogGame[] | null;
};

type LiveItem = {
  league: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
};

const FALLBACK_GAMES: LobbyGame[] = [
  game('caishen-win', 'Caishen Win!', 'https://cdn.zabbet.com/games/1776497353110-1181f568-fdd2-450d-a812-faa308cb334b.png', 'hotdog', 'slot', 'HOT'),
  game('super-ace', 'Super Ace', 'https://cdn.zabbet.com/games/1776752691156-e36b7cd1-61b7-4a78-aacf-0c40bdb503f9.png', 'hotdog', 'slot', 'HOT'),
  game('roma-x', 'Roma X', 'https://cdn.zabbet.com/games/1776752719475-27cbcef6-51b7-460d-91a7-6a285dfcb42b.png', 'hotdog', 'slot', 'HOT'),
  game('funky-fortunez', 'Funky Fortunez', 'https://cdn.zabbet.com/games/1777960364860-5737aa5a-9dba-4a0b-bc37-5d9339d98dd7.png', 'pgsoft', 'slot', 'NEW'),
  game('island-ices', 'Island Ices', 'https://cdn.zabbet.com/games/1771481576088-7a598c5e-dbe1-441a-a3e0-c9aba0ede728.png', 'ygg', 'slot', 'NEW'),
  game('covert-chaos', 'Covert Chaos', 'https://cdn.zabbet.com/games/1771481607415-fd863209-0afc-434f-92bd-7b7a07b13a0b.png', 'ygg', 'slot', 'NEW'),
  game('thai-hi-lo-2', 'ไฮโลไทย 2', 'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg', 'kingm', 'card', 'NEW'),
  game('baccarat', 'บาคาร่า', 'https://cdn.zabbet.com/games/KM/TH/Baccarat.jpg', 'kingm', 'card', ''),
  game('devil-buster', 'Devil Buster', 'https://cdn.zabbet.com/games/1687329677649-ad488dc9-496a-4f75-894e-13e8eb7c9ffa.jpg', 'kagafish', 'fishing', 'HOT'),
  game('hero-fishing', 'Hero Fishing', 'https://cdn.zabbet.com/games/1670595737720-4a51357f-9592-45bc-9223-78b674b217a4.png', 'cqfish', 'fishing', 'HOT'),
  game('muscle-fortune-cat', 'Muscle Fortune Cat', 'https://cdn.zabbet.com/games/1772000800361-6f87dbc3-c3ea-4035-8850-21d262c1baf4.png', 'fachai', 'slot', 'NEW'),
  game('money-tree', 'Money Tree', 'https://cdn.zabbet.com/games/1778467190766-eb787ab3-e567-47f2-b960-cd62d613019e.png', 'hotdog', 'slot', 'HOT'),
];

const LIVE_ITEMS: LiveItem[] = [
  { league: 'เดนมาร์ก - ซูเปอร์ลีกา', home: 'แรนเดอร์ส', away: 'ซิลเคบอร์ก', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'นอร์เวย์ - ทิปเปลีเก้น', home: 'โรเซนบอร์ก', away: 'เฟรดริคสตัด', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'สวีเดน - อัลสเวนส์คาน', home: 'ฮัคเค่น', away: 'เอไอเค โซลน่า', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'ฮังการี - เอ็นบี ไอ', home: 'เอ็มทีเค บูดาเปสต์', away: 'ซาเลเกอร์สเซ็ก ทีอี', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'โรมาเนีย - ลีกา 1', home: 'โบโตซานี่', away: 'ราปิด บูคาเรสต์', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'เอกวาดอร์ - เซเรีย อา', home: 'มูชุค รูน่า', away: 'Libertad', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
];

let lobbyGamesRequest: Promise<LobbyGame[]> | null = null;

function useLobbyGames() {
  const [items, setItems] = useState<LobbyGame[]>(FALLBACK_GAMES);

  useEffect(() => {
    let cancelled = false;
    void getLobbyGames().then((games) => {
      if (!cancelled && games.length) setItems(games);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}

async function getLobbyGames() {
  if (!lobbyGamesRequest) lobbyGamesRequest = loadLobbyGames();
  return lobbyGamesRequest;
}

async function loadLobbyGames(): Promise<LobbyGame[]> {
  const categories = ['slot', 'casino', 'arcade', 'fishing'];

  try {
    const payloads = await Promise.all(categories.map(async (category) => {
      const params = new URLSearchParams({ platform: 'desktop', category, page: '1', limit: '100' });
      const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
        skipAuth: true,
        suppressSessionExpiryRedirect: true,
      });
      if (!response.ok) return null;
      return await response.json().catch(() => null) as CatalogPayload | null;
    }));

    const catalogGames = payloads.flatMap((payload) => {
      const source = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : [];
      return source.map(mapCatalogGame).filter((item): item is LobbyGame => Boolean(item));
    });

    const merged = dedupeGames([...catalogGames, ...FALLBACK_GAMES]);
    return merged.sort((left, right) => gameScore(right) - gameScore(left)).slice(0, 24);
  } catch {
    lobbyGamesRequest = null;
    return FALLBACK_GAMES;
  }
}

function mapCatalogGame(item: CatalogGame): LobbyGame | null {
  const id = String(item.providerGameCode ?? item.code ?? item.id ?? '').trim();
  const name = String(item.name ?? '').trim();
  const imageUrl = firstText(item.imageUrl, item.iconUrl);
  if (!id || !name || !imageUrl || isNonGameMedia(imageUrl)) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || imageUrl.includes('/provider-simulator/icons/')) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const provider = normalizeProvider(firstText(item.providerId, typeof item.provider === 'string' ? item.provider : null, providerObject?.code));
  const providerLogo = firstText(item.providerLogoUrl, providerObject?.logoUrl, provider ? `https://cdn.zabbet.com/providers/set/1_1_badge/${provider}.png` : null);
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const badge: LobbyGame['badge'] = tags.some(isHotTag) ? 'HOT' : tags.some(isNewTag) ? 'NEW' : '';
  const players = readPlayerCount(item, id);

  return {
    id,
    name,
    imageUrl,
    providerLogo,
    badge,
    category: normalizeCategory(item.category),
    provider,
    players,
  };
}

function game(id: string, name: string, imageUrl: string, provider: string, category: string, badge: LobbyGame['badge']): LobbyGame {
  return {
    id,
    name,
    imageUrl,
    providerLogo: `https://cdn.zabbet.com/providers/set/1_1_badge/${provider}.png`,
    provider,
    category,
    badge,
    players: estimatedPlayers(id),
  };
}

function dedupeGames(items: LobbyGame[]) {
  return Array.from(new Map(items.map((item) => [`${item.provider}:${item.id}`.toLowerCase(), item] as const)).values());
}

function gameScore(item: LobbyGame) {
  const badgeScore = item.badge === 'HOT' ? 200 : item.badge === 'NEW' ? 100 : 0;
  return badgeScore + item.players;
}

function readPlayerCount(item: CatalogGame, seed: string) {
  const value = Number(item.onlinePlayers ?? item.playerCount);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : estimatedPlayers(seed);
}

function estimatedPlayers(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  return 1200 + Math.abs(hash % 4200);
}

function isHotTag(tag: string) {
  return tag.includes('hot') || tag.includes('popular') || tag.includes('ฮิต');
}

function isNewTag(tag: string) {
  return tag.includes('new') || tag.includes('ใหม่');
}

function isNonGameMedia(url: string) {
  const value = url.toLowerCase();
  return ['/highlight/', '/promotion', '/lobby_settings/', '/imageslides/', '/banner/'].some((token) => value.includes(token));
}

function normalizeProvider(value: string) {
  return value.trim().toLowerCase().replace(/\.png$/i, '');
}

function normalizeCategory(value?: string | null) {
  const category = String(value ?? 'slot').trim().toLowerCase();
  if (category === 'fish') return 'fishing';
  if (category === 'table') return 'card';
  return category || 'slot';
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function gameHref(item: LobbyGame) {
  const params = new URLSearchParams({ category: item.category });
  if (item.provider) params.set('provider', item.provider);
  return `/browse/games?${params.toString()}`;
}

function SourceHeading({ title, icon, iconSize = 25, notice }: { title: string; icon: string; iconSize?: number; notice?: string }) {
  return (
    <header className="source-feed-heading">
      <span className="source-feed-heading__content">
        <img src={icon} alt="" aria-hidden="true" width={iconSize} height={iconSize} onError={hideDecorativeImage} />
        <strong>{title}</strong>
        {notice ? <small className="source-feed-heading__notice">{notice}</small> : null}
      </span>
    </header>
  );
}

export function SourcePopularSection() {
  const games = useLobbyGames().slice(0, 10);

  return (
    <section className="source-feed-host source-feed-host--popular" data-section-kind="popular" data-content-state="catalog">
      <div className="member-source-feed-mount member-source-feed-mount--popular">
        <div className="source-feed-section source-popular-section">
          <SourceHeading title="Top 10 Popular Games" icon="/images/highlight/icongamehit.webp" iconSize={24} />
          <div className="source-popular-track" data-drag-scroll="true">
            {games.map((item, index) => (
              <a key={`${item.provider}:${item.id}`} className="source-popular-card" href={gameHref(item)} title={item.name}>
                <span className="source-popular-card__art">
                  <img className="source-popular-card__blur" src={item.imageUrl} alt="" aria-hidden="true" onError={applyMemberImageFallback} />
                  <img className="source-popular-card__image" src={item.imageUrl} alt={item.name} onError={applyMemberImageFallback} />
                  {item.providerLogo ? <span className="source-popular-card__provider"><img src={item.providerLogo} alt="" aria-hidden="true" onError={hideDecorativeImage} /></span> : null}
                  {item.badge ? <span className={`source-popular-card__badge source-popular-card__badge--${item.badge.toLowerCase()}`}>{item.badge}</span> : null}
                </span>
                <span className="source-popular-card__name">{item.name}</span>
                <span className="source-popular-card__rank" aria-hidden="true">{index + 1}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SourceOnlineSection() {
  const games = [...useLobbyGames()].sort((left, right) => right.players - left.players).slice(0, 6);

  return (
    <section className="source-feed-host source-feed-host--online" data-section-kind="online" data-content-state="catalog">
      <div className="member-source-feed-mount member-source-feed-mount--online">
        <div className="source-feed-section source-online-section">
          <SourceHeading title="Most Online Now" icon="/images/home/mostonline1.webp" notice="จำนวนผู้เล่นโดยประมาณ" />
          <div className="source-online-track" data-drag-scroll="true">
            {games.map((item) => (
              <a key={`${item.provider}:${item.id}`} className="source-online-card" href={gameHref(item)} title={item.name}>
                <span className="source-online-card__art"><img src={item.imageUrl} alt={item.name} onError={applyMemberImageFallback} /></span>
                <span className="source-online-card__counter"><span className="source-online-card__counter-inner"><UserIcon /><strong>{item.players.toLocaleString('en-US')}</strong></span></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SourceLiveSection({ onAction }: { onAction: () => void }) {
  return (
    <section className="source-feed-host source-feed-host--live" id="live" data-section-kind="live" data-content-state="demo">
      <div className="member-source-feed-mount member-source-feed-mount--live">
        <div className="source-feed-section source-live-section">
          <SourceHeading title="ตารางการแข่งขัน" icon="/images/home/live1.webp" notice="ข้อมูลตัวอย่าง ไม่ใช่รายการสด" />
          <div className="source-live-track" data-drag-scroll="true">
            {LIVE_ITEMS.map((match, index) => (
              <article key={`${match.league}-${index}`} className="source-live-card">
                <div className="source-live-card__inner">
                  <div className="source-live-card__glow" aria-hidden="true" />
                  <div className="source-live-card__content">
                    <header className="source-live-card__header">
                      <span className="source-live-card__league"><SoccerIcon /><span>{match.league}</span></span>
                      <span className="source-live-card__status"><b>ตัวอย่าง</b><time>กำหนดการจำลอง</time></span>
                    </header>
                    <div className="source-live-card__teams"><Team logo={match.homeLogo} name={match.home} /><strong>VS</strong><Team logo={match.awayLogo} name={match.away} /></div>
                    <footer className="source-live-card__actions">
                      <button type="button" className="source-live-card__watch" onClick={onAction}><LiveIcon /><span>ดูหมวดกีฬา</span></button>
                      <button type="button" className="source-live-card__bet" onClick={onAction}>เลือกเกมกีฬา</button>
                    </footer>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Team({ logo, name }: { logo: string; name: string }) {
  return <span className="source-live-team"><span className="source-live-team__logo"><img src={logo} alt="" aria-hidden="true" onError={applyMemberImageFallback} /></span><span title={name}>{name}</span></span>;
}

function UserIcon() {
  return <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true"><path d="M6 7.41a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666Z" fill="#944fe8" fillOpacity=".86" /><path d="M0 14.805a6 6 0 0 1 12 0 .6.6 0 0 1-.6.606H.6a.6.6 0 0 1-.6-.606Z" fill="#944fe8" fillOpacity=".86" /></svg>;
}

function SoccerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" /><path d="m12 7 3 2.2-1.15 3.5h-3.7L9 9.2 12 7Zm-3 2.2-3.5.4m8.35 3.1 2.2 3.05M10.15 12.7l-2.2 3.05m.05 0-1.25 2.7m9.3-2.7 1.2 2.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}

function LiveIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="white" /><path d="M3.4 3.4a6.5 6.5 0 0 0 0 9.2M12.6 3.4a6.5 6.5 0 0 1 0 9.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
