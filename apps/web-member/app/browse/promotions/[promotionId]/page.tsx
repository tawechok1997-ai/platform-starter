'use client';

import { useParams } from 'next/navigation';
import { BrowsePromotionDetail } from '../../public-browse';

export default function PublicPromotionDetailPage() {
  const params = useParams<{ promotionId: string }>();
  return <BrowsePromotionDetail id={params.promotionId} />;
}
