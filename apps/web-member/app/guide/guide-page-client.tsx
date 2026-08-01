'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import UsageGuideModal from '../components/member-home/usage-guide-modal';

export default function GuidePageClient() {
  const router = useRouter();

  const closeGuide = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace('/');
  }, [router]);

  return <UsageGuideModal open onClose={closeGuide} />;
}
