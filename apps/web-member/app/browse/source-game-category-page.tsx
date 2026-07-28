'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './source-game-category-page.module.css';

export type SourceGameFilterKey = 'arcade' | 'buy' | 'hot' | 'new' | 'slot' | 'table';
export type SourceGameProvider = { code: string; name: string; badge: string; card: string; background: string; title: string; avatar: string };
export type SourceGameItem = { id: string; name: string; image: string; provider: string | null; providerBadge?: string; isNew: boolean; isHot: boolean; tags: SourceGameFilterKey[] };
export type SourceGameCategoryConfig = {
  slug: string; title: string; total: number; resultUnit: 'เกม' | 'ค่าย'; baseBackground: string; baseLogo: string;
  mode: 'games' | 'provider-cards'; filters: { key: SourceGameFilterKey; label: string; count: number }[];
  providers: SourceGameProvider[]; games: SourceGameItem[]; showProviderStrip?: boolean;
};

export default function SourceGameCategoryPage({ config }: { config: SourceGameCategoryConfig }) {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<SourceGameFilterKey[]>([]);
  const [providerCode, setProviderCode] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const providers = useMemo(() => Array.from(new Map(config.providers.map((item) => [item.code, item])).values()), [config.providers]);
  const games = useMemo(() => Array.from(new Map(config.games.map((item) => [`${item.provider ?? 'none'}:${item.id}`, item])).values()), [config.games]);
  const themeCode = config.mode === 'provider-cards' ? previewCode : providerCode;
  const activeProvider = providers.find((item) => item.code === themeCode) ?? null;
  const visibleGames = useMemo(() => games.filter((game) => {
    const providerMatch = !providerCode || game.provider === providerCode;
    const filterMatch = selectedFilters.length === 0 || selectedFilters.every((filter) => game.tags.includes(filter));
    return providerMatch && filterMatch;
  }), [games, providerCode, selectedFilters]);
  const untouched = !providerCode && selectedFilters.length === 0;
  const resultCount = untouched ? config.total : visibleGames.length;
  const clearFilters = () => { setSelectedFilters([]); setProviderCode(null); setPreviewCode(null); };

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
    <main className={styles.page} data-source-game-category={config.slug}>
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
            <div className={styles.filterGlow} aria-hidden="true" /><div className={styles.filterTitle}>ตัวกรอง</div>
            <div className={`${styles.filterSectionTitle}${config.filters.length ? '' : ` ${styles.filterSectionCollapsed}`}`}><strong>ค้นหาเกมที่คุณสนใจ</strong><span>เลือกได้มากกว่าหนึ่ง</span></div>
            <div className={`${styles.typeGrid}${config.filters.length ? '' : ` ${styles.typeGridCollapsed}`}`}>{config.filters.map((filter) => { const checked = selectedFilters.includes(filter.key); return <label key={filter.key} className={styles.filterOption}><input type="checkbox" checked={checked} onChange={() => setSelectedFilters((current) => current.includes(filter.key) ? current.filter((item) => item !== filter.key) : [...current, filter.key])} /><span className={`${styles.checkbox}${checked ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span><span className={styles.filterLabel}>{filter.label}</span><small>( {filter.count} )</small></label>; })}</div>
            {config.showProviderStrip ? <><div className={styles.filterSectionTitle}><strong>ค้นหาค่ายเกม</strong><span>เลือกอย่างใดอย่างหนึ่ง</span></div><div className={`${styles.providerGrid}${providers.length ? '' : ` ${styles.providerGridEmpty}`}`}>{providers.map((provider) => <button key={provider.code} type="button" className={`${styles.providerButton}${providerCode === provider.code ? ` ${styles.providerActive}` : ''}`} onClick={() => setProviderCode((current) => current === provider.code ? null : provider.code)} aria-pressed={providerCode === provider.code} title={provider.name}><span aria-hidden="true" /><img src={provider.badge} alt={provider.name} onError={hideBrokenImage} /></button>)}</div></> : null}
            <div className={styles.filterActions}><div className={styles.filterSummary}><span>พบเกมส์ที่คุณค้นหา</span><strong>{resultCount.toLocaleString('th-TH')} {config.resultUnit}</strong></div><button type="button" className={styles.clearButton} onClick={clearFilters}>ล้าง</button></div>
          </aside>
          <section className={styles.gameArea} aria-label={`รายการ${config.title}`}>
            <h1>{config.title} ({resultCount.toLocaleString('th-TH')} เกม)</h1>
            <div className={styles.gameGrid}>{visibleGames.map((game) => {
              const provider = providers.find((item) => item.code === game.provider);
              const providerBadge = game.providerBadge ?? provider?.badge;
              return <article key={`${game.provider ?? 'none'}:${game.id}`} className={styles.gameCard} onMouseEnter={() => config.mode === 'provider-cards' && setPreviewCode(game.provider)} onMouseLeave={() => config.mode === 'provider-cards' && setPreviewCode(null)}><button type="button" className={styles.gameCover} onFocus={() => config.mode === 'provider-cards' && setPreviewCode(game.provider)} onBlur={() => config.mode === 'provider-cards' && setPreviewCode(null)} onClick={() => openGame(game)} aria-label={`เปิด ${game.name}`}>{config.mode === 'games' ? <img className={styles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" onError={hideBrokenImage} /> : null}<img className={config.mode === 'games' ? styles.gameImageContain : styles.gameImageCover} src={game.image} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span className={styles.cardBadges} aria-hidden="true">{game.isNew ? <b className={styles.newBadge}><StarIcon />NEW</b> : null}{game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}</span>{config.mode === 'games' && providerBadge ? <span className={styles.cardProviderBand} aria-hidden="true"><img src={providerBadge} alt="" onError={hideBrokenImage} /></span> : null}<span className={styles.playOverlay}><b>เข้าเล่น</b></span></button><p>{game.name}</p></article>;
            })}</div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StarIcon() { return <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true"><path d="M4.837.055C4.813.095 4.506.669 4.157 1.336 3.657 2.289 3.476 2.582 3.307 2.709c-.199.149-.331.178-1.626.362C.229 3.272 0 3.324 0 3.456c0 .04.476.523 1.06 1.074.585.552 1.097 1.075 1.145 1.161.127.23.109.523-.132 1.816-.229 1.258-.235 1.465-.067 1.494.06.011.675-.264 1.368-.615.699-.345 1.361-.649 1.47-.672.295-.052.475.023 1.837.701.668.333 1.259.598 1.313.586.169-.029.163-.23-.066-1.488-.235-1.27-.259-1.609-.133-1.833.049-.075.561-.592 1.145-1.149C9.524 3.979 10 3.49 10 3.45c0-.126-.241-.178-1.681-.379-1.295-.184-1.427-.213-1.626-.362-.169-.126-.356-.425-.88-1.425C5.283.279 5.127.014 5.018.003c-.066-.012-.15.011-.18.052Z" fill="currentColor" /></svg>; }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }
function swapToAssetBundle(event: SyntheticEvent<HTMLImageElement>) { if (event.currentTarget.dataset.fallbackApplied === 'true') return; event.currentTarget.dataset.fallbackApplied = 'true'; event.currentTarget.src = `/assets/asset-pc${event.currentTarget.getAttribute('src') ?? ''}`; }
