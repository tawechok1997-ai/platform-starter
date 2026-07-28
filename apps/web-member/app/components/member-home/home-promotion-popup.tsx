'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CmsContent, PromotionCampaign } from '../../site-settings';
import { promotionMediaUrls } from '../../site-settings';

type PromotionCategory = 'all' | 'new-member' | 'daily' | 'privilege' | 'cashback';

type HomePromotionPopupProps = {
  content: CmsContent;
  campaigns: PromotionCampaign[];
  onClose: () => void;
};

const CATEGORY_TABS: Array<{ key: PromotionCategory; label: string }> = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'new-member', label: 'สมาชิกใหม่' },
  { key: 'daily', label: 'ประจำวัน' },
  { key: 'privilege', label: 'สิทธิพิเศษ' },
  { key: 'cashback', label: 'คืนยอดเสีย' },
];

const SOURCE_FALLBACK_CAMPAIGNS: PromotionCampaign[] = [
  {
    id: 'source-turnover-reward',
    title: 'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
    description: '',
    enabled: true,
    lifecycle: 'published',
    bonusType: 'fixed',
    bonusValue: 0,
    minDeposit: 0,
    maxBonus: 0,
    turnoverMultiplier: 0,
    claimMode: 'manual_review',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
    desktopImageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
    mobileImageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
    href: '/browse/promotions',
    priority: 30,
  },
  {
    id: 'source-referral-reward',
    title: 'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜',
    description: '',
    enabled: true,
    lifecycle: 'published',
    bonusType: 'fixed',
    bonusValue: 300,
    minDeposit: 0,
    maxBonus: 300,
    turnoverMultiplier: 0,
    claimMode: 'manual_review',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
    desktopImageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
    mobileImageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
    href: '/browse/promotions',
    priority: 20,
  },
  {
    id: 'source-repeat-deposit',
    title: 'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
    description: '',
    enabled: true,
    lifecycle: 'published',
    bonusType: 'fixed',
    bonusValue: 100,
    minDeposit: 0,
    maxBonus: 100,
    turnoverMultiplier: 0,
    claimMode: 'manual_review',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
    desktopImageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
    mobileImageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
    href: '/browse/promotions',
    priority: 10,
  },
];

export function HomePromotionPopup({ content, campaigns, onClose }: HomePromotionPopupProps) {
  const [category, setCategory] = useState<PromotionCategory>('all');
  const [visible, setVisible] = useState(false);

  const publishedCampaigns = useMemo(() => {
    const active = campaigns
      .filter((campaign) => campaign.enabled && campaign.lifecycle !== 'draft' && campaign.lifecycle !== 'archived')
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
    return active.length ? active : SOURCE_FALLBACK_CAMPAIGNS;
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    if (category === 'all') return publishedCampaigns;
    return publishedCampaigns.filter((campaign) => classifyCampaign(campaign) === category);
  }, [category, publishedCampaigns]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const animationFrame = window.requestAnimationFrame(() => setVisible(true));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWithMotion();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  function closeWithMotion() {
    setVisible(false);
    window.setTimeout(onClose, 180);
  }

  return (
    <div
      className="home-promotion-popup"
      data-state={visible ? 'open' : 'opening'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-promotion-popup-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeWithMotion();
      }}
    >
      <section className="home-promotion-popup__panel">
        <div className="home-promotion-popup__shine" aria-hidden="true" />

        <header className="home-promotion-popup__header">
          <div className="home-promotion-popup__title">
            <span className="home-promotion-popup__gift" aria-hidden="true">
              <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
                <path d="M26.4936 25.969V14.2852H5.39062V25.969C5.39062 27.0736 6.28606 27.969 7.39062 27.969H24.4936C25.5982 27.969 26.4936 27.0736 26.4936 25.969Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.9375 27.9688V14.2812M28.2157 11.082V12.2837C28.2157 13.3882 27.3203 14.2837 26.2157 14.2837H5.66406C4.5595 14.2837 3.66406 13.3882 3.66406 12.2837V11.082C3.66406 9.97747 4.5595 9.08203 5.66406 9.08203H26.2157C27.3203 9.08203 28.2157 9.97747 28.2157 11.082Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.9393 9.08334C15.9393 7.33334 13.8977 3.25 10.8352 3.25C5.85297 3.25 7.66787 9.08334 10.0525 9.08334M15.9375 9.08334C15.9375 7.33334 17.9792 3.25 21.0417 3.25C26.0239 3.25 24.2089 9.08334 21.8244 9.08334" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 id="home-promotion-popup-title">โปรโมชั่น</h2>
          </div>
          <button type="button" className="home-promotion-popup__close" onClick={closeWithMotion} aria-label="ปิดโปรโมชั่น">
            <img src="/images/close.svg" width="16" height="16" alt="" />
          </button>
        </header>

        <div className="home-promotion-popup__content">
          <nav className="home-promotion-popup__tabs" aria-label="หมวดโปรโมชั่น">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={category === tab.key ? 'is-active' : ''}
                onClick={() => setCategory(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="home-promotion-popup__scroll">
            {filteredCampaigns.length ? (
              <div className="home-promotion-popup__grid">
                {filteredCampaigns.map((campaign) => {
                  const media = promotionMediaUrls(content, campaign);
                  const imageUrl = media.desktop || media.mobile || campaign.imageUrl || '';
                  return (
                    <a key={campaign.id} className="home-promotion-popup__card" href={campaign.href || '/browse/promotions'}>
                      <div className="home-promotion-popup__media">
                        {imageUrl ? <img src={imageUrl} alt={campaign.title} loading="lazy" /> : null}
                      </div>
                      <strong>{campaign.title}</strong>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="home-promotion-popup__empty">ยังไม่มีโปรโมชั่นในหมวดนี้</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function classifyCampaign(campaign: PromotionCampaign): PromotionCategory {
  const text = `${campaign.title} ${campaign.description} ${campaign.badgeText ?? ''}`.toLowerCase();
  if (/คืน|ยอดเสีย|cashback|loss/.test(text)) return 'cashback';
  if (/สมาชิกใหม่|ต้อนรับ|welcome|new member/.test(text)) return 'new-member';
  if (/ประจำวัน|รายวัน|daily|ฝากซ้ำ/.test(text)) return 'daily';
  return 'privilege';
}
