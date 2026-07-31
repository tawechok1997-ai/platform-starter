'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMemberLocale } from '../../member-locale-provider';
import styles from './mobile-home-root.module.css';

const SOURCE_ROOT = '/assets/asset-pc/images';
const LOGO_URL = 'https://cdn.zabbet.com/FEZX/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png';
const SHORTCUT_ART_URL = 'https://cdn.zabbet.com/FEZX/lobby_settings/fc6b7ea8-3eaf-47ec-8640-33c7138d3c7c.png';
const SHORTCUT_ICON_URL = 'https://cdn.zabbet.com/FEZX/lobby_settings/083e4b9b-63aa-4825-a0e3-57a88de57e2f.ico';

const HERO_SLIDES = [
  'https://cdn.zabbet.com/FEZX/imageslides/1785515208075-2e3c49ad-afac-48e1-b855-5385734de314.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1785515227053-d641c984-ff02-40c9-a0cc-faa7d9abee9c.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c.jpg',
] as const;

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

export default function MobileHomeRoot() {
  const { locale, toggleLocale } = useMemberLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof HIGHLIGHT_TABS)[number]>('ไฮไลท์');

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
        role="presentation"
        aria-hidden={!menuOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
      >
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

          <div className={styles.drawerAuth}>
            <Link href="/?auth=register" className={styles.registerButton} onClick={() => setMenuOpen(false)}>สมัครสมาชิก</Link>
            <Link href="/?auth=login" className={styles.loginButton} onClick={() => setMenuOpen(false)}>เข้าสู่ระบบ</Link>
          </div>
        </aside>
      </div>

      <div className={styles.pageContent}>
        <section className={styles.hero} data-mobile-section-owner="hero" aria-label="โปรโมชั่น">
          <div className={styles.heroViewport}>
            <div className={styles.heroTrack} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {HERO_SLIDES.map((image, index) => (
                <Link key={image} href={index === HERO_SLIDES.length - 1 ? '/promotions' : '#'} className={styles.heroSlide}>
                  <span><img src={image} alt={`โปรโมชั่น ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} /></span>
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.heroDots} aria-label="เลือกโปรโมชั่น">
            {HERO_SLIDES.map((image, index) => (
              <button
                key={image}
                type="button"
                className={index === activeSlide ? styles.heroDotActive : ''}
                aria-label={`โปรโมชั่น ${index + 1}`}
                aria-current={index === activeSlide ? 'true' : undefined}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </section>

        <section className={styles.announcement} data-mobile-section-owner="announcement" aria-label="ประกาศ">
          <span className={styles.announcementIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 10v4h3l4 4V6l-4 4H4Zm10.5-2.5a6 6 0 0 1 0 9M17 5a9.5 9.5 0 0 1 0 14" /></svg>
          </span>
          <span className={styles.announcementText}>ประกาศจากระบบ NOAH345</span>
        </section>

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
          <div className={styles.shortcutCard}>
            <img className={styles.shortcutArtwork} src={SHORTCUT_ART_URL} alt="" aria-hidden="true" />
            <div className={styles.shortcutContent}>
              <div className={styles.shortcutIntro}>
                <img src={SHORTCUT_ICON_URL} alt="NOAH345" />
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
