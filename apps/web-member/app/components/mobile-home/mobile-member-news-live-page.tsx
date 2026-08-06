'use client';

import type { MobileMemberContentItem } from './use-mobile-member-content-sources';
import styles from './mobile-member-news-page.module.css';

type Props = {
  items: MobileMemberContentItem[];
  loading: boolean;
  onBack: () => void;
};

export default function MobileMemberNewsLivePage({ items, loading, onBack }: Props) {
  return (
    <main
      className={styles.page}
      data-mobile-member-page="news"
      data-news-owner="standalone"
      data-content-source="shared-cms"
      aria-busy={loading}
    >
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>ข่าวสาร</h1>
        <span aria-hidden="true" />
      </header>

      <section className={styles.body} aria-live="polite">
        {loading ? (
          <div className={styles.list} aria-label="กำลังโหลดข่าวสาร">
            {[0, 1, 2].map((index) => <span className={styles.skeleton} key={index} />)}
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <NewsEmptyIcon />
            <span>ไม่มีข้อความใหม่</span>
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className={styles.list}>
            {items.map((item) => {
              const content = (
                <>
                  {item.image ? <img className={styles.image} src={item.image} alt="" loading="lazy" /> : (
                    <span className={styles.placeholder} aria-hidden="true">✦</span>
                  )}
                  <span className={styles.copy}>
                    <strong>{item.title}</strong>
                    <p>{item.summary || 'อ่านรายละเอียดข่าวสาร'}</p>
                  </span>
                </>
              );
              const linked = item.href && item.href !== '/mobile/member/news';
              return linked ? (
                <a className={styles.card} href={item.href} key={item.id}>{content}</a>
              ) : (
                <article className={styles.card} key={item.id}>{content}</article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
    </svg>
  );
}

function NewsEmptyIcon() {
  return (
    <svg className={styles.emptyIcon} width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
      <path d="M87.43 36.61H23.21v36.12a8.03 8.03 0 0 0 8.03 8.03H79.4a8.03 8.03 0 0 0 8.03-8.03V36.61Z" fill="#e0b1f1" />
      <rect x="47.9" y="46.67" width="14.74" height="4.91" rx="2.46" fill="#a800cb" />
      <path d="M7.75 17.31a8.03 8.03 0 0 0-5.67 9.83l2.08 7.76a8.03 8.03 0 0 0 9.83 5.67l56.86-15.23a8.03 8.03 0 0 0 5.67-9.83l-2.08-7.76a8.03 8.03 0 0 0-9.83-5.67L7.75 17.31Z" fill="#a800cb" />
      <path d="M68.77 35s19.65-5.53 16.58-11.67c-1.66-3.33-6.44-3.1-9.21-.61-3.19 2.86-3.06 10.44 1.23 10.44 3.07 0 10.44.61 15.97-2.46 8.65-4.81 10.44-8.6 12.9-14.12" stroke="#e0b1f1" strokeWidth="1.23" strokeLinecap="round" strokeDasharray="2.46 2.46" />
    </svg>
  );
}
