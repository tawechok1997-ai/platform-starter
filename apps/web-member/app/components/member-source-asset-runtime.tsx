'use client';

import { useEffect } from 'react';

const AVATAR_SOURCE_BASE = '/assets/asset-pc/images/avatar';
const VIP_TIER_SOURCE_BASE = '/assets/asset-pc/FEZX/grouptypes';
const SOURCE_ICON_BASE = '/assets/asset-pc/source-icons';
const MENU_ICON_BASE = '/assets/asset-pc/images';
const CLOSE_ICON = '/images/close.svg';
const SOURCE_ASSET_TRIGGER_SELECTOR = [
  '.public-member-profile-trigger',
  '.public-member-profile-avatar-button',
  '.member-profile-detail-avatar-grid button',
  '.public-member-income-row a',
  '.public-member-referral-row',
  '.public-member-menu-grid a',
  '.member-vip-tier-step button',
].join(',');

const VIP_TIER_ASSETS = new Map([
  ['c005cd08-59f6-485f-8ee2-db342d509aa5', `${VIP_TIER_SOURCE_BASE}/c005cd08-59f6-485f-8ee2-db342d509aa5.png`],
  ['36eb82e4-63aa-49ac-aa07-b075b0e91ca4', `${VIP_TIER_SOURCE_BASE}/36eb82e4-63aa-49ac-aa07-b075b0e91ca4.png`],
]);

const BENEFIT_ICON_BY_LABEL = new Map([
  ['ฝ่ายบริการลูกค้าพิเศษ รายบุคคล', `${SOURCE_ICON_BASE}/customer-service-special.svg`],
  ['Dedicated personal support', `${SOURCE_ICON_BASE}/customer-service-special.svg`],
  ['ยอดถอนสูงสุดต่อวัน', `${SOURCE_ICON_BASE}/max-withdrawal.svg`],
  ['Maximum daily withdrawal', `${SOURCE_ICON_BASE}/max-withdrawal.svg`],
  ['สิทธิ์เข้าร่วมกิจกรรมต่างๆ', `${SOURCE_ICON_BASE}/activities.svg`],
  ['Access to special activities', `${SOURCE_ICON_BASE}/activities.svg`],
]);

export default function MemberSourceAssetRuntime() {
  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;
    let fallbackTimer = 0;

    const patchDocument = () => {
      patchAvatars(document);
      patchVipTiers(document);
      patchVipBenefits(document);
      patchIncomePopup(document);
    };

    const schedulePatch = () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallbackTimer);
      firstFrame = window.requestAnimationFrame(() => {
        patchDocument();
        secondFrame = window.requestAnimationFrame(patchDocument);
      });
      fallbackTimer = window.setTimeout(patchDocument, 120);
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(SOURCE_ASSET_TRIGGER_SELECTOR)) schedulePatch();
    };

    patchDocument();
    document.addEventListener('click', handleClick, true);
    window.addEventListener('member-source-assets-refresh', schedulePatch);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('member-source-assets-refresh', schedulePatch);
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}

function patchAvatars(root: ParentNode) {
  for (const image of root.querySelectorAll<HTMLImageElement>('img[src*="/images/avatar/"]')) {
    const source = image.getAttribute('src') ?? '';
    const match = source.match(/^\/images\/avatar\/(\d{1,2})\.webp(?:\?.*)?$/);
    if (!match) continue;
    const avatar = Number(match[1]);
    if (!Number.isInteger(avatar) || avatar < 1 || avatar > 15) continue;
    const correctSource = `${AVATAR_SOURCE_BASE}/${avatar}.webp`;
    if (source !== correctSource) image.setAttribute('src', correctSource);
  }
}

function patchVipTiers(root: ParentNode) {
  for (const image of root.querySelectorAll<HTMLImageElement>('.member-vip-tier-image')) {
    const source = image.getAttribute('src') ?? '';
    const assetId = Array.from(VIP_TIER_ASSETS.keys()).find((id) => source.includes(id));
    if (!assetId) continue;
    const correctSource = VIP_TIER_ASSETS.get(assetId);
    if (correctSource && source !== correctSource) image.setAttribute('src', correctSource);
  }
}

function patchVipBenefits(root: ParentNode) {
  for (const item of root.querySelectorAll<HTMLElement>('.member-vip-benefit-item')) {
    const label = item.querySelector('p')?.textContent?.trim() ?? '';
    const source = BENEFIT_ICON_BY_LABEL.get(label);
    const image = item.querySelector<HTMLImageElement>('img');
    if (source && image && image.getAttribute('src') !== source) image.setAttribute('src', source);
  }
}

function patchIncomePopup(root: ParentNode) {
  for (const popup of root.querySelectorAll<HTMLElement>('.member-income-safe-popup')) {
    const title = popup.querySelector('header h2')?.textContent?.trim().toLowerCase() ?? '';
    const titleIcon = title.includes('เครือข่าย') || title.includes('network')
      ? `${MENU_ICON_BASE}/รายได้ตากเครือข่าย.png`
      : title.includes('คอมมิชชั่น') || title.includes('commission')
        ? `${MENU_ICON_BASE}/รายได้จากคอมมิชชั้น.png`
        : title.includes('คูปอง') || title.includes('coupon')
          ? `${MENU_ICON_BASE}/คูปอง.png`
          : '';

    const iconSlot = popup.querySelector<HTMLElement>('header > div > span');
    if (titleIcon && iconSlot && iconSlot.dataset.sourceAsset !== titleIcon) {
      const image = document.createElement('img');
      image.src = titleIcon;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      iconSlot.replaceChildren(image);
      iconSlot.classList.add('member-source-title-icon');
      iconSlot.dataset.sourceAsset = titleIcon;
    }

    const closeButton = popup.querySelector<HTMLButtonElement>('header > button');
    if (closeButton && closeButton.dataset.sourceAsset !== CLOSE_ICON) {
      const image = document.createElement('img');
      image.src = CLOSE_ICON;
      image.alt = '';
      image.className = 'member-source-close-icon';
      image.setAttribute('aria-hidden', 'true');
      closeButton.replaceChildren(image);
      closeButton.dataset.sourceAsset = CLOSE_ICON;
    }
  }
}
