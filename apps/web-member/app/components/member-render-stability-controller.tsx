'use client';

import { useLayoutEffect } from 'react';

export default function MemberRenderStabilityController() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    let firstFrame = 0;
    let secondFrame = 0;

    const reveal = () => {
      root.dataset.memberViewportReady = 'true';
    };

    if (root.dataset.memberViewportReady === 'true') return;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(reveal);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  return null;
}
