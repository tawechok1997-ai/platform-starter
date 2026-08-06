'use client';

import { useRouter } from 'next/navigation';
import MobileMemberPromotionsLivePage from '../../../components/mobile-home/mobile-member-promotions-live-page';
import { useMobilePromotionsSource } from '../../../components/mobile-home/use-mobile-member-content-sources';

export default function MobilePromotionsRoute() {
  const router = useRouter();
  const { payload, loading, error } = useMobilePromotionsSource();

  return (
    <>
      <MobileMemberPromotionsLivePage
        payload={payload}
        loading={loading}
        error={error}
        onBack={() => {
          if (window.history.length > 1) router.back();
          else router.replace('/');
        }}
      />
      <style jsx global>{`
        [data-mobile-member-page='promotions'] {
          background: #141019 !important;
        }

        [data-mobile-member-page='promotions'] > header {
          height: 48px !important;
          padding-inline: 8px !important;
          background: #171422 !important;
        }

        [data-mobile-member-page='promotions'] > header h1 {
          font-size: 16px !important;
          line-height: 20px !important;
        }

        [data-mobile-member-page='promotions'] > nav {
          top: 48px !important;
          padding-inline: 24px !important;
          background: #171422 !important;
        }

        [data-mobile-member-page='promotions'] > nav > div {
          height: 48px !important;
          gap: 8px !important;
        }

        [data-mobile-member-page='promotions'] > nav button {
          height: 28px !important;
          padding-inline: 12px !important;
          font-size: 11px !important;
          line-height: 16px !important;
        }

        [data-mobile-member-page='promotions'] > section {
          padding: 16px 12px calc(46px + env(safe-area-inset-bottom)) !important;
        }

        [data-mobile-member-page='promotions'] > section > div {
          min-height: 220px !important;
          padding: 10px 8px !important;
          gap: 10px !important;
          border: 1px solid #413e4b !important;
          border-radius: 6px !important;
          background: linear-gradient(180deg, rgb(63 59 75 / 64%), rgb(27 24 36 / 70%)) !important;
        }

        [data-mobile-member-page='promotions'] > section > div > article {
          border: 1px solid rgb(109 101 124 / 42%) !important;
          border-radius: 6px !important;
          background: #17141d !important;
          box-shadow: 0 0 7px rgb(255 255 255 / 20%) !important;
        }

        [data-mobile-member-page='promotions'] > section > div > article > button:first-child img {
          min-height: 126px !important;
          max-height: 154px !important;
          aspect-ratio: 2.15 / 1 !important;
          object-fit: cover !important;
        }

        [data-mobile-member-page='promotions'] > section > div > article > div {
          padding: 7px 10px 6px !important;
          gap: 5px !important;
        }

        [data-mobile-member-page='promotions'] > section > div > article > div > strong {
          font-size: 12px !important;
          font-weight: 600 !important;
          line-height: 16px !important;
        }

        [data-mobile-member-page='promotions'] > section > div > article > div > div:last-child {
          min-height: 18px !important;
          gap: 8px !important;
        }

        [data-mobile-member-page='promotions'] > section > div > article > div > div:last-child span,
        [data-mobile-member-page='promotions'] > section > div > article > div > div:last-child button {
          font-size: 10px !important;
          line-height: 15px !important;
        }

        @media (max-width: 359px) {
          [data-mobile-member-page='promotions'] > nav {
            padding-inline: 12px !important;
          }
          [data-mobile-member-page='promotions'] > section {
            padding-inline: 8px !important;
          }
        }
      `}</style>
    </>
  );
}
