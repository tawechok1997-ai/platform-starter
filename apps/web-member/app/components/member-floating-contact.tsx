'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '../member-authenticated-source-overrides.css';

const MOBILE_MENU_PAGE_ROUTES = new Set([
  '/mobile/member/vip',
  '/mobile/member/live',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/guide',
]);

const MOBILE_MENU_BACK_SELECTOR = [
  '[data-mobile-member-page] button[aria-label="ย้อนกลับ"]',
  '[data-mobile-live-page="true"] button[aria-label="ย้อนกลับ"]',
].join(',');

const MOBILE_REFERRAL_COPY_SELECTOR = '[data-mobile-member-drawer-copy="referral"]';

export default function MemberFloatingContact() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const normalizedPath = normalizePath(pathname);
  const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES.has(normalizedPath);

  useEffect(() => {
    const preserveReferralCopy = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLElement>(MOBILE_REFERRAL_COPY_SELECTOR);
      const label = action?.querySelector<HTMLElement>('strong');
      if (!action || !label) return;

      // The shared popup router infers navigation from visible Thai labels during
      // document capture. Mask only that label for the current click so the
      // original React handler can copy the referral URL and show its source toast.
      const originalLabel = label.textContent ?? '';
      label.textContent = 'คัดลอกลิงก์';
      window.queueMicrotask(() => {
        if (label.isConnected) label.textContent = originalLabel;
      });
    };

    window.addEventListener('click', preserveReferralCopy, true);
    return () => window.removeEventListener('click', preserveReferralCopy, true);
  }, []);

  useEffect(() => {
    if (!isMobileMenuPage) return;

    const returnToMobileHome = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const backButton = event.target.closest<HTMLButtonElement>(MOBILE_MENU_BACK_SELECTOR);
      if (!backButton) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      router.replace('/');
    };

    document.addEventListener('click', returnToMobileHome, true);
    return () => document.removeEventListener('click', returnToMobileHome, true);
  }, [isMobileMenuPage, router]);

  return null;
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}
