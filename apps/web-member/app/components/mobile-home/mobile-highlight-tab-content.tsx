import Link from 'next/link';
import MobileSourceContent from './mobile-source-content';
import styles from './mobile-highlight-tab-content.module.css';

export type MobileHighlightTab = 'ไฮไลท์' | 'โปรโมชั่นแนะนำ' | 'กิจกรรม' | 'ข่าวสาร';

const PROMOTIONS = [
  'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
  'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
  'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
] as const;

const ACTIVITIES = [
  {
    title: 'ภารกิจ',
    date: '',
    image: 'https://cdn.zabbet.com/event/predict/1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d.jpeg',
  },
  {
    title: 'ทายผลหวย',
    date: '2026-08-01',
    image: 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
  },
  {
    title: 'ทำยอด Turn รับรางวัลจุใจ',
    date: '',
    image: 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  },
] as const;

type MobileHighlightTabContentProps = {
  activeTab: MobileHighlightTab;
};

export default function MobileHighlightTabContent({ activeTab }: MobileHighlightTabContentProps) {
  if (activeTab === 'โปรโมชั่นแนะนำ') {
    return (
      <section className={styles.panel} data-mobile-highlight-panel="promotions" aria-label="โปรโมชั่นแนะนำ">
        <div className={styles.promotionList}>
          {PROMOTIONS.map((image, index) => (
            <Link key={image} href="/promotions" className={styles.promotionCard} aria-label={`โปรโมชั่นแนะนำ ${index + 1}`}>
              <img src={image} alt={`โปรโมชั่นแนะนำ ${index + 1}`} loading="lazy" />
            </Link>
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === 'กิจกรรม') {
    return (
      <section className={styles.panel} data-mobile-highlight-panel="activities" aria-label="กิจกรรม">
        <div className={styles.activityList}>
          {ACTIVITIES.map((activity) => (
            <article key={`${activity.title}-${activity.image}`} className={styles.activityCard}>
              <img src={activity.image} alt={activity.title} loading="lazy" />
              <div className={styles.activityContent}>
                <strong>{activity.title}</strong>
                <span>{activity.date}</span>
                <Link href="/promotions" className={styles.joinButton}>เข้าร่วม</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === 'ข่าวสาร') {
    return (
      <section className={`${styles.panel} ${styles.newsPanel}`} data-mobile-highlight-panel="news" aria-label="ข่าวสาร">
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
            <path d="M87.4313 36.6079H23.2148V72.7297C23.2148 74.8586 24.0605 76.9003 25.5659 78.4057C27.0713 79.911 29.113 80.7567 31.2419 80.7567H79.4043C81.5332 80.7567 83.5749 79.911 85.0803 78.4057C86.5856 76.9003 87.4313 74.8586 87.4313 72.7297V36.6079Z" fill="#e0b1f1" />
            <rect x="47.8984" y="46.6665" width="14.7373" height="4.91244" rx="2.45622" fill="#a800cb" />
            <path fillRule="evenodd" clipRule="evenodd" d="M7.75354 17.3131C5.69718 17.8641 3.94392 19.2094 2.87946 21.0531C1.81501 22.8968 1.52655 25.0878 2.07756 27.1442L4.15511 34.8977C4.70611 36.9541 6.05144 38.7073 7.89513 39.7718C9.73881 40.8362 11.9298 41.1247 13.9862 40.5737L70.8455 25.3383C72.9019 24.7873 74.6552 23.442 75.7196 21.5983C76.7841 19.7546 77.0725 17.5636 76.5215 15.5072L74.444 7.75365C73.893 5.69728 72.5476 3.94402 70.7039 2.87957C68.8603 1.81511 66.6692 1.52666 64.6129 2.07766L7.75354 17.3131Z" fill="#a800cb" />
            <path d="M68.7734 34.9999C68.7734 34.9999 88.4232 29.4736 85.3529 23.3325C83.6882 20.0027 78.9134 20.2331 76.1421 22.7188C72.9487 25.5831 73.0805 33.1571 77.3702 33.1571C80.4405 33.1571 87.8092 33.7712 93.3356 30.7009C101.991 25.8924 103.775 22.1041 106.231 16.5776" stroke="#e0b1f1" strokeWidth="1.22811" strokeLinecap="round" strokeDasharray="2.46 2.46" />
            <path fillRule="evenodd" clipRule="evenodd" d="M112.255 7.82712C112.565 6.82343 111.295 6.09573 110.586 6.87357L110.558 6.90437L110.503 6.9649C110.112 7.39089 109.603 7.69103 109.04 7.82732C108.478 7.96361 107.888 7.9299 107.344 7.73046C106.326 7.3579 105.558 8.68737 106.391 9.38219C106.837 9.75445 107.162 10.2512 107.324 10.8089C107.487 11.3667 107.479 11.9602 107.303 12.5137L107.27 12.6186C106.95 13.6205 108.214 14.3572 108.929 13.5858L109.017 13.492C109.411 13.067 109.922 12.768 110.486 12.6326C111.05 12.4972 111.642 12.5314 112.186 12.7309C113.207 13.1047 113.976 11.7731 113.141 11.076C112.686 10.6957 112.355 10.1864 112.194 9.61509C112.033 9.04372 112.049 8.43699 112.239 7.87458L112.255 7.82712Z" fill="#e0b1f1" />
          </svg>
          <strong>คุณยังไม่มีข้อความใหม่</strong>
        </div>
      </section>
    );
  }

  return <MobileSourceContent />;
}
