import styles from './source-game-category-skeleton.module.css';

type SourceGameCategorySkeletonProps = {
  filterCount: number;
  showProviderStrip: boolean;
};

export default function SourceGameCategorySkeleton({
  filterCount,
  showProviderStrip,
}: SourceGameCategorySkeletonProps) {
  const visibleFilterCount = Math.max(2, Math.min(6, filterCount || 4));

  return (
    <>
      <aside className={styles.filterPanel} aria-hidden="true">
        <div className={`${styles.filterTitle} ${styles.skeletonSurface}`} />

        <div className={styles.filterSection}>
          <span className={`${styles.sectionHeading} ${styles.skeletonSurface}`} />
          <div className={styles.filterRows}>
            {Array.from({ length: visibleFilterCount }, (_, index) => (
              <span key={`filter-${index}`} className={styles.filterRow}>
                <i className={`${styles.checkbox} ${styles.skeletonSurface}`} />
                <i className={`${styles.filterLabel} ${styles.skeletonSurface}`} />
                <i className={`${styles.filterCount} ${styles.skeletonSurface}`} />
              </span>
            ))}
          </div>
        </div>

        {showProviderStrip ? (
          <div className={styles.filterSection}>
            <span className={`${styles.sectionHeading} ${styles.skeletonSurface}`} />
            <div className={styles.providerRows}>
              {Array.from({ length: 9 }, (_, index) => (
                <i key={`provider-${index}`} className={`${styles.providerCard} ${styles.skeletonSurface}`} />
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.summary}>
          <span className={`${styles.summaryBox} ${styles.skeletonSurface}`} />
          <span className={`${styles.summaryButton} ${styles.skeletonSurface}`} />
        </div>
      </aside>

      <section className={styles.gameArea} role="status" aria-label="กำลังโหลดรายการเกม">
        <div className={`${styles.heading} ${styles.skeletonSurface}`} />
        <div className={styles.gameGrid}>
          {Array.from({ length: 18 }, (_, index) => (
            <article key={`game-${index}`} className={styles.gameCard}>
              <div className={`${styles.gameCover} ${styles.skeletonSurface}`} />
              <div className={`${styles.gameLabel} ${styles.skeletonSurface}`} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
