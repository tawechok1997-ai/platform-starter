'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cmsContentSetting, cmsResponsiveMediaUrls } from '../../site-settings';
import { useSiteSettings } from '../../site-settings-provider';
import styles from './mobile-member-news-page.module.css';

export default function MobileMemberNewsPage() {
  const router = useRouter();
  const { settings, ready } = useSiteSettings();
  const items = useMemo(() => {
    const content = cmsContentSetting(settings);
    return content.announcements
      .filter((item) => (
        item.kind === 'news'
        && item.enabled
        && item.lifecycle !== 'draft'
        && item.lifecycle !== 'archived'
      ))
      .map((item) => {
        const media = cmsResponsiveMediaUrls(content, item);
        return {
          id: item.id || item.title,
          title: item.title.trim(),
          message: item.message.trim(),
          image: media.mobile || media.desktop || media.legacy || item.thumbnailImageUrl || '',
          href: safeHref(item.href),
        };
      })
      .filter((item) => item.title);
  }, [settings]);

  return (
    <main className={styles.page} data-mobile-member-page="news" data-content-source="cms" aria-busy={!ready}>
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}>
          <BackIcon />
        </button>
        <h1>ข่าวสาร</h1>
        <span aria-hidden="true" />
      </header>

      <section className={styles.body} aria-live="polite">
        <div className={styles.panel}>
          {!ready ? (
            <div className={styles.list} aria-label="กำลังโหลดข่าวสาร">
              {[0, 1, 2].map((index) => <span className={styles.skeleton} key={index} />)}
            </div>
          ) : null}

          {ready && items.length === 0 ? (
            <div className={styles.state}>ไม่มีข้อความใหม่</div>
          ) : null}

          {ready && items.length > 0 ? (
            <div className={styles.list}>
              {items.map((item) => {
                const content = (
                  <>
                    {item.image ? <img className={styles.image} src={item.image} alt="" loading="lazy" /> : (
                      <span className={styles.placeholder} aria-hidden="true">✦</span>
                    )}
                    <span className={styles.copy}>
                      <strong>{item.title}</strong>
                      <p>{item.message || 'อ่านรายละเอียดข่าวสาร'}</p>
                    </span>
                  </>
                );

                return item.href ? (
                  <a className={styles.card} href={item.href} key={item.id}>{content}</a>
                ) : (
                  <article className={styles.card} key={item.id}>{content}</article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function safeHref(value: string | undefined) {
  const href = value?.trim() ?? '';
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
    </svg>
  );
}
