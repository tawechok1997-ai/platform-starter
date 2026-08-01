import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BrowsePromotionsCms } from '../browse-promotions-cms';

export default async function PublicPromotionsBrowsePage() {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') ?? '';
  const clientMobileHint = requestHeaders.get('sec-ch-ua-mobile');
  const isMobile = clientMobileHint === '?1'
    || /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(userAgent);

  if (isMobile) redirect('/mobile/member/promotions');

  return (
    <Suspense fallback={<main className="browse-page"><section className="browse-empty"><strong>กำลังโหลดรายการโปรโมชั่น...</strong></section></main>}>
      <BrowsePromotionsCms />
    </Suspense>
  );
}
