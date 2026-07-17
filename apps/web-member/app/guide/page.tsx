'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cmsContentSetting, loadPublicSiteSettings } from '../site-settings';

type GuideFaq = { question: string; answer: string; enabled: boolean };

const REFERENCE_FAQS: GuideFaq[] = [
  { question: 'ฝากเงินแบบ โอนผ่านธนาคาร', answer: 'เลือกเมนูฝาก เลือกธนาคารที่ต้องการ จากนั้นกรอกยอดและทำรายการตามขั้นตอนที่ระบบแสดง', enabled: true },
  { question: 'ฝากเงินแบบ โอนผ่าน QR Payment', answer: 'เลือกฝากผ่าน QR ระบุยอดเงิน แล้วสแกน QR ที่ระบบสร้างให้ภายในเวลาที่กำหนด', enabled: true },
  { question: 'ฝากเงินแบบ ฝากจุดทศนิยม', answer: 'กรอกยอดตามที่ระบบกำหนดและโอนยอดรวมจุดทศนิยมให้ตรง เพื่อให้ระบบตรวจสอบรายการอัตโนมัติ', enabled: true },
  { question: 'วิธีการฝากแบบ TrueWallet', answer: 'เลือกช่องทาง TrueWallet กรอกข้อมูลให้ครบและทำรายการตามคำแนะนำบนหน้าจอ', enabled: true },
  { question: 'ยอดไม่เข้าทันที ทำยังไงดี?', answer: 'ตรวจสอบสถานะรายการและหลักฐานการโอน หากเกินเวลาที่แจ้งให้ติดต่อทีมงานพร้อมเลขรายการ', enabled: true },
];

export default function GuidePage() {
  const [faqs, setFaqs] = useState<GuideFaq[]>([]);

  useEffect(() => {
    let active = true;
    loadPublicSiteSettings().then((settings) => {
      if (!active) return;
      setFaqs(cmsContentSetting(settings).faqs.filter((item) => item.enabled));
    });
    return () => { active = false; };
  }, []);

  const visibleFaqs = useMemo(() => faqs.length ? faqs : REFERENCE_FAQS, [faqs]);

  return (
    <main className="member-guide-page">
      <section className="member-guide-live-actions" aria-label="ทางลัดเกมสด">
        <Link href="/games?category=casino" className="member-guide-live">◉ ดูถ่ายทอดสด</Link>
        <Link href="/games" className="member-guide-bet">เดิมพันทันที</Link>
      </section>

      <section className="member-guide-section">
        <div className="member-guide-section__title"><span>❔</span><h2>Guide</h2></div>
        <div className="member-guide-faqs">
          {visibleFaqs.slice(0, 5).map((item, index) => (
            <details key={`${item.question}-${index}`}>
              <summary>{item.question}<span>⌃</span></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <Link className="member-guide-more" href="/support">ดูทั้งหมด</Link>
      </section>
    </main>
  );
}
