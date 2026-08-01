'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  loadSourceCategoryCatalog,
} from '../../browse/source-game-catalog';
import type {
  SourceGameItem,
  SourceGameProvider,
} from '../../browse/source-game-category-page';
import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import styles from './mobile-casino-provider-page.module.css';

type SlotProviderBadge = 'hot' | 'new';

type SlotProviderCard = {
  code: string;
  name: string;
  source: string;
  layout: 'wide-hero' | 'wide-banner' | 'half';
  badge?: SlotProviderBadge;
};

const INITIAL_GAME_COUNT = 60;
const GAME_PAGE_STEP = 60;

const SLOT_PROVIDERS: readonly SlotProviderCard[] = [
  { code: 'ygr', name: 'YGR', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ygr.png', layout: 'wide-hero', badge: 'hot' },
  { code: 'hotdog', name: 'HOTDOG', source: 'https://cdn.zabbet.com/providers/set/1_1_l/hotdog.png', layout: 'wide-banner', badge: 'new' },
  { code: 'misolt', name: 'MISOLT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/misolt.png', layout: 'half' },
  { code: 'jl', name: 'JL', source: 'https://cdn.zabbet.com/providers/set/1_1_h/jl.png', layout: 'half', badge: 'hot' },
  { code: 'pp', name: 'PP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pp.png', layout: 'half' },
  { code: 'kingm', name: 'KINGM', source: 'https://cdn.zabbet.com/providers/set/1_1_h/kingm.png', layout: 'half' },
  { code: 'spg', name: 'SPG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/spg.png', layout: 'half' },
  { code: 'jkgx2', name: 'JKGX2', source: 'https://cdn.zabbet.com/providers/set/1_1_h/jkgx2.png', layout: 'half' },
  { code: 'fachai', name: 'FACHAI', source: 'https://cdn.zabbet.com/providers/set/1_1_h/fachai.png', layout: 'half' },
  { code: 'rsg', name: 'RSG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/rsg.png', layout: 'half' },
  { code: 'pgsoft', name: 'PGSOFT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pgsoft.png', layout: 'half' },
  { code: 'kaga', name: 'KAGA', source: 'https://cdn.zabbet.com/providers/set/1_1_h/kaga.png', layout: 'half' },
  { code: 'hacksaw', name: 'HACKSAW', source: 'https://cdn.zabbet.com/providers/set/1_1_h/hacksaw.png', layout: 'half', badge: 'new' },
  { code: 'cq', name: 'CQ', source: 'https://cdn.zabbet.com/providers/set/1_1_h/cq.png', layout: 'half' },
  { code: 'redtiger', name: 'REDTIGER', source: 'https://cdn.zabbet.com/providers/set/1_1_h/redtiger.png', layout: 'half' },
  { code: 'hbn', name: 'HBN', source: 'https://cdn.zabbet.com/providers/set/1_1_h/hbn.png', layout: 'half' },
  { code: 'wmslot', name: 'WMSLOT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/wmslot.png', layout: 'half' },
  { code: 'evp', name: 'EVP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/evp.png', layout: 'half' },
  { code: 'netent', name: 'NETENT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/netent.png', layout: 'half' },
  { code: 'ps', name: 'PS', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ps.png', layout: 'half' },
  { code: 'pokslot', name: 'POKSLOT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pokslot.png', layout: 'half' },
  { code: 'edp', name: 'EDP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/edp.png', layout: 'half' },
  { code: 'spp', name: 'SPP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/spp.png', layout: 'half' },
  { code: 'ame', name: 'AME', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ame.png', layout: 'half' },
  { code: 'bng', name: 'BNG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/bng.png', layout: 'half' },
  { code: 'r88', name: 'R88', source: 'https://cdn.zabbet.com/providers/set/1_1_h/r88.png', layout: 'half' },
  { code: 'cala', name: 'CALA', source: 'https://cdn.zabbet.com/providers/set/1_1_h/cala.png', layout: 'half' },
  { code: 'glx', name: 'GLX', source: 'https://cdn.zabbet.com/providers/set/1_1_h/glx.png', layout: 'half' },
  { code: 'l22', name: 'L22', source: 'https://cdn.zabbet.com/providers/set/1_1_h/l22.png', layout: 'half' },
  { code: 'reg', name: 'REG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/reg.png', layout: 'half' },
  { code: 'ygg', name: 'YGG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ygg.png', layout: 'half' },
  { code: 'fs', name: 'FS', source: 'https://cdn.zabbet.com/providers/set/1_1_h/fs.png', layout: 'half' },
  { code: 'pgsus', name: 'PGSUS', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pgsus.png', layout: 'half' },
  { code: 'n2', name: 'N2', source: 'https://cdn.zabbet.com/providers/set/1_1_h/n2.png', layout: 'half' },
  { code: 'ap', name: 'AP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ap.png', layout: 'half' },
  { code: 'amb', name: 'AMB', source: 'https://cdn.zabbet.com/providers/set/1_1_h/amb.png', layout: 'half' },
  { code: 'ask', name: 'ASK', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ask.png', layout: 'half' },
  { code: 'nlc', name: 'NLC', source: 'https://cdn.zabbet.com/providers/set/1_1_h/nlc.png', layout: 'half' },
  { code: 'vp', name: 'VP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/vp.png', layout: 'half', badge: 'new' },
  { code: 'drag', name: 'DRAG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/drag.png', layout: 'half', badge: 'new' },
  { code: 'acewin', name: 'ACEWIN', source: 'https://cdn.zabbet.com/providers/set/1_1_h/acewin.png', layout: 'half', badge: 'new' },
  { code: 'rb7slot', name: 'RB7SLOT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/rb7slot.png', layout: 'half', badge: 'new' },
] as const;

const SLOT_SOURCE_PROVIDERS: readonly SourceGameProvider[] = SLOT_PROVIDERS.map((provider) => ({
  code: provider.code,
  name: provider.name,
  badge: providerAssetSource('badge', provider.code),
  card: providerAssetSource('card', provider.code),
  background: providerAssetSource('bg', provider.code),
  title: providerAssetSource('title', provider.code),
  avatar: providerAssetSource('avatar', provider.code),
}));

export default function MobileSlotProviderPage() {
  const { locale } = useMemberLocale();
  const [selectedProvider, setSelectedProvider] = useState<SlotProviderCard | null>(null);

  if (selectedProvider) {
    return (
      <MobileSlotGamesPage
        provider={selectedProvider}
        locale={locale}
        onBack={() => setSelectedProvider(null)}
      />
    );
  }

  return (
    <section
      className={styles.root}
      data-mobile-slot-provider-page="true"
      data-category-flow="provider-games"
      data-slot-step="providers"
      aria-labelledby="mobile-slot-provider-heading"
    >
      <div className={styles.headingRow}>
        <h2 id="mobile-slot-provider-heading" className={styles.heading}>
          {locale === 'th' ? 'สล็อต' : 'Slots'}{' '}
          <span>({SLOT_PROVIDERS.length} {locale === 'th' ? 'ค่ายเกม' : 'providers'})</span>
        </h2>
      </div>

      <div className={styles.grid}>
        {SLOT_PROVIDERS.map((provider) => {
          const resolvedSource = resolveLocalAssetOrSource(provider.source, 'mobile');
          const className = [
            styles.card,
            styles.providerSelectButton,
            provider.layout !== 'half' ? styles.wide : '',
            provider.layout === 'wide-banner' ? styles.banner : styles.hero,
          ].filter(Boolean).join(' ');

          return (
            <button
              key={provider.code}
              type="button"
              className={className}
              data-provider-select="true"
              data-provider-code={provider.code}
              data-game-category="slot"
              data-next-step="games"
              aria-label={locale === 'th' ? `ดูเกมค่าย ${provider.name}` : `View ${provider.name} games`}
              onClick={() => setSelectedProvider(provider)}
            >
              {provider.badge === 'hot' ? <HotBadge /> : null}
              {provider.badge === 'new' ? <NewBadge /> : null}
              <img
                src={resolvedSource}
                alt={provider.name}
                loading="lazy"
                data-provider-image-source={provider.source}
                onError={(event) => {
                  const image = event.currentTarget;
                  if (resolvedSource !== provider.source && image.dataset.remoteFallback !== 'true') {
                    image.dataset.remoteFallback = 'true';
                    image.src = provider.source;
                    return;
                  }
                  image.hidden = true;
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MobileSlotGamesPage({
  provider,
  locale,
  onBack,
}: {
  provider: SlotProviderCard;
  locale: 'th' | 'en';
  onBack: () => void;
}) {
  const [games, setGames] = useState<SourceGameItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [visibleCount, setVisibleCount] = useState(INITIAL_GAME_COUNT);
  const copy = SLOT_COPY[locale];

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setGames([]);
    setVisibleCount(INITIAL_GAME_COUNT);
    setStatus('loading');

    void loadSourceCategoryCatalog('slot', SLOT_SOURCE_PROVIDERS, 'mobile', controller.signal)
      .then((catalog) => {
        if (cancelled) return;
        const selectedCode = normalizeProviderCode(provider.code);
        setGames(catalog.games.filter((game) => game.provider === selectedCode));
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setGames([]);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [provider.code]);

  const visibleGames = useMemo(() => games.slice(0, visibleCount), [games, visibleCount]);
  const providerBadge = resolveLocalAssetOrSource(providerAssetSource('badge', provider.code), 'mobile');

  return (
    <section
      className={`${styles.root} ${styles.slotGamesRoot}`}
      data-mobile-slot-games-page="true"
      data-category-flow="provider-games"
      data-slot-step="games"
      data-selected-provider={provider.code}
      aria-labelledby="mobile-slot-games-heading"
    >
      <div className={styles.slotGamesHeading}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label={copy.backToProviders}>
          <span aria-hidden="true">‹</span>
        </button>
        <img src={providerBadge} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; }} />
        <h2 id="mobile-slot-games-heading">
          {provider.name}
          <span>{status === 'ready' ? `(${games.length} ${copy.games})` : ''}</span>
        </h2>
      </div>

      {status === 'loading' ? <SlotState message={copy.loading} /> : null}
      {status === 'error' ? <SlotState message={copy.error} /> : null}
      {status === 'ready' && games.length === 0 ? <SlotState message={copy.empty} /> : null}

      {visibleGames.length > 0 ? (
        <div className={styles.slotGameGrid}>
          {visibleGames.map((game) => (
            <SlotGameCard key={`${game.provider ?? provider.code}:${game.id}`} game={game} provider={provider} locale={locale} />
          ))}
        </div>
      ) : null}

      {visibleCount < games.length ? (
        <button
          type="button"
          className={styles.loadMoreButton}
          onClick={() => setVisibleCount((current) => Math.min(games.length, current + GAME_PAGE_STEP))}
        >
          {copy.loadMore}
        </button>
      ) : null}
    </section>
  );
}

function SlotGameCard({
  game,
  provider,
  locale,
}: {
  game: SourceGameItem;
  provider: SlotProviderCard;
  locale: 'th' | 'en';
}) {
  const source = game.image;
  const resolvedSource = resolveLocalAssetOrSource(source, 'mobile');

  return (
    <button
      type="button"
      className={styles.slotGameCard}
      data-game-id={game.id}
      data-game-code={game.id}
      data-game-name={game.name}
      data-provider-code={game.provider ?? provider.code}
      data-game-category="slot"
      aria-label={`${locale === 'th' ? 'เข้าเล่น' : 'Play'} ${game.name}`}
    >
      <span className={styles.slotGameImage}>
        <img
          src={resolvedSource}
          alt={game.name}
          loading="lazy"
          onError={(event) => {
            const image = event.currentTarget;
            if (resolvedSource !== source && image.dataset.remoteFallback !== 'true') {
              image.dataset.remoteFallback = 'true';
              image.src = source;
              return;
            }
            image.hidden = true;
          }}
        />
        <span className={styles.slotGameBadges} aria-hidden="true">
          {game.isHot ? <b className={styles.slotHotBadge}>HOT</b> : null}
          {game.isNew ? <b className={styles.slotNewBadge}>NEW</b> : null}
        </span>
      </span>
      <strong>{game.name}</strong>
      <small>{provider.name}</small>
    </button>
  );
}

function SlotState({ message }: { message: string }) {
  return <div className={styles.slotState} role="status">{message}</div>;
}

function HotBadge() {
  return (
    <span className={styles.hotProviderBadge} aria-label="HOT">
      <img src="/images/game/fire.webp" alt="" aria-hidden="true" />
      <strong>HOT</strong>
    </span>
  );
}

function NewBadge() {
  return (
    <span className={styles.newBadge} aria-label="NEW">
      <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
        <path d="M4.83735.05466c-.0241.04022-.33133.61472-.68072 1.28114-.5.95367-.68073 1.24667-.8494 1.37306-.1988.14937-.33133.17809-1.62651.36193C.22892 3.27187 0 3.32357 0 3.45571c0 .04021.4759.52279 1.06024 1.07431.58434.55152 1.09639 1.07432 1.14458 1.1605.12651.2298.10843.52279-.13253 1.81542-.22892 1.25815-.23494 1.46497-.06627 1.4937.06024.01149.6747-.26427 1.36747-.61472.6988-.3447 1.36145-.64918 1.46988-.67216.29518-.05171.47591.02298 1.83735.70089.66868.33321 1.25904.59748 1.31326.58599.16867-.02873.16265-.2298-.06627-1.48796-.23494-1.26964-.25904-1.6086-.13253-1.83266.04819-.07468.56024-.59173 1.14458-1.149.58434-.55152 1.06024-1.03984 1.06024-1.08006 0-.12639-.24096-.17809-1.68072-.37917-1.29518-.18384-1.42771-.21256-1.62651-.36193-.16867-.12639-.35542-.42513-.87952-1.42477-.53012-1.00537-.68674-1.26964-.79518-1.28113-.06626-.01149-.1506.01149-.18072.0517Z" fill="white" />
      </svg>
      <strong>NEW</strong>
    </span>
  );
}

function providerAssetSource(kind: 'badge' | 'card' | 'bg' | 'title' | 'avatar', code: string) {
  const set = kind === 'card' ? '1_1_v' : `1_1_${kind}`;
  return `https://cdn.zabbet.com/providers/set/${set}/${code}.png`;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

const SLOT_COPY = {
  th: {
    games: 'เกม',
    loading: 'กำลังโหลดเกมของค่าย...',
    error: 'โหลดรายการเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    empty: 'ค่ายนี้ยังไม่มีเกมมือถือที่พร้อมแสดง',
    loadMore: 'โหลดเกมเพิ่มเติม',
    backToProviders: 'กลับไปเลือกค่ายสล็อต',
  },
  en: {
    games: 'games',
    loading: 'Loading provider games...',
    error: 'Unable to load games. Please try again.',
    empty: 'This provider has no mobile games available yet.',
    loadMore: 'Load more games',
    backToProviders: 'Back to slot providers',
  },
} as const;
