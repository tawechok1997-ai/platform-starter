'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cmsContentSetting, loadPublicSiteSettings } from '../site-settings';

type GuideTab = 'all' | 'money' | 'activity' | 'play' | 'network' | 'benefits' | 'issues';
type GuideSection = {
  id: string;
  tab: Exclude<GuideTab, 'all'>;
  title: string;
  items: readonly string[];
  fallbackAnswer: string;
};

const TABS: readonly { id: GuideTab; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'money', label: 'การฝาก - ถอน' },
  { id: 'activity', label: 'กิจกรรม' },
  { id: 'play', label: 'การเข้าเล่น' },
  { id: 'network', label: 'สร้างรายได้เครือข่าย' },
  { id: 'benefits', label: 'สิทธิประโยชน์' },
  { id: 'issues', label: 'เกิดปัญหาในการเล่นเกม?' },
] as const;

const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: 'deposit',
    tab: 'money',
    title: 'การฝากเงิน',
    items: [
      'ฝากเงินแบบ โอนผ่านธนาคาร',
      'ฝากเงินแบบ โอนผ่าน QR Payment',
      'ฝากเงินแบบ ฝากจุดทศนิยม',
      'วิธีการฝากแบบ TrueWallet',
      'ยอดไม่เข้าทันที ทำยังไงดี?',
    ],
    fallbackAnswer: 'เลือกช่องทางฝากเงินที่ต้องการ กรอกข้อมูลให้ครบ และตรวจสอบยอดก่อนยืนยันรายการทุกครั้ง',
  },
  {
    id: 'withdraw',
    tab: 'money',
    title: 'การถอนเงิน',
    items: ['การถอนเงิน'],
    fallbackAnswer: 'เปิดเมนูถอนเงิน เลือกบัญชีรับเงิน ระบุยอด และตรวจสอบข้อมูลก่อนส่งคำขอถอน',
  },
  {
    id: 'promotion',
    tab: 'activity',
    title: 'โปรโมชั่น',
    items: ['โปรโมชั่นแนะนำ'],
    fallbackAnswer: 'ตรวจสอบเงื่อนไข ระยะเวลา และข้อกำหนดการรับรางวัลของแต่ละโปรโมชั่นก่อนเข้าร่วม',
  },
  {
    id: 'activities',
    tab: 'activity',
    title: 'รวบรวมทุกกิจกรรม',
    items: [
      'กิจกรรมทายผลคืออะไร?',
      'สิ่งที่ต้องทำก่อนทายผล',
      'เข้าร่วมกิจกรรมทายผลยังไง?',
      'การประกาศรางวัล',
      'ล็อคอินประจำวัน / ภารกิจ',
      'ขั้นตอน : ทายผลบอล',
      'ขั้นตอน : ทายผลมวย',
      'ขั้นตอน : ทายผลหวย',
    ],
    fallbackAnswer: 'เลือกกิจกรรมที่สนใจ อ่านกติกาให้ครบ และทำตามขั้นตอนที่แสดงบนหน้ากิจกรรมนั้น',
  },
  {
    id: 'news',
    tab: 'activity',
    title: 'ข่าวสาร',
    items: ['ติดตามข่าวสาร'],
    fallbackAnswer: 'ติดตามประกาศ โปรโมชั่น และการเปลี่ยนแปลงระบบได้จากเมนูข่าวสารและการแจ้งเตือน',
  },
  {
    id: 'play',
    tab: 'play',
    title: 'การเข้าเล่นคาสิโน',
    items: [
      'เข้าเล่น : คาสิโน',
      'เข้าเล่น : สล็อต',
      'เข้าเล่น : ยิงปลา',
      'เข้าเล่น : กีฬา',
      'เข้าเล่น : ไพ่',
      'เข้าเล่น : หวย',
    ],
    fallbackAnswer: 'เลือกหมวดเกม เลือกค่ายหรือเกมที่ต้องการ จากนั้นเข้าสู่ระบบเพื่อเริ่มเล่น',
  },
  {
    id: 'network',
    tab: 'network',
    title: 'ระบบสร้างรายได้เครือข่าย',
    items: ['สร้างรายได้เครือข่าย', 'ถอนรายได้เครือข่าย (แนะนำเพื่อน)'],
    fallbackAnswer: 'ตรวจสอบเงื่อนไขเครือข่าย ยอดรายได้ และข้อมูลบัญชีรับเงินก่อนทำรายการ',
  },
  {
    id: 'benefits',
    tab: 'benefits',
    title: 'สิทธิประโยชน์ลูกค้าแต่ละระดับ',
    items: [
      'วิธีการตรวจสอบระดับ',
      'ระดับ Silver',
      'ระดับ Gold',
      'ระดับ Platinum',
      'ระดับ Titanium',
      'ระดับ Diamond',
      'ระดับ VVIP',
    ],
    fallbackAnswer: 'ระดับสมาชิกและสิทธิประโยชน์ขึ้นอยู่กับเงื่อนไขที่ระบบกำหนด ตรวจสอบสถานะล่าสุดได้จากหน้าโปรไฟล์',
  },
  {
    id: 'issues',
    tab: 'issues',
    title: 'ปัญหาอินเตอร์เน็ต',
    items: [
      'หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้',
      'รีเฟรชหน้าเว็บไซต์',
      'ติดต่อฝ่ายบริการลูกค้า',
    ],
    fallbackAnswer: 'ตรวจสอบอินเทอร์เน็ต รีเฟรชหน้าเว็บไซต์ และลองเข้าใหม่ หากยังพบปัญหาให้ติดต่อฝ่ายบริการพร้อมรายละเอียดและภาพหน้าจอ',
  },
] as const;

const REFERENCE_ANSWERS: Record<string, string> = {
  'ฝากเงินแบบ โอนผ่านธนาคาร': 'เลือกเมนูฝาก เลือกธนาคารที่ต้องการ จากนั้นกรอกยอดและทำรายการตามขั้นตอนที่ระบบแสดง',
  'ฝากเงินแบบ โอนผ่าน QR Payment': 'เลือกฝากผ่าน QR ระบุยอดเงิน แล้วสแกน QR ที่ระบบสร้างให้ภายในเวลาที่กำหนด',
  'ฝากเงินแบบ ฝากจุดทศนิยม': 'กรอกยอดตามที่ระบบกำหนดและโอนยอดรวมจุดทศนิยมให้ตรง เพื่อให้ระบบตรวจสอบรายการอัตโนมัติ',
  'วิธีการฝากแบบ TrueWallet': 'เลือกช่องทาง TrueWallet กรอกข้อมูลให้ครบและทำรายการตามคำแนะนำบนหน้าจอ',
  'ยอดไม่เข้าทันที ทำยังไงดี?': 'ตรวจสอบสถานะรายการและหลักฐานการโอน หากเกินเวลาที่แจ้งให้ติดต่อทีมงานพร้อมเลขรายการ',
};

export default function GuidePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [cmsAnswers, setCmsAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    loadPublicSiteSettings().then((settings) => {
      if (!active) return;
      const answers = Object.fromEntries(
        cmsContentSetting(settings).faqs
          .filter((item) => item.enabled && item.question.trim())
          .map((item) => [item.question.trim(), item.answer.trim()]),
      );
      setCmsAnswers(answers);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGuide(router);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = bodyOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [router]);

  const visibleSections = useMemo(
    () => activeTab === 'all' ? GUIDE_SECTIONS : GUIDE_SECTIONS.filter((section) => section.tab === activeTab),
    [activeTab],
  );

  return (
    <main
      className="guide-source-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeGuide(router);
      }}
    >
      <section className="guide-source-modal" role="dialog" aria-modal="true" aria-labelledby="guide-source-title">
        <div className="guide-source-top-line" aria-hidden="true" />

        <header className="guide-source-header">
          <div className="guide-source-heading">
            <span className="guide-source-heading__icon" aria-hidden="true">
              <img src="/assets/asset-moblie/images/home/faq.svg" alt="" />
            </span>
            <h1 id="guide-source-title">แนะนำการใช้งาน</h1>
          </div>
          <button type="button" className="guide-source-close" aria-label="ปิดหน้าต่าง" onClick={() => closeGuide(router)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10.884 10 15 5.884 14.116 5 10 9.116 5.884 5 5 5.884 9.116 10 5 14.116 5.884 15 10 10.884 14.116 15 15 14.116 10.884 10Z" /></svg>
          </button>
        </header>

        <nav className="guide-source-tabs" aria-label="หมวดแนะนำการใช้งาน">
          <div className="guide-source-tabs__track">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'guide-source-tab is-active' : 'guide-source-tab'}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="guide-source-content">
          {visibleSections.map((section) => (
            <section key={section.id} className="guide-source-section" aria-labelledby={`guide-source-section-${section.id}`}>
              <header className="guide-source-section__header">
                <div className="guide-source-section__gradient" aria-hidden="true" />
                <div className="guide-source-section__line" aria-hidden="true" />
                <h2 id={`guide-source-section-${section.id}`}>{section.title}</h2>
              </header>

              <div className="guide-source-accordions">
                {section.items.map((question) => (
                  <details key={question} className="guide-source-accordion">
                    <summary>
                      <span>{question}</span>
                      <svg viewBox="0 0 512 512" aria-hidden="true"><path d="M256 294.1 383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0L256 294.1Z" /></svg>
                    </summary>
                    <div className="guide-source-answer">
                      <p>{cmsAnswers[question] || REFERENCE_ANSWERS[question] || section.fallbackAnswer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function closeGuide(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) router.back();
  else router.push('/');
}
