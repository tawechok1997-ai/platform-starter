'use client';

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { memberApiFetch } from '../../member-api';
import { hideDecorativeImage } from '../image-fallback';
import { V47_ASSETS } from './v47-asset-map';

const LOCAL_IMAGE_ASSET_ROOT = '/assets/asset-pc/images';
const GAME_CARD_MAX_RATIO = 1.32;

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
  game('roma-x-10000', 'ROMA X 10000', 'https://cdn.zabbet.com/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg', 'jl', 'slot', 'HOT'),
  game('maya-golden-city-2', 'Maya Golden City 2', 'https://cdn.zabbet.com/games/1704871891426-d938a4ec-5a3c-475f-a1d0-c410e0b30782.jpg', 'ygr', 'slot', 'HOT'),
  game('el-paso-gunfight', 'El Paso Gunfight xNudge', 'https://cdn.zabbet.com/games/NLC/elpaso0000000000.jpg', 'nlc', 'slot', 'NEW'),
  game('sweet-bonanza-xmas', 'Sweet Bonanza Xmas', 'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png', 'pp', 'slot', 'NEW'),
  game('roma', 'Roma', 'https://cdn.zabbet.com/games/1684776659135-399a7654-b556-4a24-885d-3946c7322fb9.jpg', 'rsg', 'slot', 'NEW'),
  game('treasures-of-aztec-z', 'TREASURES OF AZTEC Z', 'https://cdn.zabbet.com/games/1692882357754-c47b8426-4045-4792-8ee3-58b784ed9a78.jpg', 'ps', 'slot', 'NEW'),
  game('thai-hi-lo-2', 'ไฮโลไทย 2', 'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg', 'kingm', 'card', 'NEW'),
  game('starlight-princess', 'Starlight Princess', 'https://cdn.zabbet.com/games/vertical/PP/starlight_princess.png', 'pp', 'slot', 'NEW'),
  game('coin-spinner', 'Coin Spinner', 'https://cdn.zabbet.com/games/vertical/CQ/coin_spinner.jpg', 'cq', 'arcade', 'NEW'),
  game('fortune-gems', 'Fortune Gems', 'https://cdn.zabbet.com/games/1671995554666-2fba59cf-2cb7-48bf-b619-ba56269e90ca.jpg', 'jl', 'slot', 'NEW'),
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

function useRenderableGames(limit: number, order: 'popular' | 'online') {
  const games = useLobbyGames();
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(() => new Set());

  const items = useMemo(() => {
    const valid = games.filter((item) => !invalidKeys.has(gameKey(item)));
    if (order === 'online') valid.sort((left, right) => right.players - left.players);
    return valid.slice(0, limit);
  }, [games, invalidKeys, limit, order]);

  const reject = (item: LobbyGame) => {
    const key = gameKey(item);
    setInvalidKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  return { items, reject };
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
    return merged.sort((left, right) => gameScore(right) - gameScore(left)).slice(0, 40);
  } catch {
    lobbyGamesRequest = null;
    return FALLBACK_GAMES;
  }
}

function mapCatalogGame(item: CatalogGame): LobbyGame | null {
  const id = String(item.providerGameCode ?? item.code ?? item.id ?? '').trim();
  const name = String(item.name ?? '').trim();
  const sourceImageUrl = firstText(item.imageUrl, item.iconUrl);
  if (!id || !name || !sourceImageUrl || isNonGameMedia(sourceImageUrl)) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || sourceImageUrl.includes('/provider-simulator/icons/')) return null;

  const imageUrl = localGameImageUrl(sourceImageUrl);
  if (!imageUrl) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const provider = normalizeProvider(firstText(item.providerId, typeof item.provider === 'string' ? item.provider : null, providerObject?.code));
  const providerLogo = localProviderLogoUrl(firstText(item.providerLogoUrl, providerObject?.logoUrl), provider);
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const badge: LobbyGame['badge'] = tags.some(isHotTag) ? 'HOT' : tags.some(isNewTag) ? 'NEW' : '';

  return {
    id,
    name,
    imageUrl,
    providerLogo,
    badge,
    category: normalizeCategory(item.category),
    provider,
    players: readPlayerCount(item, id),
  };
}

function game(id: string, name: string, sourceImageUrl: string, provider: string, category: string, badge: LobbyGame['badge']): LobbyGame {
  return {
    id,
    name,
    imageUrl: localGameImageUrl(sourceImageUrl),
    providerLogo: `${LOCAL_IMAGE_ASSET_ROOT}/providers/set/1_1_badge/${provider}.png`,
    provider,
    category,
    badge,
    players: estimatedPlayers(id),
  };
}

function localGameImageUrl(sourceUrl: string) {
  const normalized = sourceUrl.trim().replace(/\\/g, '/');
  if (!normalized) return '';

  let pathname = normalized.split(/[?#]/, 1)[0] ?? '';
  if (/^https?:\/\//i.test(normalized)) {
    try {
      pathname = new URL(normalized).pathname;
    } catch {
      return '';
    }
  }

  const fileName = pathname.split('/').filter(Boolean).pop() ?? '';
  if (!fileName || fileName.includes('..') || isSuspiciousFileName(fileName)) return '';
  return `${LOCAL_IMAGE_ASSET_ROOT}/games/${fileName}`;
}

function localProviderLogoUrl(sourceUrl: string, provider: string) {
  const normalized = sourceUrl.trim().replace(/\\/g, '/');
  if (normalized.startsWith(`${LOCAL_IMAGE_ASSET_ROOT}/providers/`)) return normalized;

  if (normalized) {
    let pathname = normalized.split(/[?#]/, 1)[0] ?? '';
    if (/^https?:\/\//i.test(normalized)) {
      try {
        pathname = new URL(normalized).pathname;
      } catch {
        pathname = '';
      }
    }

    const marker = '/providers/';
    const markerIndex = pathname.toLowerCase().indexOf(marker);
    if (markerIndex >= 0) {
      const relativePath = pathname.slice(markerIndex + 1).replace(/^\/+/, '');
      if (relativePath && !relativePath.includes('..')) return `${LOCAL_IMAGE_ASSET_ROOT}/${relativePath}`;
    }
  }

  return provider ? `${LOCAL_IMAGE_ASSET_ROOT}/providers/set/1_1_badge/${provider}.png` : '';
}

function dedupeGames(items: LobbyGame[]) {
  return Array.from(new Map(items.map((item) => [gameKey(item), item] as const)).values());
}

function gameKey(item: LobbyGame) {
  return `${item.provider}:${item.id}`.toLowerCase();
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
  return [
    '/highlight/',
    '/promotion',
    '/event/',
    '/news/',
    '/lobby_settings/',
    '/imageslides/',
    '/banner/',
    '/fallback',
    'placeholder',
    'image-unavailable',
    'image_unavailable',
  ].some((token) => value.includes(token));
}

function isSuspiciousFileName(fileName: string) {
  return /(?:placeholder|unavailable|no[-_]?image|default[-_]?image|fallback)\.(?:svg|png|jpe?g|webp)$/i.test(fileName);
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

function validateGameArt(item: LobbyGame, event: SyntheticEvent<HTMLImageElement>, reject: (item: LobbyGame) => void) {
  const image = event.currentTarget;
  if (!image.naturalWidth || !image.naturalHeight) {
    reject(item);
    return;
  }

  const ratio = image.naturalWidth / image.naturalHeight;
  if (ratio > GAME_CARD_MAX_RATIO) reject(item);
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
  const { items: games, reject } = useRenderableGames(10, 'popular');

  return (
    <section className="source-feed-host source-feed-host--popular" data-section-kind="popular" data-content-state="catalog">
      <div className="member-source-feed-mount member-source-feed-mount--popular">
        <div className="source-feed-section source-popular-section">
          <SourceHeading title="Top 10 Popular Games" icon="/assets/asset-pc/images/highlight/icongamehit.webp" iconSize={24} />
          <div className="source-popular-track" data-drag-scroll="true">
            {games.map((item, index) => (
              <a key={gameKey(item)} className="source-popular-card" href={gameHref(item)} title={item.name}>
                <span className="source-popular-card__art">
                  <img className="source-popular-card__blur" src={item.imageUrl} alt="" aria-hidden="true" onError={() => reject(item)} />
                  <img
                    className="source-popular-card__image"
                    src={item.imageUrl}
                    alt={item.name}
                    onLoad={(event) => validateGameArt(item, event, reject)}
                    onError={() => reject(item)}
                  />
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
  const { items: games, reject } = useRenderableGames(6, 'online');

  return (
    <section className="source-feed-host source-feed-host--online" data-section-kind="online" data-content-state="catalog">
      <div className="member-source-feed-mount member-source-feed-mount--online">
        <div className="source-feed-section source-online-section">
          <SourceHeading title="Most Online Now" icon="/assets/asset-pc/images/home/mostonline1.webp" notice="จำนวนผู้เล่นโดยประมาณ" />
          <div className="source-online-track" data-drag-scroll="true">
            {games.map((item) => (
              <a key={gameKey(item)} className="source-online-card" href={gameHref(item)} title={item.name}>
                <span className="source-online-card__art">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    onLoad={(event) => validateGameArt(item, event, reject)}
                    onError={() => reject(item)}
                  />
                </span>
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
  return <span className="source-live-team"><span className="source-live-team__logo"><img src={logo} alt="" aria-hidden="true" onError={hideDecorativeImage} /></span><span title={name}>{name}</span></span>;
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
