'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getMemberGameCatalog,
  type MemberCatalogGame,
} from '../../lib/member-game-catalog';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import { useMemberLocale } from '../../member-locale-provider';
import styles from './mobile-category-provider-icons.module.css';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';
type GameCategoryId = Exclude<MobileCategoryId, 'home'>;

type CategoryProvider = {
  code: string;
  name: string;
  icon: string;
  iconSource: string;
};

const CATEGORY_LABELS: Record<'th' | 'en', Record<MobileCategoryId, string>> = {
  th: {
    home: 'หน้าแรก',
    casino: 'คาสิโน',
    slot: 'สล็อต',
    fishing: 'ตกปลา',
    sport: 'กีฬา',
    card: 'ไพ่',
    lottery: 'หวย',
  },
  en: {
    home: 'Home',
    casino: 'Casino',
    slot: 'Slots',
    fishing: 'Fishing',
    sport: 'Sports',
    card: 'Cards',
    lottery: 'Lottery',
  },
};

const MOBILE_CATEGORY_SELECT_EVENT = 'member:mobile-category-select';
let providerCatalogRequest: Promise<MemberCatalogGame[]> | null = null;

export default function MobileCategoryTabRuntime() {
  const { locale } = useMemberLocale();
  const [activeCategory, setActiveCategory] = useState<MobileCategoryId>('home');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    const slot = root.querySelector<HTMLElement>('[data-mobile-content-slot="after-highlight"]');
    setPortalTarget(slot);

    const switchCategory = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>('[data-mobile-category-id]');
      if (!trigger || !root.contains(trigger)) return;

      const category = trigger.dataset.mobileCategoryId;
      if (!isMobileCategoryId(category)) return;

      event.preventDefault();
      event.stopPropagation();
      setActiveCategory(category);
    };

    const selectCategory = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const category = detail && typeof detail === 'object'
        ? (detail as { category?: string }).category
        : undefined;
      if (isMobileCategoryId(category)) setActiveCategory(category);
    };

    root.addEventListener('click', switchCategory, true);
    window.addEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectCategory);
    return () => {
      root.removeEventListener('click', switchCategory, true);
      window.removeEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectCategory);
      setPortalTarget(null);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    root.dataset.mobileActiveCategory = activeCategory;
    root.querySelectorAll<HTMLElement>('[data-mobile-category-id]').forEach((item) => {
      const active = item.dataset.mobileCategoryId === activeCategory;
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    // Category pages replace only the provider area. Shared promotions,
    // announcements, source feed, shortcut and footer stay visible everywhere.
    const bottomStructure = root.querySelector<HTMLElement>('[data-mobile-bottom-owner="true"]');
    const sourceContent = root.querySelector<HTMLElement>('[data-mobile-section-owner="source-content"]');
    for (const element of [bottomStructure, sourceContent]) {
      if (!element) continue;
      element.hidden = false;
      element.removeAttribute('aria-hidden');
      element.style.removeProperty('display');
    }

    return () => {
      if (root.dataset.mobileActiveCategory === activeCategory) {
        delete root.dataset.mobileActiveCategory;
      }
    };
  }, [activeCategory]);

  if (!portalTarget || activeCategory === 'home') return null;

  return createPortal(
    <CategoryProviderPanel
      key={activeCategory}
      category={activeCategory}
      label={CATEGORY_LABELS[locale][activeCategory]}
      locale={locale}
    />,
    portalTarget,
  );
}

function CategoryProviderPanel({
  category,
  label,
  locale,
}: {
  category: GameCategoryId;
  label: string;
  locale: 'th' | 'en';
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [catalog, setCatalog] = useState<MemberCatalogGame[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel?.parentElement) return;
    panel.parentElement.prepend(panel);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    void getProviderCatalog()
      .then((items) => {
        if (cancelled) return;
        setCatalog(items);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const providers = useMemo(
    () => collectCategoryProviders(catalog, category),
    [catalog, category],
  );

  return (
    <section
      ref={panelRef}
      className={styles.panel}
      data-mobile-section-owner="category-content"
      data-mobile-category-content={category}
      data-category-flow="provider-icons"
      aria-label={label}
      aria-live="polite"
    >
      <div className={styles.heading}>
        <h2>{locale === 'th' ? `ค่ายเกม${label}` : `${label} providers`}</h2>
        {status === 'ready' ? (
          <span>{locale === 'th' ? `${providers.length} ค่าย` : `${providers.length} providers`}</span>
        ) : null}
      </div>

      {status === 'loading' ? (
        <div className={styles.loadingGrid} aria-label={locale === 'th' ? 'กำลังโหลดค่ายเกม' : 'Loading providers'}>
          {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
        </div>
      ) : null}

      {status === 'ready' && providers.length > 0 ? (
        <div className={styles.grid}>
          {providers.map((provider) => (
            <ProviderIconCard
              key={provider.code}
              provider={provider}
              category={category}
              openLabel={locale === 'th' ? 'เข้าเล่น' : 'Open'}
            />
          ))}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className={styles.stateCard} role="status">
          {locale === 'th' ? 'โหลดข้อมูลค่ายเกมไม่สำเร็จ' : 'Unable to load providers'}
        </div>
      ) : null}

      {status === 'ready' && providers.length === 0 ? (
        <div className={styles.stateCard} role="status">
          {locale === 'th' ? 'ยังไม่มีค่ายเกมในหมวดนี้' : 'No providers in this category yet'}
        </div>
      ) : null}
    </section>
  );
}

function ProviderIconCard({
  provider,
  category,
  openLabel,
}: {
  provider: CategoryProvider;
  category: GameCategoryId;
  openLabel: string;
}) {
  const href = `/browse/games?category=${encodeURIComponent(category)}&provider=${encodeURIComponent(provider.code)}&platform=mobile`;

  return (
    <a
      href={href}
      className={styles.card}
      data-provider-launch="true"
      data-provider-code={provider.code}
      data-provider-category={category}
      data-provider-icon-source={provider.iconSource}
      aria-label={`${openLabel} ${provider.name}`}
    >
      <span className={styles.iconFrame} aria-hidden="true">
        <img
          src={provider.icon}
          alt=""
          loading="lazy"
          onError={(event) => {
            const image = event.currentTarget;
            if (provider.icon !== provider.iconSource && image.dataset.remoteFallback !== 'true') {
              image.dataset.remoteFallback = 'true';
              image.src = provider.iconSource;
              return;
            }
            image.hidden = true;
          }}
        />
      </span>
      <strong className={styles.providerName}>{provider.name}</strong>
    </a>
  );
}

function collectCategoryProviders(
  catalog: MemberCatalogGame[],
  category: GameCategoryId,
): CategoryProvider[] {
  const providers = new Map<string, CategoryProvider>();

  catalog.forEach((game) => {
    if (game.category !== category) return;
    const code = normalizeProviderCode(game.provider);
    if (!code || providers.has(code)) return;

    const iconSource = game.providerIconSource
      || `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`;
    providers.set(code, {
      code,
      name: game.providerName || code.toUpperCase(),
      iconSource,
      icon: game.providerIcon || resolveLocalAssetOrSource(iconSource, 'pc'),
    });
  });

  return Array.from(providers.values()).sort((left, right) => (
    left.name.localeCompare(right.name, 'th')
  ));
}

function getProviderCatalog() {
  if (!providerCatalogRequest) {
    providerCatalogRequest = getMemberGameCatalog('mobile').catch((error) => {
      providerCatalogRequest = null;
      throw error;
    });
  }
  return providerCatalogRequest;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function isMobileCategoryId(value: unknown): value is MobileCategoryId {
  return typeof value === 'string'
    && ['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery'].includes(value);
}
