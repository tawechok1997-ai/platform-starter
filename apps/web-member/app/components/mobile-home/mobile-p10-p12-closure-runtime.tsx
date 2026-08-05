'use client';

import { useEffect, useRef } from 'react';
import type { MemberLocale } from '../../member-locale-provider';

type MobileP10P12ClosureRuntimeProps = {
  locale: MemberLocale;
};

const MOBILE_QUERY = '(max-width: 900px)';
const MOBILE_OWNER_SELECTOR = [
  '[data-mobile-home-root]',
  '[data-mobile-member-page]',
  '[data-mobile-popup-owner]',
  '[data-ui-owner="mobile-popup"]',
  '.member-auth-overlay',
  '.member-public-page',
  '.member-finance-page',
  '.finance-flow-page',
  '#mobile-home-drawer',
].join(',');
const SCROLL_REGION_SELECTOR = [
  '[role="tablist"]',
  '[data-mobile-scroll-region="true"]',
  '[data-mobile-provider-stage]',
  '[data-mobile-rank-stage]',
].join(',');
const FORM_CONTROL_SELECTOR = 'input, select, textarea';
const PROHIBITED_SECTION_LOCK_ARIA = [
  'aria-checked',
  'aria-expanded',
  'aria-pressed',
  'aria-selected',
] as const;
const SUPPORTED_LOCALES = new Set<MemberLocale>(['th', 'en']);
const LANGUAGE_LABELS = new Map<string, MemberLocale | 'unsupported'>([
  ['th', 'th'],
  ['thai', 'th'],
  ['ไทย', 'th'],
  ['en', 'en'],
  ['english', 'en'],
  ['อังกฤษ', 'en'],
  ['chinese', 'unsupported'],
  ['中文', 'unsupported'],
  ['vietnamese', 'unsupported'],
  ['tiếng việt', 'unsupported'],
  ['burmese', 'unsupported'],
  ['မြန်မာ', 'unsupported'],
  ['khmer', 'unsupported'],
  ['cambodian', 'unsupported'],
  ['bahasa indonesia', 'unsupported'],
  ['indonesian', 'unsupported'],
  ['tagalog', 'unsupported'],
  ['filipino', 'unsupported'],
]);

const CONTROL_LABELS = {
  th: {
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    phone: 'เบอร์โทรศัพท์',
    email: 'อีเมล',
    search: 'ค้นหาเกม',
    otp: 'รหัสยืนยัน',
    select: 'เลือกตัวเลือก',
    textarea: 'รายละเอียด',
    input: 'ข้อมูล',
    scrollRegion: 'พื้นที่เลื่อนเพิ่มเติม',
    localeStatus: 'เปลี่ยนภาษาเป็นภาษาไทยแล้ว',
  },
  en: {
    username: 'Username',
    password: 'Password',
    phone: 'Phone number',
    email: 'Email address',
    search: 'Search games',
    otp: 'Verification code',
    select: 'Select an option',
    textarea: 'Details',
    input: 'Input',
    scrollRegion: 'Additional scrollable content',
    localeStatus: 'Language changed to English',
  },
} as const;

export default function MobileP10P12ClosureRuntime({ locale }: MobileP10P12ClosureRuntimeProps) {
  const previousLocale = useRef<MemberLocale>(locale);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = 'ltr';
    root.dataset.mobileP10P12Locale = locale;
    root.dataset.mobileP10P12Ready = 'true';

    if (previousLocale.current !== locale) {
      window.dispatchEvent(new CustomEvent('member:locale-changed', {
        detail: { locale },
      }));
      previousLocale.current = locale;
    }
  }, [locale]);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    let frame = 0;

    const syncDocument = () => {
      if (!media.matches) return;
      patchDrawerSemantics();
      patchFormControlNames(locale);
      patchScrollableRegions(locale);
      patchUnsupportedLanguageOptions();
      patchVipSectionLockAria();
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(syncDocument);
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        'aria-expanded',
        'class',
        'data-state',
        'hidden',
        'open',
      ],
      childList: true,
      subtree: true,
    });

    const handleKeyboardScroll = (event: KeyboardEvent) => {
      if (!media.matches || !(event.target instanceof HTMLElement)) return;
      const region = event.target.closest<HTMLElement>('[data-mobile-keyboard-scroll="true"]');
      if (!region) return;

      const horizontal = region.scrollWidth > region.clientWidth + 1;
      const vertical = region.scrollHeight > region.clientHeight + 1;
      let left = region.scrollLeft;
      let top = region.scrollTop;
      let handled = false;

      if (horizontal && event.key === 'ArrowRight') {
        left += 80;
        handled = true;
      } else if (horizontal && event.key === 'ArrowLeft') {
        left -= 80;
        handled = true;
      } else if (vertical && event.key === 'ArrowDown') {
        top += 80;
        handled = true;
      } else if (vertical && event.key === 'ArrowUp') {
        top -= 80;
        handled = true;
      } else if ((horizontal || vertical) && event.key === 'PageDown') {
        left += horizontal ? Math.max(80, region.clientWidth * 0.8) : 0;
        top += vertical ? Math.max(80, region.clientHeight * 0.8) : 0;
        handled = true;
      } else if ((horizontal || vertical) && event.key === 'PageUp') {
        left -= horizontal ? Math.max(80, region.clientWidth * 0.8) : 0;
        top -= vertical ? Math.max(80, region.clientHeight * 0.8) : 0;
        handled = true;
      } else if ((horizontal || vertical) && event.key === 'Home') {
        left = 0;
        top = 0;
        handled = true;
      } else if ((horizontal || vertical) && event.key === 'End') {
        left = region.scrollWidth;
        top = region.scrollHeight;
        handled = true;
      }

      if (!handled) return;
      event.preventDefault();
      region.scrollTo({ left, top, behavior: 'smooth' });
    };

    document.addEventListener('keydown', handleKeyboardScroll, true);
    media.addEventListener?.('change', scheduleSync);
    syncDocument();

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleKeyboardScroll, true);
      media.removeEventListener?.('change', scheduleSync);
      window.cancelAnimationFrame(frame);
      delete document.documentElement.dataset.mobileP10P12Ready;
    };
  }, [locale]);

  return (
    <>
      <span
        id="member-mobile-p10-p12-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {CONTROL_LABELS[locale].localeStatus}
      </span>
      <style jsx global>{`
        #member-mobile-p10-p12-status {
          position: fixed;
          width: 1px;
          height: 1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 900px) {
          html[data-mobile-p10-p12-ready='true'] :is(
            button[aria-controls='mobile-home-drawer'],
            button[aria-label='เปลี่ยนภาษา'],
            button[aria-label='Change language'],
            button[aria-label*='ย้อนกลับ'],
            button[aria-label='Back'],
            button[aria-label='ปิด'],
            button[aria-label='Close'],
            #mobile-home-drawer a,
            #mobile-home-drawer button,
            [data-mobile-member-page] button,
            [data-mobile-member-page] [role='button'],
            [data-mobile-member-page] [role='tab'],
            [data-mobile-popup-owner] button,
            [data-ui-owner='mobile-popup'] button,
            .member-auth-overlay button,
            [role='tab']
          ) {
            min-inline-size: 44px !important;
            min-block-size: 44px !important;
            touch-action: manipulation;
          }

          html[data-mobile-p10-p12-ready='true'] :is(
            [data-mobile-home-root],
            [data-mobile-member-page],
            [data-mobile-popup-owner],
            [data-ui-owner='mobile-popup'],
            .member-auth-overlay,
            .member-public-page,
            .member-finance-page,
            .finance-flow-page
          ) :is(input, select, textarea) {
            min-block-size: 44px !important;
            font-size: max(16px, 1em);
          }

          html[data-mobile-p10-p12-ready='true'] [data-mobile-category-id] {
            min-inline-size: 45px !important;
            min-block-size: 45px !important;
          }

          html[data-mobile-p10-p12-ready='true'] [data-mobile-category-id] > span:last-child {
            font-size: 11px !important;
            line-height: 1.1 !important;
          }

          html[data-mobile-p10-p12-ready='true'] :is(
            [aria-label='เลือกโปรโมชั่น'],
            [aria-label='Select a promotion']
          ) > button {
            position: relative;
            inline-size: 44px !important;
            block-size: 44px !important;
            background: transparent !important;
          }

          html[data-mobile-p10-p12-ready='true'] :is(
            [aria-label='เลือกโปรโมชั่น'],
            [aria-label='Select a promotion']
          ) > button::before {
            display: block;
            width: 6px;
            height: 6px;
            margin: auto;
            border-radius: 999px;
            background: rgb(255 255 255 / 38%);
            content: '';
          }

          html[data-mobile-p10-p12-ready='true'] :is(
            [aria-label='เลือกโปรโมชั่น'],
            [aria-label='Select a promotion']
          ) > button[aria-current='true']::before {
            width: 16px;
            background: #bb5bea;
          }

          html[data-mobile-p10-p12-ready='true'] [data-mobile-keyboard-scroll='true'] {
            scroll-behavior: smooth;
            scroll-padding-inline: 12px;
          }

          html[data-mobile-p10-p12-ready='true'] :is(
            [data-mobile-home-root],
            [data-mobile-member-page],
            [data-mobile-popup-owner],
            [data-ui-owner='mobile-popup'],
            .member-auth-overlay,
            .member-public-page,
            .member-finance-page,
            .finance-flow-page
          ) :focus-visible {
            outline: 3px solid #f0b7ff !important;
            outline-offset: 2px !important;
          }
        }

        @media (max-width: 900px) and (prefers-reduced-motion: reduce) {
          html[data-mobile-p10-p12-ready='true'] *,
          html[data-mobile-p10-p12-ready='true'] *::before,
          html[data-mobile-p10-p12-ready='true'] *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </>
  );
}

function patchDrawerSemantics() {
  const drawer = document.getElementById('mobile-home-drawer');
  if (!drawer) return;

  const trigger = document.querySelector<HTMLButtonElement>('button[aria-controls="mobile-home-drawer"]');
  const open = trigger?.getAttribute('aria-expanded') === 'true';

  if (drawer.getAttribute('role') !== 'dialog') drawer.setAttribute('role', 'dialog');
  if (drawer.getAttribute('aria-hidden') !== String(!open)) {
    drawer.setAttribute('aria-hidden', String(!open));
  }
  if (drawer.getAttribute('tabindex') !== '-1') drawer.setAttribute('tabindex', '-1');
  if (open) {
    if (drawer.getAttribute('aria-modal') !== 'true') drawer.setAttribute('aria-modal', 'true');
  } else if (drawer.hasAttribute('aria-modal')) {
    drawer.removeAttribute('aria-modal');
  }
}

function patchFormControlNames(locale: MemberLocale) {
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(FORM_CONTROL_SELECTOR)
    .forEach((control) => {
      if (!isInsideMobileOwner(control) || hasAccessibleName(control)) return;
      if (control instanceof HTMLInputElement && ['hidden', 'button', 'submit', 'reset', 'image'].includes(control.type)) return;

      control.setAttribute('aria-label', deriveControlLabel(control, locale));
      control.dataset.mobileAccessibleNamePatched = 'true';
    });
}

function patchScrollableRegions(locale: MemberLocale) {
  document.querySelectorAll<HTMLElement>(SCROLL_REGION_SELECTOR).forEach((region) => {
    if (!isInsideMobileOwner(region)) return;

    const style = window.getComputedStyle(region);
    const scrollable = region.scrollWidth > region.clientWidth + 1
      || region.scrollHeight > region.clientHeight + 1
      || ['auto', 'scroll'].includes(style.overflowX)
      || ['auto', 'scroll'].includes(style.overflowY);
    if (!scrollable && region.getAttribute('role') !== 'tablist') return;

    if (!region.hasAttribute('tabindex')) region.tabIndex = 0;
    if (!region.hasAttribute('aria-label') && !region.hasAttribute('aria-labelledby')) {
      region.setAttribute('aria-label', CONTROL_LABELS[locale].scrollRegion);
    }
    region.dataset.mobileKeyboardScroll = 'true';
  });
}

function patchUnsupportedLanguageOptions() {
  document.querySelectorAll<HTMLElement>('[role="dialog"], [data-mobile-popup-owner]')
    .forEach((dialog) => {
      if (!isVisible(dialog)) return;
      const candidates = Array.from(dialog.querySelectorAll<HTMLElement>('button, [role="button"], [data-locale], [data-language]'));
      const recognized = candidates.flatMap((candidate) => {
        const locale = localeForOption(candidate);
        return locale ? [{ candidate, locale }] : [];
      });

      const dialogLooksLikeLanguagePicker = recognized.length >= 3
        || /เปลี่ยนภาษา|change language|language/i.test(dialog.textContent ?? '');
      if (!dialogLooksLikeLanguagePicker) return;

      recognized.forEach(({ candidate, locale }) => {
        if (locale !== 'unsupported' && SUPPORTED_LOCALES.has(locale)) return;
        if (!candidate.hidden) candidate.hidden = true;
        if (candidate.getAttribute('aria-hidden') !== 'true') candidate.setAttribute('aria-hidden', 'true');
        if (candidate.getAttribute('tabindex') !== '-1') candidate.setAttribute('tabindex', '-1');
        candidate.dataset.mobileUnsupportedLocale = 'true';
        if (candidate instanceof HTMLButtonElement && !candidate.disabled) candidate.disabled = true;
      });
    });
}

function patchVipSectionLockAria() {
  document.querySelectorAll<HTMLElement>('[class*="sectionLock"], [data-section-lock]')
    .forEach((element) => {
      const role = element.getAttribute('role');
      const interactive = element.matches('button, input, select, textarea, [role="button"], [role="checkbox"], [role="switch"], [role="tab"]');
      if (interactive || role) return;
      PROHIBITED_SECTION_LOCK_ARIA.forEach((attribute) => element.removeAttribute(attribute));
      element.dataset.mobileAriaNormalized = 'true';
    });
}

function hasAccessibleName(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return true;
  if (control.closest('label')) return true;
  if (control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`)) return true;
  return false;
}

function deriveControlLabel(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  locale: MemberLocale,
) {
  const labels = CONTROL_LABELS[locale];
  const hint = [
    control.getAttribute('autocomplete'),
    control.getAttribute('name'),
    control.id,
    control.getAttribute('placeholder'),
    control.getAttribute('type'),
  ].filter(Boolean).join(' ').toLowerCase();

  if (/user|login|identifier|account/.test(hint)) return labels.username;
  if (/password|secret|passcode|pin/.test(hint)) return labels.password;
  if (/phone|mobile|tel/.test(hint)) return labels.phone;
  if (/email/.test(hint)) return labels.email;
  if (/search|ค้นหา/.test(hint)) return labels.search;
  if (/otp|one-time|verification|verify/.test(hint)) return labels.otp;
  if (control instanceof HTMLSelectElement) return labels.select;
  if (control instanceof HTMLTextAreaElement) return labels.textarea;
  return labels.input;
}

function localeForOption(element: HTMLElement) {
  const explicit = normalizeLanguageLabel(
    element.dataset.memberLocale
    ?? element.dataset.locale
    ?? element.dataset.language
    ?? '',
  );
  if (explicit === 'th' || explicit === 'en') return explicit;
  if (explicit && explicit !== 'unsupported') return 'unsupported' as const;

  const text = normalizeLanguageLabel(element.textContent ?? element.getAttribute('aria-label') ?? '');
  return LANGUAGE_LABELS.get(text) ?? null;
}

function normalizeLanguageLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isInsideMobileOwner(element: Element) {
  return Boolean(element.closest(MOBILE_OWNER_SELECTOR));
}

function isVisible(element: HTMLElement) {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
}
