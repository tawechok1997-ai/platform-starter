'use client';

import { SiteIconSettings } from './site-settings';

/**
 * Deprecated compatibility shim.
 * MemberChrome owns the only bottom navigation for authenticated member pages.
 * Old pages may still import this component while cleanup is in progress.
 */
export default function MemberBottomNav(_props: { pendingCount?: number; icons?: SiteIconSettings }) {
  return null;
}
