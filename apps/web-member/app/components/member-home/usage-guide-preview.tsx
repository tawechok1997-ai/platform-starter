'use client';

import { useMemberLocale } from '../../member-locale-provider';
import { HOME_GUIDE_PREVIEW, localizeGuideText } from './usage-guide-data';
import { V47_ASSETS } from './v47-asset-map';

type UsageGuidePreviewProps = {
  mobile?: boolean;
};

export default function UsageGuidePreview({ mobile = false }: UsageGuidePreviewProps) {
  const { locale } = useMemberLocale();

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
        <header className="reference-panel-heading">
          <span className="reference-heading-icon" aria-hidden="true">
            <img src={V47_ASSETS.mobileFaq} alt="" />
          </span>
          <strong>Guide</strong>
        </header>
      )}

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
    </div>
  );
}
