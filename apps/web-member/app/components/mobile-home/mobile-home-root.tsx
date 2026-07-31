import styles from './mobile-home-root.module.css';

export default function MobileHomeRoot() {
  return (
    <main
      className={styles.root}
      data-mobile-home-root="true"
      data-ui-owner="mobile-home"
      aria-label="หน้าแรกมือถือ"
    />
  );
}
