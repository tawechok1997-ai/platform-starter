'use client';

import type { CmsContent } from '../../site-settings';
import { MemberRuntimeImage } from '../member-runtime-image';
import { buildHomePromotionCards } from './home-promotion-model';

export function HomePromotionCards({ content }: { content: CmsContent }) {
  const cards = buildHomePromotionCards(content);

  if (!cards.length) {
    return <div className="member-source-state">ยังไม่มีโปรโมชั่นที่เปิดใช้งาน</div>;
  }

  return (
    <div className="member-reference-promotion-grid" aria-label="รายการโปรโมชั่น">
      {cards.map((card) => (
        <a key={card.id} className="member-reference-promotion-card" href={card.href}>
          <div className="member-reference-promotion-card__media">
            <MemberRuntimeImage src={card.imageUrl} alt={card.title} />
            {card.badge && <span className="member-reference-promotion-card__badge">{card.badge}</span>}
          </div>
          <div className="member-reference-promotion-card__body">
            <strong>{card.title}</strong>
            {card.subtitle && <span>{card.subtitle}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}
