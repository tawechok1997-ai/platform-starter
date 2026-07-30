'use client';

import { useEffect, useState } from 'react';
import '../member-floating-contact.css';

const LINE_CONTACT_URL = 'https://lin.ee/UYkP0OC';
const LINE_ICON_URL = '/assets/asset-pc/images/line.png';
const CONTACT_ICON_URL = '/assets/asset-pc/images/footer/contact/icon-open-gold.webp';

export default function MemberFloatingContact() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <aside
      className="member-floating-contact"
      data-open={open ? 'true' : 'false'}
      aria-label="ติดต่อทีมงาน"
    >
      <div className="member-floating-contact__channels" aria-hidden={!open}>
        <a
          href={LINE_CONTACT_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="member-floating-contact__line"
          tabIndex={open ? 0 : -1}
          aria-label="ติดต่อทีมงานผ่าน LINE"
        >
          <img src={LINE_ICON_URL} alt="LINE" loading="lazy" />
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
