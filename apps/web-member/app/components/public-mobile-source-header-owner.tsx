'use client';

import { useLayoutEffect, useState } from 'react';
import PublicMobileSourceHeader from './public-mobile-source-header';

type ViewportMode = 'mobile' | 'desktop';

const MOBILE_QUERY = '(max-width: 900px)';

export default function PublicMobileSourceHeaderOwner() {
  const [viewportMode, setViewportMode] = useState<ViewportMode | null>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const syncViewport = () => setViewportMode(media.matches ? 'mobile' : 'desktop');

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  return viewportMode === 'mobile' ? <PublicMobileSourceHeader /> : null;
}
