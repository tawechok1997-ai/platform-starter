'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  cmsContentSetting,
  defaultSettings,
  loadPublicSiteSettings,
  promotionCampaignsSetting,
  type CmsAnnouncement,
  type PromotionCampaign,
} from '../site-settings';
import { memberApiFetch } from '../member-api';
import { useMemberLocale, type MemberLocale } from '../member-locale-provider';
import UsageGuideModal from './member-home/usage-guide-modal';

type PopupKind =
  | 'promotions'
  | 'news'
  | 'activity'
  | 'history'
  | 'alerts'
  | 'video'
  | 'guide'
  | 'language'
  | null;

type PromotionCategory = 'all' | 'new' | 'daily' | 'special' | 'cashback';
type NoticeTab = 'all' | 'benefits' | 'messages';
type HistoryCategory = 'deposit' | 'withdraw' | 'promotion' | 'referral' | 'commission';
type Period = 'all' | 'today' | 'lastWeek' | 'lastMonth';

type PromotionView = {
  id: string;
  title: string;
  imageUrl: string;
  fallbackUrl?: string;
  category: Exclude<PromotionCategory, 'all'>;
};

type ActivityView = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  fallbackUrl?: string;
  bannerUrl?: string;
  bannerFallbackUrl?: string;
  endsAt?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: 'finance' | 'security' | 'promotion' | 'system' | string;
  createdAt: string;
  href?: string;
  isRead?: boolean;
};

type LedgerItem = {
  id: string;
  type: string;
  direction?: string;
  amount: string | number;
  createdAt: string;
  reviewedAt?: string | null;
};

const SECONDARY_POPUPS: Exclude<PopupKind, null>[] = [
  'promotions',
  'news',
  'activity',
  'history',
  'alerts',
  'video',
  'guide',
];

const SOURCE_PROMOTIONS: PromotionView[] = [
  sourcePromotion('1782164814389-bca4393d-1c7c-4bec-a0b8-e960916cfd9d.jpg', 'โปรโมชั่นฝากครั้งแรกของวันรับโบนัส 10%', 'daily'),
  sourcePromotion('1782165958043-1ec8b238-97de-4b29-b502-be002ba8ac98.jpg', 'Happy Sunday❤️', 'daily'),
  sourcePromotion('1782186950198-7958f845-3425-424a-b5e3-01f54b8e0c4b.jpg', 'Happy Monday💛', 'daily'),
  sourcePromotion('1782162665522-ff713e27-06c3-4dd5-b225-b807e03070ea.jpg', 'Happy Tuesday🩷', 'daily'),
  sourcePromotion('1783488417565-f0ae722e-6a36-4dcd-9b24-d5dacdcecd0d.jpg', 'Happy Wednesday💚 ฝาก 199 บาทรับ 199 บาท', 'daily'),
  sourcePromotion('1782333005051-a77a780a-ce12-4de1-84c6-cc7e7f81ec10.jpg', 'Happy Thursday🧡', 'daily'),
  sourcePromotion('1782165688406-a17f5eec-b674-42c0-8a3b-35314d34c0ca.jpg', 'Happy Friday🩵 ฝาก 500 บาท รับเพิ่มอีก 200 บาท', 'daily'),
  sourcePromotion('1782165739037-02c65a48-ca93-4ea6-9f96-145e4b2d6c3e.jpg', 'Happy Friday🩵 ฝาก 1,000 บาท รับเพิ่มอีก 300 บาท', 'daily'),
  sourcePromotion('1782165809106-8828c4f2-92c6-4392-8a28-43418d99e73b.jpg', 'Happy Saturday💜', 'daily'),
  sourcePromotion('1783790318510-5bc763b9-f73e-4930-9870-174dab6c1e77.jpg', 'คืนยอดเสีย ทุกสัปดาห์ 💜', 'cashback'),
  sourcePromotion('1782164376815-227b90e6-58cf-467e-b2f3-e3eaf9999672.jpg', 'โปรโมชั่น ฝาก 300 บาท รับ 400 บาท', 'new'),
  sourcePromotion('1780834184357-0cc2399f-e991-4b8c-bd34-c9febea8395a.jpg', 'HAPPY BIRTHDAY BONUS🎉', 'special'),
  sourcePromotion('1782164248920-68db04c9-6a30-4095-81b5-efee4a336a4f.jpg', 'ฝาก 100 บาท รับ 150 บาท', 'new'),
  sourcePromotion('1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg', 'ทำยอดเทิร์นรับรางวัลจุใจ🎉', 'special'),
  sourcePromotion('1782164616325-0a1284e5-10ab-498d-8f73-3121a0d47941.jpg', 'สมาชิกใหม่ฝากต่อเนื่อง 3 วัน รับ 30% สูงสุด 1,000 บาท', 'new'),
  sourcePromotion('1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg', 'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜', 'special'),
  sourcePromotion('1783881200278-ab8a8dfd-8b1d-4762-a8f1-ab4bbb6ffb38.jpg', '⚡️Secret Bonus ฝากรับ 100 บาท!!! (หน้าเว็บ)', 'special'),
  sourcePromotion('1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg', 'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨', 'daily'),
];

const SOURCE_ACTIVITIES: ActivityView[] = [
  {
    id: 'lottery-prediction',
    title: 'ทายผลหวย',
    description: 'กิจกรรมทายผลหวย',
    imageUrl: localEventAsset('1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg'),
    fallbackUrl: 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
    bannerUrl: localEventAsset('1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg'),
    bannerFallbackUrl: 'https://cdn.zabbet.com/event/predict/1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg',
    endsAt: '2026-08-01T23:59:59+07:00',
  },
  {
    id: 'turnover-reward',
    title: 'ทำยอด Turn รับรางวัลจุใจ',
    imageUrl: localEventAsset('1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png'),
    fallbackUrl: 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  },
];

const COPY = {
  th: {
    promotions: 'โปรโมชั่น', news: 'ข่าวสาร', activity: 'กิจกรรม', history: 'ประวัติทำรายการ',
    alerts: 'แจ้งเตือน', video: 'วิธีแนะนำเพื่อน', language: 'เปลี่ยนภาษา', close: 'ปิด',
    noData: 'ไม่พบข้อมูล', noMessages: 'ไม่มีข้อความใหม่', all: 'ทั้งหมด', newMember: 'สมาชิกใหม่',
    daily: 'ประจำวัน', special: 'สิทธิพิเศษ', cashback: 'คืนยอดเสีย', benefits: 'สิทธิพิเศษ', messages: 'ข้อความ',
    deposit: 'ฝากเงิน', withdraw: 'ถอนเงิน', promotion: 'โบนัสโปรโมชั่น', referral: 'ค่าแนะนำเพื่อน', commission: 'ค่าคอมมิชชั่น',
    startDate: 'เริ่มจากวันที่', endDate: 'วันที่สิ้นสุด', today: 'วันนี้', lastWeek: 'สัปดาห์ที่แล้ว', lastMonth: 'เดือนที่แล้ว',
    type: 'ประเภท', date: 'ว/ด/ป', time: 'เวลา', slipTime: 'เวลาสลิป', amount: 'จำนวนเงิน',
    days: 'วัน', hours: 'ชั่วโมง', minutes: 'นาที', seconds: 'วินาที', lotteryHint: 'กรุณาทายผลให้ครบทั้ง 3 ตัวบน และ 2 ตัวล่าง',
    topThree: 'ระบุตัวเลขท้าย 3 ตัวบน', bottomTwo: 'ระบุตัวเลขท้าย 2 ตัวล่าง', conditions: 'เงื่อนไขเข้าร่วมกิจกรรม',
    unsupportedLanguage: 'ภาษานี้ยังไม่เปิดใช้งาน', loading: 'กำลังโหลด...',
  },
  en: {
    promotions: 'Promotions', news: 'News', activity: 'Activities', history: 'Transaction history',
    alerts: 'Notifications', video: 'Referral guide', language: 'Change language', close: 'Close',
    noData: 'No data', noMessages: 'No new messages', all: 'All', newMember: 'New member',
    daily: 'Daily', special: 'Benefits', cashback: 'Cashback', benefits: 'Benefits', messages: 'Messages',
    deposit: 'Deposit', withdraw: 'Withdrawal', promotion: 'Promotion bonus', referral: 'Referral income', commission: 'Commission',
    startDate: 'Start date', endDate: 'End date', today: 'Today', lastWeek: 'Last week', lastMonth: 'Last month',
    type: 'Type', date: 'Date', time: 'Time', slipTime: 'Slip time', amount: 'Amount',
    days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds', lotteryHint: 'Enter both the 3-digit top and 2-digit bottom predictions',
    topThree: 'Top 3 digits', bottomTwo: 'Bottom 2 digits', conditions: 'Activity conditions',
    unsupportedLanguage: 'This language is not available yet', loading: 'Loading...',
  },
} as const;

export default function MemberMenuSecondaryRuntime({ locale }: { locale: MemberLocale }) {
  const { setLocale } = useMemberLocale();
  const [popup, setPopup] = useState<PopupKind>(null);
  const [campaigns, setCampaigns] = useState<PromotionView[]>(SOURCE_PROMOTIONS);
  const [announcements, setAnnouncements] = useState<CmsAnnouncement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const closeProfileMenu = () => {
      window.setTimeout(() => {
        document.querySelector<HTMLButtonElement>('.public-member-profile-trigger[aria-expanded="true"]')?.click();
      }, 0);
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const secondaryLink = event.target.closest<HTMLAnchorElement>('.public-member-menu-grid--secondary a');
      if (secondaryLink) {
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.public-member-menu-grid--secondary a'));
        const nextPopup = SECONDARY_POPUPS[links.indexOf(secondaryLink)] ?? null;
        if (!nextPopup) return;
        event.preventDefault();
        event.stopPropagation();
        setPopup(nextPopup);
        closeProfileMenu();
        return;
      }

      const languageButton = event.target.closest<HTMLButtonElement>('.public-member-menu-grid--secondary button');
      if (!languageButton) return;
      event.preventDefault();
      event.stopPropagation();
      setPopup('language');
      closeProfileMenu();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const loadCms = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const settings = await loadPublicSiteSettings();
      const nextCampaigns = promotionCampaignsSetting(settings)
        .filter((item) => item.enabled && item.lifecycle !== 'archived' && isInWindow(item))
        .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0))
        .map(mapCampaign);
      const content = cmsContentSetting(settings);
      setCampaigns(nextCampaigns.length ? nextCampaigns : SOURCE_PROMOTIONS);
      setAnnouncements(content.announcements.filter((item) => item.enabled && item.lifecycle !== 'archived'));
    } catch {
      setCampaigns(promotionCampaignsSetting(defaultSettings).filter((item) => item.enabled).map(mapCampaign));
      setMessage(locale === 'th' ? 'โหลดข้อมูลล่าสุดไม่สำเร็จ กำลังแสดงข้อมูลสำรอง' : 'Latest content is unavailable. Showing fallback content.');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await memberApiFetch('/member/notifications');
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'load failed');
      setNotifications(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setNotifications([]);
      setMessage(locale === 'th' ? 'โหลดการแจ้งเตือนไม่สำเร็จ' : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await memberApiFetch('/member/wallet/ledger?limit=100');
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'load failed');
      setLedger(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setLedger([]);
      setMessage(locale === 'th' ? 'โหลดประวัติทำรายการไม่สำเร็จ' : 'Unable to load transaction history');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (popup === 'promotions' || popup === 'news' || popup === 'activity') void loadCms();
    if (popup === 'alerts') void loadNotifications();
    if (popup === 'history') void loadLedger();
  }, [loadCms, loadLedger, loadNotifications, popup]);

  if (!popup || typeof document === 'undefined') return null;
  if (popup === 'guide') return <UsageGuideModal open onClose={() => setPopup(null)} />;

  const copy = COPY[locale];
  const content = popup === 'promotions'
    ? <PromotionsContent locale={locale} campaigns={campaigns.length ? campaigns : SOURCE_PROMOTIONS} />
    : popup === 'news'
      ? <NewsContent locale={locale} announcements={announcements.filter((item) => item.kind === 'news')} />
      : popup === 'activity'
        ? <ActivityContent locale={locale} announcements={announcements.filter((item) => item.kind === 'event')} />
        : popup === 'history'
          ? <HistoryContent locale={locale} items={ledger} />
          : popup === 'alerts'
            ? <AlertsContent locale={locale} items={notifications} />
            : popup === 'video'
              ? <VideoContent />
              : <LanguageContent locale={locale} onSelect={(nextLocale) => {
                setLocale(nextLocale);
                setPopup(null);
              }} />;

  return createPortal(
    <SourcePopup
      kind={popup}
      title={copy[popup]}
      closeLabel={copy.close}
      loading={loading}
      message={message}
      onClose={() => setPopup(null)}
    >
      {content}
    </SourcePopup>,
    document.body,
  );
}

function SourcePopup({
  kind,
  title,
  closeLabel,
  loading,
  message,
  onClose,
  children,
}: {
  kind: Exclude<PopupKind, null | 'guide'>;
  title: string;
  closeLabel: string;
  loading: boolean;
  message: string;
  onClose: () => void;
  children: ReactNode;
}) {
  usePopupLifecycle(onClose);
  return (
    <div className="member-source-popup-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section className={`member-source-popup member-source-popup--${kind}`} role="dialog" aria-modal="true" aria-label={title}>
        <span className="member-source-popup-top-line" aria-hidden="true" />
        <header className="member-source-popup-header">
          <div>
            <span className="member-source-popup-icon"><PopupAssetIcon kind={kind} /></span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={closeLabel}><CloseIcon /></button>
        </header>
        {message ? <div className="member-source-popup-message" role="status">{message}</div> : null}
        {loading ? <div className="member-source-popup-loading" role="status">{COPY.th.loading}</div> : null}
        <div className="member-source-popup-body">{children}</div>
      </section>
    </div>
  );
}

function PromotionsContent({ locale, campaigns }: { locale: MemberLocale; campaigns: PromotionView[] }) {
  const copy = COPY[locale];
  const [category, setCategory] = useState<PromotionCategory>('all');
  const visible = category === 'all' ? campaigns : campaigns.filter((item) => item.category === category);
  const tabs: Array<{ key: PromotionCategory; label: string }> = [
    { key: 'all', label: copy.all },
    { key: 'new', label: copy.newMember },
    { key: 'daily', label: copy.daily },
    { key: 'special', label: copy.special },
    { key: 'cashback', label: copy.cashback },
  ];
  return (
    <div className="member-source-promotions">
      <div className="member-source-promotion-tabs" role="tablist">
        {tabs.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={category === tab.key} className={category === tab.key ? 'is-active' : ''} onClick={() => setCategory(tab.key)}>{tab.label}</button>)}
      </div>
      <div className="member-source-promotion-grid">
        {visible.map((item) => (
          <a href="/promotions" className="member-source-promotion-card" key={item.id}>
            <SourceImage src={item.imageUrl} fallback={item.fallbackUrl} alt={item.title} />
            <strong>{item.title}</strong>
          </a>
        ))}
        {!visible.length ? <EmptySourceState label={copy.noData} /> : null}
      </div>
    </div>
  );
}

function NewsContent({ locale, announcements }: { locale: MemberLocale; announcements: CmsAnnouncement[] }) {
  const copy = COPY[locale];
  if (!announcements.length) return <EmptySourceState label={copy.noMessages} />;
  return (
    <div className="member-source-news-list">
      {announcements.map((item, index) => (
        <article key={item.id ?? `${item.title}-${index}`}>
          <strong>{item.title}</strong>
          <p>{item.message}</p>
          {item.href ? <a href={item.href}>{locale === 'th' ? 'เปิดดู' : 'Open'}</a> : null}
        </article>
      ))}
    </div>
  );
}

function ActivityContent({ locale, announcements }: { locale: MemberLocale; announcements: CmsAnnouncement[] }) {
  const copy = COPY[locale];
  const cmsActivities: ActivityView[] = announcements.map((item, index) => ({
    id: item.id ?? `event-${index}`,
    title: item.title,
    description: item.message,
    imageUrl: localFromCdn(item.desktopImageUrl || item.imageUrl || '', 'event/predict'),
    fallbackUrl: item.desktopImageUrl || item.imageUrl,
  }));
  const activities = cmsActivities.length ? cmsActivities : SOURCE_ACTIVITIES;
  const [selectedId, setSelectedId] = useState(activities[0]?.id ?? '');
  const selected = activities.find((item) => item.id === selectedId) ?? activities[0];
  const [topDigits, setTopDigits] = useState('');
  const [bottomDigits, setBottomDigits] = useState('');
  return (
    <div className="member-source-activity-layout">
      <div className="member-source-activity-list">
        {activities.map((item) => (
          <button key={item.id} type="button" className={selected?.id === item.id ? 'is-active' : ''} onClick={() => setSelectedId(item.id)}>
            <SourceImage src={item.imageUrl} fallback={item.fallbackUrl} alt="" />
            <span><strong>{item.title}</strong>{item.endsAt ? <small>{locale === 'th' ? 'หมดเขต' : 'Ends'}: {new Date(item.endsAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}</small> : null}</span>
          </button>
        ))}
      </div>
      <div className="member-source-activity-detail">
        {selected ? (
          <>
            <h3>{selected.title}</h3>
            {selected.endsAt ? <Countdown target={selected.endsAt} locale={locale} /> : null}
            {selected.bannerUrl ? <SourceImage src={selected.bannerUrl} fallback={selected.bannerFallbackUrl} alt={selected.title} /> : null}
            <p>{selected.description}</p>
            {selected.id === 'lottery-prediction' ? (
              <div className="member-source-lottery-form">
                <strong>{copy.lotteryHint}</strong>
                <div>
                  <label>{copy.topThree}<input value={topDigits} inputMode="numeric" maxLength={3} onChange={(event) => setTopDigits(event.target.value.replace(/\D/g, '').slice(0, 3))} /></label>
                  <label>{copy.bottomTwo}<input value={bottomDigits} inputMode="numeric" maxLength={2} onChange={(event) => setBottomDigits(event.target.value.replace(/\D/g, '').slice(0, 2))} /></label>
                </div>
                <details><summary>{copy.conditions}</summary><p>{locale === 'th' ? 'สมาชิกต้องกรอกตัวเลขให้ครบก่อนหมดเวลา ระบบกิจกรรมจริงจะเปิดรับเมื่อผู้ดูแลเปิดใช้งาน' : 'Complete both predictions before the deadline. Submission is available when the activity is enabled.'}</p></details>
              </div>
            ) : null}
          </>
        ) : <EmptySourceState label={copy.noData} />}
      </div>
    </div>
  );
}

function HistoryContent({ locale, items }: { locale: MemberLocale; items: LedgerItem[] }) {
  const copy = COPY[locale];
  const [category, setCategory] = useState<HistoryCategory>('deposit');
  const [period, setPeriod] = useState<Period>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const categories: Array<{ key: HistoryCategory; label: string }> = [
    { key: 'deposit', label: copy.deposit }, { key: 'withdraw', label: copy.withdraw },
    { key: 'promotion', label: copy.promotion }, { key: 'referral', label: copy.referral },
    { key: 'commission', label: copy.commission },
  ];
  const periods: Array<{ key: Period; label: string }> = [
    { key: 'all', label: copy.all }, { key: 'today', label: copy.today },
    { key: 'lastWeek', label: copy.lastWeek }, { key: 'lastMonth', label: copy.lastMonth },
  ];
  const filtered = useMemo(() => items.filter((item) => {
    if (historyCategory(item.type) !== category) return false;
    const created = new Date(item.createdAt);
    if (!matchesPeriod(created, period)) return false;
    if (startDate && created < new Date(`${startDate}T00:00:00`)) return false;
    if (endDate && created > new Date(`${endDate}T23:59:59`)) return false;
    return true;
  }), [category, endDate, items, period, startDate]);
  return (
    <div className="member-source-history">
      <div className="member-source-history-categories">{categories.map((item) => <button type="button" key={item.key} className={category === item.key ? 'is-active' : ''} onClick={() => setCategory(item.key)}>{item.label}</button>)}</div>
      <div className="member-source-history-filters">
        <label><span>{copy.startDate}</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label><span>{copy.endDate}</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      </div>
      <div className="member-source-history-periods">{periods.map((item) => <button type="button" key={item.key} className={period === item.key ? 'is-active' : ''} onClick={() => setPeriod(item.key)}>{item.label}</button>)}</div>
      <div className="member-source-history-table">
        <table><thead><tr><th>{copy.type}</th><th>{copy.date}</th><th>{copy.time}</th><th>{copy.slipTime}</th><th>{copy.amount}</th></tr></thead>
          <tbody>{filtered.length ? filtered.map((item) => {
            const created = new Date(item.createdAt);
            return <tr key={item.id}><td>{historyTypeLabel(item.type, locale)}</td><td>{created.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}</td><td>{created.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</td><td>{item.reviewedAt ? new Date(item.reviewedAt).toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{formatMoney(item.amount)}</td></tr>;
          }) : <tr><td colSpan={5}><EmptySourceState label={copy.noData} /></td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsContent({ locale, items }: { locale: MemberLocale; items: NotificationItem[] }) {
  const copy = COPY[locale];
  const [tab, setTab] = useState<NoticeTab>('all');
  const visible = tab === 'all' ? items : tab === 'benefits' ? items.filter((item) => item.type === 'promotion') : items.filter((item) => item.type !== 'promotion');
  return (
    <div className="member-source-alerts">
      <div className="member-source-alert-tabs" role="tablist">
        {(['all', 'benefits', 'messages'] as NoticeTab[]).map((item) => <button type="button" role="tab" key={item} aria-selected={tab === item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>{copy[item]}</button>)}
      </div>
      <div className="member-source-alert-list">
        {visible.length ? visible.map((item) => <article key={item.id} className={item.isRead ? 'is-read' : 'is-unread'}><div><strong>{item.title}</strong><p>{item.description}</p><time>{new Date(item.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}</time></div>{item.href ? <a href={item.href}>{locale === 'th' ? 'เปิดดู' : 'Open'}</a> : null}</article>) : <EmptySourceState label={copy.noMessages} />}
      </div>
    </div>
  );
}

function VideoContent() {
  return (
    <div className="member-source-video-wrap">
      <video
        autoPlay
        loop
        controls
        playsInline
        src="/assets/asset-pc/images/affiliate_640.webm"
        onError={(event) => {
          const video = event.currentTarget;
          if (video.dataset.fallback === 'true') return;
          video.dataset.fallback = 'true';
          video.src = 'https://cdn.zabbet.com/videos/affiliate_640.webm';
          void video.play().catch(() => undefined);
        }}
      />
    </div>
  );
}

function LanguageContent({ locale, onSelect }: { locale: MemberLocale; onSelect: (locale: MemberLocale) => void }) {
  const [message, setMessage] = useState('');
  const languages = [
    { code: 'en', label: 'English', flag: 'en', enabled: true },
    { code: 'th', label: 'ภาษาไทย', flag: 'th', enabled: true },
    { code: 'ph', label: 'Tagalog', flag: 'ph', enabled: false },
    { code: 'vi', label: 'Tiếng Việt', flag: 'vi', enabled: false },
    { code: 'km', label: 'ភាសាខ្មែរ', flag: 'km', enabled: false },
    { code: 'lo', label: 'ພາສາລາວ', flag: 'lo', enabled: false },
    { code: 'id', label: 'Bahasa Indonesia', flag: 'id', enabled: false },
    { code: 'mm', label: 'Myan', flag: 'mm', enabled: false },
  ];
  return (
    <div className="member-source-language">
      <div>{languages.map((item) => <button type="button" key={item.code} className={locale === item.code ? 'is-active' : ''} onClick={() => {
        if (!item.enabled) { setMessage(COPY[locale].unsupportedLanguage); return; }
        onSelect(item.code as MemberLocale);
      }}><span><img src={`/images/flags/${item.flag}.svg`} alt="" /></span><strong>{item.label}</strong></button>)}</div>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}

function Countdown({ target, locale }: { target: string; locale: MemberLocale }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Date.parse(target) - now);
  const seconds = Math.floor(remaining / 1000);
  const values = [Math.floor(seconds / 86400), Math.floor((seconds % 86400) / 3600), Math.floor((seconds % 3600) / 60), seconds % 60];
  const labels = [COPY[locale].days, COPY[locale].hours, COPY[locale].minutes, COPY[locale].seconds];
  return <div className="member-source-countdown">{values.map((value, index) => <div key={labels[index]}><strong>{String(value).padStart(2, '0')}</strong><span>{labels[index]}</span></div>)}</div>;
}

function EmptySourceState({ label }: { label: string }) {
  return <div className="member-source-empty"><EmptyIcon /><span>{label}</span></div>;
}

function SourceImage({ src, fallback, alt }: { src: string; fallback?: string; alt: string }) {
  return <img src={src} alt={alt} loading="lazy" onError={(event) => useImageFallback(event, fallback)} />;
}

function PopupAssetIcon({ kind }: { kind: Exclude<PopupKind, null | 'guide'> }) {
  const map: Record<Exclude<PopupKind, null | 'guide'>, string> = {
    promotions: '/assets/asset-pc/images/โปรโมชั้น.png',
    news: '/assets/asset-pc/images/ข่าวสาร.png',
    activity: '/assets/asset-pc/images/กิจกรรม.png',
    history: '/assets/asset-pc/images/ประวัติ.png',
    alerts: '/assets/asset-pc/images/เเจ้งเตือน.png',
    video: '/assets/asset-pc/images/วิดีโอเเนะนำ.png',
    language: '/assets/asset-pc/images/เปลียนภาษา.svg',
  };
  return <img src={map[kind]} alt="" aria-hidden="true" />;
}

function CloseIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" /></svg>;
}

function EmptyIcon() {
  return <svg viewBox="0 0 116 81" aria-hidden="true"><path d="M23 36h64v37a8 8 0 0 1-8 8H31a8 8 0 0 1-8-8V36Z" /><path d="M8 17 65 2a8 8 0 0 1 10 6l2 8a8 8 0 0 1-6 10L14 41a8 8 0 0 1-10-6l-2-8a8 8 0 0 1 6-10Z" /><path d="M48 49h14" /></svg>;
}

function usePopupLifecycle(onClose: () => void) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);
}

function sourcePromotion(fileName: string, title: string, category: Exclude<PromotionCategory, 'all'>): PromotionView {
  return {
    id: fileName,
    title,
    category,
    imageUrl: `/assets/asset-pc/images/FEZX/promotions/${fileName}`,
    fallbackUrl: `https://cdn.zabbet.com/FEZX/promotions/${fileName}`,
  };
}

function mapCampaign(item: PromotionCampaign): PromotionView {
  const sourceUrl = item.desktopImageUrl || item.imageUrl || '';
  return {
    id: item.id,
    title: item.title,
    imageUrl: localFromCdn(sourceUrl, 'FEZX/promotions'),
    fallbackUrl: sourceUrl || undefined,
    category: classifyPromotion(item.title),
  };
}

function classifyPromotion(title: string): Exclude<PromotionCategory, 'all'> {
  if (/คืนยอดเสีย|cashback/i.test(title)) return 'cashback';
  if (/สมาชิกใหม่|ฝาก\s*(100|300)|new member/i.test(title)) return 'new';
  if (/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|ประจำวัน|ครั้งแรกของวัน|ฝากซ้ำ/i.test(title)) return 'daily';
  return 'special';
}

function localEventAsset(fileName: string) {
  return `/assets/asset-pc/images/event/predict/${fileName}`;
}

function localFromCdn(url: string, folder: string) {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  const fileName = url.split('/').pop()?.split('?')[0] ?? '';
  return fileName ? `/assets/asset-pc/images/${folder}/${fileName}` : url;
}

function useImageFallback(event: SyntheticEvent<HTMLImageElement>, fallback?: string) {
  const image = event.currentTarget;
  if (!fallback || image.dataset.fallback === 'true') return;
  image.dataset.fallback = 'true';
  image.src = fallback;
}

function isInWindow(item: PromotionCampaign) {
  const now = Date.now();
  const start = item.startsAt ? Date.parse(item.startsAt) : NaN;
  const end = item.endsAt ? Date.parse(item.endsAt) : NaN;
  if (Number.isFinite(start) && now < start) return false;
  if (Number.isFinite(end) && now > end) return false;
  return true;
}

function historyCategory(type: string): HistoryCategory {
  const value = String(type || '').toUpperCase();
  if (/WITHDRAW/.test(value)) return 'withdraw';
  if (/PROMO|BONUS/.test(value)) return 'promotion';
  if (/REFERRAL|NETWORK|DOWNLINE/.test(value)) return 'referral';
  if (/COMMISSION/.test(value)) return 'commission';
  return 'deposit';
}

function historyTypeLabel(type: string, locale: MemberLocale) {
  const category = historyCategory(type);
  return COPY[locale][category];
}

function matchesPeriod(created: Date, period: Period) {
  if (period === 'all') return true;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return created >= startToday;
  const days = period === 'lastWeek' ? 7 : 30;
  return created >= new Date(startToday.getTime() - days * 86400000);
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
