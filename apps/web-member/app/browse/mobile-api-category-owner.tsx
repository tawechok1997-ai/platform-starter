'use client';

import { useEffect, useState, type ReactNode } from 'react';
import MobileHomeCategoryRedirect, {
  type MobileBrowseCategorySlug,
} from './mobile-home-category-redirect';

const MOBILE_QUERY = '(max-width: 900px)';

export default function MobileApiCategoryOwner({
  slug,
  desktop,
}: {
  slug: MobileBrowseCategorySlug;
  desktop: ReactNode;
}) {
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  if (mobile === null) {
    return <main className="member-loading-screen">กำลังตรวจสอบชุดเกม...</main>;
  }

  if (!mobile) return <>{desktop}</>;

  // Mobile categories belong to the Home owner. Rendering the standalone
  // Desktop-style category route removed the header, Hero, auth actions,
  // announcement and topic tabs. Redirect into the Home shell and let the
  // category query bridge activate the same API-backed category content.
  return <MobileHomeCategoryRedirect slug={slug} />;
}
