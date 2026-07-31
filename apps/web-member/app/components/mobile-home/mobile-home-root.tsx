'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMemberLocale } from '../../member-locale-provider';
import styles from './mobile-home-root.module.css';

const LOGO_URL = 'https://cdn.zabbet.com/FEZX/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png';

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
    </main>
  );
}
