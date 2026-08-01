'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberSession } from '../member-session-provider';
import { useMemberContactRuntime } from '../member-settings-runtime';
import '../member-floating-contact.css';
import '../member-authenticated-source-overrides.css';
import '../member-floating-contact-home-effect.css';

const CONTACT_ICON_URL = '/assets/asset-pc/images/footer/contact/icon-open-gold.webp';
const LINE_ICON_URL = '/assets/asset-pc/images/line.png';

const MOBILE_MENU_PAGE_ROUTES = new Set([
  '/mobile/member/vip',
  '/mobile/member/live',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/guide',
]);

const MINI_TOOLS = [
  {
    id: 'wheel',
    label: 'วงล้อ',
    image: '/assets/asset-pc/images/mini_game/icon-luckywheel-dt.webp',
  },
  {
    id: 'mission',
    label: 'ทำภารกิจ',
    image: '/assets/asset-pc/images/mini_game/icon-dailymission-dt.webp',
  },
] as const;

export default function MemberFloatingContact() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [miniToolsOpen, setMiniToolsOpen] = useState(false);
  const { ready: sessionReady, isLoggedIn } = useMemberSession();
  const { primary } = useMemberContactRuntime();
  const normalizedPath = normalizePath(pathname);
  const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES.has(normalizedPath);
  const isHomePage = normalizedPath === '/';
  const showFloatingContact = sessionReady && !isMobileMenuPage;

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setMiniToolsOpen(false);
  }, [isLoggedIn, normalizedPath]);

  useEffect(() => {
    if (!isMobileMenuPage) return;

    const returnToMobileHome = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const backButton = event.target.closest<HTMLButtonElement>(
        '[data-mobile-member-page] button[aria-label="ย้อนกลับ"]',
      );
      if (!backButton) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      router.replace('/');
    };

    document.addEventListener('click', returnToMobileHome, true);
    return () => document.removeEventListener('click', returnToMobileHome, true);
  }, [isMobileMenuPage, router]);

  const activateMiniTool = (id: (typeof MINI_TOOLS)[number]['id']) => {
    window.dispatchEvent(new CustomEvent('member:mini-tool', { detail: { id } }));
  };

  if (isMobileMenuPage) return null;

  return (
    <aside
      className="member-floating-contact"
      data-open={open ? 'true' : 'false'}
      data-authenticated={isLoggedIn ? 'true' : 'false'}
      data-home={isHomePage ? 'true' : 'false'}
      data-source-contact-motion="true"
      aria-label="เครื่องมือสมาชิกและช่องทางติดต่อ"
    >
      <div
        className="member-floating-contact__mini-shell"
        data-expanded={miniToolsOpen ? 'true' : 'false'}
      >
        <div className="member-floating-contact__mini-panel" aria-hidden={!miniToolsOpen}>
          {MINI_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="member-floating-contact__mini-card"
              data-mini-tool-id={tool.id}
              tabIndex={miniToolsOpen ? 0 : -1}
              aria-label={tool.label}
              onClick={() => activateMiniTool(tool.id)}
              style={{ backgroundImage: `url('${tool.image}')` }}
            >
              <span className="member-floating-contact__mini-new">ใหม่</span>
              <span className="member-floating-contact__mini-label">{tool.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="member-floating-contact__mini-toggle"
          aria-label={miniToolsOpen ? 'ซ่อนเมนูวงล้อและภารกิจ' : 'แสดงเมนูวงล้อและภารกิจ'}
          aria-expanded={miniToolsOpen}
          onClick={() => setMiniToolsOpen((current) => !current)}
        >
          <svg className="member-floating-contact__mini-toggle-shape" width="28" height="74" viewBox="0 0 28 74" fill="none" aria-hidden="true">
            <path d="M0 74V0C0 0 8.8734 10.6234 16.6297 19.2379C22.7095 25.9903 28.1029 29.7405 27.9985 37.9913C27.8969 46.022 22.5935 49.4785 16.6297 56.0044C8.8734 64.4917 0 74 0 74Z" fill="url(#member-mini-toggle-gradient)" />
            <defs>
              <linearGradient id="member-mini-toggle-gradient" x1="0" y1="0" x2="28" y2="74" gradientUnits="userSpaceOnUse">
                <stop stopColor="#944fe8" />
                <stop offset="1" stopColor="#7600a8" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="member-floating-contact__mini-toggle-arrow" viewBox="0 0 192 512" aria-hidden="true">
            <path d="M192 127.338v257.324c0 17.818-21.543 26.741-34.142 14.142L29.196 270.142c-7.81-7.81-7.81-20.474 0-28.284l128.662-128.662c12.599-12.6 34.142-3.676 34.142 14.142z" />
          </svg>
        </button>
      </div>

      {showFloatingContact ? (
        <div className="member-floating-contact__contact-stage contact-source-stage">
          <div className="member-floating-contact__channels contact-source-channels" aria-hidden={!open}>
            <a
              href={primary.href}
              target={primary.external ? '_blank' : undefined}
              rel={primary.external ? 'noreferrer noopener' : undefined}
              className="member-floating-contact__line contact"
              tabIndex={open ? 0 : -1}
              aria-label={`ติดต่อทีมงานผ่าน ${primary.label}`}
              title={`${primary.label}: ${primary.value}`}
            >
              <img
                className="contact-source-line-icon"
                src={LINE_ICON_URL}
                alt={primary.label}
                loading="lazy"
              />
            </a>
          </div>

          <button
            type="button"
            className="member-floating-contact__toggle contact-source-toggle"
            aria-label={open ? 'ปิดเมนูติดต่อทีมงาน' : 'เปิดเมนูติดต่อทีมงาน'}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="member-floating-contact__ring member-floating-contact__ring--1 contact-ring contact-ring-1" aria-hidden="true" />
            <span className="member-floating-contact__ring member-floating-contact__ring--2 contact-ring contact-ring-2" aria-hidden="true" />
            <span className="member-floating-contact__ring member-floating-contact__ring--3 contact-ring contact-ring-3" aria-hidden="true" />

            <span className="member-floating-contact__button-face contact-btn" aria-hidden="true">
              <img className="contact-icon-btn" src={CONTACT_ICON_URL} alt="" loading="lazy" />
              <span className="member-floating-contact__close-icon contact-close-motion" />
            </span>
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}
