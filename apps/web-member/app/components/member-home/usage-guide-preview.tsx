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

const PC_SOURCE_GUIDES = Object.entries(PC_USAGE_GUIDE_SOURCE_BY_QUESTION) as readonly [
  string,
  PcSourceGuideItem,
][];

export default function UsageGuidePreview({ mobile = false }: UsageGuidePreviewProps) {
  const { locale } = useMemberLocale();
  const useSourcePcGuide = !mobile && locale === 'th';

  return (
    <div className="shared-usage-guide-preview" data-shared-guide-preview-content="true">
      {mobile ? (
        <header className="v47-mobile-section-title">
          <span>
            <img src={V47_ASSETS.mobileFaq} alt="" aria-hidden="true" />
            <strong>Guide</strong>
          </span>
        </header>
      ) : (
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">
            <img src={V47_ASSETS.mobileFaq} alt="" />
          </span>
          <strong>{locale === 'en' ? 'Usage Guide' : 'คู่มือการใช้งาน'}</strong>
        </header>
      )}

      {useSourcePcGuide ? (
        <div className={styles.sourceGuide} data-pc-source-guide-preview="true">
          {PC_SOURCE_GUIDES.map(([question, guide]) => (
            <details key={question}>
              <summary>{question}</summary>
              <PcSourceGuidePanel guide={guide} />
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

function PcSourceGuidePanel({ guide }: { guide: PcSourceGuideItem }) {
  return (
    <div className={styles.panel}>
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