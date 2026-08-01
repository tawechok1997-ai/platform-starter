import styles from './member-loading-screen.module.css';

const LOGO_URL = '/assets/asset-pc/images/FEZX/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png';

export default function MemberLoadingScreen() {
  return (
    <main
      className={styles.screen}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
      data-member-loading-owner="true"
    >
      <header className={styles.header} aria-hidden="true">
        <span className={styles.menuIcon}>
          <i />
          <i />
          <i />
        </span>

        <img className={styles.logo} src={LOGO_URL} alt="" />

        <span className={styles.flag}>
          <img src="/images/flags/th.svg" alt="" />
        </span>
      </header>

      <div className={styles.loadingWord} aria-hidden="true">
        <span>L</span>
        <span className={styles.spinner} />
        <span>ading</span>
      </div>

      <span className={styles.srOnly}>กำลังโหลด</span>
    </main>
  );
}
