'use client';

import { useLayoutEffect, useState } from 'react';
import PublicDesktopViewportBootstrap from './public-desktop-viewport-bootstrap';

type ViewportMode = 'mobile' | 'desktop';

const DESKTOP_QUERY = '(min-width: 901px)';

export default function PublicDesktopViewportBootstrapOwner() {
  const [viewportMode, setViewportMode] = useState<ViewportMode | null>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const syncViewport = () => setViewportMode(media.matches ? 'desktop' : 'mobile');

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  return viewportMode === 'desktop' ? <PublicDesktopViewportBootstrap /> : null;
}
