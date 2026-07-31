'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './mobile-reference-page.module.css';

export type MobileReferenceSection =
  | 'vip'
  | 'live'
  | 'promotions'
  | 'news'
  | 'activities'
  | 'video'
  | 'guide'
  | 'language';

type AssetMap = Record<string, string>;

type MobileReferencePageProps = {
  section: MobileReferenceSection;
  assets: AssetMap;
};

const VIP_LEVELS = [
  {
    name: 'Bronze',
    required: '20,000',
    imageKey: 'vipBronze',
  },
  {
    name: 'Silver',
    required: '50,000',
    imageKey: 'vipSilver',
  },
] as const;

const VIP_BENEFITS = [
  {
    title: 'สิทธิประโยชน์ VIP',
    items: ['ฝ่ายบริการลูกค้าพิเศษ รายบุคคล', 'ยอดถอนสูงสุดต่อวัน', 'สิทธิ์เข้าร่วมกิจกรรมต่างๆ'],
  },
  {
    title: 'โบนัสพิเศษต่างๆ',
    items: ['โบนัสพิเศษวันเกิด'],
  },
] as const;

const CASHBACK = [
  ['กีฬา', '0%'],
  ['คาสิโน', '0%'],
  ['ยิงปลา', '0%'],
  ['สล็อต', '0%'],
  ['หวย', '0%'],
] as const;

const LIVE_GROUPS = [
  {
    league: 'โลก - อุ่นเครื่องสโมสร',
    date: '31 - 07 - 2026',
    matches: [['06:30', 'ซันเดอร์แลนด์', 'ลีดส์ ยูไนเต็ด', 'team683', 'team681']],
  },
  {
    league: 'อาร์เจนตินา - ปรีเมร่า ดิวิซิโอน',
    date: '31 - 07 - 2026',
    matches: [
      ['07:15', 'เซ็นทรัล คอร์โดบ้า', 'อัตเลติโก ตูคูมาน', 'team7031', 'team7064'],
      ['07:15', 'อินเดเปนเดียนเต้', 'นีเวลล์ส โอลด์ บอยส์', 'team100', 'team102'],
    ],
  },
  {
    league: 'บราซิล - เซเรีย อา',
    date: '31 - 07 - 2026',
    matches: [['07:30', 'โคริติบา', 'ครูไซโร่', 'team324', 'team304']],
  },
  {
    league: 'โคลอมเบีย - ลีกา อากีล่า',
    date: '31 - 07 - 2026',
    matches: [['08:00', 'อัตเลติโก บูคารามังก้า', 'ยาเนรอส', 'team466', 'team21661']],
  },
  {
    league: 'อเมริกาใต้ - โคปา ซูดาเมริกาน่า',
    date: '31 - 07 - 2026',
    matches: [
      ['07:30', 'คาราคัส', 'ซานตา เฟ่', 'team2303', 'team469'],
      ['07:30', 'โอฮิกกินส์', 'โบคา จูเนียร์ส', 'team2836', 'team95'],
    ],
  },
  {
    league: 'อเมริกาเหนือ/กลาง - คอนคาเคฟ แชมเปี้ยนส์ชิพ ยู-20',
    date: '31 - 07 - 2026',
    matches: [['08:00', 'เม็กซิโก', 'กัวเตมาลา', 'team1497', 'team1094']],
  },
] as const;

const PROMOTIONS = [
  {
    title: 'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
    expires: 'หมดเขต 01/06/2030',
    imageKey: 'promotionTurnover',
  },
  {
    title: 'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜',
    expires: 'หมดเขต 30/06/2029',
    imageKey: 'promotionReferral',
  },
  {
    title: 'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
    expires: 'หมดเขต 01/06/2027',
    imageKey: 'promotionDeposit',
  },
] as const;

const ACTIVITIES = [
  ['ภารกิจ', 'เข้าร่วม', 'activityMission'],
  ['ทายผลหวย', '2026-08-01', 'activityLottery'],
  ['ทำยอด Turn รับรางวัลจุใจ', 'เข้าร่วม', 'activityTurnover'],
] as const;

const GUIDE_GROUPS = [
  ['การฝากเงิน', ['ฝากเงินแบบ โอนผ่านธนาคาร', 'ฝากเงินแบบ โอนผ่าน QR Payment', 'ฝากเงินแบบ ฝากจุดทศนิยม', 'วิธีการฝากแบบ TrueWallet', 'ยอดไม่เข้าทันที ทำยังไงดี?']],
  ['การถอนเงิน', ['การถอนเงิน']],
  ['โปรโมชั่น', ['โปรโมชั่นแนะนำ']],
  ['รวบรวมทุกกิจกรรม', ['กิจกรรมทายผลคืออะไร?', 'สิ่งที่ต้องทำก่อนทายผล', 'เข้าร่วมกิจกรรมทายผลยังไง?', 'การประกาศรางวัล', 'ล็อคอินประจำวัน / ภารกิจ', 'ขั้นตอน : ทายผลบอล', 'ขั้นตอน : ทายผลมวย', 'ขั้นตอน : ทายผลหวย']],
  ['ข่าวสาร', ['ติดตามข่าวสาร']],
  ['การเข้าเล่นคาสิโน', ['เข้าเล่น : คาสิโน', 'เข้าเล่น : สล็อต', 'เข้าเล่น : ยิงปลา', 'เข้าเล่น : กีฬา', 'เข้าเล่น : ไพ่', 'เข้าเล่น : หวย']],
  ['ระบบสร้างรายได้เครือข่าย', ['สร้างรายได้เครือข่าย', 'ถอนรายได้เครือข่าย (แนะนำเพื่อน)']],
  ['สิทธิประโยชน์ลูกค้าเเต่ระดับ', ['วิธีการตรวจสอบระดับ', 'ระดับ Silver', 'ระดับ Gold', 'ระดับ Platinum', 'ระดับ Titanium', 'ระดับ Diamond', 'ระดับ VVIP']],
  ['ปัญหาอินเตอร์เน็ต', ['หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้', 'รีเฟรชหน้าเว็บไซต์']],
] as const;

const LANGUAGES = [
  ['English', 'flagEn', 'en'],
  ['ภาษาไทย', 'flagTh', 'th'],
  ['Tagalog', 'flagPh', 'ph'],
  ['Tiếng Việt', 'flagVi', 'vi'],
  ['ភាសាខ្មែរ', 'flagKm', 'km'],
  ['ພາສາລາວ', 'flagLo', 'lo'],
  ['Bahasa Indonesia', 'flagId', 'id'],
  ['Myan', 'flagMm', 'mm'],
] as const;

export default function MobileReferencePage({ section, assets }: MobileReferencePageProps) {
  const router = useRouter();

  return (
    <main className={styles.viewport} data-mobile-reference-section={section}>
      {section === 'language' ? (
        <LanguagePopup assets={assets} onClose={() => router.back()} />
      ) : (
        <div className={styles.phone}>
          <ReferenceHeader title={sectionTitle(section)} onBack={() => router.back()} />
          {section === 'vip' ? <VipPage assets={assets} /> : null}
          {section === 'live' ? <LivePage assets={assets} /> : null}
          {section === 'promotions' ? <PromotionsPage assets={assets} /> : null}
          {section === 'news' ? <NewsPage /> : null}
          {section === 'activities' ? <ActivitiesPage assets={assets} /> : null}
          {section === 'video' ? <VideoPopup /> : null}
          {section === 'guide' ? <GuidePage /> : null}
        </div>
      )}
    </main>
  );
}

function ReferenceHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className={styles.header}>
      <button type="button" aria-label="ย้อนกลับ" onClick={onBack}>
        <BackIcon />
      </button>
      <h1>{title}</h1>
    </header>
  );
}

function VipPage({ assets }: { assets: AssetMap }) {
  const [activeLevel, setActiveLevel] = useState(0);
  const selected = VIP_LEVELS[activeLevel];

  return (
    <div className={styles.vipBody}>
      <div className={styles.vipLevelRail} role="tablist" aria-label="ระดับสมาชิก">
        {VIP_LEVELS.map((level, index) => (
          <button
            key={level.name}
            type="button"
            className={index === activeLevel ? styles.vipLevelActive : ''}
            role="tab"
            aria-selected={index === activeLevel}
            onClick={() => setActiveLevel(index)}
          >
            <span><LockIcon /></span>
            <b>{level.name}</b>
          </button>
        ))}
      </div>

      <div className={styles.vipCardRail}>
        {VIP_LEVELS.map((level, index) => (
          <button
            key={level.name}
            type="button"
            className={`${styles.vipCard} ${index === activeLevel ? styles.vipCardActive : ''}`}
            onClick={() => setActiveLevel(index)}
          >
            <ExactImage src={assets[level.imageKey]} alt={level.name} className={styles.vipCharacter} />
            <span className={styles.vipGlass} aria-hidden="true" />
            <strong>{level.name}</strong>
            <div className={styles.vipRequirement}>
              <LockLargeIcon />
              <span>คุณมียอดแทงสะสมยังไม่ถึง {level.name}</span>
              <b>ต้องมียอดแทงครบ {level.required} เครดิต ขึ้นไป</b>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.vipSections}>
        {VIP_BENEFITS.map((group) => (
          <section key={group.title} className={styles.vipBenefitCard}>
            <NotchTitle>{group.title}</NotchTitle>
            <div className={styles.vipBenefitGrid}>
              {group.items.map((item) => (
                <div key={item}>
                  <span className={styles.vipBenefitIcon}><LockIcon /></span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className={styles.vipBenefitCard}>
          <NotchTitle>คืนเงินพิเศษ</NotchTitle>
          <div className={styles.cashbackGrid}>
            {CASHBACK.map(([label, value]) => (
              <div key={label}>
                <span className={styles.vipBenefitIcon}><LockIcon /></span>
                <b>{label}</b>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.vipCurrentNote}>
        ระดับที่เลือก: <strong>{selected.name}</strong>
      </div>
    </div>
  );
}

function NotchTitle({ children }: { children: React.ReactNode }) {
  return <div className={styles.notchTitle}><span>{children}</span></div>;
}

function LivePage({ assets }: { assets: AssetMap }) {
  const [sort, setSort] = useState<'time' | 'league'>('league');

  return (
    <div className={styles.liveBody}>
      <div className={styles.sportTabs}><button type="button">ฟุตบอล</button></div>
      <div className={styles.liveToolbar}>
        <strong>ฟุตบอล</strong>
        <div>
          <button type="button" className={sort === 'time' ? styles.sortActive : ''} onClick={() => setSort('time')}>เรียงเวลา</button>
          <button type="button" className={sort === 'league' ? styles.sortActive : ''} onClick={() => setSort('league')}>เรียงลีก</button>
        </div>
      </div>
      <div className={styles.liveGroups}>
        {LIVE_GROUPS.map((group) => (
          <section key={group.league} className={styles.leagueGroup}>
            <header><strong>{group.league}</strong><span>{group.date}</span></header>
            {group.matches.map(([time, home, away, homeKey, awayKey], index) => (
              <article key={`${group.league}-${home}`} className={index % 2 ? styles.matchAlt : ''}>
                <div className={styles.matchTeams}>
                  <div className={styles.matchTime}><b>{time}</b><span>LIVE</span></div>
                  <div>
                    <span><ExactImage src={assets[homeKey]} alt="" />{home}</span>
                    <span><ExactImage src={assets[awayKey]} alt="" />{away}</span>
                  </div>
                </div>
                <div className={styles.matchActions}>
                  <button type="button">ดูถ่ายทอดสด</button>
                  <button type="button">เดิมพันทันที</button>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function PromotionsPage({ assets }: { assets: AssetMap }) {
  const tabs = ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย'] as const;
  const [active, setActive] = useState<(typeof tabs)[number]>('ทั้งหมด');

  return (
    <div className={styles.promotionBody}>
      <div className={styles.filterRail}>
        {tabs.map((tab) => <button key={tab} type="button" className={tab === active ? styles.filterActive : ''} onClick={() => setActive(tab)}>{tab}</button>)}
      </div>
      <div className={styles.promotionList}>
        {PROMOTIONS.map((item) => (
          <article key={item.title} className={styles.promotionCard}>
            <ExactImage src={assets[item.imageKey]} alt={item.title} />
            <div><strong>{item.title}</strong><span>{item.expires}</span><button type="button">อ่านเงื่อนไข</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function NewsPage() {
  return <div className={styles.emptyBody}><BellIcon /><strong>ไม่มีข้อความใหม่</strong></div>;
}

function ActivitiesPage({ assets }: { assets: AssetMap }) {
  return (
    <div className={styles.activityBody}>
      <div className={styles.activityTabs}><button type="button">กิจกรรม</button></div>
      <div className={styles.activityList}>
        {ACTIVITIES.map(([title, label, imageKey]) => (
          <article key={title}>
            <ExactImage src={assets[imageKey]} alt={title} />
            <div><strong>{title}</strong><button type="button">{label}</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function VideoPopup() {
  const items = ['การสมัครสมาชิก', 'การฝากเงิน', 'การถอนเงิน', 'การเข้าเล่นเกม', 'กิจกรรมและโปรโมชั่น', 'การแก้ปัญหาเบื้องต้น'];
  const [selected, setSelected] = useState(0);

  return (
    <div className={styles.videoBody}>
      <section className={styles.videoPanel}>
        <div className={styles.videoFrame}><PlayIcon /><span>วีดีโอแนะนำการใช้งาน</span></div>
        <div className={styles.videoList}>
          {items.map((item, index) => (
            <button key={item} type="button" className={index === selected ? styles.videoSelected : ''} onClick={() => setSelected(index)}>
              <span>{index + 1}</span><strong>{item}</strong><ChevronIcon />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function GuidePage() {
  const tabs = ['ทั้งหมด', 'การฝาก - ถอน', 'กิจกรรม', 'การเข้าเล่น', 'สร้างรายได้เครือข่าย', 'สิทธิประโยชน์'] as const;
  const [active, setActive] = useState<(typeof tabs)[number]>('ทั้งหมด');

  const groups = useMemo(() => {
    if (active === 'ทั้งหมด') return GUIDE_GROUPS;
    if (active === 'การฝาก - ถอน') return GUIDE_GROUPS.slice(0, 2);
    if (active === 'กิจกรรม') return GUIDE_GROUPS.slice(2, 5);
    if (active === 'การเข้าเล่น') return GUIDE_GROUPS.slice(5, 6);
    if (active === 'สร้างรายได้เครือข่าย') return GUIDE_GROUPS.slice(6, 7);
    return GUIDE_GROUPS.slice(7, 8);
  }, [active]);

  return (
    <div className={styles.guideBody}>
      <div className={styles.guideTabs}>{tabs.map((tab) => <button key={tab} type="button" className={tab === active ? styles.guideTabActive : ''} onClick={() => setActive(tab)}>{tab}</button>)}</div>
      <div className={styles.guideGroups}>
        {groups.map(([title, items]) => (
          <section key={title}>
            <h2>{title}</h2>
            {items.map((item) => <button key={item} type="button"><span>{item}</span><ChevronIcon /></button>)}
          </section>
        ))}
      </div>
    </div>
  );
}

function LanguagePopup({ assets, onClose }: { assets: AssetMap; onClose: () => void }) {
  return (
    <div className={styles.languageOverlay}>
      <section className={styles.languageDialog}>
        <div className={styles.dialogBorder} aria-hidden="true" />
        <NotchTitle>เปลี่ยนภาษา</NotchTitle>
        <button type="button" className={styles.dialogClose} aria-label="ปิด" onClick={onClose}>×</button>
        <div className={styles.languageGrid}>
          {LANGUAGES.map(([label, imageKey, code]) => (
            <button key={code} type="button" onClick={onClose}>
              <ExactImage src={assets[imageKey]} alt="" />
              <strong>{label}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ExactImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src) return <span className={className} aria-hidden="true" />;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

function sectionTitle(section: MobileReferenceSection) {
  switch (section) {
    case 'vip': return 'ระดับสมาชิก VIP';
    case 'live': return 'ตารางถ่ายทอดสด';
    case 'promotions': return 'โปรโมชั่น';
    case 'news': return 'ข่าวสาร';
    case 'activities': return 'กิจกรรม';
    case 'video': return 'วีดีโอแนะนำ';
    case 'guide': return 'แนะนำการใช้งาน';
    case 'language': return 'เปลี่ยนภาษา';
  }
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20 4 12l8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 11c-.275 0-.51-.098-.706-.294A.962.962 0 0 1 2 10V5c0-.275.098-.51.294-.706A.962.962 0 0 1 3 4h.5V3c0-.692.244-1.281.732-1.769A2.41 2.41 0 0 1 6 .5c.692 0 1.281.244 1.769.732A2.41 2.41 0 0 1 8.5 3v1H9c.275 0 .51.098.706.294A.962.962 0 0 1 10 5v5c0 .275-.098.51-.294.706A.962.962 0 0 1 9 11H3Zm3-2.5a.962.962 0 0 0 .706-.294A.962.962 0 0 0 7 7.5a.962.962 0 0 0-.294-.706A.962.962 0 0 0 6 6.5a.962.962 0 0 0-.706.294A.962.962 0 0 0 5 7.5c0 .275.098.51.294.706A.962.962 0 0 0 6 8.5ZM4.5 4h3V3c0-.417-.146-.771-.438-1.063A1.446 1.446 0 0 0 6 1.5c-.417 0-.771.146-1.063.438A1.446 1.446 0 0 0 4.5 3v1Z" /></svg>;
}

function LockLargeIcon() {
  return <svg viewBox="0 0 20 21" aria-hidden="true"><path d="M5.05 18.923a1.59 1.59 0 0 1-1.65-1.65v-8.25a1.59 1.59 0 0 1 1.65-1.65h.823v-1.65c0-1.141.402-2.114 1.207-2.918A3.972 3.972 0 0 1 10 1.598c1.14 0 2.113.402 2.918 1.207a3.972 3.972 0 0 1 1.207 2.918v1.65h.825a1.59 1.59 0 0 1 1.65 1.65v8.25a1.59 1.59 0 0 1-1.65 1.65h-9.9ZM10 14.798a1.59 1.59 0 0 0 1.65-1.65A1.59 1.59 0 0 0 10 11.498a1.59 1.59 0 0 0-1.65 1.65A1.59 1.59 0 0 0 10 14.798ZM7.525 7.373h4.95v-1.65c0-.688-.24-1.272-.722-1.753A2.386 2.386 0 0 0 10 3.248c-.688 0-1.272.24-1.753.722a2.386 2.386 0 0 0-.722 1.753v1.65Z" /></svg>;
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 0 0-5-6.71V3a2 2 0 0 0-4 0v1.29A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" /></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>;
}
