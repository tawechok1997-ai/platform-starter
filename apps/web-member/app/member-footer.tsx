'use client';

import Link from 'next/link';
import { memo, type SyntheticEvent } from 'react';
import { useMemberLocale } from './member-locale-provider';
import type { TypedPublicSiteSettings } from './site-settings-types';
import mobileFooterStyles from './member-footer-mobile-match.module.css';

const SOURCE_ROOT = '/assets/asset-pc/images';

const GAME_LINKS = [
  ['casino', '/browse/games?category=casino'],
  ['slot', '/browse/games?category=slot'],
  ['fishing', '/browse/games?category=fishing'],
  ['sport', '/browse/games?category=sport'],
  ['card', '/browse/games?category=card'],
  ['lottery', '/browse/games?category=lottery'],
] as const;

const INFO_LINKS = [
  ['promotions', '/promotions'],
  ['news', '/notifications'],
  ['activities', '/promotions'],
  ['vip', '/profile'],
  ['networkIncome', '/affiliate'],
  ['commissionIncome', '/affiliate'],
] as const;

const LICENSE_BADGES = [
  ['GC', `${SOURCE_ROOT}/footer/GC-icon%202.webp`],
  ['iTech Labs', `${SOURCE_ROOT}/footer/iTech.webp`],
  ['Gaming Labs', `${SOURCE_ROOT}/footer/GamingLab.webp`],
  ['BMM Testlabs', `${SOURCE_ROOT}/footer/BBM-Cert.webp`],
  ['Iovation', `${SOURCE_ROOT}/footer/Iovation.webp`],
] as const;

const SECURITY_BADGES = [
  ['GoDaddy', `${SOURCE_ROOT}/footer/GO%20DADDY.webp`],
  ['Security Group', `${SOURCE_ROOT}/footer/Group%2048102721.webp`],
] as const;

const RESPONSIBLE_BADGES = [
  ['18+', `${SOURCE_ROOT}/footer/18.webp`],
  ['Game Care', `${SOURCE_ROOT}/footer/gamecare.webp`],
  ['Be Gamble Aware', `${SOURCE_ROOT}/footer/be-gamble-aware.webp`],
] as const;

const LOCAL_BANKS = [
  'BBL',
  'KBANK',
  'KTB',
  'TTB',
  'SCB',
  'BAY',
  'KKP',
  'CIMBT',
  'TISCO',
  'UOBT',
  'TCD',
  'LHFG',
  'BAAC',
  'EXIM',
  'GSB',
  'GHB',
  'TMN',
].map((name) => ({ name, url: `${SOURCE_ROOT}/banks/TH/${name}.webp` }));

const FOOTER_COPY = {
  th: {
    description: `เว็บพนันออนไลน์ที่ดีที่สุด
พร้อมบริการลูกค้าทุกท่าน ตลอด 24 ชั่วโมง
มีเกมให้เลือกเล่นมากมาย
บาคาร่า รูเล็ต ไฮโล เสือมังกร สล็อตออนไลน์ กีฬาออนไลน์
แจ็คพอตแตกทุกวัน`,
    license: 'ใบอนุญาตและใบรับรอง',
    licenseNote: '(การันตีเกมลิขสิทธิ์แท้)',
    security: 'การรองรับและความปลอดภัยโดย',
    responsible: 'รับผิดชอบในการเดิมพัน',
    games: 'เกม',
    information: 'ข้อมูล',
    contact: 'ติดต่อเรา',
    contactAria: 'ติดต่อฝ่ายบริการผ่าน LINE',
    payments: 'วิธีการชำระเงิน',
    links: {
      casino: 'คาสิโน',
      slot: 'สล็อต',
      fishing: 'ตกปลา',
      sport: 'กีฬา',
      card: 'ไพ่',
      lottery: 'หวย',
      promotions: 'โปรโมชั่น',
      news: 'ข่าวสาร',
      activities: 'กิจกรรม',
      vip: 'ระดับสมาชิก VIP',
      networkIncome: 'รายได้จากเครือข่าย',
      commissionIncome: 'รายได้จากคอมมิชชั่น',
    },
  },
  en: {
    description: `A premium online gaming destination
with 24-hour customer support.
Choose from a wide range of games including
baccarat, roulette, hi-lo, slots and sports.
Daily jackpot opportunities.`,
    license: 'Licenses and certifications',
    licenseNote: '(Verified licensed games)',
    security: 'Security and platform protection',
    responsible: 'Responsible gaming',
    games: 'Games',
    information: 'Information',
    contact: 'Contact us',
    contactAria: 'Contact support via LINE',
    payments: 'Payment methods',
    links: {
      casino: 'Casino',
      slot: 'Slots',
      fishing: 'Fishing',
      sport: 'Sports',
      card: 'Cards',
      lottery: 'Lottery',
      promotions: 'Promotions',
      news: 'News',
      activities: 'Activities',
      vip: 'VIP membership',
      networkIncome: 'Network income',
      commissionIncome: 'Commission income',
    },
  },
} as const;

function sourceBrandName(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || /platform starter/i.test(normalized) ? 'NOAH345' : normalized;
}

function sourceDescription(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return !normalized || /แพลตฟอร์มสมาชิก|member platform starter|platform starter/i.test(normalized)
    ? fallback
    : normalized;
}

function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const { locale } = useMemberLocale();
  const copy = FOOTER_COPY[locale];
  const { website } = settings;
  const siteName = sourceBrandName(website.site_name);
  const description = sourceDescription(website.site_description, copy.description);

  return (
    <footer
      className={`member-footer member-footer--shared member-persistent-shell__footer ${mobileFooterStyles.root}`}
      data-locale={locale}
    >
      <div className="member-footer__main">
        <section className="member-footer__about">
          <h3>{siteName}</h3>
          <p>{description}</p>
        </section>

        <section className="member-footer__trust">
          <h3>
            <strong>{copy.license}</strong> <span>{copy.licenseNote}</span>
          </h3>
          <BadgeRow badges={LICENSE_BADGES} className="member-footer__trust-primary" />

          <div className="member-footer__trust-groups">
            <div className="member-footer__trust-group">
              <h3>{copy.security}</h3>
              <BadgeRow badges={SECURITY_BADGES} />
            </div>
            <div className="member-footer__trust-group">
              <h3>{copy.responsible}</h3>
              <BadgeRow badges={RESPONSIBLE_BADGES} />
            </div>
          </div>
        </section>

        <div className="member-footer__menus">
          <nav className="member-footer__links" aria-label={copy.games}>
            <h3>{copy.games}</h3>
            {GAME_LINKS.map(([key, href]) => (
              <Link key={key} href={href}>{copy.links[key]}</Link>
            ))}
          </nav>

          <nav className="member-footer__links" aria-label={copy.information}>
            <h3>{copy.information}</h3>
            {INFO_LINKS.map(([key, href]) => (
              <Link key={key} href={href}>{copy.links[key]}</Link>
            ))}
          </nav>
        </div>

        <section className="member-footer__contact">
          <h3>{copy.contact}</h3>
          <Link className="member-footer__contact-line" href="/contact" aria-label={copy.contactAria}>
            <img src={`${SOURCE_ROOT}/line.png`} alt="LINE" loading="lazy" onError={hideBrokenImage} />
          </Link>
        </section>
      </div>

      <section className="member-footer__payments" aria-label={copy.payments}>
        <h3>{copy.payments}</h3>
        <div className="member-footer__bank-grid">
          {LOCAL_BANKS.map((bank) => (
            <span key={bank.name} className="member-footer__bank" title={bank.name}>
              <img src={bank.url} alt={bank.name} loading="lazy" onError={hideBrokenImage} />
            </span>
          ))}
        </div>
      </section>

      <small className="member-footer__copyright">
        <img
          className="member-footer__copyright-logo"
          src="/reference-v6/logo.webp"
          alt="NOAH345"
          onError={hideBrokenImage}
        />
        <span>Copyright © NOAH345, All Rights Reserved.</span>
      </small>
    </footer>
  );
}

export default memo(MemberFooter);

const BadgeRow = memo(function BadgeRow({
  badges,
  className = '',
}: {
  badges: readonly (readonly [name: string, url: string])[];
  className?: string;
}) {
  return (
    <div className={`member-footer__trust-row${className ? ` ${className}` : ''}`}>
      {badges.map(([name, url]) => (
        <span key={name} className="member-footer__trust-badge" title={name}>
          <img src={url} alt={name} loading="lazy" onError={hideBrokenImage} />
        </span>
      ))}
    </div>
  );
});

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
