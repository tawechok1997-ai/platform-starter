'use client';

import { useEffect } from 'react';

const COUPON_OWNER = '[data-mobile-popup-owner="coupon"]';

export default function MobileCouponPopupBridge() {
  useEffect(() => {
    const syncCouponPopup = () => {
      const dialog = document.querySelector<HTMLElement>(COUPON_OWNER);
      if (!dialog) return;

      dialog.dataset.mobileCouponSource = 'true';
      const field = dialog.querySelector<HTMLLabelElement>('label');
      const input = dialog.querySelector<HTMLInputElement>('input');
      if (!field || !input) return;

      input.maxLength = 5;
      input.name = 'รหัสคูปอง';
      input.autocomplete = 'off';
      input.setAttribute('aria-label', 'รหัสคูปอง');

      const syncValue = () => {
        field.dataset.hasValue = input.value.trim() ? 'true' : 'false';
      };

      if (field.dataset.couponBound !== 'true') {
        field.dataset.couponBound = 'true';
        input.addEventListener('input', syncValue);
      }
      syncValue();
    };

    syncCouponPopup();
    const observer = new MutationObserver(syncCouponPopup);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        ${COUPON_OWNER} {
          width: min(428px, calc(100vw - 32px));
          max-width: min(428px, calc(100vw - 32px));
          padding: 56px 16px 16px;
          gap: 24px;
        }

        ${COUPON_OWNER} > div:last-child {
          width: 100%;
          max-height: calc(100dvh - 104px);
          overflow: visible;
        }

        ${COUPON_OWNER} > div:last-child > div {
          display: flex;
          width: 100%;
          max-width: 396px;
          height: 100%;
          margin: 0 auto;
          padding: 16px;
          flex-direction: column;
          gap: 0;
          border-radius: 10px;
          background: rgb(37 32 51 / 35%);
          box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
          backdrop-filter: blur(40px);
        }

        ${COUPON_OWNER} > div:last-child > div > label {
          position: relative;
          display: flex;
          width: 100%;
          height: 40px;
          margin: 12px 0;
          padding: 0 16px 0 4px;
          flex-direction: row;
          align-items: center;
          gap: 0;
          border: 1px solid #757575;
          border-radius: 6px;
          color: #757575;
          background: rgb(21 19 26);
          cursor: text;
        }

        ${COUPON_OWNER} > div:last-child > div > label > span {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          display: block;
          padding: 0 8px;
          color: #757575;
          background: rgb(21 19 26);
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          pointer-events: none;
          transform-origin: left center;
          transition:
            transform 300ms cubic-bezier(.4, 0, .2, 1),
            color 300ms cubic-bezier(.4, 0, .2, 1),
            font-size 300ms cubic-bezier(.4, 0, .2, 1);
        }

        ${COUPON_OWNER} > div:last-child > div > label:focus-within,
        ${COUPON_OWNER} > div:last-child > div > label[data-has-value='true'] {
          border-color: #bb5bea;
        }

        ${COUPON_OWNER} > div:last-child > div > label:focus-within > span,
        ${COUPON_OWNER} > div:last-child > div > label[data-has-value='true'] > span {
          color: #bb5bea;
          font-size: 10px;
          transform: translateY(-20px);
        }

        ${COUPON_OWNER} > div:last-child > div > label > input {
          flex: 1;
          width: 0;
          height: 100%;
          min-width: 0;
          padding: 1px 8px;
          border: 0;
          outline: 0;
          color: #fff;
          background: transparent;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          box-shadow: none;
        }

        ${COUPON_OWNER} > div:last-child > div > label > input:focus {
          border: 0;
          outline: 0;
          box-shadow: none;
        }

        ${COUPON_OWNER} > div:last-child > div > button {
          width: 100%;
          height: 44px;
          min-height: 44px;
          margin-top: 20px;
          border: 0;
          border-radius: 6px;
          color: #fff;
          background: linear-gradient(165deg, rgb(148 79 232) -17.16%, rgb(118 0 168) 91.36%);
          font-size: 14px;
          font-weight: 600;
          box-shadow: none;
        }

        ${COUPON_OWNER} > div:last-child > div > button:disabled {
          color: rgb(85 85 85);
          background: rgb(56 55 62);
          opacity: 1;
          cursor: not-allowed;
        }

        ${COUPON_OWNER} > div:last-child > div > div[role='status'] {
          margin-top: 12px;
        }
      }

      @media (min-width: 360px) and (max-width: 900px) {
        ${COUPON_OWNER} > div:last-child > div > label {
          height: 56px;
        }

        ${COUPON_OWNER} > div:last-child > div > label > span {
          top: 15px;
        }

        ${COUPON_OWNER} > div:last-child > div > label:focus-within > span,
        ${COUPON_OWNER} > div:last-child > div > label[data-has-value='true'] > span {
          transform: translateY(-25px);
        }
      }
    `}</style>
  );
}
