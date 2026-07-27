import styles from './casino-alliance-band.module.css';

const ROW_ONE = [
  'evoplay', 'cq9', 'jili', 'playstar', 'joker', 'ebet',
  'popk', 'evoplay', 'cq9', 'jili', 'playstar', 'joker',
] as const;

const ROW_TWO = [
  'jili', 'playstar', 'evoplay', 'ebet', 'popk', 'cq9',
  'evoplay', 'jili', 'playstar', 'joker', 'evoplay',
] as const;

export default function CasinoAllianceBand() {
  return (
    <section className={styles.section} aria-labelledby="casino-alliance-heading">
      <div className={styles.inner}>
        <h2 id="casino-alliance-heading">พันธมิตรของเรา</h2>
        <div className={styles.rows}>
          <AllianceRow logos={ROW_ONE} className={styles.rowOne ?? ''} />
          <AllianceRow logos={ROW_TWO} className={styles.rowTwo ?? ''} />
        </div>
      </div>
    </section>
  );
}

function AllianceRow({ logos, className }: { logos: readonly string[]; className: string }) {
  return (
    <div className={`${styles.row} ${className}`}>
      {logos.map((logo, index) => (
        <span key={`${logo}-${index}`} className={styles.card} title={logo}>
          <img src={`/assets/asset-pc/images/alliance/${logo}.webp`} alt={logo} loading="eager" decoding="sync" />
        </span>
      ))}
    </div>
  );
}
