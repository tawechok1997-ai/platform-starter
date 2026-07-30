'use client';

import { useEffect, useState } from 'react';
import type { MemberLocale } from '../member-locale-provider';
import MemberVipModal from './member-vip-modal';

const VIP_MENU_SELECTOR = '.public-member-menu-grid:not(.public-member-menu-grid--secondary) a:first-child';

export default function MemberMenuVipRuntime({ locale }: { locale: MemberLocale }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLAnchorElement>(VIP_MENU_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      setOpen(true);

      window.setTimeout(() => {
        document.querySelector<HTMLButtonElement>('.public-member-profile-trigger[aria-expanded="true"]')?.click();
      }, 0);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return <MemberVipModal open={open} locale={locale} onClose={() => setOpen(false)} />;
}
