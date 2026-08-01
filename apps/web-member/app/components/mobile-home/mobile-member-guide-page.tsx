'use client';

import { useId, useMemo, useState } from 'react';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import {
  MOBILE_GUIDE_SECTIONS,
  type MobileGuideCategory,
  type MobileGuideItem,
} from './mobile-member-guide-source-data';
import styles from './mobile-member-guide-page.module.css';

type GuideTab = 'all' | MobileGuideCategory;

type MobileMemberGuidePageProps = {
  onBack: () => void;
};

const GUIDE_TABS: ReadonlyArray<{ id: GuideTab; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'finance', label: 'การฝาก - ถอน' },
  { id: 'activity', label: 'กิจกรรม' },
  { id: 'play', label: 'การเข้าเล่น' },
  { id: 'network', label: 'สร้างรายได้เครือข่าย' },
  { id: 'benefit', label: 'สิทธิประโยชน์' },
  { id: 'problem', label: 'เกิดปัญหาในการเล่นเกม?' },
];

export default function MobileMemberGuidePage({ onBack }: MobileMemberGuidePageProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  const visibleSections = useMemo(
    () => activeTab === 'all'
      ? MOBILE_GUIDE_SECTIONS
      : MOBILE_GUIDE_SECTIONS.filter((section) => section.category === activeTab),
    [activeTab],
  );

  function selectTab(tab: GuideTab) {
    setActiveTab(tab);
    setOpenItemKey(null);
  }

  return (
    <main className={styles.page} data-mobile-member-page="guide">
      <div className={styles.topShell}>
        <header className={styles.header}>
          <button type="button" aria-label="ย้อนกลับ" onClick={onBack}>
            <BackIcon />
          </button>
          <h1>แนะนำการใช้งาน</h1>
          <span aria-hidden="true" />
        </header>

        <nav className={styles.tabBar} aria-label="หมวดแนะนำการใช้งาน">
          <div className={styles.tabScroller}>
            {GUIDE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? styles.tabActive : styles.tabButton}
                aria-pressed={activeTab === tab.id}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <section className={styles.sections} aria-live="polite">
        {visibleSections.map((section) => (
          <article className={styles.sectionCard} key={section.id}>
            <SectionTitlePlate title={section.title} />
            <div className={styles.sectionItems}>
              {section.items.map((item) => {
                const itemKey = `${section.id}:${item.id}`;
                const expanded = openItemKey === itemKey;
                return (
                  <GuideDisclosure
                    key={itemKey}
                    item={item}
                    expanded={expanded}
                    onToggle={() => setOpenItemKey(expanded ? null : itemKey)}
                  />
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function GuideDisclosure({
  item,
  expanded,
  onToggle,
}: {
  item: MobileGuideItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `mobile-guide-panel-${item.id}`;

  return (
    <section className={expanded ? styles.disclosureOpen : styles.disclosure}>
      <button
        type="button"
        className={styles.disclosureButton}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <ChevronIcon expanded={expanded} />
        <span>{item.title}</span>
      </button>

      {expanded ? (
        <div className={styles.disclosurePanel} id={panelId}>
          {item.blocks.map((block, index) => block.type === 'image' ? (
            <GuideImage
              key={`${block.source}:${index}`}
              source={block.source}
              alt={block.alt}
            />
          ) : (
            <div
              key={`${item.id}:html:${index}`}
              className={styles.guideCopy}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function GuideImage({ source, alt }: { source: string; alt: string }) {
  const remoteSource = source.trim();
  const localSource = resolveLocalAssetOrSource(remoteSource, 'pc');
  const [currentSource, setCurrentSource] = useState(localSource);

  return (
    <img
      className={styles.guideImage}
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

function SectionTitlePlate({ title }: { title: string }) {
  const gradientId = useId().replace(/:/g, '');
  const strokeId = `${gradientId}-stroke`;

  return (
    <div className={styles.sectionTitlePlate}>
      <svg viewBox="0 0 194 38" fill="none" aria-hidden="true">
        <path
          d="M3 1H1.69l.346 1.264 4.651 17 .013.049.018.047c.032.083.832 2.148 2.35 4.745 1.505 2.576 3.771 5.735 6.883 7.783 3.45 2.27 7.534 3.299 10.622 3.786 1.557.245 2.882.326 3.824.346.47.01.845.004 1.106-.004l.301-.012.08-.004.022-.001h.006H53.375 96.25 139.125h21.438.006l.022.001.08.004.301.012c.261.008.636.014 1.106.004.942-.02 2.267-.101 3.824-.346 3.088-.487 7.172-1.516 10.622-3.786 3.112-2.048 5.378-5.207 6.883-7.783 1.518-2.597 2.318-4.662 2.35-4.745l.018-.047.013-.049 4.651-17L192.31 1H191 3Z"
          fill={`url(#${gradientId})`}
          stroke={`url(#${strokeId})`}
          strokeOpacity=".22"
          strokeWidth="2"
        />
        <defs>
          <linearGradient id={gradientId} x1="96" y1="38" x2="96" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#505050" />
            <stop offset=".32" stopColor="#474747" />
            <stop offset=".79" stopColor="#313131" />
          </linearGradient>
          <linearGradient id={strokeId} x1="142.5" y1="48.75" x2="142" y2="6.72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f2f2f2" />
            <stop offset="1" stopColor="#f2f2f2" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <strong>{title}</strong>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={expanded ? styles.chevronExpanded : styles.chevron}
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <path d="M256 294.1 383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127Z" />
    </svg>
  );
}
