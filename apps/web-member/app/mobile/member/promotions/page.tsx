'use client';

import { useRouter } from 'next/navigation';
import MobileMemberPromotionsLivePage from '../../../components/mobile-home/mobile-member-promotions-live-page';
import { useMobilePromotionsSource } from '../../../components/mobile-home/use-mobile-member-content-sources';

export default function MobilePromotionsRoute() {
  const router = useRouter();
  const { payload, loading, error } = useMobilePromotionsSource();

  return (
    <MobileMemberPromotionsLivePage
      payload={payload}
      loading={loading}
      error={error}
      onBack={() => {
        if (window.history.length > 1) router.back();
        else router.replace('/');
      }}
    />
  );
}
