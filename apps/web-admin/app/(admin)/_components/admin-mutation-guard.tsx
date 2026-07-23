'use client';

import { useCallback, useRef, useState } from 'react';

export function useAdminMutationGuard() {
  const activeRef = useRef(new Set<string>());
  const [activeKeys, setActiveKeys] = useState<ReadonlySet<string>>(new Set());

  const run = useCallback(async <T,>(key: string, task: () => Promise<T>) => {
    const normalizedKey = key.trim();
    if (!normalizedKey || activeRef.current.has(normalizedKey)) return undefined;

    activeRef.current.add(normalizedKey);
    setActiveKeys(new Set(activeRef.current));
    try {
      return await task();
    } finally {
      activeRef.current.delete(normalizedKey);
      setActiveKeys(new Set(activeRef.current));
    }
  }, []);

  const isBusy = useCallback((key: string) => activeKeys.has(key.trim()), [activeKeys]);

  return {
    run,
    isBusy,
    busy: activeKeys.size > 0,
    activeCount: activeKeys.size,
  };
}
