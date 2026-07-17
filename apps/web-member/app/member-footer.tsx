'use client';

import type { TypedPublicSiteSettings } from './site-settings-types';

const BANKS = ['BBL', 'KBANK', 'KTB', 'ttb', 'SCB', 'BAY', 'KKP', 'GSB', 'TISCO', 'CIMB', 'LH', 'BAAC', 'EXIM', 'GHB', 'UOB', 'ICBC'];

export default function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const { website, contact } = settings;
  const company = contact.company_name || website.site_name;

  return (
    <footer className="member-footer">
      <section className="member-footer__payments" aria-label="วิธีการชำระเงิน">
        <h3>วิธีการชำระเงิน</h3>
        <div className="member-footer__bank-grid">
          {BANKS.map((bank) => <span key={bank} className="member-footer__bank">{bank}</span>)}
        </div>
      </section>

      <div className="member-footer__compliance">
        <section>
          <h4>ติดต่อเรา</h4>
          <div className="member-footer__badges">
            <a className="member-footer__badge member-footer__badge--line" href="/contact">LINE</a>
            <a className="member-footer__badge" href="/contact">Support</a>
          </div>
        </section>
        <section>
          <h4>รับผิดชอบในการเดิมพัน</h4>
          <div className="member-footer__badges">
            <span className="member-footer__badge">18+</span>
            <span className="member-footer__badge">GAMECARE</span>
            <span className="member-footer__badge">Be Gamble Aware</span>
          </div>
        </section>
        <section>
          <h4>ใบอนุญาตและใบรับรอง</h4>
          <div className="member-footer__badges">
            <span className="member-footer__badge">BMM</span>
            <span className="member-footer__badge">iTech Labs</span>
            <span className="member-footer__badge">iOVATION</span>
            <span className="member-footer__badge">Curaçao eGaming</span>
          </div>
        </section>
        <section>
          <h4>การรองรับและความปลอดภัยโดย</h4>
          <div className="member-footer__badges">
            <span className="member-footer__badge">Verified &amp; Secured</span>
            <span className="member-footer__badge">SSL</span>
          </div>
        </section>
      </div>

      <small className="member-footer__copyright">Copyright © {website.site_name || company}, All Rights Reserved.</small>
    </footer>
  );
}
