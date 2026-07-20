'use client';

import { useEffect, useRef } from 'react';

type Options = {
  enabled: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
};

export function useInfiniteScroll({ enabled, loading, onLoadMore, rootMargin = '420px 0px' }: Options) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onLoadMore);

  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled || loading || typeof IntersectionObserver === 'undefined') return;

    let consumed = false;
    const observer = new IntersectionObserver((entries) => {
      if (!consumed && entries.some((entry) => entry.isIntersecting)) {
        consumed = true;
        callbackRef.current();
      }
    }, { rootMargin });

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, loading, rootMargin]);

  return sentinelRef;
}
