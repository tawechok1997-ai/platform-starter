import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import GuidePageClient from './guide-page-client';

export default async function GuidePage() {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') ?? '';
  const clientMobileHint = requestHeaders.get('sec-ch-ua-mobile');
  const isMobile = clientMobileHint === '?1'
    || /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(userAgent);

  if (isMobile) redirect('/mobile/member/guide');

  return <GuidePageClient />;
}
