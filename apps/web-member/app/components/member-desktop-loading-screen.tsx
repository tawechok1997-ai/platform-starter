import styles from './member-desktop-loading-screen.module.css';

const LOGO_URL = '/assets/asset-pc/images/FEZX/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png';

export default function MemberDesktopLoadingScreen() {
  return (
    <main
      className={styles.screen}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
      data-member-loading-owner="desktop"
    >
      <div className={styles.skeleton} aria-hidden="true">
        <div className={styles.skeletonHeader}>
          <span className={styles.skeletonLogo} />
          <span className={styles.skeletonNav} />
          <span className={styles.skeletonNav} />
          <span className={styles.skeletonNav} />
          <span className={styles.skeletonNavShort} />
          <span className={styles.skeletonAccount} />
        </div>
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonSectionTitle} />
        <div className={styles.skeletonCards}>
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className={styles.skeletonCard} />
          ))}
        </div>
        <div className={styles.skeletonSectionTitleSmall} />
        <div className={styles.skeletonRows}>
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className={styles.stage} aria-hidden="true">
        <span className={styles.aura} />
        <span className={styles.orbit}>
          <i />
          <i />
        </span>
        <span className={styles.logoShell}>
          <img src={LOGO_URL} alt="" />
        </span>
        <span className={styles.loadingDots}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.progressTrack}>
          <i />
        </span>
      </div>

      <span className={styles.srOnly}>กำลังโหลดข้อมูลสมาชิก</span>
    </main>
  );
}
