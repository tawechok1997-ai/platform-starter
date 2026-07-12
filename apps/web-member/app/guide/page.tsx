'use client';

import { useEffect, useState } from 'react';
import { cmsContentSetting, defaultCmsContent, loadPublicSiteSettings } from '../site-settings';

type GuideFaq = { question: string; answer: string; enabled: boolean };

export default function GuidePage() {
  const [faqs, setFaqs] = useState<GuideFaq[]>(defaultCmsContent.faqs);
  useEffect(() => {
    let active = true;
    loadPublicSiteSettings().then((settings) => {
      if (active) setFaqs(cmsContentSetting(settings).faqs.filter((item) => item.enabled));
    });
    return () => { active = false; };
  }, []);

  return <main className="member-guide-page">
    <header className="member-guide-heading"><a href="/" aria-label="กลับหน้าแรก">‹</a><h1>คู่มือ / Guide</h1></header>
    <section className="member-guide-section">
      <div className="member-guide-section__title"><span>❔</span><h2>Guide</h2></div>
      <div className="member-guide-faqs">
        {(faqs.length ? faqs : defaultCmsContent.faqs).map((item, index) => <details key={`${item.question}-${index}`} open={index === 0}><summary>{item.question}<span>⌄</span></summary><p>{item.answer}</p></details>)}
        {faqs.length === 0 && <details><summary>ฝากเงินแบบ โอนผ่านธนาคาร<span>⌄</span></summary><p>ระบบยังไม่มีรายละเอียดจากผู้ดูแล กรุณาติดต่อทีมงานเพื่อเชื่อมต่อข้อมูลจริง</p></details>}
      </div>
      <a className="member-guide-more" href="/support">ดูทั้งหมด</a>
    </section>
    <section className="member-guide-section member-guide-payments">
      <div className="member-guide-section__title"><span>🏦</span><h2>ช่องทางการชำระเงิน</h2></div>
      <div className="member-guide-payment-row"><span>ธนาคาร</span><span>QR Payment</span><span>วอลเล็ท</span></div>
      <p>ช่องทางที่แสดงจะถูกเชื่อมจากระบบรับชำระเงินจริงเมื่อเปิดใช้งาน</p>
    </section>
    <section className="member-guide-section member-guide-contact">
      <div><h2>ติดต่อเรา</h2><p>ต้องการความช่วยเหลือเกี่ยวกับการฝาก ถอน หรือเกม</p></div><a href="/contact">ติดต่อทีมงาน</a>
    </section>
    <footer className="member-guide-footer"><span>การเชื่อมต่อปลอดภัย</span><span>18+</span><span>เล่นอย่างรับผิดชอบ</span></footer>
  </main>;
}
