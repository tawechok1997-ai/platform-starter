'use client';

import { useState, type SyntheticEvent } from 'react';
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
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const activeProvider = PROVIDERS.find((provider) => provider.code === activeCode) ?? null;

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
            <div className={styles.collapsedFilterHeading} aria-hidden="true">
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>
            <div className={styles.filterSpacer} aria-hidden="true" />
            <div className={styles.filterSummary}>
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>5 ค่าย</strong></div>
              <button type="button" onClick={() => setActiveCode(null)}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="ผู้ให้บริการกีฬา">
            <h1>กีฬา (5 เกม)</h1>
            <div className={styles.gameGrid}>
              {PROVIDERS.map((provider) => (
                <article
                  key={provider.code}
                  className={styles.gameCard}
                  onMouseEnter={() => setActiveCode(provider.code)}
                  onMouseLeave={() => setActiveCode(null)}
                >
                  <button
                    type="button"
                    className={styles.gameCover}
                    onFocus={() => setActiveCode(provider.code)}
                    onBlur={() => setActiveCode(null)}
                    onClick={() => openProvider(provider)}
                    aria-label={`เปิด ${provider.name}`}
                  >
                    <img className={styles.gameImage} src={provider.card} alt={provider.name} />
                    {provider.isNew ? <span className={styles.newBadge}><StarIcon /><b>NEW</b></span> : null}
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

function StarIcon() {
  return (
    <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
      <path d="M4.83735.0547C4.81325.0949 4.50602.6694 4.15663 1.3358 3.65663 2.2895 3.4759 2.5825 3.30723 2.7089 3.10843 2.8582 2.9759 2.887 1.68072 3.0708.228916 3.2719 0 3.3236 0 3.4557c0 .0402.475904.5228 1.06024 1.0743.58434.5515 1.09639 1.0743 1.14458 1.1605.12651.2298.10843.5228-.13253 1.8154-.22892 1.2582-.23494 1.465-.06627 1.4937.06024.0115.6747-.2643 1.36747-.6147.6988-.3447 1.36145-.6492 1.46988-.6722.29518-.0517.47591.023.83735.7009.66868.3332 1.25904.5975 1.31326.586.16867-.0287.16265-.2298-.06627-1.4879-.23494-1.2696-.25904-1.6086-.13253-1.8326.04819-.0747.56024-.5917 1.14458-1.149.58434-.5515 1.06024-1.0398 1.06024-1.08 0-.1264-.24096-.1781-1.68072-.3792-1.29518-.1838-1.42771-.2126-1.62651-.3619-.16867-.1264-.35542-.4251-.87952-1.4248C5.28313.2787 5.12651.0144 5.01807.003c-.06626-.0115-.1506.0115-.18072.0517Z" fill="white" />
    </svg>
  );
}

function swapToAssetBundle(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = '/assets/asset-pc/images/game/sport/logo_sport.webp';
}
