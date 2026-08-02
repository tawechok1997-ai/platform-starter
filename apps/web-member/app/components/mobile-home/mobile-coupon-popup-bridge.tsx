'use client';

import { useEffect } from 'react';

const COUPON_OWNER = '[data-mobile-popup-owner="coupon"]';
const COUPON_WIDTH = 'min(396px, calc(100vw - 32px))';

export default function MobileCouponPopupBridge() {
  useEffect(() => {
    const syncCouponPopup = () => {
      const dialog = document.querySelector<HTMLElement>(COUPON_OWNER);
      if (!dialog) return;

      dialog.dataset.mobileCouponSource = 'true';
      dialog.style.setProperty('box-sizing', 'border-box', 'important');
      dialog.style.setProperty('width', COUPON_WIDTH, 'important');
      dialog.style.setProperty('min-width', 'min(288px, calc(100vw - 32px))', 'important');
      dialog.style.setProperty('max-width', COUPON_WIDTH, 'important');
      dialog.style.setProperty('height', 'auto', 'important');
      dialog.style.setProperty('transform', 'none', 'important');
      dialog.style.setProperty('scale', 'none', 'important');
      dialog.style.setProperty('zoom', '1', 'important');

      const content = dialog.querySelector<HTMLElement>(':scope > div:last-child');
      const form = content?.firstElementChild instanceof HTMLElement
        ? content.firstElementChild
        : null;
      const field = dialog.querySelector<HTMLLabelElement>('label');
      const input = dialog.querySelector<HTMLInputElement>('input');
      const submit = form?.querySelector<HTMLButtonElement>(':scope > button');

      content?.style.setProperty('width', '100%', 'important');
      content?.style.setProperty('min-width', '0', 'important');
      content?.style.setProperty('max-width', 'none', 'important');
      content?.style.setProperty('height', 'auto', 'important');

      form?.style.setProperty('box-sizing', 'border-box', 'important');
      form?.style.setProperty('width', '100%', 'important');
      form?.style.setProperty('min-width', '0', 'important');
      form?.style.setProperty('max-width', 'none', 'important');
      form?.style.setProperty('height', 'auto', 'important');
      form?.style.setProperty('transform', 'none', 'important');

      if (!field || !input) return;

      input.maxLength = 5;
      input.name = 'รหัสคูปอง';
      input.autocomplete = 'off';
      input.inputMode = 'text';
      input.setAttribute('aria-label', 'รหัสคูปอง');

      const syncValue = () => {
        field.dataset.hasValue = input.value.trim() ? 'true' : 'false';
      };

      if (field.dataset.couponBound !== 'true') {
        field.dataset.couponBound = 'true';
        input.addEventListener('input', syncValue);
      }

      submit?.setAttribute('data-mobile-coupon-submit', 'true');
      syncValue();
    };

    syncCouponPopup();
    const observer = new MutationObserver(syncCouponPopup);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', syncCouponPopup, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncCouponPopup);
    };
  }, []);

  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        ${COUPON_OWNER} {
          box-sizing: border-box !important;
          width: ${COUPON_WIDTH} !important;
          min-width: min(288px, calc(100vw - 32px)) !important;
          max-width: ${COUPON_WIDTH} !important;
          height: auto !important;
          max-height: calc(100dvh - 32px) !important;
          padding: 56px 16px 16px !important;
          gap: 16px !important;
          overflow: hidden !important;
          transform: none !important;
          scale: none !important;
          zoom: 1 !important;
          direction: ltr;
          writing-mode: horizontal-tb;
        }

        ${COUPON_OWNER} > div:last-child {
          box-sizing: border-box;
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          height: auto !important;
          max-height: calc(100dvh - 104px);
          overflow-x: hidden;
          overflow-y: auto;
        }

        ${COUPON_OWNER} > div:last-child > div {
          display: flex !important;
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          height: auto !important;
          margin: 0 !important;
          padding: 16px !important;
          flex-direction: column;
          gap: 12px !important;
          border: 1px solid rgb(98 98 98 / 45%);
          border-radius: 10px;
          background: linear-gradient(180deg, rgb(37 32 51 / 92%), rgb(21 19 26 / 92%));
          box-shadow: 0 10px 30px rgb(0 0 0 / 28%);
          backdrop-filter: blur(24px);
          transform: none !important;
          direction: ltr;
          writing-mode: horizontal-tb;
        }

        ${COUPON_OWNER} > div:last-child > div > label {
          position: relative;
          display: flex;
          box-sizing: border-box;
          width: 100% !important;
          min-width: 0;
          height: 48px;
          margin: 0;
          padding: 0 12px;
          flex-direction: row;
          align-items: center;
          gap: 0;
          border: 1px solid #757575;
          border-radius: 7px;
          color: #9f9aa8;
          background: rgb(21 19 26);
          cursor: text;
          direction: ltr;
          writing-mode: horizontal-tb;
        }

        ${COUPON_OWNER} > div:last-child > div > label > span {
          position: absolute;
          top: 13px;
          left: 12px;
          z-index: 2;
          display: block;
          max-width: calc(100% - 24px);
          padding: 0 6px;
          overflow: hidden;
          color: #8f8997;
          background: rgb(21 19 26);
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          text-overflow: ellipsis;
          white-space: nowrap;
          pointer-events: none;
          transform-origin: left center;
          transition: transform 180ms ease, color 180ms ease, font-size 180ms ease;
        }

        ${COUPON_OWNER} > div:last-child > div > label:focus-within,
        ${COUPON_OWNER} > div:last-child > div > label[data-has-value='true'] {
          border-color: #bb5bea;
          box-shadow: 0 0 0 1px rgb(187 91 234 / 14%);
        }

        ${COUPON_OWNER} > div:last-child > div > label:focus-within > span,
        ${COUPON_OWNER} > div:last-child > div > label[data-has-value='true'] > span {
          color: #d79cf2;
          font-size: 10px;
          transform: translateY(-24px);
        }

        ${COUPON_OWNER} > div:last-child > div > label > input {
          box-sizing: border-box;
          width: 100% !important;
          min-width: 0;
          height: 100%;
          padding: 2px 6px 0;
          border: 0;
          outline: 0;
          color: #fff;
          background: transparent;
          font-size: 16px;
          font-weight: 700;
          line-height: 22px;
          letter-spacing: .08em;
          text-align: left;
          text-transform: uppercase;
          direction: ltr;
          unicode-bidi: plaintext;
          writing-mode: horizontal-tb;
          box-shadow: none;
        }

        ${COUPON_OWNER} > div:last-child > div > label > input:focus {
          border: 0;
          outline: 0;
          box-shadow: none;
        }

        ${COUPON_OWNER} > div:last-child > div > button,
        ${COUPON_OWNER} [data-mobile-coupon-submit='true'] {
          box-sizing: border-box;
          width: 100% !important;
          min-width: 0;
          height: 48px;
          min-height: 48px;
          margin: 4px 0 0 !important;
          border: 0;
          border-radius: 7px;
          color: #fff;
          background: linear-gradient(165deg, rgb(148 79 232) -17.16%, rgb(118 0 168) 91.36%);
          font-size: 15px;
          font-weight: 700;
          line-height: 22px;
          box-shadow: 0 5px 14px rgb(118 0 168 / 28%);
          transform: none !important;
        }

        ${COUPON_OWNER} > div:last-child > div > button:disabled,
        ${COUPON_OWNER} [data-mobile-coupon-submit='true']:disabled {
          color: rgb(112 108 118);
          background: rgb(56 55 62);
          box-shadow: none;
          opacity: 1;
          cursor: not-allowed;
        }

        ${COUPON_OWNER} > div:last-child > div > div[role='status'] {
          width: 100%;
          margin: 0;
        }
      }

      @media (min-width: 360px) and (max-width: 900px) {
        ${COUPON_OWNER} > div:last-child > div > label {
          height: 56px;
        }

        ${COUPON_OWNER} > div:last-child > div > label > span {
          top: 17px;
        }

        ${COUPON_OWNER} > div:last-child > div > label:focus-within > span,
        ${COUPON_OWNER} > div:last-child > div > label[data-has-value='true'] > span {
          transform: translateY(-28px);
        }
      }
    `}</style>
  );
}
