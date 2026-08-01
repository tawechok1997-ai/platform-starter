'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberSession } from '../member-session-provider';
import { useMemberContactRuntime } from '../member-settings-runtime';
import '../member-floating-contact.css';
import '../member-authenticated-source-overrides.css';

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

const MOBILE_MENU_BACK_SELECTOR = [
  '[data-mobile-member-page] button[aria-label="ย้อนกลับ"]',
  '[data-mobile-live-page="true"] button[aria-label="ย้อนกลับ"]',
].join(',');

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
  const closeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [miniToolsOpen, setMiniToolsOpen] = useState(false);
  const { ready: sessionReady, isLoggedIn } = useMemberSession();
  const { primary } = useMemberContactRuntime();
  const normalizedPath = normalizePath(pathname);
  const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES.has(normalizedPath);
  const showFloatingContact = sessionReady && !isMobileMenuPage;

  useEffect(() => {
    if (!showFloatingContact) return;
    drawContactCloseCanvas(closeCanvasRef.current);
  }, [showFloatingContact]);

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
      const backButton = event.target.closest<HTMLButtonElement>(MOBILE_MENU_BACK_SELECTOR);
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
        <div className="member-floating-contact__contact-host">
          <div className="member-floating-contact__contact-stage">
            <div className="member-floating-contact__contact-spacer" aria-hidden="true" />

            <div className="member-floating-contact__contact-motion">
              <div className="member-floating-contact__contact-content">
                <div className="member-floating-contact__channels">
                  <a
                    href={primary.href}
                    target={primary.external ? '_blank' : undefined}
                    rel={primary.external ? 'noreferrer noopener' : undefined}
                    className="member-floating-contact__line contact"
                    tabIndex={open ? 0 : -1}
                    aria-hidden={!open}
                    aria-label={`ติดต่อทีมงานผ่าน ${primary.label}`}
                    title={`${primary.label}: ${primary.value}`}
                  >
                    <img src={LINE_ICON_URL} alt={primary.label} loading="lazy" />
                  </a>
                </div>

                <button
                  type="button"
                  className="member-floating-contact__toggle"
                  aria-label={open ? 'ปิดเมนูติดต่อทีมงาน' : 'เปิดเมนูติดต่อทีมงาน'}
                  aria-expanded={open}
                  onClick={() => setOpen((current) => !current)}
                >
                  <span className="member-floating-contact__ring member-floating-contact__ring--1 contact-ring contact-ring-1" aria-hidden="true" />
                  <span className="member-floating-contact__ring member-floating-contact__ring--2 contact-ring contact-ring-2" aria-hidden="true" />
                  <span className="member-floating-contact__ring member-floating-contact__ring--3 contact-ring contact-ring-3" aria-hidden="true" />

                  <span className="member-floating-contact__button-face contact-btn" aria-hidden="true">
                    <img className="contact-icon-btn" src={CONTACT_ICON_URL} alt="" loading="lazy" />
                    <canvas
                      ref={closeCanvasRef}
                      className="member-floating-contact__close-canvas"
                      width={80}
                      height={80}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="member-floating-contact__scroll-top"
            aria-hidden="true"
            tabIndex={-1}
          >
            <span className="member-floating-contact__scroll-top-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" fill="none" viewBox="0 0 24 25" aria-hidden="true">
                <path stroke="#3a334b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 15.667 6-6 6 6" />
              </svg>
            </span>
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function drawContactCloseCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = 'round';
  context.lineWidth = 4;
  context.shadowColor = 'rgba(255, 211, 91, 0.48)';
  context.shadowBlur = 10;

  const gradient = context.createLinearGradient(24, 24, 56, 56);
  gradient.addColorStop(0, '#fff1a9');
  gradient.addColorStop(1, '#dcae32');
  context.strokeStyle = gradient;

  context.beginPath();
  context.moveTo(27, 27);
  context.lineTo(53, 53);
  context.moveTo(53, 27);
  context.lineTo(27, 53);
  context.stroke();
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}
