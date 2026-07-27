'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './sport-browse-source.module.css';

type SportProvider = {
  code: string;
  name: string;
  card: string;
  background: string;
  title: string;
  avatar: string;
  isNew?: boolean;
};

const PROVIDERS: readonly SportProvider[] = [
  {
    code: 'sbo',
    name: 'SBO',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/sbo.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/sbo.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/sbo.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/sbo.png',
  },
  {
    code: 'lali',
    name: 'Lalika',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/lali.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/lali.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/lali.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/lali.png',
  },
  {
    code: 'bcs',
    name: 'Betconstruct',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/bcs.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/bcs.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/bcs.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/bcs.png',
    isNew: true,
  },
  {
    code: 'muay',
    name: 'Muay Pakyok',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/muay.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/muay.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/muay.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/muay.png',
    isNew: true,
  },
  {
    code: 'saba',
    name: 'Saba',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/saba.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/saba.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/saba.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/saba.png',
  },
] as const;

export default function SportBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const activeProvider = PROVIDERS.find((provider) => provider.code === selectedProvider);
  const visibleProviders = useMemo(
    () => activeProvider ? [activeProvider] : [...PROVIDERS],
    [activeProvider],
  );

  const clearFilter = () => setSelectedProvider('all');

  const openProvider = (provider: SportProvider) => {
    if (!ready || !isLoggedIn) {
      window.location.assign('/?auth=login&next=%2Fbrowse%2Fgames%3Fcategory%3Dsport');
      return;
    }
    window.location.assign(`/games?provider=${encodeURIComponent(provider.code)}&category=sport`);
  };

  return (
    <main className={styles.page}>
      <div className={styles.backgroundStack} aria-hidden="true">
        <div className={styles.baseBackground} />
        {PROVIDERS.map((provider) => (
          <img
            key={provider.code}
            className={`${styles.providerBackground}${activeProvider?.code === provider.code ? ` ${styles.providerBackgroundActive}` : ''}`}
            src={provider.background}
            alt=""
          />
        ))}
        <div className={styles.purpleWash} />
        <div className={styles.bottomFade} />
      </div>

      <section className={styles.content} aria-label="กีฬา">
        <header className={styles.heroTitle}>
          <img
            className={`${styles.baseTitle}${activeProvider ? ` ${styles.baseTitleHidden}` : ''}`}
            src="/images/game/sport/logo_sport.webp"
            alt="กีฬา"
            onError={swapToAssetBundle}
          />
          {PROVIDERS.map((provider) => (
            <img
              key={`${provider.code}-title`}
              className={`${styles.providerTitle}${activeProvider?.code === provider.code ? ` ${styles.providerTitleActive}` : ''}`}
              src={provider.title}
              alt={provider.name}
            />
          ))}
          {PROVIDERS.map((provider) => (
            <img
              key={`${provider.code}-avatar`}
              className={`${styles.providerAvatar}${activeProvider?.code === provider.code ? ` ${styles.providerAvatarActive}` : ''}`}
              src={provider.avatar}
              alt=""
              aria-hidden="true"
            />
          ))}
        </header>

        <div className={styles.layout}>
          <aside className={styles.filterPanel} aria-label="ตัวกรองกีฬา">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>

            <div className={styles.providerHeading}>
              <strong>ค้นหาค่ายเกม</strong>
              <span>เลือกอย่างใดอย่างหนึ่ง</span>
            </div>

            <div className={styles.providerButtons}>
              {PROVIDERS.map((provider) => {
                const selected = selectedProvider === provider.code;
                return (
                  <button
                    key={provider.code}
                    type="button"
                    className={`${styles.providerButton}${selected ? ` ${styles.providerButtonActive}` : ''}`}
                    onClick={() => setSelectedProvider((current) => current === provider.code ? 'all' : provider.code)}
                    aria-pressed={selected}
                  >
                    <img src={provider.card} alt={provider.name} />
                    <span>{provider.name}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.filterSummary}>
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>{visibleProviders.length} ค่าย</strong></div>
              <button type="button" onClick={clearFilter}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="ผู้ให้บริการกีฬา">
            <h1>กีฬา ({visibleProviders.length} เกม)</h1>
            <div className={styles.gameGrid}>
              {visibleProviders.map((provider) => (
                <article key={provider.code} className={styles.gameCard}>
                  <button
                    type="button"
                    className={styles.gameCover}
                    onClick={() => openProvider(provider)}
                    aria-label={`เปิด ${provider.name}`}
                  >
                    <img className={styles.gameImage} src={provider.card} alt={provider.name} />
                    {provider.isNew ? <span className={styles.newBadge}>★ <b>NEW</b></span> : null}
                    <span className={styles.playOverlay}><b>เข้าเล่น</b></span>
                  </button>
                  <p>{provider.name}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function swapToAssetBundle(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = '/assets/asset-pc/images/game/sport/logo_sport.webp';
}
