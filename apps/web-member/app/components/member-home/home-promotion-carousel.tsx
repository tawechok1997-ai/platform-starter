'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CmsContent } from '../../site-settings';
import {
  MEMBER_PROMOTION_FALLBACKS,
  loadMemberPromotionCampaigns,
  memberPromotionImage,
  type MemberPromotionCampaign,
} from '../../member-promotion-runtime';
import { PromotionCarousel } from './promotion-carousel';

export function HomePromotionCarousel({ siteName }: { content: CmsContent; siteName: string }) {
  const [campaigns, setCampaigns] = useState<MemberPromotionCampaign[]>(MEMBER_PROMOTION_FALLBACKS);

  useEffect(() => {
    const controller = new AbortController();
    void loadMemberPromotionCampaigns(controller.signal)
      .then(setCampaigns)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const items = useMemo(() => campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    imageUrl: memberPromotionImage(campaign),
    href: campaign.href || '/browse/promotions?view=promotion',
    alt: campaign.title || 'โปรโมชั่น',
  })), [campaigns]);

  return (
    <PromotionCarousel
      items={items}
      autoPlayMs={5000}
      className="member-home-hero"
      ariaLabel={`โปรโมชั่น ${siteName}`}
    />
  );
}
