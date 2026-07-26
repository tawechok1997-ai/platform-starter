import { Suspense } from 'react';
import { BrowsePromotions } from '../public-browse';

export default function PublicPromotionsBrowsePage() {
  return (
    <Suspense fallback={<main className="browse-page"><section className="browse-empty"><strong>กำลังโหลดรายการโปรโมชั่น...</strong></section></main>}>
      <BrowsePromotions />
    </Suspense>
  );
}
