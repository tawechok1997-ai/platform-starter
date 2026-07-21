'use client';

import { useMemo } from 'react';
import type { CmsContent } from '../../site-settings';
import { PromotionCarousel } from './promotion-carousel';
import { buildHomePromotionItems } from './promotion-carousel-model';

export function HomePromotionCarousel({ content, siteName }: { content: CmsContent; siteName: string }) {
  const items = useMemo(() => buildHomePromotionItems(content), [content]);
  return (
    <PromotionCarousel
      items={items}
      autoPlayMs={5000}
      className="member-home-hero"
      ariaLabel={`โปรโมชั่น ${siteName}`}
    />
  );
}
