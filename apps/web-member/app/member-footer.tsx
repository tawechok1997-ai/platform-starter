'use client';

import type { TypedPublicSiteSettings } from './site-settings-types';
import { REFERENCE_BANKS, REFERENCE_HOME_ASSETS, REFERENCE_TRUST_BADGES } from './components/reference-asset-catalog';

export default function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const { website, contact } = settings;
  const company = contact.company_name || website.site_name;

  return (
    <footer className="member-footer">
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

      <div className="member-footer__compliance">
        <section>
          <h4>ติดต่อเรา</h4>
          <div className="member-footer__badges">
            <a className="member-footer__badge member-footer__badge--line" href="/contact">
              <img className="member-footer__line-image" src={REFERENCE_HOME_ASSETS.line} alt="LINE" loading="lazy" />
            </a>
            <a className="member-footer__badge" href="/contact">Support 24 ชั่วโมง</a>
          </div>
        </section>

        <section>
          <h4>รับผิดชอบในการเดิมพัน</h4>
          <div className="member-footer__badges">
            <span className="member-footer__badge">18+</span>
            <span className="member-footer__badge">เล่นอย่างมีความรับผิดชอบ</span>
          </div>
        </section>

        <section className="member-footer__trust-section">
          <h4>ใบอนุญาต ความปลอดภัย และการรับรอง</h4>
          <div className="member-footer__trust-grid">
            {REFERENCE_TRUST_BADGES.map((badge) => (
              <span key={badge.name} className="member-footer__trust-badge" title={badge.name}>
                <img src={badge.url} alt={badge.name} loading="lazy" />
              </span>
            ))}
          </div>
        </section>
      </div>

      <small className="member-footer__copyright">Copyright © {website.site_name || company}, All Rights Reserved.</small>
    </footer>
  );
}
