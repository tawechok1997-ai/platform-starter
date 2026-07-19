'use client';

import type { CmsContent } from '../../site-settings';
import { PromotionSlotGrid } from '../member-home-sections';

export function HomePromotionsPanel({
  active,
  enabled,
  content,
}: {
  active: boolean;
  enabled: boolean;
  content: CmsContent;
}) {
  return (
    <section
      className="member-source-panel member-source-panel--promotions"
      hidden={!active}
      aria-label="โปรโมชั่นแนะนำ"
    >
      {enabled ? (
        <PromotionSlotGrid content={content} />
      ) : (
        <div className="member-source-state">โปรโมชั่นถูกปิดใช้งานชั่วคราว</div>
      )}
    </section>
  );
}
