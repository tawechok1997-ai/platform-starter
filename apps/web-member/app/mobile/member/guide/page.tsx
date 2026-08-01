'use client';

import { useRouter } from 'next/navigation';
import MobileMemberGuidePage from '../../../components/mobile-home/mobile-member-guide-page';

export default function MobileMemberGuideRoute() {
  const router = useRouter();
  return <MobileMemberGuidePage onBack={() => router.back()} />;
}
