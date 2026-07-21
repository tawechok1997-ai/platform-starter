'use client';

import { useSearchParams } from 'next/navigation';
import type {
  GameCategoryNavigationConfig,
  GameCategoryNavigationKey,
} from '../brand/game-category-navigation';
import type { ExtendedBrandIconSettings } from '../brand/brand-icon-registry';
import type { MemberFeatureFlags, SiteIconSettings } from '../site-settings';
import { BrandIcon } from './brand-icon';

const CATEGORY_KEYS: GameCategoryNavigationKey[] = [
  'home',
  'casino',
  'slot',
  'live',
  'sport',
  'fishing',
  'lottery',
  'card',
];

export function MemberCategoryRail({
  pathname,
  features,
  config,
  baseIcons,
}: {
  pathname: string;
  features: MemberFeatureFlags;
  config: GameCategoryNavigationConfig;
  baseIcons: SiteIconSettings;
}) {
  const searchParams = useSearchParams();
  if (!features.games || (pathname !== '/' && !pathname.startsWith('/games'))) return null;

  const selectedCategory = searchParams.get('category')?.trim().toLowerCase() ?? '';

  return (
    <aside
      className={`member-category-rail${pathname === '/' ? ' member-category-rail--home' : ''}`}
      aria-label="หมวดหมู่เกม"
    >
      {CATEGORY_KEYS.map((key) => {
        const item = config[key];
        const category = key === 'home' ? '' : key;
        const href = category ? `/games?category=${encodeURIComponent(category)}` : '/';
        const active = key === 'home'
          ? pathname === '/' && !selectedCategory
          : pathname.startsWith('/games') && selectedCategory === category;
        const configured: ExtendedBrandIconSettings = { [item.iconName]: item.iconValue };

        return (
          <a
            key={key}
            href={href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
            data-game-category-key={key}
          >
            <span>
              <BrandIcon
                name={item.iconName}
                configured={configured}
                existing={baseIcons}
                title={item.label}
              />
            </span>
            <strong>{item.label}</strong>
          </a>
        );
      })}
      <span className="member-category-rail__handle" aria-hidden="true">›</span>
    </aside>
  );
}
