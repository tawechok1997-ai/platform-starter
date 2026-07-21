'use client';

import type { CmsContent } from '../../site-settings';
import { buildHomeAnnouncements } from './home-announcement-model';

export function HomeAnnouncementStrip({ content }: { content: CmsContent }) {
  const items = buildHomeAnnouncements(content);

  return (
    <section className="home-announcement-strip" aria-label="ประกาศสมาชิก">
      <div className="home-announcement-strip__badge" aria-hidden="true">ประกาศ</div>
      <div className="home-announcement-strip__track">
        {items.map((item) => (
          <article className="home-announcement-strip__item" key={item.id}>
            <strong>{item.title}</strong>
            {item.message && <span>{item.message}</span>}
          </article>
        ))}
      </div>
    </section>
  );
}
