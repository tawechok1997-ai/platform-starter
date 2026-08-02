'use client';

import Link from 'next/link';
import { useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import { MOBILE_GUIDE_SECTIONS, type MobileGuideItem } from './mobile-member-guide-source-data';
import styles from './mobile-home-guide-preview.module.css';

const GUIDE_PREVIEW_ITEMS = MOBILE_GUIDE_SECTIONS
  .find((section) => section.id === 'section-1')
  ?.items.slice(0, 5) ?? [];

export default function MobileHomeGuidePreview() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    const bottomStructure = root?.querySelector<HTMLElement>('[data-mobile-bottom-owner="true"]');
    const ownerClassName = styles.owner;
    if (!root || !bottomStructure || !ownerClassName) return;

    root.classList.add(ownerClassName);

    const host = document.createElement('div');
    host.dataset.mobileHomeGuidePreviewHost = 'true';
    const shortcut = bottomStructure.querySelector<HTMLElement>(':scope > [data-mobile-section-owner="shortcut"]');
    bottomStructure.insertBefore(host, shortcut ?? bottomStructure.firstChild);
    setTarget(host);

    const syncVisibility = () => {
      setVisible((root.dataset.mobileActiveCategory ?? 'home') === 'home');
    };

    const observer = new MutationObserver(syncVisibility);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-mobile-active-category'],
    });
    syncVisibility();

    return () => {
      observer.disconnect();
      root.classList.remove(ownerClassName);
      host.remove();
      setTarget(null);
    };
  }, []);

  if (!target || !visible) return null;
  return createPortal(<GuidePreviewContent />, target);
}

function GuidePreviewContent() {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  return (
    <section className={styles.preview} data-mobile-home-guide-preview="true" aria-labelledby="mobile-home-guide-title">
      <header className={styles.titleBar}>
        <img src="/images/home/faq.svg" alt="" aria-hidden="true" />
        <h2 id="mobile-home-guide-title">Guide</h2>
      </header>

      <div className={styles.list}>
        {GUIDE_PREVIEW_ITEMS.map((item) => {
          const expanded = openItemId === item.id;
          const panelId = `mobile-home-guide-panel-${item.id}`;
          return (
            <article className={styles.item} data-expanded={expanded ? 'true' : 'false'} key={item.id}>
              <button
                type="button"
                className={styles.trigger}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenItemId((current) => current === item.id ? null : item.id)}
              >
                <span>{item.title}</span>
                <Chevron expanded={expanded} />
              </button>
              {expanded ? <GuidePanel item={item} panelId={panelId} /> : null}
            </article>
          );
        })}
      </div>

      <div className={styles.moreRow}>
        <Link href="/mobile/member/guide">ดูทั้งหมด</Link>
      </div>
    </section>
  );
}

function GuidePanel({ item, panelId }: { item: MobileGuideItem; panelId: string }) {
  return (
    <div className={styles.panel} id={panelId}>
      {item.blocks.map((block, index) => block.type === 'image' ? (
        <GuideImage key={`${block.source}:${index}`} source={block.source} alt={block.alt} />
      ) : (
        <div
          key={`${item.id}:copy:${index}`}
          className={styles.copy}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      ))}
    </div>
  );
}

function GuideImage({ source, alt }: { source: string; alt: string }) {
  const remoteSource = source.trim();
  const localSource = useMemo(() => resolveLocalAssetOrSource(remoteSource, 'mobile'), [remoteSource]);
  const [currentSource, setCurrentSource] = useState(localSource);

  return (
    <img
      className={styles.image}
      src={currentSource}
      data-source-cdn={remoteSource}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (remoteSource && currentSource !== remoteSource) setCurrentSource(remoteSource);
      }}
    />
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg className={expanded ? styles.chevronOpen : styles.chevron} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="m7.41 15.41 4.59-4.58 4.59 4.58L18 14l-6-6-6 6 1.41 1.41Z" />
    </svg>
  );
}
