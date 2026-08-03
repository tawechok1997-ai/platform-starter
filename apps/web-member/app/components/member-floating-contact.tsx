'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '../member-authenticated-source-overrides.css';
import '../member-mobile-deposit-source-contract.css';

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
const MOBILE_REFERRAL_LABELS = new Set(['แนะนำเพื่อน', 'Refer a friend']);
const MOBILE_REFERRAL_ROUTES = new Set(['/affiliate', '/mobile/member/affiliate']);

export default function MemberFloatingContact() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const normalizedPath = normalizePath(pathname);
  const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES.has(normalizedPath);

  useEffect(() => {
    const routeReferralActionsToCopyOwner = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLElement>('a,button,[role="button"]');
      if (!action) return;

      const canonicalCopyAction = action.closest<HTMLElement>(MOBILE_REFERRAL_COPY_SELECTOR);
      if (canonicalCopyAction) {
        preserveCanonicalReferralCopyLabel(canonicalCopyAction);
        return;
      }

      // Explicit popup actions such as network income may also use /affiliate.
      // They are not referral-copy controls and must keep their own behavior.
      if (action.dataset.mobileMemberPopup) return;

      const label = normalizeActionLabel(action.textContent ?? '');
      const href = action instanceof HTMLAnchorElement
        ? normalizePathname(action.getAttribute('href') ?? '')
        : '';
      const isReferralAction = MOBILE_REFERRAL_LABELS.has(label)
        || (MOBILE_REFERRAL_ROUTES.has(href) && label.includes('แนะนำเพื่อน'));
      if (!isReferralAction) return;

      const copyAction = document.querySelector<HTMLElement>(MOBILE_REFERRAL_COPY_SELECTOR);
      if (!copyAction) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      action
        .closest<HTMLElement>('[data-mobile-popup-owner="menu"]')
        ?.querySelector<HTMLButtonElement>('button[aria-label="ปิด"]')
        ?.click();
      action
        .closest<HTMLElement>('#mobile-home-drawer')
        ?.querySelector<HTMLButtonElement>('button[aria-label="ปิดเมนู"]')
        ?.click();

      // Run the one authenticated copy handler. That owner resolves the real
      // referral URL, supports restricted mobile clipboards and shows the
      // source-matched success toast. No menu is allowed to navigate instead.
      copyAction.click();
    };

    window.addEventListener('click', routeReferralActionsToCopyOwner, true);
    return () => window.removeEventListener('click', routeReferralActionsToCopyOwner, true);
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

function preserveCanonicalReferralCopyLabel(action: HTMLElement) {
  const label = action.querySelector<HTMLElement>('strong');
  if (!label) return;

  // The shared popup router infers navigation from visible Thai labels during
  // document capture. Mask only the canonical row for the current click so its
  // React copy handler and success toast remain the final owner.
  const originalLabel = label.textContent ?? '';
  label.textContent = 'คัดลอกลิงก์';
  window.queueMicrotask(() => {
    if (label.isConnected) label.textContent = originalLabel;
  });
}

function normalizeActionLabel(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizePathname(value: string) {
  if (!value) return '';
  try {
    return normalizePath(new URL(value, window.location.origin).pathname);
  } catch {
    return normalizePath(value.split(/[?#]/, 1)[0] ?? '');
  }
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}
