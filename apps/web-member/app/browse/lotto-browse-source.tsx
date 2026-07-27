'use client';

import { useMemo, useState } from 'react';
import MemberAuthOverlay from '../components/auth/member-auth-overlay';
import { useMemberSession } from '../member-session-provider';
import styles from './lotto-browse-source.module.css';

type LottoProvider = {
  code: string;
  name: string;
  card: string;
  background: string;
  title: string;
  avatar: string;
  isNew?: boolean;
};

const PROVIDERS: readonly LottoProvider[] = [
  {
    code: 'lotmw',
    name: 'RB7 Lotto',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/lotmw.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/lotmw.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/lotmw.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/lotmw.png',
    isNew: true,
  },
  {
    code: 'dac',
    name: 'Huay Dragon',
    card: 'https://cdn.zabbet.com/providers/set/1_1_v/dac.png',
    background: 'https://cdn.zabbet.com/providers/set/1_1_bg/dac.png',
    title: 'https://cdn.zabbet.com/providers/set/1_1_title/dac.png',
    avatar: 'https://cdn.zabbet.com/providers/set/1_1_avatar/dac.png',
  },
] as const;

export default function LottoBrowseSource() {
  const { ready, isLoggedIn, verify } = useMemberSession();
  const [newOnly, setNewOnly] = useState(false);
  const [previewProvider, setPreviewProvider] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<LottoProvider | null>(null);

  const activeProvider = PROVIDERS.find((provider) => provider.code === previewProvider) ?? null;
  const visibleProviders = useMemo(
    () => newOnly ? PROVIDERS.filter((provider) => provider.isNew) : [...PROVIDERS],
    [newOnly],
  );

  const clearFilters = () => {
    setNewOnly(false);
    setPreviewProvider(null);
  };

  const goToProvider = (provider: LottoProvider) => {
    window.location.assign(`/games?provider=${encodeURIComponent(provider.code)}&category=lotto`);
  };

  const openProvider = (provider: LottoProvider) => {
    if (!ready || !isLoggedIn) {
      setPendingProvider(provider);
      setAuthOpen(true);
      return;
    }
    goToProvider(provider);
  };

  const handleAuthSuccess = async () => {
    const authenticated = await verify();
    if (!authenticated) return;
    setAuthOpen(false);
    if (pendingProvider) goToProvider(pendingProvider);
    setPendingProvider(null);
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

      <section className={styles.content} aria-label="หวย">
        <header className={styles.heroTitle}>
          <img
            className={`${styles.baseTitle}${activeProvider ? ` ${styles.baseTitleHidden}` : ''}`}
            src="/images/game/lotto/logo_lotto.webp"
            alt="หวย"
            onError={(event) => {
              event.currentTarget.src = '/assets/asset-pc/images/game/lotto/logo_lotto.webp';
            }}
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
          <aside className={styles.filterPanel} aria-label="ตัวกรองหวย">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>

            <div className={styles.filterHeading}>
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>

            <div className={styles.filterOptions}>
              <label className={styles.filterOption}>
                <input type="checkbox" checked={newOnly} onChange={(event) => setNewOnly(event.target.checked)} />
                <span className={`${styles.checkbox}${newOnly ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">{newOnly ? '✓' : ''}</span>
                <span>เกมส์ใหม่</span>
                <small>( 1 )</small>
              </label>
            </div>

            <div className={styles.filterSummary}>
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>{visibleProviders.length} ค่าย</strong></div>
              <button type="button" onClick={clearFilters}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="ผู้ให้บริการหวย">
            <h1>หวย ({visibleProviders.length} เกม)</h1>
            <div className={styles.gameGrid}>
              {visibleProviders.map((provider) => (
                <article
                  key={provider.code}
                  className={styles.gameCard}
                  onMouseEnter={() => setPreviewProvider(provider.code)}
                  onMouseLeave={() => setPreviewProvider(null)}
                  onFocus={() => setPreviewProvider(provider.code)}
                  onBlur={() => setPreviewProvider(null)}
                >
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

      {authOpen ? (
        <MemberAuthOverlay
          mode="login"
          onClose={() => {
            setAuthOpen(false);
            setPendingProvider(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      ) : null}
    </main>
  );
}
