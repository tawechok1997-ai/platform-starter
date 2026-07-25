'use client';

import type { TypedPublicSiteSettings } from './site-settings-types';
import { REFERENCE_BANKS, REFERENCE_HOME_ASSETS, REFERENCE_TRUST_BADGES } from './components/reference-asset-catalog';

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

const SOURCE_DESCRIPTION = 'เว็บพนันออนไลน์ที่ดีที่สุด พร้อมบริการลูกค้าทุกท่าน ตลอด 24 ชั่วโมง มีเกมให้เลือกเล่นมากมาย บาคาร่า รูเล็ต ไฮโล เสือมังกร สล็อตออนไลน์ กีฬาออนไลน์ แจ็คพอตแตกทุกวัน';

function sourceBrandName(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || /platform starter/i.test(normalized) ? 'NOAH345' : normalized;
}

function sourceDescription(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || /แพลตฟอร์มสมาชิก|platform starter/i.test(normalized) ? SOURCE_DESCRIPTION : normalized;
}

export default function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const { website } = settings;
  const siteName = sourceBrandName(website.site_name);
  const description = sourceDescription(website.site_description);

  return (
    <footer className="member-footer">
      <div className="member-footer__main">
        <section className="member-footer__about">
          <img className="member-footer__about-logo" src="/reference-v6/logo.webp" alt={siteName} />
          <strong>{siteName}</strong>
          <p>{description}</p>
        </section>

        <section className="member-footer__trust">
          <h3>ใบอนุญาตและใบรับรอง (การันตีเกมลิขสิทธิ์แท้)</h3>
          <div className="member-footer__trust-grid">
            {REFERENCE_TRUST_BADGES.map((badge) => (
              <span key={badge.name} className="member-footer__trust-badge" title={badge.name}>
                <img src={badge.url} alt={badge.name} loading="lazy" />
              </span>
            ))}
          </div>
        </section>

        <nav className="member-footer__links" aria-label="เกม">
          <h3>เกม</h3>
          {GAME_LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>

        <nav className="member-footer__links" aria-label="ข้อมูล">
          <h3>ข้อมูล</h3>
          {INFO_LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>

        <section className="member-footer__contact">
          <h3>ติดต่อเรา</h3>
          <div className="member-footer__contact-list">
            <a className="member-footer__contact-line" href="/contact">
              <img src={REFERENCE_HOME_ASSETS.line} alt="LINE" loading="lazy" />
              <span>Support 24 ชั่วโมง</span>
            </a>
          </div>
          <div className="member-footer__responsible">
            <span>18+</span>
            <span>เล่นอย่างมีความรับผิดชอบ</span>
          </div>
        </section>
      </div>

      <section className="member-footer__payments" aria-label="วิธีการชำระเงิน">
        <h3>วิธีการชำระเงิน</h3>
        <div className="member-footer__bank-grid">
          {REFERENCE_BANKS.map((bank) => (
            <span key={bank.name} className="member-footer__bank" title={bank.name}>
              <img src={bank.url} alt={bank.name} loading="lazy" />
            </span>
          ))}
        </div>
      </section>

      <small className="member-footer__copyright">
        <img className="member-footer__copyright-logo" src="/reference-v6/logo.webp" alt="" aria-hidden="true" />
        <span>Copyright © {siteName}, All Rights Reserved.</span>
      </small>
    </footer>
  );
}
