'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import { useMemberLocale } from '../../member-locale-provider';
import {
  USAGE_GUIDE_COPY,
  USAGE_GUIDE_GROUPS,
  USAGE_GUIDE_TABS,
  localizeGuideText,
  type GuideTab,
} from './usage-guide-data';
import {
  PC_USAGE_GUIDE_DEFAULT_OPEN_KEYS,
  PC_USAGE_GUIDE_SOURCE_BY_QUESTION,
  type PcGuidePart,
  type PcSourceGuideItem,
} from './usage-guide-pc-source-data';
import styles from './usage-guide-modal.module.css';
import sourceStyles from './usage-guide-pc-source.module.css';

const GUIDE_TITLE_ID = 'member-usage-guide-title';
const DESKTOP_GUIDE_MEDIA = '(min-width: 901px)';

export default function UsageGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useMemberLocale();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [openDesktopItems, setOpenDesktopItems] = useState<ReadonlySet<string>>(
    () => new Set(PC_USAGE_GUIDE_DEFAULT_OPEN_KEYS),
  );
  const [desktopSourceEnabled, setDesktopSourceEnabled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const visibleGroups = useMemo(
    () => activeTab === 'all'
      ? USAGE_GUIDE_GROUPS
      : USAGE_GUIDE_GROUPS.filter((group) => group.tab === activeTab),
    [activeTab],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const media = window.matchMedia(DESKTOP_GUIDE_MEDIA);
    const syncViewport = () => setDesktopSourceEnabled(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setActiveTab('all');
      setOpenItem(null);
      setOpenDesktopItems(new Set(PC_USAGE_GUIDE_DEFAULT_OPEN_KEYS));
      setDesktopSourceEnabled(false);
    }
  }, [open]);

  if (!open || !mounted) return null;

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const title = localizeGuideText(USAGE_GUIDE_COPY.title, locale);
  const closeLabel = localizeGuideText(USAGE_GUIDE_COPY.close, locale);
  const tabListLabel = localizeGuideText(USAGE_GUIDE_COPY.tabList, locale);

  const resetDesktopDisclosureState = (tab: GuideTab) => {
    setOpenDesktopItems(
      tab === 'all' || tab === 'finance'
        ? new Set(PC_USAGE_GUIDE_DEFAULT_OPEN_KEYS)
        : new Set(),
    );
  };

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={closeFromBackdrop}>
      <section
        className={`${styles.modal} ${desktopSourceEnabled ? sourceStyles.modal : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={GUIDE_TITLE_ID}
        data-pc-source-guide={desktopSourceEnabled ? 'true' : 'false'}
      >
        <div className={styles.topLine} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.iconBox}>
              <img src="/images/usage-guide-icon.svg" alt="" aria-hidden="true" />
            </span>
            <h2 id={GUIDE_TITLE_ID}>{title}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel} title={closeLabel}>
            <img src="/images/close.svg" width="16" height="16" alt="" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.tabShell}>
          <div className={styles.tabs} role="tablist" aria-label={tabListLabel}>
            {USAGE_GUIDE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => {
                  setActiveTab(tab.id);
                  setOpenItem(null);
                  resetDesktopDisclosureState(tab.id);
                  contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {localizeGuideText(tab.label, locale)}
              </button>
            ))}
          </div>
        </div>

        <div ref={contentRef} className={styles.content}>
          {visibleGroups.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`guide-group-${group.id}`}>
              <header className={styles.groupHeader}>
                <div className={styles.groupGlow} aria-hidden="true" />
                <div className={styles.groupLine} aria-hidden="true" />
                <h3 id={`guide-group-${group.id}`}>{localizeGuideText(group.title, locale)}</h3>
              </header>
              <div className={styles.items}>
                {group.items.map((guideItem, index) => {
                  const key = `${group.id}:${index}`;
                  const pcSourceItem = desktopSourceEnabled
                    ? PC_USAGE_GUIDE_SOURCE_BY_QUESTION[guideItem.question.th]
                    : undefined;
                  const expanded = pcSourceItem
                    ? openDesktopItems.has(key)
                    : openItem === key;

                  return (
                    <div key={key} className={styles.item}>
                      <button
                        type="button"
                        className={expanded
                          ? `${styles.itemButton} ${sourceStyles.itemButtonExpanded}`
                          : styles.itemButton}
                        aria-expanded={expanded}
                        onClick={() => {
                          if (pcSourceItem) {
                            setOpenDesktopItems((current) => toggleKey(current, key));
                            return;
                          }
                          setOpenItem(expanded ? null : key);
                        }}
                      >
                        <span>{localizeGuideText(guideItem.question, locale)}</span>
                        <svg className={expanded ? styles.chevronOpen : styles.chevron} viewBox="0 0 512 512" aria-hidden="true">
                          <path d="M256 294.1 383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127Z" />
                        </svg>
                      </button>
                      {expanded ? (
                        pcSourceItem
                          ? <PcSourceGuideAnswer item={pcSourceItem} />
                          : <div className={styles.answer}>{localizeGuideText(guideItem.answer, locale)}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function PcSourceGuideAnswer({ item }: { item: PcSourceGuideItem }) {
  return (
    <div className={`${styles.answer} ${sourceStyles.answer}`}>
      {item.steps.map((step, stepIndex) => (
        <div key={`${step.image}:${stepIndex}`} className={sourceStyles.step}>
          {step.bullet ? (
            <ul className={sourceStyles.list}>
              {step.lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderGuideParts(line)}</li>
              ))}
            </ul>
          ) : (
            <div className={sourceStyles.paragraphs}>
              {step.lines.map((line, lineIndex) => (
                <p key={lineIndex}>{renderGuideParts(line)}</p>
              ))}
            </div>
          )}
          <img
            className={sourceStyles.image}
            src={resolveLocalAssetOrSource(step.image, 'pc')}
            data-source-cdn={step.image}
            alt={step.alt}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              const image = event.currentTarget;
              if (image.dataset.cdnFallbackApplied === 'true') return;
              image.dataset.cdnFallbackApplied = 'true';
              image.src = step.image;
            }}
          />
        </div>
      ))}
    </div>
  );
}

function renderGuideParts(parts: readonly PcGuidePart[]) {
  return parts.map((part, index) => {
    const className = part.tone === 'danger'
      ? sourceStyles.danger
      : part.tone === 'success'
        ? sourceStyles.success
        : undefined;
    return part.strong ? (
      <strong key={`${part.text}:${index}`} className={className}>{part.text}</strong>
    ) : (
      <span key={`${part.text}:${index}`} className={className}>{part.text}</span>
    );
  });
}

function toggleKey(current: ReadonlySet<string>, key: string) {
  const next = new Set(current);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}
