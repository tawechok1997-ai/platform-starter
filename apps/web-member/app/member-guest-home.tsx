'use client';

import type { MemberFeatureFlags } from './site-settings';
import { MemberIcon } from './components/member-icon';

type MemberGuestHomeProps = {
  siteName: string;
  description: string;
  logoUrl: string;
  features: MemberFeatureFlags;
};

const guestCategories = [
  ['casino', 'คาสิโน', '/games?category=casino', 'games'],
  ['slot', 'สล็อต', '/games?category=slot', 'bonus'],
  ['fishing', 'ตกปลา', '/games?category=fishing', 'games'],
  ['sport', 'กีฬา', '/games?category=sport', 'vip'],
] as const;

export default function MemberGuestHome({ siteName, description, logoUrl, features }: MemberGuestHomeProps) {
  return (
    <main className="member-guest-home">
      <section className="member-guest-home__hero">
        <div className="member-guest-home__brand">
          {logoUrl && <img src={logoUrl} alt="" aria-hidden="true" />}
          <div>
            <strong>{siteName}</strong>
            <span>{description}</span>
          </div>
        </div>

        <div className="member-guest-home__welcome">
          <p className="member-guest-home__eyebrow">ยินดีต้อนรับ</p>
          <h1>เข้าสู่ระบบเพื่อเริ่มใช้งาน</h1>
          <p>ดูหน้าเว็บและหมวดหมู่ได้ก่อน ส่วนเกม กระเป๋าเงิน และข้อมูลบัญชียังคงล็อกจนกว่าจะเข้าสู่ระบบ</p>
        </div>

        <div className="member-guest-home__auth" aria-label="เข้าสู่ระบบหรือสมัครสมาชิก">
          {features.login && <a href="/login" className="member-login-button member-login-button--guest">เข้าสู่ระบบ</a>}
          {features.registration && <a href="/register" className="member-register-button member-register-button--guest">สมัครสมาชิก</a>}
        </div>
      </section>

      <section className="member-guest-home__categories" aria-label="ตัวอย่างหมวดหมู่เกม">
        <div className="member-guest-home__section-head">
          <div>
            <small>หมวดหมู่</small>
            <h2>เลือกดูเกม</h2>
          </div>
          <span>เข้าสู่ระบบเพื่อเล่น</span>
        </div>
        <div className="member-guest-home__category-grid">
          {guestCategories.map(([key, label, href, icon]) => (
            <a key={key} href={`/login?next=${encodeURIComponent(href)}`} className="member-guest-home__category member-locked-action">
              <span><MemberIcon name={icon} /></span>
              <strong>{label}</strong>
              <small>ล็อกอยู่</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
