import styles from './member-desktop-loading-screen.module.css';

export default function MemberDesktopLoadingScreen() {
  return (
    <main
      className={styles.screen}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
      data-member-loading-owner="desktop"
    >
      <div className={styles.loadingWord} aria-hidden="true">
        <span>L</span>
        <span className={styles.spinner} />
        <span>ading</span>
      </div>
      <span className={styles.srOnly}>กำลังโหลด</span>
    </main>
  );
}
