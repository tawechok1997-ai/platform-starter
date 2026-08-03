'use client';

import { useRouter } from 'next/navigation';
import MobileLiveSchedulePage from '../components/mobile-home/mobile-live-schedule-page';
import { LIVE_SERVICE_COPY } from '../lib/live-service-status';
import { useMemberLocale } from '../member-locale-provider';

export default function LiveSchedulePage() {
  const router = useRouter();
  const { locale } = useMemberLocale();
  const copy = LIVE_SERVICE_COPY[locale];

  return (
    <section aria-label={copy.scheduleTitle} data-desktop-live-page="true">
      <MobileLiveSchedulePage onBack={() => router.push('/')} />
    </section>
  );
}
