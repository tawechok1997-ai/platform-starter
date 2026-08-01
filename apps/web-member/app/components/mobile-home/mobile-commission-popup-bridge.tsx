'use client';

export default function MobileCommissionPopupBridge() {
  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        [data-mobile-popup-owner='commission-income'] {
          width: min(480px, 100%);
          max-height: calc(100dvh - max(32px, env(safe-area-inset-top) + env(safe-area-inset-bottom)));
          padding: 56px 16px 16px;
          gap: 24px;
          border-radius: 10px;
          background: linear-gradient(0deg, rgb(27 24 36) -5.86%, rgb(63 59 75) 104.05%);
          box-shadow: 0 1px 24px 4px rgb(90 90 90 / 20%);
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child {
          width: 100%;
          max-height: calc(100dvh - 104px);
          overflow-x: hidden;
          overflow-y: auto;
          scrollbar-width: none;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child::-webkit-scrollbar {
          display: none;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div {
          display: flex;
          width: 100%;
          min-width: 0;
          flex-direction: column;
          gap: 16px;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:first-child {
          position: relative;
          display: flex;
          width: 100%;
          min-height: 75px;
          padding: 8px 12px;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          overflow: hidden;
          border: 1px solid rgb(98 98 98 / 70%);
          border-radius: 7px;
          background: rgb(21 19 26 / 70%);
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:first-child > span {
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 20px;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:first-child > strong {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          line-height: 38px;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:first-child > strong::after {
          color: #757575;
          content: '↻';
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
        }

        [data-mobile-popup-owner='commission-income'] section {
          display: flex;
          width: 100%;
          min-width: 0;
          flex-direction: column;
          gap: 8px;
        }

        [data-mobile-popup-owner='commission-income'] section > h3,
        [data-mobile-popup-owner='commission-income'] section > h4 {
          margin: 0;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          line-height: 20px;
        }

        [data-mobile-popup-owner='commission-income'] section > input {
          width: 100%;
          height: 55px;
          padding: 0 12px;
          border: 1px solid rgb(49 47 57);
          border-radius: 6px;
          outline: 0;
          color: #fff;
          background: rgb(21 19 26);
          font-size: 14px;
          font-weight: 400;
          text-align: left;
        }

        [data-mobile-popup-owner='commission-income'] section > input:focus {
          border-color: #bb5bea;
        }

        [data-mobile-popup-owner='commission-income'] section > div:last-child {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        [data-mobile-popup-owner='commission-income'] section > div:last-child > button {
          min-width: 0;
          min-height: 45px;
          padding: 1px;
          border: 1px solid rgb(55 53 64);
          border-radius: 6px;
          color: #fff;
          background: rgb(21 19 26);
          font-size: 12px;
          font-weight: 400;
        }

        [data-mobile-popup-owner='commission-income'] section > div:last-child > button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:has(> button + button) {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:has(> button + button) > button {
          width: 100%;
          min-width: 0;
          min-height: 48px;
          border: 1px solid rgb(65 62 75);
          border-radius: 6px;
          color: rgb(107 111 119);
          background: rgb(21 19 26);
          font-size: 13px;
          font-weight: 600;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:has(> button + button) > button:last-child {
          color: #555;
          border-color: transparent;
          background: rgb(56 55 62);
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:has(> button + button) > button:last-child:not(:disabled) {
          color: #fff;
          border-color: #9a14bb;
          background: linear-gradient(180deg, #9700bd 0%, #5e0074 100%);
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:nth-last-child(2) {
          width: 100%;
          height: 1px;
          margin-top: 0;
          background: linear-gradient(180deg, #efd596 0%, #ccbc98 45.83%, #b7a47c 93.23%);
          opacity: .1;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:last-child {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #909090;
          font-size: 11px;
          line-height: 16px;
        }

        [data-mobile-popup-owner='commission-income'] > div:last-child > div > div:last-child button {
          padding: 0;
          border: 0;
          color: #7100bd;
          background: transparent;
          font: inherit;
          font-weight: 700;
        }
      }
    `}</style>
  );
}
