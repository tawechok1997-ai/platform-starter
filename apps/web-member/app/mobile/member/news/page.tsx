'use client';

import { useRouter } from 'next/navigation';
import MobileMemberNewsLivePage from '../../../components/mobile-home/mobile-member-news-live-page';
import { useMobileNewsSource } from '../../../components/mobile-home/use-mobile-member-content-sources';

export default function MobileNewsRoute() {
  const router = useRouter();
  const { items, loading } = useMobileNewsSource();

  return (
    <MobileMemberNewsLivePage
      items={items}
      loading={loading}
      onBack={() => {
        if (window.history.length > 1) router.back();
        else router.replace('/');
      }}
    />
  );
}
