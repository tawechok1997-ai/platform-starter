'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMemberContactRuntime } from '../member-settings-runtime';
import '../member-floating-contact.css';

const CONTACT_ICON_URL = '/assets/asset-pc/images/footer/contact/icon-open-gold.webp';
const MOBILE_QUERY = '(max-width: 900px)';

export default function MemberFloatingContact() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const { primary } = useMemberContactRuntime();

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const syncViewport = () => setIsMobile(media.matches);

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  if (pathname === '/' && isMobile !== false) return null;

  return (
    <aside
      className="member-floating-contact"
      data-open={open ? 'true' : 'false'}
      aria-label="ติดต่อทีมงาน"
    >
      <div className="member-floating-contact__channels" aria-hidden={!open}>
        <a
          href={primary.href}
          target={primary.external ? '_blank' : undefined}
          rel={primary.external ? 'noreferrer noopener' : undefined}
          className="member-floating-contact__line"
          tabIndex={open ? 0 : -1}
          aria-label={`ติดต่อทีมงานผ่าน ${primary.label}`}
          title={`${primary.label}: ${primary.value}`}
        >
          <img src={primary.iconUrl} alt={primary.label} loading="lazy" />
        </a>
      </div>

      <button
        type="button"
        className="member-floating-contact__toggle"
        aria-label={open ? 'ปิดเมนูติดต่อทีมงาน' : 'เปิดเมนูติดต่อทีมงาน'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="member-floating-contact__ring member-floating-contact__ring--1" aria-hidden="true" />
        <span className="member-floating-contact__ring member-floating-contact__ring--2" aria-hidden="true" />
        <span className="member-floating-contact__ring member-floating-contact__ring--3" aria-hidden="true" />

        <span className="member-floating-contact__button-face" aria-hidden="true">
          <img src={CONTACT_ICON_URL} alt="" loading="lazy" />
          <span className="member-floating-contact__close-icon" />
        </span>
      </button>
    </aside>
  );
}
