import { Suspense } from 'react';
import { BrowsePromotionsCms } from '../browse-promotions-cms';

export default function PublicPromotionsBrowsePage() {
  return (
    <Suspense fallback={<main className="browse-page"><section className="browse-empty"><strong>กำลังโหลดรายการโปรโมชั่น...</strong></section></main>}>
      <BrowsePromotionsCms />
    </Suspense>
  );
}
