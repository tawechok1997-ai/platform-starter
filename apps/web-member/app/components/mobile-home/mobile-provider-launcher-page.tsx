'use client';

import { useState } from 'react';
import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import styles from './mobile-casino-provider-page.module.css';

export type MobileProviderLauncherCard = {
  code: string;
  name: string;
  source: string;
  layout: 'wide-hero' | 'wide-banner' | 'half';
  isNew?: boolean;
};

type MobileProviderLauncherPageProps = {
  category: 'casino' | 'sport' | 'lottery';
  title: Readonly<{ th: string; en: string }>;
  providers: readonly MobileProviderLauncherCard[];
  countLabel?: Readonly<{ th: string; en: string }>;
  filterable?: boolean;
  stacked?: boolean;
};

type ProviderFilter = 'all' | 'new';

export default function MobileProviderLauncherPage({
  category,
  title,
  providers,
  countLabel,
  filterable = false,
  stacked = false,
}: MobileProviderLauncherPageProps) {
  const { locale } = useMemberLocale();
  const copy = COPY[locale];
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<ProviderFilter>('all');
  const visibleProviders = filter === 'new'
    ? providers.filter((provider) => provider.isNew)
    : providers;

  const selectFilter = (value: ProviderFilter) => {
    setFilter(value);
    setFilterOpen(false);
  };

  return (
    <section
      className={styles.root}
      data-mobile-provider-launcher-page="true"
      data-provider-category={category}
      data-category-launch-mode="provider"
      aria-labelledby={`mobile-${category}-provider-heading`}
    >
      <div className={styles.headingRow}>
        <h2 id={`mobile-${category}-provider-heading`} className={styles.heading}>
          {title[locale]} <span>({providers.length} {countLabel?.[locale] ?? copy.providers})</span>
        </h2>

        {filterable ? (
          <div className={styles.filterWrap}>
            <button
              type="button"
              className={styles.filterButton}
              data-mobile-provider-filter-button="true"
              aria-haspopup="menu"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((current) => !current)}
            >
              <span>{copy.filter}</span>
              <FilterIcon />
            </button>

            {filterOpen ? (
              <div className={styles.filterMenu} role="menu" aria-label={copy.filter}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={filter === 'all'}
                  data-active={filter === 'all'}
                  onClick={() => selectFilter('all')}
                >
                  {copy.all}
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={filter === 'new'}
                  data-active={filter === 'new'}
                  onClick={() => selectFilter('new')}
                >
                  {copy.newOnly}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`${styles.grid} ${stacked ? styles.stackedGrid : ''}`}>
        {visibleProviders.map((provider) => {
          const resolvedSource = resolveLocalAssetOrSource(provider.source, 'mobile');
          const className = [
            styles.card,
            provider.layout !== 'half' ? styles.wide : '',
            provider.layout === 'wide-banner' ? styles.banner : styles.hero,
          ].filter(Boolean).join(' ');

          return (
            <a
              key={provider.code}
              href={`/browse/games?category=${encodeURIComponent(category)}&provider=${encodeURIComponent(provider.code)}`}
              className={className}
              data-provider-launch="true"
              data-provider-code={provider.code}
              data-game-category={category}
              data-game-name={provider.name}
              aria-label={`${copy.open} ${provider.name}`}
            >
              {provider.isNew ? <NewBadge label={copy.newLabel} /> : null}
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
            </a>
          );
        })}
      </div>
    </section>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <path d="M32 384h272v32H32zM400 384h80v32h-80zM384 447.5c0 17.949-14.327 32.5-32 32.5-17.673 0-32-14.551-32-32.5v-95c0-17.949 14.327-32.5 32-32.5 17.673 0 32 14.551 32 32.5v95z" />
      <path d="M32 240h80v32H32zM208 240h272v32H208zM192 303.5c0 17.949-14.327 32.5-32 32.5-17.673 0-32-14.551-32-32.5v-95c0-17.949 14.327-32.5 32-32.5 17.673 0 32 14.551 32 32.5v95z" />
      <path d="M32 96h272v32H32zM400 96h80v32h-80zM384 159.5c0 17.949-14.327 32.5-32 32.5-17.673 0-32-14.551-32-32.5v-95c0-17.949 14.327-32.5 32-32.5 17.673 0 32 14.551 32 32.5v95z" />
    </svg>
  );
}

function NewBadge({ label }: { label: string }) {
  return (
    <span className={styles.newBadge} aria-label={label}>
      <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
        <path d="M4.83735.05466c-.0241.04022-.33133.61472-.68072 1.28114-.5.95367-.68073 1.24667-.8494 1.37306-.1988.14937-.33133.17809-1.62651.36193C.22892 3.27187 0 3.32357 0 3.45571c0 .04021.4759.52279 1.06024 1.07431.58434.55152 1.09639 1.07432 1.14458 1.1605.12651.2298.10843.52279-.13253 1.81542-.22892 1.25815-.23494 1.46497-.06627 1.4937.06024.01149.6747-.26427 1.36747-.61472.6988-.3447 1.36145-.64918 1.46988-.67216.29518-.05171.47591.02298 1.83735.70089.66868.33321 1.25904.59748 1.31326.58599.16867-.02873.16265-.2298-.06627-1.48796-.23494-1.26964-.25904-1.6086-.13253-1.83266.04819-.07468.56024-.59173 1.14458-1.149.58434-.55152 1.06024-1.03984 1.06024-1.08006 0-.12639-.24096-.17809-1.68072-.37917-1.29518-.18384-1.42771-.21256-1.62651-.36193-.16867-.12639-.35542-.42513-.87952-1.42477-.53012-1.00537-.68674-1.26964-.79518-1.28113-.06626-.01149-.1506.01149-.18072.0517Z" fill="white" />
      </svg>
      <strong>{label}</strong>
    </span>
  );
}

const COPY = {
  th: {
    providers: 'ค่ายเกม',
    open: 'เข้าเล่น',
    newLabel: 'ใหม่',
    filter: 'กรอง',
    all: 'ทั้งหมด',
    newOnly: 'เกมใหม่',
  },
  en: {
    providers: 'providers',
    open: 'Open',
    newLabel: 'New',
    filter: 'Filter',
    all: 'All',
    newOnly: 'New games',
  },
} as const;
