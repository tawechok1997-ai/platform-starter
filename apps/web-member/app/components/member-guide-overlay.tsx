'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './member-guide-overlay.module.css';

type GuideCategory = 'all' | 'finance' | 'activity' | 'play' | 'affiliate' | 'benefit' | 'problem';

type GuideItem = {
  id: string;
  category: Exclude<GuideCategory, 'all'>;
  section: string;
  question: string;
  answer: string;
};

const CATEGORIES: Array<{ key: GuideCategory; label: string }> = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'finance', label: 'การฝาก - ถอน' },
  { key: 'activity', label: 'กิจกรรม' },
  { key: 'play', label: 'การเข้าเล่น' },
  { key: 'affiliate', label: 'สร้างรายได้เครือข่าย' },
  { key: 'benefit', label: 'สิทธิประโยชน์' },
  { key: 'problem', label: 'เกิดปัญหาในการเล่นเกม?' },
];

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'deposit-bank',
    category: 'finance',
    section: 'การฝากเงิน',
    question: 'ฝากเงินแบบ โอนผ่านธนาคาร',
    answer: 'เลือกเมนูฝาก เลือกธนาคารที่ต้องการ จากนั้นกรอกยอดและทำรายการตามขั้นตอนที่ระบบแสดง',
  },
  {
    id: 'deposit-qr',
    category: 'finance',
    section: 'การฝากเงิน',
    question: 'ฝากเงินแบบ โอนผ่าน QR Payment',
    answer: 'เลือกฝากผ่าน QR ระบุยอดเงิน แล้วสแกน QR ที่ระบบสร้างให้ภายในเวลาที่กำหนด',
  },
  {
    id: 'deposit-decimal',
    category: 'finance',
    section: 'การฝากเงิน',
    question: 'ฝากเงินแบบ ฝากจุดทศนิยม',
    answer: 'กรอกยอดตามที่ระบบกำหนดและโอนยอดรวมจุดทศนิยมให้ตรง เพื่อให้ระบบตรวจสอบรายการอัตโนมัติ',
  },
  {
    id: 'deposit-wallet',
    category: 'finance',
    section: 'การฝากเงิน',
    question: 'วิธีการฝากแบบ TrueWallet',
    answer: 'เลือกช่องทาง TrueWallet กรอกข้อมูลให้ครบและทำรายการตามคำแนะนำบนหน้าจอ',
  },
  {
    id: 'deposit-delay',
    category: 'finance',
    section: 'การฝากเงิน',
    question: 'ยอดไม่เข้าทันที ทำยังไงดี?',
    answer: 'ตรวจสอบสถานะรายการและหลักฐานการโอน หากเกินเวลาที่แจ้งให้ติดต่อทีมงานพร้อมเลขรายการ',
  },
  {
    id: 'withdraw',
    category: 'finance',
    section: 'การถอนเงิน',
    question: 'การถอนเงิน',
    answer: 'เลือกเมนูถอน ตรวจสอบบัญชีรับเงินและยอดที่ต้องการ จากนั้นยืนยันรายการตามขั้นตอนของระบบ',
  },
  {
    id: 'promotion',
    category: 'activity',
    section: 'โปรโมชั่น',
    question: 'โปรโมชั่นแนะนำ',
    answer: 'เปิดหน้ารายละเอียดโปรโมชั่นเพื่อตรวจสอบยอดฝากขั้นต่ำ เงื่อนไขรับโบนัส และข้อกำหนดการทำยอดก่อนกดรับสิทธิ์',
  },
  {
    id: 'mission',
    category: 'activity',
    section: 'กิจกรรมและภารกิจ',
    question: 'วิธีเข้าร่วมกิจกรรม',
    answer: 'เลือกกิจกรรมที่เปิดอยู่ อ่านเงื่อนไขให้ครบ แล้วกดเข้าร่วมก่อนเริ่มทำภารกิจเพื่อให้ระบบบันทึกความคืบหน้า',
  },
  {
    id: 'play-casino',
    category: 'play',
    section: 'การเข้าเล่นคาสิโน',
    question: 'เข้าเล่น : คาสิโน',
    answer: 'เลือกหมวดคาสิโน เลือกค่ายและโต๊ะที่ต้องการ แล้วกดเข้าเล่น ระบบจะเปิดเกมในหน้าต่างที่รองรับ',
  },
  {
    id: 'play-slot',
    category: 'play',
    section: 'การเข้าเล่นคาสิโน',
    question: 'เข้าเล่น : สล็อต',
    answer: 'เลือกหมวดสล็อต เลือกเกมที่ต้องการ และตรวจสอบยอดคงเหลือก่อนกดเข้าเล่น',
  },
  {
    id: 'play-fishing',
    category: 'play',
    section: 'การเข้าเล่นคาสิโน',
    question: 'เข้าเล่น : ยิงปลา',
    answer: 'เลือกหมวดยิงปลา จากนั้นเลือกเกมและห้องที่รองรับอุปกรณ์ของคุณก่อนเข้าเล่น',
  },
  {
    id: 'affiliate-create',
    category: 'affiliate',
    section: 'ระบบสร้างรายได้เครือข่าย',
    question: 'สร้างรายได้เครือข่าย',
    answer: 'เปิดเมนูเครือข่าย คัดลอกลิงก์แนะนำ และตรวจสอบเงื่อนไขรายได้ของแต่ละระดับก่อนแชร์',
  },
  {
    id: 'affiliate-withdraw',
    category: 'affiliate',
    section: 'ระบบสร้างรายได้เครือข่าย',
    question: 'ถอนรายได้เครือข่าย (แนะนำเพื่อน)',
    answer: 'ตรวจสอบยอดรายได้ที่ถอนได้ เลือกบัญชีรับเงิน และยืนยันคำขอถอนตามรอบที่ระบบกำหนด',
  },
  {
    id: 'benefit-level',
    category: 'benefit',
    section: 'สิทธิประโยชน์ลูกค้าแต่ละระดับ',
    question: 'วิธีการตรวจสอบระดับ',
    answer: 'เปิดหน้าโปรไฟล์หรือสิทธิประโยชน์เพื่อดูระดับปัจจุบัน คะแนนสะสม และเงื่อนไขการเลื่อนระดับ',
  },
  {
    id: 'benefit-reward',
    category: 'benefit',
    section: 'สิทธิประโยชน์ลูกค้าแต่ละระดับ',
    question: 'รับสิทธิประโยชน์ประจำระดับ',
    answer: 'ตรวจสอบสิทธิ์ที่เปิดรับในแต่ละระดับและกดรับภายในระยะเวลาที่กำหนด',
  },
  {
    id: 'problem-game',
    category: 'problem',
    section: 'ปัญหาอินเตอร์เน็ต',
    question: 'หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้',
    answer: 'ปิดเกมแล้วเปิดใหม่ ตรวจสอบอินเทอร์เน็ต และลองเปลี่ยนเบราว์เซอร์ หากยังมีปัญหาให้ติดต่อทีมงานพร้อมชื่อเกมและเวลาที่เกิดเหตุ',
  },
  {
    id: 'problem-refresh',
    category: 'problem',
    section: 'ปัญหาอินเตอร์เน็ต',
    question: 'รีเฟรชหน้าเว็บไซต์',
    answer: 'บันทึกข้อมูลที่จำเป็นก่อน จากนั้นรีเฟรชหน้าเว็บหนึ่งครั้งและเข้าสู่ระบบใหม่หากระบบร้องขอ',
  },
  {
    id: 'problem-cache',
    category: 'problem',
    section: 'ปัญหาอินเตอร์เน็ต',
    question: 'ล้างแคชและคุกกี้',
    answer: 'ล้างเฉพาะข้อมูลเว็บไซต์ของ NOAH345 แล้วเปิดหน้าเว็บใหม่ เพื่อไม่ให้กระทบข้อมูลเว็บไซต์อื่นโดยไม่จำเป็น',
  },
];

export default function MemberGuideOverlay() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<GuideCategory>('all');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  useEffect(() => {
    const interceptGuideButton = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('.reference-guide-more')
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      setCategory('all');
      setOpenItemId(null);
      setOpen(true);
    };

    document.addEventListener('click', interceptGuideButton, true);
    return () => document.removeEventListener('click', interceptGuideButton, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const visibleItems = useMemo(
    () => category === 'all' ? GUIDE_ITEMS : GUIDE_ITEMS.filter((item) => item.category === category),
    [category],
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, GuideItem[]>();
    visibleItems.forEach((item) => {
      const current = grouped.get(item.section) ?? [];
      current.push(item);
      grouped.set(item.section, current);
    });
    return Array.from(grouped.entries());
  }, [visibleItems]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-guide-popup-title">
        <div className={styles.topLine} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.titleIcon} aria-hidden="true">
              <img src="/assets/asset-pc/images/home/faq1.webp" alt="" />
            </span>
            <h2 id="member-guide-popup-title">แนะนำการใช้งาน</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="ปิดหน้าคู่มือ">
            <img src="/assets/asset-pc/images/close.svg" alt="" aria-hidden="true" />
          </button>
        </header>

        <nav className={styles.tabs} aria-label="หมวดคู่มือ">
          <div className={styles.tabTrack}>
            {CATEGORIES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={category === item.key ? styles.activeTab : styles.tab}
                aria-pressed={category === item.key}
                onClick={() => {
                  setCategory(item.key);
                  setOpenItemId(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className={styles.content}>
          {sections.map(([section, items]) => (
            <section key={section} className={styles.guideSection}>
              <header className={styles.sectionHeader}><strong>{section}</strong></header>
              <div className={styles.items}>
                {items.map((item) => {
                  const isOpen = openItemId === item.id;
                  return (
                    <article key={item.id} className={isOpen ? styles.openItem : styles.item}>
                      <button
                        type="button"
                        className={styles.itemButton}
                        aria-expanded={isOpen}
                        onClick={() => setOpenItemId(isOpen ? null : item.id)}
                      >
                        <span>{item.question}</span>
                        <svg viewBox="0 0 512 512" aria-hidden="true"><path d="M256 294.1 383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0L256 294.1Z" /></svg>
                      </button>
                      {isOpen ? <div className={styles.answer}>{item.answer}</div> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
