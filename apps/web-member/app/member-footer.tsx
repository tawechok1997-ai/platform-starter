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
  ['คำถามที่พบบ่อย', '/guide'],
  ['สมัครสมาชิก', '/register'],
  ['เข้าสู่ระบบ', '/login'],
] as const;

export default function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const { website, contact } = settings;
  const company = contact.company_name || website.site_name;
  const siteName = website.site_name || company || 'NOAH345';
  const description = website.site_description || 'ศูนย์รวมเกมและกิจกรรมสำหรับสมาชิก พร้อมบริการตลอด 24 ชั่วโมง';

  return (
    <footer className="member-footer">
      <div className="member-footer__main">
        <section className="member-footer__about">
          <img className="member-footer__about-logo" src="/reference-v6/logo.webp" alt={siteName} />
          <strong>{siteName}</strong>
          <p>{description}</p>
          <p>ใช้งานง่าย รองรับทุกอุปกรณ์ และมีทีมบริการคอยดูแลสมาชิกตลอดวัน</p>
        </section>

        <section className="member-footer__trust">
          <h3>ใบอนุญาต ความปลอดภัย และการรับรอง</h3>
          <p className="member-footer__trust-copy">ระบบให้ความสำคัญกับความปลอดภัยของข้อมูล การใช้งานอย่างรับผิดชอบ และมาตรฐานการให้บริการ</p>
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
