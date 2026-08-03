'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { useMemberLocale, type MemberLocale } from '../../member-locale-provider';
import type { Game } from '../../types/member-api';
import { hideDecorativeImage } from '../image-fallback';
import {
  resolveHomeGameFallback,
  resolveHomeGameImage,
  resolveHomeProviderLogo,
} from './local-game-asset-resolver';
import { V47_ASSETS } from './v47-asset-map';

type LobbyGame = {
  id: string;
  providerGameCode: string;
  name: string;
  imageUrl: string;
  imageSource: string;
  providerLogo: string;
  providerLogoSource: string;
  badge: 'HOT' | 'NEW' | '';
  category: string;
  tags: string[];
  provider: string;
  players: number;
};

type LocalizedText = Record<MemberLocale, string>;

type LiveItem = {
  league: LocalizedText;
  home: LocalizedText;
  away: LocalizedText;
  homeLogo: string;
  awayLogo: string;
};

const FEED_COPY: Record<MemberLocale, {
  popularTitle: string;
  onlineTitle: string;
  onlineNotice: string;
  liveTitle: string;
  liveNotice: string;
  sample: string;
  simulatedSchedule: string;
  watchSports: string;
  chooseSports: string;
}> = {
  th: {
    popularTitle: '10 เกมยอดนิยม',
    onlineTitle: 'ผู้เล่นออนไลน์สูงสุด',
    onlineNotice: 'จำนวนผู้เล่นโดยประมาณ',
    liveTitle: 'ตารางการแข่งขัน',
    liveNotice: 'ข้อมูลตัวอย่าง ไม่ใช่รายการสด',
    sample: 'ตัวอย่าง',
    simulatedSchedule: 'กำหนดการจำลอง',
    watchSports: 'ดูหมวดกีฬา',
    chooseSports: 'เลือกเกมกีฬา',
  },
  en: {
    popularTitle: 'Top 10 Popular Games',
    onlineTitle: 'Most Online Now',
    onlineNotice: 'Estimated player count',
    liveTitle: 'Match Schedule',
    liveNotice: 'Sample data, not live fixtures',
    sample: 'Sample',
    simulatedSchedule: 'Simulated schedule',
    watchSports: 'View sports category',
    chooseSports: 'Choose a sports game',
  },
};

const FALLBACK_GAMES: LobbyGame[] = [
  fallbackGame('roma-x-10000', 'ROMA X 10000', '/assets/asset-pc/images/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg', 'jl', 'slot', 'HOT'),
  fallbackGame('maya-golden-city-2', 'Maya Golden City 2', '/assets/asset-pc/images/games/1704871891426-d938a4ec-5a3c-475f-a1d0-c410e0b30782.jpg', 'ygr', 'slot', 'HOT'),
  fallbackGame('el-paso-gunfight', 'El Paso Gunfight xNudge', '/assets/asset-pc/images/games/elpaso0000000000.jpg', 'nlc', 'slot', 'NEW'),
  fallbackGame('sweet-bonanza-xmas', 'Sweet Bonanza Xmas', '/assets/asset-pc/images/games/sweet_bonanza_xmas.png', 'pp', 'slot', 'NEW'),
  fallbackGame('thai-hi-lo-2', 'ไฮโลไทย 2', '/assets/asset-pc/images/games/Thai_Hi_Lo_2.jpg', 'kingm', 'card', 'NEW'),
  fallbackGame('coin-spinner', 'Coin Spinner', '/assets/asset-pc/images/games/coin_spinner.jpg', 'cq', 'arcade', 'NEW'),
];

const LIVE_ITEMS: LiveItem[] = [
  {
    league: { th: 'เดนมาร์ก - ซูเปอร์ลีกา', en: 'Denmark - Superliga' },
    home: { th: 'แรนเดอร์ส', en: 'Randers' },
    away: { th: 'ซิลเคบอร์ก', en: 'Silkeborg' },
    homeLogo: V47_ASSETS.live,
    awayLogo: V47_ASSETS.tournament,
  },
  {
    league: { th: 'นอร์เวย์ - ทิปเปลีเก้น', en: 'Norway - Eliteserien' },
    home: { th: 'โรเซนบอร์ก', en: 'Rosenborg' },
    away: { th: 'เฟรดริคสตัด', en: 'Fredrikstad' },
    homeLogo: V47_ASSETS.live,
    awayLogo: V47_ASSETS.tournament,
  },
  {
    league: { th: 'สวีเดน - อัลสเวนส์คาน', en: 'Sweden - Allsvenskan' },
    home: { th: 'ฮัคเค่น', en: 'Häcken' },
    away: { th: 'เอไอเค โซลน่า', en: 'AIK Solna' },
    homeLogo: V47_ASSETS.live,
    awayLogo: V47_ASSETS.tournament,
  },
  {
    league: { th: 'ฮังการี - เอ็นบี ไอ', en: 'Hungary - NB I' },
    home: { th: 'เอ็มทีเค บูดาเปสต์', en: 'MTK Budapest' },
    away: { th: 'ซาเลเกอร์สเซ็ก ทีอี', en: 'Zalaegerszegi TE' },
    homeLogo: V47_ASSETS.live,
    awayLogo: V47_ASSETS.tournament,
  },
];

function useRenderableGames(sourceGames: Game[], limit: number) {
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(() => new Set());

  const games = useMemo(() => {
    const source = sourceGames.length > 0 ? sourceGames.map(toLobbyGame) : FALLBACK_GAMES;
    return source.filter((item) => !invalidKeys.has(gameKey(item))).slice(0, limit);
  }, [invalidKeys, limit, sourceGames]);

  const reject = (item: LobbyGame) => {
    const key = gameKey(item);
    setInvalidKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  return { games, reject };
}

function toLobbyGame(item: Game): LobbyGame {
  const imageSource = item.imageSource
    || item.media?.find((media) => media.sourceUrl)?.sourceUrl
    || '';
  const provider = item.provider?.code || item.provider?.name || '';
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const badge = item.badge || (item.isNew ? 'NEW' : item.isPopular ? 'HOT' : '');

  return {
    id: item.id,
    providerGameCode: item.providerGameCode,
    name: item.name,
    imageUrl: resolveHomeGameImage(item) || resolveHomeGameFallback(item),
    imageSource,
    providerLogo: resolveHomeProviderLogo(item.provider),
    providerLogoSource: item.provider?.sourceLogoUrl || item.provider?.logoUrl || '',
    badge,
    category: item.category || 'all',
    tags,
    provider,
    players: item.players || estimatedPlayers(item.providerGameCode || item.id),
  };
}

function fallbackGame(
  id: string,
  name: string,
  imageUrl: string,
  provider: string,
  category: string,
  badge: LobbyGame['badge'],
): LobbyGame {
  return {
    id,
    providerGameCode: id,
    name,
    imageUrl,
    imageSource: imageUrl,
    providerLogo: `/assets/asset-pc/images/providers/set/1_1_badge/${provider}.png`,
    providerLogoSource: `https://cdn.zabbet.com/providers/set/1_1_badge/${provider}.png`,
    provider,
    category,
    tags: [category, badge === 'HOT' ? 'hot' : 'new'],
    badge,
    players: estimatedPlayers(id),
  };
}

function gameKey(item: LobbyGame) {
  return `${item.provider}:${item.providerGameCode || item.id}`.toLowerCase();
}

function estimatedPlayers(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return 1200 + Math.abs(hash % 4200);
}

function gameHref(item: LobbyGame) {
  const params = new URLSearchParams({
    category: item.category,
    game: item.providerGameCode || item.id,
    platform: 'pc',
  });
  if (item.provider) params.set('provider', item.provider);
  return `/games?${params.toString()}`;
}

function restoreRemoteImage(
  event: SyntheticEvent<HTMLImageElement>,
  source: string,
  reject?: () => void,
) {
  const image = event.currentTarget;
  const current = image.getAttribute('src') || '';
  if (source && current !== source && /^https?:\/\//i.test(source)) {
    image.src = source;
    return;
  }
  reject?.();
  image.hidden = true;
}

function SourceHeading({ title, icon, iconSize = 25, notice }: {
  title: string;
  icon: string;
  iconSize?: number;
  notice?: string;
}) {
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

export function SourcePopularSection({ games: sourceGames }: { games: Game[] }) {
  const { locale } = useMemberLocale();
  const copy = FEED_COPY[locale];
  const { games, reject } = useRenderableGames(sourceGames, 10);

  return (
    <section className="source-feed-host source-feed-host--popular" data-section-kind="popular" data-content-state={sourceGames.length ? 'catalog' : 'fallback'}>
      <div className="member-source-feed-mount member-source-feed-mount--popular">
        <div className="source-feed-section source-popular-section">
          <SourceHeading title={copy.popularTitle} icon="/assets/asset-pc/images/highlight/icongamehit.webp" iconSize={24} />
          <div className="source-popular-track" data-drag-scroll="true">
            {games.map((item, index) => (
              <a
                key={gameKey(item)}
                className="source-popular-card"
                href={gameHref(item)}
                title={item.name}
                data-game-card="popular"
                data-game-tags={item.tags.join(',')}
              >
                <span className="source-popular-card__art">
                  <img
                    className="source-popular-card__blur"
                    src={item.imageUrl}
                    alt=""
                    aria-hidden="true"
                    data-no-fallback="true"
                    onError={(event) => restoreRemoteImage(event, item.imageSource)}
                  />
                  <img
                    className="source-popular-card__image"
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    data-no-fallback="true"
                    onError={(event) => restoreRemoteImage(event, item.imageSource, () => reject(item))}
                  />
                  {item.providerLogo ? (
                    <span className="source-popular-card__provider">
                      <img
                        src={item.providerLogo}
                        alt=""
                        aria-hidden="true"
                        data-no-fallback="true"
                        onError={(event) => restoreRemoteImage(event, item.providerLogoSource)}
                      />
                    </span>
                  ) : null}
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

export function SourceOnlineSection({ games: sourceGames }: { games: Game[] }) {
  const { locale } = useMemberLocale();
  const copy = FEED_COPY[locale];
  const { games, reject } = useRenderableGames(sourceGames, 6);

  return (
    <section className="source-feed-host source-feed-host--online" data-section-kind="online" data-content-state={sourceGames.length ? 'catalog' : 'fallback'}>
      <div className="member-source-feed-mount member-source-feed-mount--online">
        <div className="source-feed-section source-online-section">
          <SourceHeading title={copy.onlineTitle} icon="/assets/asset-pc/images/home/mostonline1.webp" notice={copy.onlineNotice} />
          <div className="source-online-track" data-drag-scroll="true">
            {games.map((item) => (
              <a
                key={gameKey(item)}
                className="source-online-card"
                href={gameHref(item)}
                title={item.name}
                data-game-card="online"
                data-game-tags={item.tags.join(',')}
              >
                <span className="source-online-card__art">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    data-no-fallback="true"
                    onError={(event) => restoreRemoteImage(event, item.imageSource, () => reject(item))}
                  />
                </span>
                <span className="source-online-card__counter">
                  <span className="source-online-card__counter-inner">
                    <UserIcon />
                    <strong>{item.players.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</strong>
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SourceLiveSection({ onAction }: { onAction: () => void }) {
  const { locale } = useMemberLocale();
  const copy = FEED_COPY[locale];

  return (
    <section className="source-feed-host source-feed-host--live" id="live" data-section-kind="live" data-content-state="demo">
      <div className="member-source-feed-mount member-source-feed-mount--live">
        <div className="source-feed-section source-live-section">
          <SourceHeading title={copy.liveTitle} icon="/images/home/live1.webp" notice={copy.liveNotice} />
          <div className="source-live-track" data-drag-scroll="true">
            {LIVE_ITEMS.map((match, index) => {
              const league = match.league[locale];
              const home = match.home[locale];
              const away = match.away[locale];
              return (
                <article key={`${match.league.en}-${index}`} className="source-live-card">
                  <div className="source-live-card__inner">
                    <div className="source-live-card__glow" aria-hidden="true" />
                    <div className="source-live-card__content">
                      <header className="source-live-card__header">
                        <span className="source-live-card__league"><SoccerIcon /><span>{league}</span></span>
                        <span className="source-live-card__status"><b>{copy.sample}</b><time>{copy.simulatedSchedule}</time></span>
                      </header>
                      <div className="source-live-card__teams"><Team logo={match.homeLogo} name={home} /><strong>VS</strong><Team logo={match.awayLogo} name={away} /></div>
                      <footer className="source-live-card__actions">
                        <button type="button" className="source-live-card__watch" onClick={onAction}><LiveIcon /><span>{copy.watchSports}</span></button>
                        <button type="button" className="source-live-card__bet" onClick={onAction}>{copy.chooseSports}</button>
                      </footer>
                    </div>
                  </div>
                </article>
              );
            })}
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
