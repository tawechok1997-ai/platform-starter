'use client';

import Link from 'next/link';
import type { MemberFeatureFlags, SiteIconSettings } from '../../site-settings';
import { navigationFor } from '../../member-navigation';
import { BrandIcon } from '../brand-icon';

const QUICK_ACTION_KEYS = new Set(['deposit', 'withdraw', 'transactions', 'bonus']);

export function HomeQuickActions({
  icons,
  features,
}: {
  icons: SiteIconSettings;
  features: MemberFeatureFlags;
}) {
  const items = navigationFor('home', features)
    .filter((item) => QUICK_ACTION_KEYS.has(item.key))
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="member-quick-panel" aria-label="ทางลัด">
      {items.map((item) => (
        <Link key={item.key} href={item.href} className="member-quick-action">
          <span className="member-home-quick-icon">
            <BrandIcon name={item.iconKey} existing={icons} />
          </span>
          <strong>{item.shortTitle ?? item.title}</strong>
          <span>{item.description}</span>
        </Link>
      ))}
    </section>
  );
}
