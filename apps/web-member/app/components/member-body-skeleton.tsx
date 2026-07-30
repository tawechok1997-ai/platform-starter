import styles from './member-body-skeleton.module.css';

type MemberBodySkeletonProps = {
  label?: string;
};

const CARD_COUNT = 18;
const FILTER_COUNT = 5;

export default function MemberBodySkeleton({ label = 'กำลังโหลดเนื้อหา' }: MemberBodySkeletonProps) {
  return (
    <main className={styles.root} aria-busy="true" aria-live="polite" aria-label={label}>
      <span className={styles.srOnly}>{label}</span>

      <div className={`${styles.block} ${styles.hero}`} />

      <div className={styles.layout}>
        <aside className={`${styles.panel} ${styles.filterPanel}`} aria-hidden="true">
          <div className={`${styles.block} ${styles.filterTitle}`} />
          <div className={`${styles.block} ${styles.filterBanner}`} />
          <div className={styles.filterRows}>
            {Array.from({ length: FILTER_COUNT }, (_, index) => (
              <div className={styles.filterRow} key={index}>
                <span className={`${styles.block} ${styles.checkbox}`} />
                <span className={`${styles.block} ${styles.filterText}`} />
              </div>
            ))}
          </div>
          <div className={`${styles.block} ${styles.summary}`} />
          <div className={`${styles.block} ${styles.button}`} />
        </aside>

        <section className={styles.content} aria-hidden="true">
          <div className={styles.headingRow}>
            <div className={`${styles.block} ${styles.heading}`} />
            <div className={`${styles.block} ${styles.headingAction}`} />
          </div>

          <div className={styles.providerRow}>
            {Array.from({ length: 7 }, (_, index) => (
              <span className={`${styles.block} ${styles.provider}`} key={index} />
            ))}
          </div>

          <div className={styles.gameGrid}>
            {Array.from({ length: CARD_COUNT }, (_, index) => (
              <article className={styles.card} key={index}>
                <div className={`${styles.block} ${styles.cover}`} />
                <div className={`${styles.block} ${styles.cardTitle}`} />
                <div className={`${styles.block} ${styles.cardMeta}`} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
