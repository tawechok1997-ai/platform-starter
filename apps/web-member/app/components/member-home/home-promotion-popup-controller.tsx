'use client';

import { useEffect, useState } from 'react';
import { HomePromotionPopup } from './home-promotion-popup';

const PROMOTION_TRIGGER_SELECTOR = [
  'a.reference-promo-card--1',
  '.v47-mobile-quick-grid > a:first-child',
].join(',');

export default function HomePromotionPopupController() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handlePromotionClick = (event: MouseEvent) => {
      if (window.location.pathname !== '/') return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest(PROMOTION_TRIGGER_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    };

    window.addEventListener('click', handlePromotionClick, true);
    return () => window.removeEventListener('click', handlePromotionClick, true);
  }, []);

  if (!open) return null;
  return <HomePromotionPopup onClose={() => setOpen(false)} />;
}
