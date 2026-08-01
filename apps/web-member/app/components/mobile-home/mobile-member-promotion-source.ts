export type SourcePromotionCampaign = {
  id: string;
  title: string;
  mobileImageUrl: string;
  category: 'new-member' | 'daily' | 'privilege' | 'cashback';
  endsAt: string;
  enabled: true;
  lifecycle: 'published';
  description: string;
};

function campaign(
  id: string,
  title: string,
  mobileImageUrl: string,
  category: SourcePromotionCampaign['category'],
  endsAt: string,
): SourcePromotionCampaign {
  return {
    id,
    title,
    mobileImageUrl,
    category,
    endsAt,
    enabled: true,
    lifecycle: 'published',
    description: title,
  };
}

export const SOURCE_PROMOTION_CAMPAIGNS: readonly SourcePromotionCampaign[] = [
  campaign(
    'first-deposit-daily-10',
    'โปรโมชั่นฝากครั้งแรกของวันรับโบนัส 10%',
    'https://cdn.zabbet.com/FEZX/promotions/1782164814389-bca4393d-1c7c-4bec-a0b8-e960916cfd9d.jpg',
    'daily',
    '2039-03-31T23:59:59+07:00',
  ),
  campaign(
    'happy-sunday',
    'Happy Sunday❤️',
    'https://cdn.zabbet.com/FEZX/promotions/1782165958043-1ec8b238-97de-4b29-b502-be002ba8ac98.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-monday',
    'Happy Monday💛',
    'https://cdn.zabbet.com/FEZX/promotions/1782186950198-7958f845-3425-424a-b5e3-01f54b8e0c4b.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-tuesday',
    'Happy Tuesday🩷',
    'https://cdn.zabbet.com/FEZX/promotions/1782162665522-ff713e27-06c3-4dd5-b225-b807e03070ea.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-wednesday-199',
    'Happy Wednesday💚 ฝาก 199 บาทรับ 199 บาท',
    'https://cdn.zabbet.com/FEZX/promotions/1783488417565-f0ae722e-6a36-4dcd-9b24-d5dacdcecd0d.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-thursday',
    'Happy Thursday🧡',
    'https://cdn.zabbet.com/FEZX/promotions/1782333005051-a77a780a-ce12-4de1-84c6-cc7e7f81ec10.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-friday-500',
    'Happy Friday🩵 ฝาก 500 บาท รับเพิ่มอีก 200 บาท',
    'https://cdn.zabbet.com/FEZX/promotions/1782165688406-a17f5eec-b674-42c0-8a3b-35314d34c0ca.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-friday-1000',
    'Happy Friday🩵 ฝาก 1,000 บาท รับเพิ่มอีก 300 บาท',
    'https://cdn.zabbet.com/FEZX/promotions/1782165739037-02c65a48-ca93-4ea6-9f96-145e4b2d6c3e.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'happy-saturday',
    'Happy Saturday💜',
    'https://cdn.zabbet.com/FEZX/promotions/1782165809106-8828c4f2-92c6-4392-8a28-43418d99e73b.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'weekly-cashback',
    'คืนยอดเสีย ทุกสัปดาห์ 💜',
    'https://cdn.zabbet.com/FEZX/promotions/1783790318510-5bc763b9-f73e-4930-9870-174dab6c1e77.jpg',
    'cashback',
    '2030-06-01T23:59:59+07:00',
  ),
  campaign(
    'deposit-300-get-400',
    'โปรโมชั่น ฝาก 300 บาท รับ 400 บาท',
    'https://cdn.zabbet.com/FEZX/promotions/1782164376815-227b90e6-58cf-467e-b2f3-e3eaf9999672.jpg',
    'privilege',
    '2028-06-23T23:59:59+07:00',
  ),
  campaign(
    'birthday-bonus',
    'HAPPY BIRTHDAY BONUS🎉',
    'https://cdn.zabbet.com/FEZX/promotions/1780834184357-0cc2399f-e991-4b8c-bd34-c9febea8395a.jpg',
    'privilege',
    '2030-06-01T23:59:59+07:00',
  ),
  campaign(
    'deposit-100-get-150',
    'ฝาก 100 บาท รับ 150 บาท',
    'https://cdn.zabbet.com/FEZX/promotions/1782164248920-68db04c9-6a30-4095-81b5-efee4a336a4f.jpg',
    'privilege',
    '2030-04-30T23:59:59+07:00',
  ),
  campaign(
    'turnover-reward',
    'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
    'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
    'privilege',
    '2030-06-01T23:59:59+07:00',
  ),
  campaign(
    'new-member-three-days-30',
    'สมาชิกใหม่ฝากต่อเนื่อง 3 วัน รับ 30% สูงสุด 1,000 บาท',
    'https://cdn.zabbet.com/FEZX/promotions/1782164616325-0a1284e5-10ab-498d-8f73-3121a0d47941.jpg',
    'new-member',
    '2038-03-31T23:59:59+07:00',
  ),
  campaign(
    'refer-friend-300',
    'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜',
    'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
    'new-member',
    '2029-06-30T23:59:59+07:00',
  ),
  campaign(
    'secret-bonus-100',
    '⚡️Secret Bonus ฝากรับ 100 บาท!!! (หน้าเว็บ)',
    'https://cdn.zabbet.com/FEZX/promotions/1783881200278-ab8a8dfd-8b1d-4762-a8f1-ab4bbb6ffb38.jpg',
    'privilege',
    '2027-06-01T23:59:59+07:00',
  ),
  campaign(
    'repeat-deposit-100',
    'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
    'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
    'daily',
    '2027-06-01T23:59:59+07:00',
  ),
] as const;

export const SOURCE_PROMOTION_PAYLOAD = {
  features: {
    promotion_campaigns: SOURCE_PROMOTION_CAMPAIGNS,
  },
} as const;
