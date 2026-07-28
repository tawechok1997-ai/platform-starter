'use client';

import { usePathname } from 'next/navigation';
import type { SyntheticEvent } from 'react';
import type { TypedPublicSiteSettings } from './site-settings-types';

const SOURCE_ROOT = '/assets/asset-pc/images';

const GAME_LINKS = [
  ['คาสิโน', '/games?category=casino'],
  ['สล็อต', '/games?category=slot'],
  ['ยิงปลา', '/games?category=fishing'],
  ['กีฬา', '/games?category=sport'],
  ['ไพ่', '/games?category=card'],
  ['หวย', '/games?category=lottery'],
] as const;

const INFO_LINKS = [
  ['โปรโมชั่น', '/promotions'],
  ['ข่าวสาร', '/notifications'],
  ['กิจกรรม', '/promotions'],
  ['ระดับสมาชิก VIP', '/profile'],
  ['รายได้จากเครือข่าย', '/affiliate'],
  ['รายได้จากคอมมิชชั่น', '/affiliate'],
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

const LOCAL_BANKS = ['BAAC', 'BAY', 'BBL', 'CIMBT', 'EXIM', 'GHB', 'GSB', 'KBANK', 'KKP', 'KTB', 'LHFG', 'SCB', 'TCD', 'TISCO', 'TMN', 'TTB']
  .map((name) => ({ name, url: `${SOURCE_ROOT}/banks/TH/${name}.webp` }));

const SOURCE_DESCRIPTION = `เว็บพนันออนไลน์ที่ดีที่สุด
พร้อมบริการลูกค้าทุกท่าน ตลอด 24 ชั่วโมง
มีเกมให้เลือกเล่นมากมาย
บาคาร่า รูเล็ต ไฮโล เสือมังกร สล็อตออนไลน์ กีฬาออนไลน์
แจ็คพอตแตกทุกวัน`;

function sourceBrandName(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || /platform starter/i.test(normalized) ? 'NOAH345' : normalized;
}

function sourceDescription(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || /แพลตฟอร์มสมาชิก|member platform starter|platform starter/i.test(normalized)
    ? SOURCE_DESCRIPTION
    : normalized;
}

export default function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const pathname = usePathname() ?? '/';
  const isHomeRoute = pathname === '/';
  const { website } = settings;
  const siteName = sourceBrandName(website.site_name);
  const description = sourceDescription(website.site_description);

  return (
    <footer className={`member-footer ${isHomeRoute ? 'member-footer--home' : 'member-footer--secondary'}`}>
      <div className="member-footer__main">
        <section className="member-footer__about">
          <h3>{siteName}</h3>
          <p>{description}</p>
        </section>

        <section className="member-footer__trust">
          <h3><strong>ใบอนุญาตและใบรับรอง</strong> <span>(การันตีเกมลิขสิทธิ์แท้)</span></h3>
          <BadgeRow badges={LICENSE_BADGES} className="member-footer__trust-primary" />

          <div className="member-footer__trust-groups">
            <div className="member-footer__trust-group">
              <h3>การรองรับและความปลอดภัยโดย</h3>
              <BadgeRow badges={SECURITY_BADGES} />
            </div>
            <div className="member-footer__trust-group">
              <h3>รับผิดชอบในการเดิมพัน</h3>
              <BadgeRow badges={RESPONSIBLE_BADGES} />
            </div>
          </div>
        </section>

        <div className="member-footer__menus">
          <nav className="member-footer__links" aria-label="เกม">
            <h3>เกม</h3>
            {GAME_LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </nav>

          <nav className="member-footer__links" aria-label="ข้อมูล">
            <h3>ข้อมูล</h3>
            {INFO_LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </nav>
        </div>

        <section className="member-footer__contact">
          <h3>ติดต่อเรา</h3>
          <a className="member-footer__contact-line" href="/contact" aria-label="ติดต่อฝ่ายบริการผ่าน LINE">
            <img src={`${SOURCE_ROOT}/line.png`} alt="LINE" loading="lazy" onError={hideBrokenImage} />
          </a>
        </section>
      </div>

      {isHomeRoute && <div className="member-footer__separator" aria-hidden="true" />}

      <section className="member-footer__payments" aria-label="วิธีการชำระเงิน">
        <h3>วิธีการชำระเงิน</h3>
        <div className="member-footer__bank-grid">
          {LOCAL_BANKS.map((bank) => (
            <span key={bank.name} className="member-footer__bank" title={bank.name}>
              <img src={bank.url} alt={bank.name} loading="lazy" onError={hideBrokenImage} />
            </span>
          ))}
        </div>
      </section>

      <small className="member-footer__copyright">
        <img className="member-footer__copyright-logo" src="/reference-v6/logo.webp" alt="NOAH345" onError={hideBrokenImage} />
        <span>Copyright © noah345.shop, All Rights Reserved.</span>
      </small>
    </footer>
  );
}

function BadgeRow({ badges, className = '' }: {
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
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
