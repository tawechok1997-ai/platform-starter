'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMemberLocale } from '../../member-locale-provider';
import { HOME_GUIDE_PREVIEW, localizeGuideText } from './usage-guide-data';
import { V47_ASSETS } from './v47-asset-map';

type GuideTarget = {
  element: HTMLElement;
  mobile: boolean;
};

const TARGET_SELECTOR = '.reference-guide, .v47-mobile-guide';
const PREVIEW_MARKER = 'data-shared-guide-preview-content';
const HIDDEN_MARKER = 'data-shared-guide-preview-hidden';

function discoverTargets(): GuideTarget[] {
  return Array.from(document.querySelectorAll<HTMLElement>(TARGET_SELECTOR)).map((element) => ({
    element,
    mobile: element.classList.contains('v47-mobile-guide'),
  }));
}

function sameTargets(left: GuideTarget[], right: GuideTarget[]) {
  return left.length === right.length && left.every((item, index) => (
    item.element === right[index]?.element && item.mobile === right[index]?.mobile
  ));
}

function hideLegacyPreview(target: HTMLElement) {
  Array.from(target.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.hasAttribute(PREVIEW_MARKER)) return;
    if (!child.hasAttribute(HIDDEN_MARKER)) {
      child.dataset.sharedGuideOriginalDisplay = child.style.display;
      child.setAttribute(HIDDEN_MARKER, 'true');
    }
    child.style.setProperty('display', 'none', 'important');
    child.setAttribute('aria-hidden', 'true');
  });
}

function restoreLegacyPreview(target: HTMLElement) {
  target.querySelectorAll<HTMLElement>(`:scope > [${HIDDEN_MARKER}]`).forEach((child) => {
    const originalDisplay = child.dataset.sharedGuideOriginalDisplay ?? '';
    if (originalDisplay) child.style.display = originalDisplay;
    else child.style.removeProperty('display');
    delete child.dataset.sharedGuideOriginalDisplay;
    child.removeAttribute(HIDDEN_MARKER);
    child.removeAttribute('aria-hidden');
  });
}

export default function UsageGuidePreviewController() {
  const { locale } = useMemberLocale();
  const [targets, setTargets] = useState<GuideTarget[]>([]);

  useEffect(() => {
    const syncTargets = () => {
      const nextTargets = discoverTargets();
      nextTargets.forEach(({ element }) => hideLegacyPreview(element));
      setTargets((current) => sameTargets(current, nextTargets) ? current : nextTargets);
    };

    syncTargets();
    const observer = new MutationObserver(syncTargets);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      discoverTargets().forEach(({ element }) => restoreLegacyPreview(element));
    };
  }, []);

  return (
    <>
      {targets.map(({ element, mobile }, index) => createPortal(
        <div className="shared-usage-guide-preview" data-shared-guide-preview-content="true">
          {mobile ? (
            <header className="v47-mobile-section-title">
              <span>
                <img src={V47_ASSETS.openGold} alt="" aria-hidden="true" />
                <strong>Guide</strong>
              </span>
            </header>
          ) : (
            <header className="reference-panel-heading">
              <span className="reference-heading-icon" aria-hidden="true">
                <img src={V47_ASSETS.openGold} alt="" />
              </span>
              <strong>Guide</strong>
            </header>
          )}

          {HOME_GUIDE_PREVIEW.map((guideItem, itemIndex) => (
            <details key={itemIndex}>
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
        </div>,
        element,
        `${mobile ? 'mobile' : 'desktop'}-guide-preview-${index}`,
      ))}
    </>
  );
}
