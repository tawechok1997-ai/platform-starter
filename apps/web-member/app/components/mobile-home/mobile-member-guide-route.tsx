'use client';

import { useRouter } from 'next/navigation';
import MobileMemberGuidePage from './mobile-member-guide-page';

export default function MobileMemberGuideRoute() {
  const router = useRouter();
  return <MobileMemberGuidePage onBack={() => router.push('/')} />;
}
