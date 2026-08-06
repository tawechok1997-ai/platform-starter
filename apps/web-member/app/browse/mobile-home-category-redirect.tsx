'use client';

import { useEffect } from 'react';

export type MobileBrowseCategorySlug = 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lotto';

const HOME_CATEGORY: Record<MobileBrowseCategorySlug, string> = {
  casino: 'casino',
  slot: 'slot',
  fishing: 'fishing',
  sport: 'sport',
  card: 'card',
  lotto: 'lottery',
};

export default function MobileHomeCategoryRedirect({ slug }: { slug: MobileBrowseCategorySlug }) {
  useEffect(() => {
    const destination = new URL('/', window.location.origin);
    destination.searchParams.set('category', HOME_CATEGORY[slug]);
    window.location.replace(destination.toString());
  }, [slug]);

  return (
    <main className="member-loading-screen" data-mobile-category-home-redirect={slug}>
      กำลังเปิดหมวดเกมพร้อมส่วนหัว...
    </main>
  );
}
