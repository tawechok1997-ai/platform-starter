'use client';

import { useMemo } from 'react';
import { useSiteSettings } from '../site-settings-provider';
import { createBrandRuntimeConfig } from './brand-config';

/**
 * Read-only bridge from the existing public site settings provider to the
 * normalized brand runtime contract. Keeping this derived avoids introducing
 * a second settings fetch or a second source of truth.
 */
export function useBrandRuntime() {
  const { typedSettings, ready, reload } = useSiteSettings();
  const brand = useMemo(() => createBrandRuntimeConfig(typedSettings), [typedSettings]);

  return { brand, ready, reload };
}
