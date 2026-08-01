'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cmsResponsiveMediaUrls, type CmsContent } from '../../site-settings';
import { useMemberLocale } from '../../member-locale-provider';
import { useMemberRuntime } from '../../member-runtime-provider';
import { V47_ASSETS } from '../member-home/v47-asset-map';
import MobileHighlightTabContent from './mobile-highlight-tab-content';
import type { MobileHighlightTab } from './mobile-highlight-tab-content';
import styles from './mobile-home-root.module.css';

const SOURCE_ROOT = '/assets/asset-pc/images';
const LOBBY_ASSET_ROOT = `${SOURCE_ROOT}/FEZX/lobby_settings`;
const LOGO_URL = `${LOBBY_ASSET_ROOT}/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png`;
const ANNOUNCEMENT_ICON_URL = `${SOURCE_ROOT}/home/coin.webp`;
const AUTH_BUTTON_TEXTURE = '/images/theme/button/style_1.webp';

type MobileMenuIconName =
  | 'vip'
  | 'commission'
  | 'referral'
  | 'coupon'
  | 'bonus'
  | 'live'
  | 'promotion'
  | 'news'
  | 'activity'
  | 'history'
  | 'notification'
  | 'video'
  | 'guide';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

const PRIMARY_MENU = [
  ['ระดับสมาชิก VIP', '/profile', 'vip'],
  ['รายได้คอมมิชชั่น', '/affiliate', 'commission'],
  ['แนะนำเพื่อน', '/affiliate', 'referral'],
  ['คูปอง', '/bonus', 'coupon'],
  ['โบนัสพิเศษ', '/bonus', 'bonus'],
  ['ถ่ายทอดสด', '/live', 'live'],
] as const satisfies ReadonlyArray<readonly [string, string, MobileMenuIconName]>;

const SECONDARY_MENU = [
  ['โปรโมชั่น', '/promotions', 'promotion'],
  ['ข่าวสาร', '/notifications', 'news'],
  ['กิจกรรม', '/promotions', 'activity'],
  ['ประวัติ', '/transactions', 'history'],
  ['แจ้งเตือน', '/notifications', 'notification'],
  ['วีดีโอแนะนำ', '/guide', 'video'],
  ['แนะนำการใช้งาน', '/guide', 'guide'],
] as const satisfies ReadonlyArray<readonly [string, string, MobileMenuIconName]>;

const MOBILE_CATEGORY_ORDER = [
  'home',
  'casino',
  'slot',
  'fishing',
  'sport',
  'card',
  'lottery',
] as const satisfies readonly MobileCategoryId[];

const MOBILE_CATEGORY_LABELS: Record<'th' | 'en', Record<MobileCategoryId, string>> = {
  th: {
    home: 'หน้าแรก',
    casino: 'คาสิโน',
    slot: 'สล็อต',
    fishing: 'ยิงปลา',
    sport: 'กีฬา',
    card: 'ไพ่',
    lottery: 'หวย',
  },
  en: {
    home: 'Home',
    casino: 'Casino',
    slot: 'Slots',
    fishing: 'Fishing',
    sport: 'Sports',
    card: 'Cards',
    lottery: 'Lottery',
  },
};

const MOBILE_CATEGORY_FALLBACK_ICONS: Record<MobileCategoryId, string> = {
  home: V47_ASSETS.menuHome,
  casino: V47_ASSETS.menuCasino,
  slot: V47_ASSETS.menuSlot,
  fishing: V47_ASSETS.menuFishing,
  sport: V47_ASSETS.menuSport,
  card: V47_ASSETS.menuCard,
  lottery: V47_ASSETS.menuLottery,
};

const HIGHLIGHT_TABS = ['highlights', 'promotions', 'activities', 'news'] as const satisfies readonly MobileHighlightTab[];

const MENU_LABELS_EN: Record<string, string> = {
  'ระดับสมาชิก VIP': 'VIP level',
  'รายได้คอมมิชชั่น': 'Commission',
  'แนะนำเพื่อน': 'Refer a friend',
  'คูปอง': 'Coupons',
  'โบนัสพิเศษ': 'Special bonuses',
  'ถ่ายทอดสด': 'Live',
  'โปรโมชั่น': 'Promotions',
  'ข่าวสาร': 'News',
  'กิจกรรม': 'Activities',
  'ประวัติ': 'History',
  'แจ้งเตือน': 'Notifications',
  'วีดีโอแนะนำ': 'Video guide',
  'แนะนำการใช้งาน': 'Usage guide',
};

const ROOT_COPY = {
  th: {
    mobileHome: 'หน้าแรกมือถือ',
    home: 'หน้าแรก',
    openMenu: 'เปิดเมนูสมาชิก',
    changeLanguage: 'เปลี่ยนภาษา',
    memberMenu: 'เมนูสมาชิก',
    closeMenu: 'ปิดเมนู',
    memberServices: 'บริการสมาชิก',
    moreMenu: 'เมนูเพิ่มเติม',
    authActions: 'สมัครสมาชิกหรือเข้าสู่ระบบ',
    homeTopics: 'หัวข้อหน้าแรก',
    mobileContent: 'เนื้อหาหน้าแรกมือถือ',
    promotions: 'โปรโมชั่น',
    selectPromotion: 'เลือกโปรโมชั่น',
    promotion: 'โปรโมชั่น',
    announcements: 'ประกาศ',
    websiteInfo: 'ข้อมูลเว็บไซต์มือถือ',
    contactLine: 'ติดต่อเราผ่าน LINE',
    register: 'สมัครสมาชิก',
    login: 'เข้าสู่ระบบ',
    highlightTabs: {
      highlights: 'ไฮไลท์',
      promotions: 'โปรโมชั่นแนะนำ',
      activities: 'กิจกรรม',
      news: 'ข่าวสาร',
    },
    shortcutTitle: 'เพิ่มปุ่มลัดหน้าโฮม',
    shortcutHeading: 'เพิ่มปุ่มลัดได้แล้ววันนี้!',
    shortcutSummary: 'สัมผัสประสบการณ์ที่เหนือกว่า เพิ่มปุ่มเลย',
    installHelp: {
      android: {
        title: 'เพิ่มบน Android',
        steps: 'เปิดเมนูเบราว์เซอร์ แล้วเลือก “เพิ่มลงในหน้าจอหลัก”',
      },
      ios: {
        title: 'เพิ่มบน iPhone หรือ iPad',
        steps: 'แตะปุ่มแชร์ใน Safari แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”',
      },
    },
    close: 'ปิด',
    paymentMethods: 'วิธีการชำระเงิน',
    contactUs: 'ติดต่อเรา',
    responsibleGaming: 'รับผิดชอบในการเดิมพัน',
    licenses: 'ใบอนุญาตและใบรับรอง',
    licenseGuarantee: '(การันตีเกมลิขสิทธิ์แท้)',
    securityBy: 'การรองรับและความปลอดภัยโดย',
  },
  en: {
    mobileHome: 'Mobile home',
    home: 'Home',
    openMenu: 'Open member menu',
    changeLanguage: 'Change language',
    memberMenu: 'Member menu',
    closeMenu: 'Close menu',
    memberServices: 'Member services',
    moreMenu: 'More options',
    authActions: 'Register or sign in',
    homeTopics: 'Home topics',
    mobileContent: 'Mobile home content',
    promotions: 'Promotions',
    selectPromotion: 'Select a promotion',
    promotion: 'Promotion',
    announcements: 'Announcements',
    websiteInfo: 'Mobile website information',
    contactLine: 'Contact us on LINE',
    register: 'Register',
    login: 'Sign in',
    highlightTabs: {
      highlights: 'Highlights',
      promotions: 'Promotions',
      activities: 'Activities',
      news: 'News',
    },
    shortcutTitle: 'Add a Home Screen shortcut',
    shortcutHeading: 'Add a shortcut today!',
    shortcutSummary: 'Get faster access from your Home Screen.',
    installHelp: {
      android: {
        title: 'Add on Android',
        steps: 'Open your browser menu and select “Add to Home screen”.',
      },
      ios: {
        title: 'Add on iPhone or iPad',
        steps: 'Tap Share in Safari, then select “Add to Home Screen”.',
      },
    },
    close: 'Close',
    paymentMethods: 'Payment methods',
    contactUs: 'Contact us',
    responsibleGaming: 'Responsible gaming',
    licenses: 'Licenses and certificates',
    licenseGuarantee: '(Genuine licensed games)',
    securityBy: 'Supported and secured by',
  },
} as const;

const BANKS = [
  'BBL',
  'KBANK',
  'KTB',
  'TTB',
  'SCB',
  'BAY',
  'KKP',
  'CIMBT',
  'TISCO',
  'UOBT',
  'TCD',
  'LHFG',
  'BAAC',
  'EXIM',
  'GSB',
  'GHB',
  'TMN',
] as const;

const LICENSE_BADGES = [
  ['BMM Testlabs', `${SOURCE_ROOT}/footer/BBM-Cert.webp`],
  ['iTech Labs', `${SOURCE_ROOT}/footer/iTech.webp`],
  ['Iovation', `${SOURCE_ROOT}/footer/Iovation.webp`],
  ['Gaming Labs', `${SOURCE_ROOT}/footer/GamingLab.webp`],
  ['GC', `${SOURCE_ROOT}/footer/GC-icon%202.webp`],
] as const;

const SECURITY_BADGES = [
  ['GoDaddy', `${SOURCE_ROOT}/footer/GO%20DADDY.webp`],
  ['Security Group', `${SOURCE_ROOT}/footer/Group%2048102721.webp`],
] as const;

type MobileHomeRootProps = {
  content: CmsContent;
  showPromotion: boolean;
};

type MobileHeroSlide = {
  id: string;
  image: string;
  href: string;
  title: string;
};

type MobileAuthActionsProps = {
  layout: 'page' | 'drawer';
  onNavigate?: () => void;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function MobileHomeRoot({ content, showPromotion }: MobileHomeRootProps) {
  const { locale, toggleLocale } = useMemberLocale();
  const { navigation } = useMemberRuntime();
  const copy = ROOT_COPY[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<MobileHighlightTab>('highlights');
  const [activeCategory, setActiveCategory] = useState<MobileCategoryId>('home');
  const categoryContentRef = useRef<HTMLDivElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shortcutHelp, setShortcutHelp] = useState<'android' | 'ios' | null>(null);
  const heroSlides = useMemo(() => getMobileHeroSlides(content, locale), [content, locale]);
  const announcementMessages = useMemo(() => getAnnouncementMessages(content), [content]);
  const categoryMenuItems = useMemo(() => MOBILE_CATEGORY_ORDER.flatMap((id) => {
    const item = navigation.find((candidate) => candidate.id === id && candidate.mobile);
    if (!item) return [];

    return [{
      id,
      label: MOBILE_CATEGORY_LABELS[locale][id],
      icon: isImageUrl(item.icon) ? item.icon : MOBILE_CATEGORY_FALLBACK_ICONS[id],
    }];
  }), [locale, navigation]);

  const selectHighlightTab = (tab: MobileHighlightTab) => {
    setActiveTab(tab);
    setActiveCategory('home');
    window.dispatchEvent(new CustomEvent('member:mobile-category-select', {
      detail: { category: 'home' satisfies MobileCategoryId },
    }));
  };

  const installShortcut = async (platform: 'android' | 'ios') => {
    if (platform === 'android' && installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
      setInstallPrompt(null);
      return;
    }
    setShortcutHelp(platform);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setActiveSlide((current) => {
      if (heroSlides.length === 0) return 0;
      return Math.min(current, heroSlides.length - 1);
    });
  }, [heroSlides.length]);

  useEffect(() => {
    if (!showPromotion || heroSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length, showPromotion]);

  useEffect(() => {
    const content = categoryContentRef.current;
    const rail = categoryRailRef.current;
    if (!content || !rail) return;

    const mobileQuery = window.matchMedia('(max-width: 900px)');
    let frame = 0;
    let lastState = '';

    const syncRail = () => {
      frame = 0;

      if (!mobileQuery.matches) {
        rail.dataset.mobileCategoryFollow = 'start';
        rail.style.removeProperty('transform');
        rail.style.removeProperty('will-change');
        lastState = 'start';
        return;
      }

      const contentRect = content.getBoundingClientRect();
      const contentHeight = content.offsetHeight;
      const railHeight = rail.offsetHeight;
      const scaleY = contentHeight > 0 ? contentRect.height / contentHeight : 1;
      const headerEdge = 60;
      const maxOffset = Math.max(0, contentHeight - railHeight);
      const requestedOffset = scaleY > 0
        ? Math.max(0, headerEdge - contentRect.top) / scaleY
        : 0;
      const offset = Math.min(requestedOffset, maxOffset);
      const nextState = offset <= 0
        ? 'start'
        : offset >= maxOffset
          ? 'end'
          : 'following';

      if (nextState !== lastState) {
        rail.dataset.mobileCategoryFollow = nextState;
        lastState = nextState;
      }

      rail.style.transform = offset > 0
        ? `translate3d(0, ${Math.round(offset)}px, 0)`
        : 'none';
      rail.style.willChange = offset > 0 ? 'transform' : 'auto';
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncRail);
    };

    syncRail();
    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('scroll', scheduleSync, { passive: true });
    document.addEventListener('scroll', scheduleSync, { capture: true, passive: true });
    mobileQuery.addEventListener?.('change', scheduleSync);

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleSync);
    resizeObserver?.observe(content);
    resizeObserver?.observe(rail);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('scroll', scheduleSync);
      document.removeEventListener('scroll', scheduleSync, { capture: true });
      mobileQuery.removeEventListener?.('change', scheduleSync);
      resizeObserver?.disconnect();
      delete rail.dataset.mobileCategoryFollow;
      rail.style.removeProperty('transform');
      rail.style.removeProperty('will-change');
    };
  }, [activeCategory, activeTab, categoryMenuItems.length]);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt);
  }, []);

  return (
    <main
      className={styles.root}
      data-mobile-home-root="true"
      data-ui-owner="mobile-home"
      aria-label={copy.mobileHome}
    >
      <header className={styles.header} data-mobile-section-owner="header">
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={copy.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-home-drawer"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true"><i /><i /><i /></span>
          </button>

          <Link href="/" className={styles.logoLink} aria-label={`NOAH345 ${copy.home}`}>
            <img src={LOGO_URL} alt="NOAH345" />
          </Link>

          <button type="button" className={styles.languageButton} aria-label={copy.changeLanguage} onClick={toggleLocale}>
            <img src={`/images/flags/${locale}.svg`} alt="" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className={`${styles.drawerBackdrop} ${menuOpen ? styles.drawerBackdropOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          data-mobile-drawer-dismiss="true"
          aria-label={copy.closeMenu}
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          id="mobile-home-drawer"
          className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
          aria-label={copy.memberMenu}
        >
          <div className={styles.drawerGlow} aria-hidden="true" />
          <div className={styles.drawerTop}>
            <img src={LOGO_URL} alt="NOAH345" />
            <button type="button" aria-label={copy.closeMenu} onClick={() => setMenuOpen(false)}>×</button>
          </div>

          <nav className={styles.primaryMenu} aria-label={copy.memberServices}>
            {PRIMARY_MENU.map(([label, href, icon]) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}>
                <span className={styles.menuGlyph} aria-hidden="true">
                  <MobileMenuIcon name={icon} />
                </span>
                <strong>{localizedMenuLabel(label, locale)}</strong>
                <span className={styles.menuArrow} aria-hidden="true">
                  <ChevronRightIcon />
                </span>
              </Link>
            ))}
          </nav>

          <nav className={styles.secondaryMenu} aria-label={copy.moreMenu}>
            {SECONDARY_MENU.map(([label, href, icon]) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}>
                <span className={styles.gridGlyph} aria-hidden="true">
                  <MobileMenuIcon name={icon} />
                </span>
                <strong>{localizedMenuLabel(label, locale)}</strong>
              </Link>
            ))}
            <button type="button" onClick={toggleLocale}>
              <img src={`/images/flags/${locale}.svg`} alt="" aria-hidden="true" />
              <strong>{copy.changeLanguage}</strong>
            </button>
          </nav>

          <MobileAuthActions layout="drawer" onNavigate={() => setMenuOpen(false)} />
        </aside>
      </div>

      <div className={styles.pageContent}>
        {showPromotion && heroSlides.length > 0 ? (
          <section className={styles.hero} data-mobile-section-owner="hero" aria-label={copy.promotions}>
            <div className={styles.heroViewport}>
              <div className={styles.heroTrack} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                {heroSlides.map((slide, index) => (
                  <Link key={slide.id} href={slide.href} className={styles.heroSlide}>
                    <span>
                      <img src={slide.image} alt={slide.title || `${copy.promotion} ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            {heroSlides.length > 1 ? (
              <div className={styles.heroDots} aria-label={copy.selectPromotion}>
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={index === activeSlide ? styles.heroDotActive : ''}
                    aria-label={slide.title || `${copy.promotion} ${index + 1}`}
                    aria-current={index === activeSlide ? 'true' : undefined}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section
          data-mobile-section-owner="auth-actions"
          aria-label={copy.authActions}
          style={{ width: '100%', padding: '12px 12px 0' }}
        >
          <MobileAuthActions layout="page" />
        </section>

        {announcementMessages.length > 0 ? (
          <section className={styles.announcement} data-mobile-section-owner="announcement" aria-label={copy.announcements}>
            <span className={styles.announcementIcon} aria-hidden="true">
              <img src={ANNOUNCEMENT_ICON_URL} alt="" />
            </span>
            <div className={styles.announcementText} data-mobile-announcement-viewport="true">
              <div data-mobile-announcement-track="true">
                {[0, 1].map((copyIndex) => (
                  <span
                    key={copyIndex}
                    data-mobile-announcement-set="true"
                    aria-hidden={copyIndex === 1 ? true : undefined}
                  >
                    {announcementMessages.map((message, messageIndex) => (
                      <span key={`${copyIndex}-${messageIndex}`} data-mobile-announcement-item="true">
                        {message}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div
          className={styles.highlightTabs}
          data-mobile-section-owner="highlight-tabs"
          aria-label={copy.homeTopics}
          role="tablist"
        >
          {HIGHLIGHT_TABS.map((tab, index) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                id={`mobile-highlight-tab-${index}`}
                type="button"
                role="tab"
                className={selected ? styles.highlightTabActive : ''}
                aria-selected={selected}
                aria-current={selected ? 'page' : undefined}
                aria-controls="mobile-highlight-content"
                onClick={() => selectHighlightTab(tab)}
              >
                {copy.highlightTabs[tab]}
              </button>
            );
          })}
        </div>

        <div ref={categoryContentRef} className={styles.categoryContent}>
          <div
            ref={categoryRailRef}
            className={styles.categoryRail}
            data-mobile-section-owner="category-menu"
            data-mobile-category-follow="start"
            aria-label={locale === 'th' ? 'หมวดเกม' : 'Game categories'}
            role="tablist"
            aria-orientation="vertical"
          >
            {categoryMenuItems.map((item) => {
              const active = item.id === activeCategory;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  className={`${styles.categoryItem} ${active ? styles.categoryItemActive : ''}`}
                  data-mobile-category-id={item.id}
                  aria-selected={active}
                  aria-current={active ? 'page' : undefined}
                  aria-controls="mobile-highlight-content"
                  onClick={() => setActiveCategory(item.id)}
                >
                  <span className={styles.categoryIcon} aria-hidden="true">
                    <img src={item.icon} alt="" />
                  </span>
                  <span className={styles.categoryLabel}>{item.label}</span>
                </button>
              );
            })}
          </div>

          <section
            id="mobile-highlight-content"
            className={styles.nextContentSlot}
            data-mobile-content-slot="after-highlight"
            aria-label={copy.mobileContent}
            role="tabpanel"
            aria-live="polite"
          >
            <MobileHighlightTabContent activeTab={activeTab} />
          </section>
        </div>
      </div>

      <div className={styles.bottomStructure} data-mobile-bottom-owner="true">
        <section className={styles.shortcutSection} data-mobile-section-owner="shortcut" aria-labelledby="mobile-shortcut-title">
          <h2 id="mobile-shortcut-title">{copy.shortcutTitle}</h2>
          <div className={styles.shortcutCard} data-mobile-shortcut-card="true">
            <img className={styles.shortcutArtwork} src={`${SOURCE_ROOT}/shortcut/bg_top.webp`} alt="" aria-hidden="true" />
            <div className={styles.shortcutContent}>
              <div className={styles.shortcutIntro}>
                <img src={LOGO_URL} alt="NOAH345" />
                <div>
                  <strong>{copy.shortcutHeading}</strong>
                  <span>{copy.shortcutSummary}</span>
                </div>
              </div>
              <div className={styles.shortcutActions}>
                <button type="button" className={styles.androidButton} onClick={() => { void installShortcut('android'); }}>Android</button>
                <button type="button" className={styles.iosButton} onClick={() => { void installShortcut('ios'); }}>iOS</button>
              </div>
              {shortcutHelp ? (
                <div className={styles.shortcutHelp} role="status">
                  <strong>{copy.installHelp[shortcutHelp].title}</strong>
                  <span>{copy.installHelp[shortcutHelp].steps}</span>
                  <button type="button" onClick={() => setShortcutHelp(null)}>{copy.close}</button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <footer className={styles.mobileFooter} data-mobile-section-owner="footer" aria-label={copy.websiteInfo}>
          <section className={styles.paymentSection} aria-labelledby="mobile-payment-title">
            <h2 id="mobile-payment-title">{copy.paymentMethods}</h2>
            <div className={styles.bankGrid}>
              {BANKS.map((bank) => (
                <img key={bank} src={`${SOURCE_ROOT}/banks/TH/${bank}.webp`} alt={bank} loading="lazy" />
              ))}
            </div>
          </section>

          <div className={styles.footerDivider} aria-hidden="true" />

          <div className={styles.footerTopRow}>
            <section>
              <strong>{copy.contactUs}</strong>
              <a href="https://lin.ee/UYkP0OC" target="_blank" rel="noopener noreferrer" aria-label={copy.contactLine}>
                <img src={`${SOURCE_ROOT}/line.png`} alt="LINE" loading="lazy" />
              </a>
            </section>
            <section>
              <strong>{copy.responsibleGaming}</strong>
              <img src={`${SOURCE_ROOT}/footer/gamecare.webp`} alt="Game Care" loading="lazy" />
            </section>
          </div>

          <div className={styles.footerDivider} aria-hidden="true" />

          <div className={styles.footerBottomRow}>
            <section className={styles.licenseSection}>
              <div className={styles.licenseTitle}>
                <strong>{copy.licenses}</strong>
                <span>{copy.licenseGuarantee}</span>
              </div>
              <div className={styles.licenseGrid}>
                {LICENSE_BADGES.map(([name, url]) => (
                  <img key={name} src={url} alt={name} loading="lazy" />
                ))}
              </div>
            </section>

            <section className={styles.securitySection}>
              <strong>{copy.securityBy}</strong>
              <div>
                {SECURITY_BADGES.map(([name, url]) => (
                  <img key={name} src={url} alt={name} loading="lazy" />
                ))}
              </div>
            </section>
          </div>

          <div className={styles.copyright}>Copyright © NOAH345, All Rights Reserved.</div>
        </footer>
      </div>
    </main>
  );
}

function MobileMenuIcon({ name }: { name: MobileMenuIconName }) {
  const commonProps = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    focusable: false,
  };

  switch (name) {
    case 'vip':
      return <svg {...commonProps}><path d="m3 8 4 3 5-7 5 7 4-3-2 10H5L3 8Z" /><path d="M7 21h10" /></svg>;
    case 'commission':
      return <svg {...commonProps}><circle cx="8" cy="8" r="4" /><circle cx="16" cy="16" r="4" /><path d="m7 17 10-10" /></svg>;
    case 'referral':
      return <svg {...commonProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>;
    case 'coupon':
      return <svg {...commonProps}><path d="M4 7a2 2 0 0 0 2-2h12v4a2 2 0 0 0 0 4v4H6a2 2 0 0 0-2-2V7Z" /><path d="M12 7v10" /></svg>;
    case 'bonus':
      return <svg {...commonProps}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M7.5 8C5 8 4 6.5 5 5s3.5-.5 7 3c3.5-3.5 6-4.5 7-3s0 3-2.5 3" /></svg>;
    case 'live':
      return <svg {...commonProps}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /><path d="M7 2h10" /></svg>;
    case 'promotion':
      return <svg {...commonProps}><path d="m3 11 15-6v14L3 13v-2Z" /><path d="M7 14v5a2 2 0 0 0 2 2h2v-5" /></svg>;
    case 'news':
      return <svg {...commonProps}><path d="M4 5h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>;
    case 'activity':
      return <svg {...commonProps}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m12 13 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 15.3l2-.3 1-2Z" /></svg>;
    case 'history':
      return <svg {...commonProps}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>;
    case 'notification':
      return <svg {...commonProps}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
    case 'video':
      return <svg {...commonProps}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
    case 'guide':
      return <svg {...commonProps}><path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2V5ZM20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2V5Z" /><path d="M15 8h2M15 12h2" /></svg>;
  }
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MobileAuthActions({ layout, onNavigate }: MobileAuthActionsProps) {
  const { locale } = useMemberLocale();
  const isPage = layout === 'page';
  const copy = ROOT_COPY[locale];

  return (
    <div
      className={isPage ? undefined : styles.drawerAuth}
      data-mobile-auth-layout={layout}
      style={isPage ? {
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontSize: 16,
        fontWeight: 600,
      } : undefined}
    >
      <AuthActionLink
        href="/?auth=register"
        label={copy.register}
        className={styles.registerButton}
        horizontal={isPage}
        onNavigate={onNavigate}
      />
      <AuthActionLink
        href="/?auth=login"
        label={copy.login}
        className={styles.loginButton}
        horizontal={isPage}
        onNavigate={onNavigate}
      />
    </div>
  );
}

type AuthActionLinkProps = {
  href: string;
  label: string;
  className: string;
  horizontal: boolean;
  onNavigate?: () => void;
};

function AuthActionLink({ href, label, className, horizontal, onNavigate }: AuthActionLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={onNavigate}
      style={horizontal ? {
        position: 'relative',
        display: 'grid',
        minWidth: 95,
        height: 44,
        flex: '1 1 0%',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: 10,
        color: '#fff',
        textDecoration: 'none',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 16%)',
      } : undefined}
    >
      {horizontal ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            backgroundImage: `url('${AUTH_BUTTON_TEXTURE}')`,
            backgroundSize: '100% 100%',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  );
}

function getMobileHeroSlides(content: CmsContent, locale: 'th' | 'en'): MobileHeroSlide[] {
  const seenImages = new Set<string>();
  const slides: MobileHeroSlide[] = [];

  content.banners.forEach((banner, index) => {
    if (!banner.enabled || banner.lifecycle === 'draft' || banner.lifecycle === 'archived') return;

    const media = cmsResponsiveMediaUrls(content, banner);
    const image = media.mobile || media.desktop || media.legacy;
    if (!image || seenImages.has(image)) return;

    seenImages.add(image);
    slides.push({
      id: banner.id || `mobile-banner-${index + 1}`,
      image,
      href: banner.href || '/promotions',
      title: banner.title || `${ROOT_COPY[locale].promotion} ${index + 1}`,
    });
  });

  return slides;
}

function getAnnouncementMessages(content: CmsContent) {
  const seenMessages = new Set<string>();
  const messages: string[] = [];

  content.announcements.forEach((announcement) => {
    if (
      !announcement.enabled
      || announcement.kind !== 'system'
      || announcement.lifecycle === 'draft'
      || announcement.lifecycle === 'archived'
    ) return;

    const message = [announcement.title, announcement.message]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' : ');

    if (!message || seenMessages.has(message)) return;
    seenMessages.add(message);
    messages.push(message);
  });

  return messages;
}

function isImageUrl(value: string) {
  return /^(?:https?:\/\/|\/)/i.test(value.trim());
}

function localizedMenuLabel(label: string, locale: 'th' | 'en') {
  return locale === 'en' ? MENU_LABELS_EN[label] ?? label : label;
}
