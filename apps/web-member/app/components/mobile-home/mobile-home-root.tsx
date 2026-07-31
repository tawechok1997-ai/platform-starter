'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cmsResponsiveMediaUrls, type CmsContent } from '../../site-settings';
import { useMemberLocale } from '../../member-locale-provider';
import styles from './mobile-home-root.module.css';

const SOURCE_ROOT = '/assets/asset-pc/images';
const LOBBY_ASSET_ROOT = `${SOURCE_ROOT}/FEZX/lobby_settings`;
const LOGO_URL = `${LOBBY_ASSET_ROOT}/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png`;
const ANNOUNCEMENT_ICON_URL = `${SOURCE_ROOT}/home/coin.webp`;
const AUTH_BUTTON_TEXTURE = '/images/theme/button/style_1.webp';

const PRIMARY_MENU = [
  ['ระดับสมาชิก VIP', '/profile'],
  ['รายได้คอมมิชชั่น', '/affiliate'],
  ['แนะนำเพื่อน', '/affiliate'],
  ['คูปอง', '/bonus'],
  ['โบนัสพิเศษ', '/bonus'],
  ['ถ่ายทอดสด', '/live'],
] as const;

const SECONDARY_MENU = [
  ['โปรโมชั่น', '/promotions'],
  ['ข่าวสาร', '/notifications'],
  ['กิจกรรม', '/promotions'],
  ['ประวัติ', '/transactions'],
  ['แจ้งเตือน', '/notifications'],
  ['วีดีโอแนะนำ', '/guide'],
  ['แนะนำการใช้งาน', '/guide'],
] as const;

const HIGHLIGHT_TABS = ['ไฮไลท์', 'โปรโมชั่นแนะนำ', 'กิจกรรม', 'ข่าวสาร'] as const;

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

export default function MobileHomeRoot({ content, showPromotion }: MobileHomeRootProps) {
  const { locale, toggleLocale } = useMemberLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof HIGHLIGHT_TABS)[number]>('ไฮไลท์');
  const heroSlides = useMemo(() => getMobileHeroSlides(content), [content]);
  const announcementMessages = useMemo(() => getAnnouncementMessages(content), [content]);

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

  return (
    <main
      className={styles.root}
      data-mobile-home-root="true"
      data-ui-owner="mobile-home"
      aria-label="หน้าแรกมือถือ"
    >
      <header className={styles.header} data-mobile-section-owner="header">
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="เปิดเมนูสมาชิก"
            aria-expanded={menuOpen}
            aria-controls="mobile-home-drawer"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true"><i /><i /><i /></span>
          </button>

          <Link href="/" className={styles.logoLink} aria-label="NOAH345 หน้าแรก">
            <img src={LOGO_URL} alt="NOAH345" />
          </Link>

          <button type="button" className={styles.languageButton} aria-label="เปลี่ยนภาษา" onClick={toggleLocale}>
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
          aria-label="ปิดเมนูสมาชิก"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          id="mobile-home-drawer"
          className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
          aria-label="เมนูสมาชิก"
        >
          <div className={styles.drawerGlow} aria-hidden="true" />
          <div className={styles.drawerTop}>
            <img src={LOGO_URL} alt="NOAH345" />
            <button type="button" aria-label="ปิดเมนู" onClick={() => setMenuOpen(false)}>×</button>
          </div>

          <nav className={styles.primaryMenu} aria-label="บริการสมาชิก">
            {PRIMARY_MENU.map(([label, href], index) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}>
                <span className={styles.menuGlyph} aria-hidden="true">{index + 1}</span>
                <strong>{label}</strong>
                <span className={styles.menuArrow} aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>

          <nav className={styles.secondaryMenu} aria-label="เมนูเพิ่มเติม">
            {SECONDARY_MENU.map(([label, href], index) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}>
                <span className={styles.gridGlyph} aria-hidden="true">{index + 1}</span>
                <strong>{label}</strong>
              </Link>
            ))}
            <button type="button" onClick={toggleLocale}>
              <img src={`/images/flags/${locale}.svg`} alt="" aria-hidden="true" />
              <strong>เปลี่ยนภาษา</strong>
            </button>
          </nav>

          <MobileAuthActions layout="drawer" onNavigate={() => setMenuOpen(false)} />
        </aside>
      </div>

      <div className={styles.pageContent}>
        {showPromotion && heroSlides.length > 0 ? (
          <section className={styles.hero} data-mobile-section-owner="hero" aria-label="โปรโมชั่น">
            <div className={styles.heroViewport}>
              <div className={styles.heroTrack} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                {heroSlides.map((slide, index) => (
                  <Link key={slide.id} href={slide.href} className={styles.heroSlide}>
                    <span>
                      <img src={slide.image} alt={slide.title || `โปรโมชั่น ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            {heroSlides.length > 1 ? (
              <div className={styles.heroDots} aria-label="เลือกโปรโมชั่น">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={index === activeSlide ? styles.heroDotActive : ''}
                    aria-label={slide.title || `โปรโมชั่น ${index + 1}`}
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
          aria-label="สมัครสมาชิกหรือเข้าสู่ระบบ"
          style={{ width: '100%', padding: '12px 12px 0' }}
        >
          <MobileAuthActions layout="page" />
        </section>

        {announcementMessages.length > 0 ? (
          <section className={styles.announcement} data-mobile-section-owner="announcement" aria-label="ประกาศ">
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

        <nav className={styles.highlightTabs} data-mobile-section-owner="highlight-tabs" aria-label="หัวข้อหน้าแรก">
          {HIGHLIGHT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? styles.highlightTabActive : ''}
              aria-current={activeTab === tab ? 'page' : undefined}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className={styles.nextContentSlot} data-mobile-content-slot="after-highlight" aria-label="พื้นที่เนื้อหาถัดไป" />
      </div>

      <div className={styles.bottomStructure} data-mobile-bottom-owner="true">
        <section className={styles.shortcutSection} data-mobile-section-owner="shortcut" aria-labelledby="mobile-shortcut-title">
          <h2 id="mobile-shortcut-title">เพิ่มปุ่มลัดหน้าโฮม</h2>
          <div className={styles.shortcutCard} data-mobile-shortcut-card="true">
            <div className={styles.shortcutContent}>
              <div className={styles.shortcutIntro}>
                <img src={LOGO_URL} alt="NOAH345" />
                <div>
                  <strong>เพิ่มปุ่มลัดได้แล้ววันนี้!</strong>
                  <span>สัมผัสประสบการณ์ที่เหนือกว่า เพิ่มปุ่มเลย</span>
                </div>
              </div>
              <div className={styles.shortcutActions}>
                <span className={styles.androidButton} aria-disabled="true">Android</span>
                <Link href="/download" className={styles.iosButton}>iOS</Link>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.mobileFooter} data-mobile-section-owner="footer" aria-label="ข้อมูลเว็บไซต์มือถือ">
          <section className={styles.paymentSection} aria-labelledby="mobile-payment-title">
            <h2 id="mobile-payment-title">วิธีการชำระเงิน</h2>
            <div className={styles.bankGrid}>
              {BANKS.map((bank) => (
                <img key={bank} src={`${SOURCE_ROOT}/banks/TH/${bank}.webp`} alt={bank} loading="lazy" />
              ))}
            </div>
          </section>

          <div className={styles.footerDivider} aria-hidden="true" />

          <div className={styles.footerTopRow}>
            <section>
              <strong>ติดต่อเรา</strong>
              <a href="https://lin.ee/UYkP0OC" target="_blank" rel="noopener noreferrer" aria-label="ติดต่อเราผ่าน LINE">
                <img src={`${SOURCE_ROOT}/line.png`} alt="LINE" loading="lazy" />
              </a>
            </section>
            <section>
              <strong>รับผิดชอบในการเดิมพัน</strong>
              <img src={`${SOURCE_ROOT}/footer/gamecare.webp`} alt="Game Care" loading="lazy" />
            </section>
          </div>

          <div className={styles.footerDivider} aria-hidden="true" />

          <div className={styles.footerBottomRow}>
            <section className={styles.licenseSection}>
              <div className={styles.licenseTitle}>
                <strong>ใบอนุญาตและใบรับรอง</strong>
                <span>(การันตีเกมลิขสิทธิ์แท้)</span>
              </div>
              <div className={styles.licenseGrid}>
                {LICENSE_BADGES.map(([name, url]) => (
                  <img key={name} src={url} alt={name} loading="lazy" />
                ))}
              </div>
            </section>

            <section className={styles.securitySection}>
              <strong>การรองรับและความปลอดภัยโดย</strong>
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

function MobileAuthActions({ layout, onNavigate }: MobileAuthActionsProps) {
  const isPage = layout === 'page';

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
        label="สมัครสมาชิก"
        className={styles.registerButton}
        horizontal={isPage}
        onNavigate={onNavigate}
      />
      <AuthActionLink
        href="/?auth=login"
        label="เข้าสู่ระบบ"
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

function getMobileHeroSlides(content: CmsContent): MobileHeroSlide[] {
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
      title: banner.title || `โปรโมชั่น ${index + 1}`,
    });
  });

  return slides;
}

function getAnnouncementMessages(content: CmsContent) {
  const seenMessages = new Set<string>();
  const messages: string[] = [];

  content.announcements.forEach((announcement) => {
    if (!announcement.enabled || announcement.lifecycle === 'draft' || announcement.lifecycle === 'archived') return;

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
