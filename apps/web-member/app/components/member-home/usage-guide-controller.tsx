'use client';

import { useEffect, useState } from 'react';
import UsageGuideModal from './usage-guide-modal';

const GUIDE_TRIGGER_SELECTOR = [
  'a.reference-guide-more[href="/guide"]',
  'a.v47-mobile-guide-more[href="/guide"]',
  '[data-open-usage-guide="true"]',
].join(',');

export default function UsageGuideController() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleGuideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>(GUIDE_TRIGGER_SELECTOR);
      if (!trigger) return;
      event.preventDefault();
      setOpen(true);
    };

    document.addEventListener('click', handleGuideClick);
    return () => document.removeEventListener('click', handleGuideClick);
  }, []);

  return <UsageGuideModal open={open} onClose={() => setOpen(false)} />;
}
