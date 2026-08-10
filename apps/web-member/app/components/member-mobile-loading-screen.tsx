import styles from './member-mobile-loading-screen.module.css';

const LOGO_URL = '/assets/asset-pc/images/FEZX/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png';

export default function MemberMobileLoadingScreen() {
  return (
    <main
      className={styles.screen}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
      data-member-loading-owner="mobile"
    >
      <header className={styles.header} aria-hidden="true">
        <span className={styles.menuIcon}>
          <i />
          <i />
          <i />
        </span>

        <img className={styles.headerLogo} src={LOGO_URL} alt="" />

        <span className={styles.flag}>
          <img src="/images/flags/th.svg" alt="" />
        </span>
      </header>

      <div className={styles.skeleton} aria-hidden="true">
        <span className={styles.skeletonHero} />
        <span className={styles.skeletonAction} />
        <span className={styles.skeletonAction} />
        <span className={styles.skeletonTicker} />
        <div className={styles.skeletonContent}>
          <span className={styles.skeletonRail} />
          <div className={styles.skeletonCards}>
            <span />
            <span />
            <span />
            <span />
          </div>
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
