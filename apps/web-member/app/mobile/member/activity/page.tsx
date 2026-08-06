'use client';

import { useRouter } from 'next/navigation';
import MobileMemberActivityPage from '../../../components/mobile-home/mobile-member-activity-page';
import { useMobileActivitiesSource } from '../../../components/mobile-home/use-mobile-member-content-sources';

export default function MobileActivityRoute() {
  const router = useRouter();
  const { items, loading, error } = useMobileActivitiesSource();

  return (
    <MobileMemberActivityPage
      items={items}
      loading={loading}
      error={error}
      onBack={() => {
        if (window.history.length > 1) router.back();
        else router.replace('/');
      }}
    />
  );
}
