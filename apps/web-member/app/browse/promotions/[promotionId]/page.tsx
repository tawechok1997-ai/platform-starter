'use client';

import { useParams } from 'next/navigation';
import { BrowsePromotionDetailCms } from '../../browse-promotion-detail-cms';

export default function PublicPromotionDetailPage() {
  const params = useParams<{ promotionId: string }>();
  return <BrowsePromotionDetailCms id={params.promotionId} />;
}
