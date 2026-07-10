'use client';

import type { TypedPublicSiteSettings } from './site-settings-types';

export default function MemberFooter({ settings }: { settings: TypedPublicSiteSettings }) {
  const { website, contact } = settings;
  const siteName = website.site_name;
  const description = website.site_description;
  const company = contact.company_name || siteName;
  const supportHours = contact.support_hours || 'ให้บริการทุกวัน';
  const phone = contact.phone || '';
  const email = contact.email || '';
  const links = [
    ['เงื่อนไขการใช้งาน', '/legal/terms'],
    ['นโยบายความเป็นส่วนตัว', '/legal/privacy'],
    ['การใช้งานอย่างรับผิดชอบ', '/legal/responsible-use'],
    ['ติดต่อเรา', '/contact'],
  ] as const;

  return <footer className="member-footer">
    <div className="member-footer__brand"><strong>{siteName}</strong><span>{description}</span><small>{company} · {supportHours}</small></div>
    <nav className="member-footer__links" aria-label="ข้อมูลเว็บไซต์">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
    {(phone || email) && <div className="member-footer__contact">{phone && <a href={`tel:${phone}`}>{phone}</a>}{email && <a href={`mailto:${email}`}>{email}</a>}</div>}
    <small className="member-footer__copyright">© {new Date().getFullYear()} {company}. สงวนลิขสิทธิ์</small>
  </footer>;
}
