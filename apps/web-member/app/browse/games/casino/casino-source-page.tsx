'use client';

import { useMemo, useState } from 'react';
import { useMemberSession } from '../../../member-session-provider';
import styles from './casino-source-page.module.css';

const CASINO_ROOT = '/assets/asset-pc/images/game/casino';
const PROVIDER_ROOT = '/assets/asset-pc/images/providers/set';

const CASINO_PROVIDERS = [
  { id: 'dg', name: 'DREAM GAMING', providerId: 'provider_13', isNew: false },
  { id: 'sexyd', name: 'Sexy Baccarat', providerId: 'provider_67', isNew: false },
  { id: 'yeebet', name: 'Yeebet', providerId: 'provider_102', isNew: true },
  { id: 'sag', name: 'SA GAMING', providerId: 'provider_17', isNew: false },
  { id: 'ppcasino', name: 'PRAGMATIC PLAY Casino', providerId: 'provider_30', isNew: false },
  { id: 'evt', name: 'EVOLUTION', providerId: 'provider_19', isNew: false },
  { id: 'ab', name: 'AllBet', providerId: 'provider_45', isNew: false },
  { id: 'wmc', name: 'WM CASINO', providerId: 'provider_6', isNew: false },
  { id: 'biggamecasino', name: 'Biggame casino', providerId: 'provider_48', isNew: false },
  { id: 'astar', name: 'Astar', providerId: 'provider_98', isNew: true },
] as const;

type CasinoProvider = (typeof CASINO_PROVIDERS)[number];

function providerCardAsset(id: string) {
  return `${PROVIDER_ROOT}/1_1_v/${id}.png`;
}

export default function CasinoSourcePage() {
  const { ready, isLoggedIn } = useMemberSession();
  const [newOnly, setNewOnly] = useState(false);

  const visibleProviders = useMemo(
    () => (newOnly ? CASINO_PROVIDERS.filter((provider) => provider.isNew) : CASINO_PROVIDERS),
    [newOnly],
  );

  const loginNext = encodeURIComponent('/browse/games?category=casino');

  function gameHref(provider: CasinoProvider) {
    return ready && isLoggedIn
      ? `/games?category=casino&provider=${encodeURIComponent(provider.id)}`
      : `/?auth=login&next=${loginNext}`;
  }

  function clearFilters() {
    setNewOnly(false);
  }

  return (
    <main className={styles.page} data-casino-source="true" aria-labelledby="casino-page-title">
      <div className={styles.backgroundStack} data-casino-background aria-hidden="true">
        <img
          className={styles.baseBackground}
          src={`${CASINO_ROOT}/bg_casino.webp`}
          alt=""
        />
        <div className={styles.purpleOverlay} />
        <div className={styles.darkFade} />
      </div>

      <div className={styles.viewport} data-casino-viewport>
        <div className={styles.content} data-casino-content>
          <header className={styles.hero} data-casino-hero>
            <img
              className={styles.casinoLogo}
              src={`${CASINO_ROOT}/logo_casino.webp`}
              alt="คาสิโน"
            />
          </header>

          <div className={styles.layout} data-casino-layout>
            <aside className={styles.filterPanel} data-casino-filter aria-label="ตัวกรองคาสิโน">
              <div className={styles.filterGlow} aria-hidden="true" />
              <div className={styles.filterTitle}><h2>ตัวกรอง</h2></div>

              <div className={styles.filterStrip}>
                <strong>ค้นหาเกมที่คุณสนใจ</strong>
                <span>เลือกได้มากกว่าหนึ่ง</span>
              </div>

              <div className={styles.filterOptions}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={newOnly} onChange={(event) => setNewOnly(event.target.checked)} />
                  <span className={styles.checkbox} aria-hidden="true"><i /></span>
                  <span>เกมส์ใหม่</span>
                  <small>( 1 )</small>
                </label>
              </div>

              <div className={styles.filterActions}>
                <div className={styles.filterSummary}>
                  <span>พบเกมส์ที่คุณค้นหา</span>
                  <strong>{visibleProviders.length} ค่าย</strong>
                </div>
                <button type="button" className={styles.clearButton} onClick={clearFilters}>ล้าง</button>
              </div>
            </aside>

            <section className={styles.catalog} data-casino-catalog>
              <h1 id="casino-page-title">คาสิโน ({visibleProviders.length} เกม)</h1>

              <div className={styles.grid} data-casino-grid>
                {visibleProviders.map((provider) => (
                  <article
                    key={provider.id}
                    className={styles.card}
                    data-casino-card
                  >
                    <div className={styles.cardMedia}>
                      {provider.isNew ? <NewBadge /> : null}
                      <a
                        className={styles.cardLink}
                        href={gameHref(provider)}
                        aria-label={`เปิด ${provider.name}`}
                      >
                        <img
                          src={providerCardAsset(provider.id)}
                          alt={provider.providerId}
                          loading="lazy"
                        />
                      </a>
                    </div>
                    <p>{provider.name}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function NewBadge() {
  return (
    <span className={styles.newBadge}>
      <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
        <path d="M4.83735 0.0546627C4.81325 0.0948772 4.50602 0.669378 4.15663 1.3358C3.65663 2.28947 3.4759 2.58247 3.30723 2.70886C3.10843 2.85823 2.9759 2.88695 1.68072 3.07079C0.228916 3.27187 0 3.32357 0 3.45571C0 3.49592 0.475904 3.9785 1.06024 4.53002C1.64458 5.08154 2.15663 5.60434 2.20482 5.69052C2.33133 5.92032 2.31325 6.21331 2.07229 7.50594C1.84337 8.76409 1.83735 8.97091 2.00602 8.99964C2.06626 9.01113 2.68072 8.73537 3.37349 8.38492C4.07229 8.04022 4.73494 7.73574 4.84337 7.71276C5.13855 7.66105 5.31928 7.73574 6.68072 8.41365C7.3494 8.74686 7.93976 9.01113 7.99398 8.99964C8.16265 8.97091 8.15663 8.76984 7.92771 7.51168C7.69277 6.24204 7.66867 5.90308 7.79518 5.67902C7.84337 5.60434 8.35542 5.08729 8.93976 4.53002C9.5241 3.9785 10 3.49018 10 3.44996C10 3.32357 9.75904 3.27187 8.31928 3.07079C7.0241 2.88695 6.89157 2.85823 6.69277 2.70886C6.5241 2.58247 6.33735 2.28373 5.81325 1.28409C5.28313 0.278718 5.12651 0.0144472 5.01807 0.00295734C4.95181 -0.00853252 4.86747 0.0144472 4.83735 0.0546627Z" fill="currentColor" />
      </svg>
      <b>NEW</b>
    </span>
  );
}
