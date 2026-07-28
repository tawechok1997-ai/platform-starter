'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import missionStyles from '../mission/daily-mission-modal.module.css';
import styles from './usage-guide-modal.module.css';

type GuideTab = 'all' | 'finance' | 'activity' | 'play' | 'affiliate' | 'benefits' | 'trouble';
type GuideGroup = {
  id: string;
  tab: Exclude<GuideTab, 'all'>;
  title: string;
  items: readonly { question: string; answer: string }[];
};

const TABS: readonly { id: GuideTab; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'finance', label: 'การฝาก - ถอน' },
  { id: 'activity', label: 'กิจกรรม' },
  { id: 'play', label: 'การเข้าเล่น' },
  { id: 'affiliate', label: 'สร้างรายได้เครือข่าย' },
  { id: 'benefits', label: 'สิทธิประโยชน์' },
  { id: 'trouble', label: 'เกิดปัญหาในการเล่นเกม?' },
] as const;

const GUIDE_GROUPS: readonly GuideGroup[] = [
  {
    id: 'deposit',
    tab: 'finance',
    title: 'การฝากเงิน',
    items: [
      { question: 'ฝากเงินแบบ โอนผ่านธนาคาร', answer: 'เลือกเมนูฝากเงิน เลือกธนาคาร ระบุยอด แล้วโอนตามข้อมูลที่ระบบแสดงให้ครบถ้วน' },
      { question: 'ฝากเงินแบบ โอนผ่าน QR Payment', answer: 'เลือก QR Payment ระบุยอด และสแกน QR ภายในเวลาที่ระบบกำหนด' },
      { question: 'ฝากเงินแบบ ฝากจุดทศนิยม', answer: 'โอนยอดรวมจุดทศนิยมให้ตรงกับยอดที่ระบบสร้าง เพื่อให้ระบบตรวจสอบรายการอัตโนมัติ' },
      { question: 'วิธีการฝากแบบ TrueWallet', answer: 'เลือกช่องทาง TrueWallet กรอกข้อมูลให้ครบ และทำรายการตามขั้นตอนบนหน้าจอ' },
      { question: 'ยอดไม่เข้าทันที ทำยังไงดี?', answer: 'ตรวจสอบสถานะรายการและหลักฐานการโอน หากเกินเวลาที่แจ้งไว้ให้ติดต่อฝ่ายบริการลูกค้า' },
    ],
  },
  {
    id: 'withdraw',
    tab: 'finance',
    title: 'การถอนเงิน',
    items: [{ question: 'การถอนเงิน', answer: 'เลือกบัญชีรับเงิน ระบุยอดถอน ตรวจสอบข้อมูล แล้วกดยืนยันรายการ' }],
  },
  {
    id: 'promotion',
    tab: 'activity',
    title: 'โปรโมชั่น',
    items: [{ question: 'โปรโมชั่นแนะนำ', answer: 'ตรวจสอบเงื่อนไข ระยะเวลา และยอดทำรายการก่อนรับโปรโมชั่นทุกครั้ง' }],
  },
  {
    id: 'activities',
    tab: 'activity',
    title: 'รวบรวมทุกกิจกรรม',
    items: [
      { question: 'กิจกรรมทายผลคืออะไร?', answer: 'กิจกรรมให้สมาชิกเลือกผลการแข่งขันหรือผลรางวัลตามกติกาที่ประกาศในแต่ละรอบ' },
      { question: 'สิ่งที่ต้องทำก่อนทายผล', answer: 'เข้าสู่ระบบ ตรวจสอบกติกา วันปิดรับคำตอบ และสิทธิ์เข้าร่วมก่อนยืนยันคำทาย' },
      { question: 'เข้าร่วมกิจกรรมทายผลยังไง?', answer: 'เปิดหน้ากิจกรรม เลือกรายการที่เปิดรับคำตอบ เลือกผล และกดยืนยัน' },
      { question: 'การประกาศรางวัล', answer: 'ผลและรายชื่อผู้ได้รับรางวัลจะแสดงในหน้ากิจกรรมหลังตรวจสอบเสร็จสิ้น' },
      { question: 'ล็อคอินประจำวัน / ภารกิจ', answer: 'เข้าสู่ระบบในแต่ละวันและทำภารกิจตามเงื่อนไขเพื่อรับสิทธิ์หรือรางวัล' },
      { question: 'ขั้นตอน : ทายผลบอล', answer: 'เลือกคู่แข่งขัน เลือกผลที่คาดการณ์ ตรวจสอบข้อมูล และกดยืนยันก่อนเวลาปิดรับ' },
      { question: 'ขั้นตอน : ทายผลมวย', answer: 'เลือกคู่ชกและผลที่คาดการณ์ จากนั้นยืนยันก่อนกิจกรรมปิดรับคำตอบ' },
      { question: 'ขั้นตอน : ทายผลหวย', answer: 'เลือกรอบ เลือกผลที่คาดการณ์ และยืนยันภายในช่วงเวลาที่กำหนด' },
    ],
  },
  {
    id: 'news',
    tab: 'activity',
    title: 'ข่าวสาร',
    items: [{ question: 'ติดตามข่าวสาร', answer: 'ติดตามประกาศ โปรโมชั่น เกมใหม่ และการปิดปรับปรุงได้จากเมนูข่าวสาร' }],
  },
  {
    id: 'play',
    tab: 'play',
    title: 'การเข้าเล่นคาสิโน',
    items: [
      { question: 'เข้าเล่น : คาสิโน', answer: 'เปิดเมนูคาสิโน เลือกค่ายที่ต้องการ แล้วกดเข้าเล่น' },
      { question: 'เข้าเล่น : สล็อต', answer: 'เปิดเมนูสล็อต เลือกค่ายหรือใช้ตัวกรอง จากนั้นเลือกเกมที่ต้องการ' },
      { question: 'เข้าเล่น : ยิงปลา', answer: 'เปิดเมนูยิงปลา เลือกเกม แล้วกดเข้าเล่น' },
      { question: 'เข้าเล่น : กีฬา', answer: 'เปิดเมนูกีฬา เลือกผู้ให้บริการ แล้วกดเข้าเล่น' },
      { question: 'เข้าเล่น : ไพ่', answer: 'เปิดเมนูไพ่ เลือกเกมที่ต้องการ แล้วกดเข้าเล่น' },
      { question: 'เข้าเล่น : หวย', answer: 'เปิดเมนูหวย เลือกผู้ให้บริการ แล้วกดเข้าเล่น' },
    ],
  },
  {
    id: 'affiliate',
    tab: 'affiliate',
    title: 'ระบบสร้างรายได้เครือข่าย',
    items: [
      { question: 'สร้างรายได้เครือข่าย', answer: 'เปิดเมนูเครือข่าย คัดลอกลิงก์แนะนำ และตรวจสอบยอดตามเงื่อนไขของระบบ' },
      { question: 'ถอนรายได้เครือข่าย (แนะนำเพื่อน)', answer: 'ตรวจสอบยอดที่ถอนได้ เลือกบัญชีรับเงิน แล้วส่งคำขอถอนรายได้เครือข่าย' },
    ],
  },
  {
    id: 'benefits',
    tab: 'benefits',
    title: 'สิทธิประโยชน์ลูกค้าเเต่ระดับ',
    items: [
      { question: 'วิธีการตรวจสอบระดับ', answer: 'เปิดโปรไฟล์หรือหน้าสิทธิประโยชน์เพื่อดูระดับปัจจุบันและเงื่อนไขการเลื่อนระดับ' },
      { question: 'ระดับ Silver', answer: 'ดูสิทธิประโยชน์ของระดับ Silver และเงื่อนไขที่หน้าโปรไฟล์สมาชิก' },
      { question: 'ระดับ Gold', answer: 'ดูสิทธิประโยชน์ของระดับ Gold และเงื่อนไขที่หน้าโปรไฟล์สมาชิก' },
      { question: 'ระดับ Platinum', answer: 'ดูสิทธิประโยชน์ของระดับ Platinum และเงื่อนไขที่หน้าโปรไฟล์สมาชิก' },
      { question: 'ระดับ Titanium', answer: 'ดูสิทธิประโยชน์ของระดับ Titanium และเงื่อนไขที่หน้าโปรไฟล์สมาชิก' },
      { question: 'ระดับ Diamond', answer: 'ดูสิทธิประโยชน์ของระดับ Diamond และเงื่อนไขที่หน้าโปรไฟล์สมาชิก' },
      { question: 'ระดับ VVIP', answer: 'ดูสิทธิประโยชน์ของระดับ VVIP และเงื่อนไขที่หน้าโปรไฟล์สมาชิก' },
    ],
  },
  {
    id: 'trouble',
    tab: 'trouble',
    title: 'ปัญหาอินเตอร์เน็ต',
    items: [
      { question: 'หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้', answer: 'ตรวจสอบอินเทอร์เน็ต ปิดเกม แล้วเปิดใหม่ หากยังมีปัญหาให้เก็บภาพหน้าจอและชื่อเกมไว้' },
      { question: 'รีเฟรชหน้าเว็บไซต์', answer: 'บันทึกข้อมูลที่จำเป็นก่อนรีเฟรช จากนั้นโหลดหน้าเว็บใหม่แล้วลองเข้าเกมอีกครั้ง' },
      { question: 'ติดต่อฝ่ายบริการลูกค้า', answer: 'ส่งชื่อผู้ใช้ ชื่อเกม เวลาที่เกิดปัญหา และภาพหน้าจอให้ฝ่ายบริการลูกค้าตรวจสอบ' },
    ],
  },
] as const;

export default function UsageGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const visibleGroups = useMemo(
    () => activeTab === 'all' ? GUIDE_GROUPS : GUIDE_GROUPS.filter((group) => group.tab === activeTab),
    [activeTab],
  );

  useEffect(() => {
    if (!open) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setActiveTab('all');
      setOpenItem(null);
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div className={missionStyles.overlay} role="presentation" onMouseDown={closeFromBackdrop}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="usage-guide-title">
        <div className={styles.topLine} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.iconBox}><img src="/images/usage-guide-icon.svg" alt="" aria-hidden="true" /></span>
            <h2 id="usage-guide-title">แนะนำการใช้งาน</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="ปิดหน้าต่าง">
            <img src="/images/close.svg" width="16" height="16" alt="" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.tabShell}>
          <div className={styles.tabs} role="tablist" aria-label="หมวดแนะนำการใช้งาน">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => {
                  setActiveTab(tab.id);
                  setOpenItem(null);
                  contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={contentRef} className={styles.content}>
          {visibleGroups.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`guide-group-${group.id}`}>
              <header className={styles.groupHeader}>
                <div className={styles.groupGlow} aria-hidden="true" />
                <div className={styles.groupLine} aria-hidden="true" />
                <h3 id={`guide-group-${group.id}`}>{group.title}</h3>
              </header>
              <div className={styles.items}>
                {group.items.map((item) => {
                  const key = `${group.id}:${item.question}`;
                  const expanded = openItem === key;
                  return (
                    <div key={key} className={styles.item}>
                      <button type="button" className={styles.itemButton} aria-expanded={expanded} onClick={() => setOpenItem(expanded ? null : key)}>
                        <span>{item.question}</span>
                        <svg className={expanded ? styles.chevronOpen : styles.chevron} viewBox="0 0 512 512" aria-hidden="true"><path d="M256 294.1 383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127Z" /></svg>
                      </button>
                      {expanded ? <div className={styles.answer}>{item.answer}</div> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}
