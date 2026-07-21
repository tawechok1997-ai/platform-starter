'use client';

import Link from 'next/link';
import type { SiteIconSettings } from '../../site-settings';
import type {
  GameCategoryNavigationConfig,
  GameCategoryNavigationEntry,
} from '../../brand/game-category-navigation';
import { buildVisibleGameCategoryNavigation } from '../../brand/game-category-navigation';
import { BrandIcon } from '../brand-icon';

export function GameCategoryNavigation({
  categories,
  config,
  baseIcons,
}: {
  categories: string[];
  config: GameCategoryNavigationConfig;
  baseIcons: SiteIconSettings;
}) {
  const items = buildVisibleGameCategoryNavigation(categories, config);

  return (
    <section className="member-game-category-navigation" aria-label="หมวดเกม">
      <div className="member-game-category-navigation__head">
        <h2>หมวดเกม</h2>
        <Link href="/games">ดูทั้งหมด</Link>
      </div>
      <nav className="member-game-category-navigation__rail" aria-label="เลือกหมวดเกม">
        {items.map((item, index) => (
          <CategoryNavigationLink
            key={`${item.key}-${item.category || index}`}
            item={item}
            baseIcons={baseIcons}
          />
        ))}
      </nav>
    </section>
  );
}

function CategoryNavigationLink({
  item,
  baseIcons,
}: {
  item: GameCategoryNavigationEntry;
  baseIcons: SiteIconSettings;
}) {
  const href = item.category
    ? `/games?category=${encodeURIComponent(item.category)}`
    : '/games';
  const configured = { [item.iconName]: item.iconValue };

  return (
    <Link
      href={href}
      className="member-game-category-navigation__item"
      data-game-category-key={item.key}
      data-game-category-value={item.category || 'all'}
    >
      <span className="member-game-category-navigation__icon">
        <BrandIcon
          name={item.iconName}
          configured={configured}
          existing={baseIcons}
          title={item.label}
        />
      </span>
      <span className="member-game-category-navigation__label">{item.label}</span>
    </Link>
  );
}
