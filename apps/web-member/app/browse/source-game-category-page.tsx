'use client';

import { useEffect, useMemo, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { memberApiFetch } from '../member-api';
import { useMemberSession } from '../member-session-provider';
import styles from './source-game-category-page.module.css';

export type SourceGameFilterKey = 'arcade' | 'buy' | 'hot' | 'new' | 'slot' | 'table';
export type SourceGameProvider = { code: string; name: string; badge: string; card: string; background: string; title: string; avatar: string };
export type SourceGameItem = {
  id: string;
  name: string;
  image: string;
  provider: string | null;
  providerBadge?: string;
  isNew: boolean;
  isHot: boolean;
  tags: SourceGameFilterKey[];
  origin?: 'source' | 'catalog';
};
export type SourceGameCategoryConfig = {
  slug: string;
  title: string;
  total: number;
  resultUnit: 'เกม' | 'ค่าย';
  baseBackground: string;
  baseLogo: string;
  mode: 'games' | 'provider-cards';
  filters: { key: SourceGameFilterKey; label: string; count: number }[];
  providers: SourceGameProvider[];
  games: SourceGameItem[];
  showProviderStrip?: boolean;
};

type CatalogMedia = { sourceUrl?: string | null; cachedUrl?: string | null; status?: string | null };
type CatalogProvider = { code?: string | null; name?: string | null; logoUrl?: string | null };
type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  name?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  isNew?: boolean | null;
  isPopular?: boolean | null;
  provider?: CatalogProvider | null;
  media?: CatalogMedia[] | null;
};
type CatalogPayload = {
  items?: CatalogGame[];
  pagination?: { total?: number | null };
  counts?: { total?: number | null };
};

const CATEGORY_API_GROUPS: Record<string, string[]> = {
  casino: ['casino'],
  slot: ['slot', 'arcade', 'table'],
  fishing: ['fishing', 'fish'],
  sport: ['sport', 'sports'],
  card: ['card', 'table'],
  lotto: ['lottery', 'lotto'],
};

const FISHING_HOT = new Set(['devil-buster', 'undersea-battle', 'poseidons-secret', 'hungry-shark', 'captain-fishing', 'longya-fishing', 'hero-fishing', 'pirates-fishing', 'lucky-fishing']);
const FISHING_NEW = new Set(['fishing-thai', 'black-tornado', 'hoan-kiem-lake', 'duo-fu-fu-wa', 'world-cup-mania']);
const FISHING_SLOT = new Set(['dragon-zuma', 'zumas-honor']);
const SLOT_HOT = new Set(['caishen-win', 'super-ace', 'roma-x', 'funky-fortunez', 'money-tree', 'muscle-fortune-cat', 'bad-rich-wolf']);
const SLOT_ARCADE = new Set(['raptor-2', 'dj-boom-boom', 'skeleton-party', 'open-vault']);
const SLOT_TABLE = new Set(['3-coin-wild-tiger', 'amar-akbar-anthony', 'stamp-world']);

export default function SourceGameCategoryPage({ config }: { config: SourceGameCategoryConfig }) {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<SourceGameFilterKey[]>([]);
  const [providerCode, setProviderCode] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogGame[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    setSelectedFilters([]);
    setProviderCode(null);
    setPreviewCode(null);
  }, [config.slug]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setCatalogItems([]);
    setCatalogTotal(null);
    setCatalogLoading(true);

    async function loadCatalog() {
      const categories = CATEGORY_API_GROUPS[config.slug] ?? [config.slug];
      const loadedItems: CatalogGame[] = [];
      let loadedTotal = 0;

      for (const category of categories) {
        try {
          const params = new URLSearchParams({ category, platform: 'pc', page: '1', limit: '250' });
          const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
            skipAuth: true,
            suppressSessionExpiryRedirect: true,
            signal: controller.signal,
          });
          if (!response.ok) continue;

          const payload = await response.json().catch(() => null) as CatalogPayload | null;
          const items = Array.isArray(payload?.items) ? payload.items.filter(isCatalogGame) : [];
          loadedItems.push(...items);
          loadedTotal += items.length ? readCatalogTotal(payload, items.length) : 0;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }

      if (cancelled) return;
      const uniqueItems = Array.from(new Map(loadedItems.map((item) => [catalogIdentity(item), item] as const)).values());
      setCatalogItems(uniqueItems);
      setCatalogTotal(uniqueItems.length ? Math.max(uniqueItems.length, loadedTotal) : null);
      setCatalogLoading(false);
    }

    void loadCatalog();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [config.slug]);

  const providers = useMemo(
    () => Array.from(new Map(config.providers.map((item) => [item.code.toLowerCase(), item] as const)).values()),
    [config.providers],
  );

  const configuredProviderMap = useMemo(
    () => new Map(providers.map((provider) => [provider.code.toLowerCase(), provider] as const)),
    [providers],
  );

  const catalogGames = useMemo(
    () => catalogItems.map((item) => mapCatalogGame(item, configuredProviderMap)).filter((item): item is SourceGameItem => Boolean(item)),
    [catalogItems, configuredProviderMap],
  );

  const games = useMemo(() => {
    const sourceGames = config.games.map((item) => ({ ...item, origin: item.origin ?? 'source' as const }));
    const combined = catalogGames.length ? [...catalogGames, ...sourceGames] : sourceGames;
    return Array.from(new Map(combined.map((item, index) => {
      const hydrated = hydrateGame(config.slug, item, index);
      return [`${hydrated.provider ?? 'none'}:${hydrated.id}`, hydrated] as const;
    })).values());
  }, [catalogGames, config.games, config.slug]);

  const filterCounts = useMemo(() => {
    const counts = new Map<SourceGameFilterKey, number>();
    config.filters.forEach((filter) => {
      counts.set(filter.key, games.filter((game) => {
        const providerMatch = !providerCode || game.provider === providerCode;
        return providerMatch && game.tags.includes(filter.key);
      }).length);
    });
    return counts;
  }, [config.filters, games, providerCode]);

  const providerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    providers.forEach((provider) => {
      counts.set(provider.code, games.filter((game) => {
        const providerMatch = game.provider === provider.code.toLowerCase();
        const filterMatch = selectedFilters.length === 0 || selectedFilters.some((filter) => game.tags.includes(filter));
        return providerMatch && filterMatch;
      }).length);
    });
    return counts;
  }, [games, providers, selectedFilters]);

  const themeCode = config.mode === 'provider-cards' ? previewCode : providerCode;
  const activeProvider = providers.find((item) => item.code.toLowerCase() === themeCode?.toLowerCase()) ?? null;

  const visibleGames = useMemo(() => {
    const filtered = games.filter((game) => {
      const providerMatch = !providerCode || game.provider === providerCode.toLowerCase();
      const filterMatch = selectedFilters.length === 0 || selectedFilters.some((filter) => game.tags.includes(filter));
      return providerMatch && filterMatch;
    });

    if (filtered.length || !providerCode || selectedFilters.length > 0) return filtered;

    const provider = providers.find((item) => item.code.toLowerCase() === providerCode.toLowerCase());
    return provider ? [providerFallbackGame(provider)] : filtered;
  }, [games, providerCode, providers, selectedFilters]);

  const untouched = !providerCode && selectedFilters.length === 0;
  const resultCount = untouched ? (catalogTotal ?? config.total) : visibleGames.length;

  const clearFilters = () => {
    setSelectedFilters([]);
    setProviderCode(null);
    setPreviewCode(null);
  };

  const toggleFilter = (key: SourceGameFilterKey) => {
    setSelectedFilters((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  };

  const handleFilterKeyDown = (event: KeyboardEvent<HTMLLabelElement>, key: SourceGameFilterKey) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleFilter(key);
  };

  const openGame = (game: SourceGameItem) => {
    const next = `/browse/games?category=${encodeURIComponent(config.slug)}`;
    if (!ready || !isLoggedIn) {
      window.location.assign(`/?auth=login&next=${encodeURIComponent(next)}`);
      return;
    }
    const provider = game.provider ? `&provider=${encodeURIComponent(game.provider)}` : '';
    window.location.assign(`/games?category=${encodeURIComponent(config.slug)}${provider}&game=${encodeURIComponent(game.id)}`);
  };

  return (
    <main className={styles.page} data-source-game-category={config.slug} aria-busy={catalogLoading}>
      <div className={styles.backgroundStack} aria-hidden="true">
        {providers.map((provider) => <img key={provider.code} className={`${styles.providerBackground}${activeProvider?.code === provider.code ? ` ${styles.providerBackgroundActive}` : ''}`} src={provider.background} alt="" onError={hideBrokenImage} />)}
        <img className={styles.baseBackground} src={config.baseBackground} alt="" onError={swapToAssetBundle} />
        <div className={styles.purpleWash} /><div className={styles.bottomFade} />
      </div>

      <section className={styles.content} aria-label={config.title}>
        <header className={styles.heroTitle}>
          <img className={`${styles.baseTitle}${activeProvider ? ` ${styles.baseTitleHidden}` : ''}`} src={config.baseLogo} alt={config.title} onError={swapToAssetBundle} />
          {providers.map((provider) => <img key={`${provider.code}-title`} className={`${styles.providerTitle}${activeProvider?.code === provider.code ? ` ${styles.providerTitleActive}` : ''}`} src={provider.title} alt={provider.name} onError={hideBrokenImage} />)}
          {providers.map((provider) => <img key={`${provider.code}-avatar`} className={`${styles.providerAvatar}${activeProvider?.code === provider.code ? ` ${styles.providerAvatarActive}` : ''}`} src={provider.avatar} alt="" onError={hideBrokenImage} />)}
        </header>

        <div className={styles.layout}>
          <aside className={styles.filterPanel} aria-label={`ตัวกรอง${config.title}`}>
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>
            <div className={`${styles.filterSectionTitle}${config.filters.length ? '' : ` ${styles.filterSectionCollapsed}`}`}><strong>ค้นหาเกมที่คุณสนใจ</strong><span>เลือกได้มากกว่าหนึ่ง</span></div>
            <div className={`${styles.typeGrid}${config.filters.length ? '' : ` ${styles.typeGridCollapsed}`}`}>
              {config.filters.map((filter) => {
                const checked = selectedFilters.includes(filter.key);
                const loadedCount = filterCounts.get(filter.key) ?? 0;
                const count = catalogGames.length || providerCode || selectedFilters.length ? loadedCount : filter.count;
                return <label key={filter.key} className={styles.filterOption} role="checkbox" tabIndex={0} aria-checked={checked} onClick={(event) => { event.preventDefault(); toggleFilter(filter.key); }} onKeyDown={(event) => handleFilterKeyDown(event, filter.key)}><input type="checkbox" checked={checked} readOnly tabIndex={-1} /><span className={`${styles.checkbox}${checked ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span><span className={styles.filterLabel}>{filter.label}</span><small>( {count.toLocaleString('th-TH')} )</small></label>;
              })}
            </div>

            {config.showProviderStrip ? <><div className={styles.filterSectionTitle}><strong>ค้นหาค่ายเกม</strong><span>เลือกอย่างใดอย่างหนึ่ง</span></div><div className={`${styles.providerGrid}${providers.length ? '' : ` ${styles.providerGridEmpty}`}`}>{providers.map((provider) => {
              const count = providerCounts.get(provider.code) ?? 0;
              return <button key={provider.code} type="button" className={`${styles.providerButton}${providerCode === provider.code ? ` ${styles.providerActive}` : ''}`} onClick={() => { setProviderCode((current) => current === provider.code ? null : provider.code); setPreviewCode(null); }} aria-pressed={providerCode === provider.code} aria-label={`${provider.name} ${count} เกม`} title={`${provider.name} (${count})`}><span aria-hidden="true" /><img src={provider.badge} alt={provider.name} onError={hideBrokenImage} /></button>;
            })}</div></> : null}

            <div className={styles.filterActions}><div className={styles.filterSummary} aria-live="polite"><span>พบเกมส์ที่คุณค้นหา</span><strong>{resultCount.toLocaleString('th-TH')} {config.resultUnit}</strong></div><button type="button" className={styles.clearButton} onClick={clearFilters} disabled={untouched}>ล้าง</button></div>
          </aside>

          <section className={styles.gameArea} aria-label={`รายการ${config.title}`} aria-live="polite">
            <h1>{config.title} ({resultCount.toLocaleString('th-TH')} เกม)</h1>
            {visibleGames.length ? <div className={styles.gameGrid}>{visibleGames.map((game) => {
              const provider = providers.find((item) => item.code.toLowerCase() === game.provider?.toLowerCase());
              const providerBadge = game.providerBadge ?? provider?.badge;
              return <article key={`${game.provider ?? 'none'}:${game.id}`} className={styles.gameCard} onMouseEnter={() => config.mode === 'provider-cards' && setPreviewCode(game.provider)} onMouseLeave={() => config.mode === 'provider-cards' && setPreviewCode(null)}><button type="button" className={styles.gameCover} onFocus={() => config.mode === 'provider-cards' && setPreviewCode(game.provider)} onBlur={() => config.mode === 'provider-cards' && setPreviewCode(null)} onClick={() => openGame(game)} aria-label={`เปิด ${game.name}`}>{config.mode === 'games' && !game.id.startsWith('provider-') ? <img className={styles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" onError={hideBrokenImage} /> : null}<img className={config.mode === 'games' && !game.id.startsWith('provider-') ? styles.gameImageContain : styles.gameImageCover} src={game.image} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span className={styles.cardBadges} aria-hidden="true">{game.isNew ? <b className={styles.newBadge}><StarIcon />NEW</b> : null}{game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}</span>{config.mode === 'games' && providerBadge ? <span className={styles.cardProviderBand} aria-hidden="true"><img src={providerBadge} alt="" onError={hideBrokenImage} /></span> : null}<span className={styles.playOverlay}><b>เข้าเล่น</b></span></button><p>{game.name}</p></article>;
            })}</div> : <div style={{ minHeight: 280, display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 16, border: '1px solid #373147', borderRadius: 12, background: 'rgba(24,21,35,.8)' }}><strong>ไม่พบเกมที่ตรงกับตัวกรอง</strong><button type="button" className={styles.clearButton} onClick={clearFilters}>ล้างตัวกรอง</button></div>}
          </section>
        </div>
      </section>
    </main>
  );
}

function catalogIdentity(item: CatalogGame) {
  const provider = String(item.provider?.code ?? '').trim().toLowerCase();
  const id = String(item.providerGameCode ?? item.id ?? '').trim().toLowerCase();
  return `${provider}:${id}`;
}

function readCatalogTotal(payload: CatalogPayload | null, fallback: number) {
  const value = Number(payload?.pagination?.total ?? payload?.counts?.total ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function isCatalogGame(value: CatalogGame) {
  return Boolean(value && typeof value === 'object' && (value.id || value.providerGameCode) && value.name);
}

function mapCatalogGame(item: CatalogGame, providers: Map<string, SourceGameProvider>): SourceGameItem | null {
  const providerCode = String(item.provider?.code ?? '').trim().toLowerCase();
  const id = String(item.providerGameCode ?? item.id ?? '').trim();
  const name = String(item.name ?? '').trim();
  if (!id || !name) return null;

  const configuredProvider = providers.get(providerCode);
  const image = firstNonEmpty(
    item.imageUrl,
    item.iconUrl,
    item.media?.find((media) => media.status === 'READY')?.cachedUrl,
    item.media?.find((media) => media.status === 'READY')?.sourceUrl,
    item.media?.[0]?.cachedUrl,
    item.media?.[0]?.sourceUrl,
    configuredProvider?.card,
  );
  if (!image) return null;

  const category = String(item.category ?? '').toLowerCase();
  const tags = new Set<SourceGameFilterKey>();
  if (category.includes('slot')) tags.add('slot');
  if (category.includes('arcade')) tags.add('arcade');
  if (category.includes('table') || category.includes('card')) tags.add('table');
  if (/buy feature|buy bonus|free spin|ฟรีสปิน/i.test(name)) tags.add('buy');
  if (item.isNew) tags.add('new');
  if (item.isPopular) tags.add('hot');

  return {
    id,
    name,
    image,
    provider: providerCode || null,
    providerBadge: firstNonEmpty(item.provider?.logoUrl, configuredProvider?.badge),
    isNew: Boolean(item.isNew),
    isHot: Boolean(item.isPopular),
    tags: Array.from(tags),
    origin: 'catalog',
  };
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function providerFallbackGame(provider: SourceGameProvider): SourceGameItem {
  return {
    id: `provider-${provider.code}`,
    name: provider.name,
    image: provider.card,
    provider: provider.code.toLowerCase(),
    providerBadge: provider.badge,
    isNew: false,
    isHot: false,
    tags: [],
    origin: 'source',
  };
}

function hydrateGame(slug: string, game: SourceGameItem, index: number): SourceGameItem {
  const tags = new Set<SourceGameFilterKey>(game.tags);
  let isNew = game.isNew;
  let isHot = game.isHot;

  if (game.origin !== 'catalog' && slug === 'fishing') {
    tags.clear();
    isNew = FISHING_NEW.has(game.id) || game.image.includes('/176');
    isHot = FISHING_HOT.has(game.id);
    if (FISHING_SLOT.has(game.id)) tags.add('slot');
  }

  if (game.origin !== 'catalog' && slug === 'slot') {
    tags.clear();
    tags.add('slot');
    isNew = game.image.includes('/177');
    isHot = SLOT_HOT.has(game.id);
    if (SLOT_ARCADE.has(game.id) || index % 11 === 0) tags.add('arcade');
    if (/buy feature/i.test(game.name) || index % 13 === 0) tags.add('buy');
    if (SLOT_TABLE.has(game.id) || index % 17 === 0) tags.add('table');
  }

  if (isNew) tags.add('new');
  if (isHot) tags.add('hot');
  return { ...game, provider: game.provider?.toLowerCase() ?? null, isNew, isHot, tags: Array.from(tags) };
}

function StarIcon() { return <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true"><path d="M4.837.055C4.813.095 4.506.669 4.157 1.336 3.657 2.289 3.476 2.582 3.307 2.709c-.199.149-.331.178-1.626.362C.229 3.272 0 3.324 0 3.456c0 .04.476.523 1.06 1.074.585.552 1.097 1.075 1.145 1.161.127.23.109.523-.132 1.816-.229 1.258-.235 1.465-.067 1.494.06.011.675-.264 1.368-.615.699-.345 1.361-.649 1.47-.672.295-.052.475.023 1.837.701.668.333 1.259.598 1.313.586.169-.029.163-.23-.066-1.488-.235-1.27-.259-1.609-.133-1.833.049-.075.561-.592 1.145-1.149C9.524 3.979 10 3.49 10 3.45c0-.126-.241-.178-1.681-.379-1.295-.184-1.427-.213-1.626-.362-.169-.126-.356-.425-.88-1.425C5.283.279 5.127.014 5.018.003c-.066-.012-.15.011-.18.052Z" fill="currentColor" /></svg>; }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }
function swapToAssetBundle(event: SyntheticEvent<HTMLImageElement>) { if (event.currentTarget.dataset.fallbackApplied === 'true') return; event.currentTarget.dataset.fallbackApplied = 'true'; event.currentTarget.src = `/assets/asset-pc${event.currentTarget.getAttribute('src') ?? ''}`; }
