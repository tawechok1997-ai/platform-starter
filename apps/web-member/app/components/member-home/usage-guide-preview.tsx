'use client';

import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import { useMemberLocale } from '../../member-locale-provider';
import { HOME_GUIDE_PREVIEW, localizeGuideText } from './usage-guide-data';
import {
  PC_USAGE_GUIDE_SOURCE_BY_QUESTION,
  type PcGuidePart,
  type PcSourceGuideItem,
} from './usage-guide-pc-source-data';
import styles from './usage-guide-preview-pc.module.css';
import { V47_ASSETS } from './v47-asset-map';

type UsageGuidePreviewProps = {
  mobile?: boolean;
};

const SOURCE_GUIDES = Object.entries(PC_USAGE_GUIDE_SOURCE_BY_QUESTION) as readonly [
  string,
  PcSourceGuideItem,
][];

export default function UsageGuidePreview({ mobile = false }: UsageGuidePreviewProps) {
  const { locale } = useMemberLocale();
  const useSourceGuide = locale === 'th';

  return (
    <div
      className={`shared-usage-guide-preview ${mobile ? styles.mobileRoot : styles.root}`}
      data-shared-guide-preview-content="true"
      data-source-guide-viewport={mobile ? 'mobile' : 'desktop'}
    >
      {mobile ? (
        <header className={styles.mobileHeader}>
          <span className={styles.mobileHeaderIcon} aria-hidden="true">
            <img src={V47_ASSETS.mobileFaq} alt="" />
          </span>
          <strong>Guide</strong>
        </header>
      ) : (
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">
            <img src={V47_ASSETS.mobileFaq} alt="" />
          </span>
          <strong>{locale === 'en' ? 'Usage Guide' : 'คู่มือการใช้งาน'}</strong>
        </header>
      )}

      {useSourceGuide ? (
        <div
          className={mobile ? styles.mobileSourceGuide : styles.sourceGuide}
          data-source-guide-preview="true"
        >
          {SOURCE_GUIDES.map(([question, guide]) => (
            <details key={question} className={mobile ? styles.mobileDetails : undefined}>
              <summary className={mobile ? styles.mobileSummary : undefined}>
                <span>{question}</span>
                {mobile ? <GuideChevron /> : null}
              </summary>
              <SourceGuidePanel guide={guide} mobile={mobile} />
            </details>
          ))}
        </div>
      ) : (
        <>
          {HOME_GUIDE_PREVIEW.map((guideItem) => (
            <details key={guideItem.question.th}>
              <summary>{localizeGuideText(guideItem.question, locale)}</summary>
              <p>{localizeGuideText(guideItem.answer, locale)}</p>
            </details>
          ))}

          <button
            type="button"
            className={mobile ? 'v47-mobile-guide-more' : 'reference-guide-more'}
            data-open-usage-guide="true"
          >
            {locale === 'en' ? 'View all' : 'ดูทั้งหมด'}
          </button>
        </>
      )}
    </div>
  );
}

function SourceGuidePanel({ guide, mobile }: { guide: PcSourceGuideItem; mobile: boolean }) {
  return (
    <div className={`${styles.panel} ${mobile ? styles.mobilePanel : ''}`}>
      {guide.steps.map((step, stepIndex) => (
        <div key={`${step.image}:${stepIndex}`} className={styles.step}>
          {step.bullet ? (
            <ul className={styles.list}>
              {step.lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderGuideParts(line)}</li>
              ))}
            </ul>
          ) : (
            <div className={styles.paragraphs}>
              {step.lines.map((line, lineIndex) => (
                <p key={lineIndex}>{renderGuideParts(line)}</p>
              ))}
            </div>
          )}
          <img
            className={styles.image}
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

function GuideChevron() {
  return (
    <svg
      className={styles.mobileChevron}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path fill="none" d="M0 0h24v24H0z" />
      <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </svg>
  );
}

function renderGuideParts(parts: readonly PcGuidePart[]) {
  return parts.map((part, index) => {
    const className = part.tone === 'danger'
      ? styles.danger
      : part.tone === 'success'
        ? styles.success
        : undefined;

    return part.strong ? (
      <strong key={`${part.text}:${index}`} className={className}>{part.text}</strong>
    ) : (
      <span key={`${part.text}:${index}`} className={className}>{part.text}</span>
    );
  });
}
