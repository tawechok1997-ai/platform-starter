import SettingsSectionPage from '../settings-section-page';

const ACTIVITY_CARDS = JSON.stringify([
  {
    code: 'daily-mission',
    title: 'ภารกิจ',
    imageUrl: 'https://cdn.zabbet.com/event/predict/1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d.jpeg',
    href: '/mobile/member/activity/daily-mission',
    enabled: true,
    sortOrder: 10,
    requiresLogin: true,
  },
  {
    code: 'lottery-prediction',
    title: 'ทายผลหวย',
    subtitle: 'ตรวจสอบรอบกิจกรรมล่าสุด',
    imageUrl: 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
    href: '/mobile/member/activity/lottery-prediction',
    enabled: true,
    sortOrder: 20,
    requiresLogin: true,
  },
  {
    code: 'turnover-reward',
    title: 'ทำยอด Turn รับรางวัลจุใจ',
    imageUrl: 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
    href: '/mobile/member/activity/turnover-reward',
    enabled: true,
    sortOrder: 30,
    requiresLogin: true,
  },
], null, 2);

const DAILY_AMOUNTS = [5, 1, 2, 2, 2, 2, 50, 1, 2, 2, 2, 2, 2, 100, 1, 2, 2, 2, 2, 2, 200, 1, 2, 2, 2, 2, 2, 300];
const DAILY_REWARDS = JSON.stringify(DAILY_AMOUNTS.map((amount, index) => {
  const day = index + 1;
  const rewardType = day % 7 === 1 && day !== 1 ? 'TICKET' : day === 1 ? 'POINT' : 'CREDIT';
  return {
    day,
    code: `daily-${day}`,
    rewardType,
    amount,
    imageUrl: rewardType === 'TICKET'
      ? 'https://cdn.zabbet.com/FEZX/rewards/1719041616090-bc9abbd0-743b-4efe-b3ea-abc91d132851.png'
      : rewardType === 'POINT'
        ? 'https://cdn.zabbet.com/FEZX/rewards/1719041921061-0895cbb8-7950-4410-aec8-ac091190235d.png'
        : 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png',
  };
}), null, 2);

const MISSIONS = JSON.stringify([
  {
    code: 'monthly-deposit-play-100k',
    title: 'ภารกิจรายเดือน : ฝากและเล่นสะสมครบ รับ 300 บาท',
    description: 'ฝากและเล่นสะสมครบ 100,000 บาท รับทันที 300 CREDIT',
    metricCode: 'QUALIFIED_TURNOVER',
    target: 100000,
    rewardType: 'CREDIT',
    rewardAmount: 300,
    period: 'MONTHLY',
    enabled: true,
  },
  {
    code: 'monthly-deposit-rounds',
    title: 'ภารกิจรายเดือน : ฝากและเล่น รับโชค',
    description: 'ฝากและเล่น 500 บาท จำนวน 20 ครั้ง รับทันที 3 Ticket',
    metricCode: 'QUALIFIED_DEPOSIT_COUNT',
    target: 20,
    rewardType: 'TICKET',
    rewardAmount: 3,
    period: 'MONTHLY',
    enabled: true,
  },
  {
    code: 'monthly-return-all',
    title: 'ภารกิจรายเดือน : BetReturn ทุกประเภท',
    description: 'เล่นครบตามยอดที่กำหนดในทุกหมวด รับคะแนนสะสม',
    metricCode: 'BET_RETURN',
    target: 10000,
    rewardType: 'POINT',
    rewardAmount: 100,
    period: 'MONTHLY',
    enabled: true,
  },
  {
    code: 'monthly-rb7-lotto',
    title: 'ภารกิจรายเดือน : เดิมพัน RB7 Lotto',
    description: 'เดิมพัน RB7 Lotto ครบตามยอด รับเครดิตกิจกรรม',
    metricCode: 'QUALIFIED_TURNOVER',
    category: 'lottery',
    target: 5000,
    rewardType: 'CREDIT',
    rewardAmount: 50,
    period: 'MONTHLY',
    enabled: true,
  },
], null, 2);

const TURNOVER_LEVELS = [
  [5000, 49], [30000, 69], [100000, 89], [300000, 399], [600000, 699],
  [1000000, 999], [3000000, 1699], [8000000, 4999], [20000000, 9999], [50000000, 19999],
] as const;
const TURNOVER_TIERS = JSON.stringify((['slot', 'casino'] as const).flatMap((category) => (
  TURNOVER_LEVELS.map(([turnover, bonus], index) => ({
    code: `${category}-${index + 1}`,
    category,
    order: index + 1,
    turnover,
    bonus,
    enabled: true,
  }))
)), null, 2);

const LOTTERY_ROUNDS = JSON.stringify([
  {
    code: 'lottery-2026-08-01',
    title: 'กิจกรรมทายผลหวย',
    bannerUrl: 'https://cdn.zabbet.com/event/predict/1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg',
    enabled: true,
    opensAt: '2026-07-25T00:00:00+07:00',
    closesAt: '2026-08-01T15:00:00+07:00',
    resultAt: '2026-08-01T16:30:00+07:00',
    topDigits: 3,
    bottomDigits: 2,
    topReward: 5000,
    bottomReward: 2000,
    bothReward: 10000,
    conditions: [
      'สมาชิกหนึ่งคนส่งคำทายได้หนึ่งครั้งต่อรอบ',
      'ต้องกรอกเลข 3 ตัวบนและ 2 ตัวล่างให้ครบก่อนหมดเวลา',
      'ระบบยึดเวลาของเซิร์ฟเวอร์ Asia/Bangkok เป็นหลัก',
      'รางวัลจะเข้ากระเป๋าหลักหลังประกาศผลและตรวจสอบรายการแล้ว',
    ],
  },
], null, 2);

const DEFAULTS = {
  activity_system_enabled: true,
  activity_timezone: 'Asia/Bangkok',
  activity_cards_json: ACTIVITY_CARDS,
  daily_login_enabled: true,
  daily_login_cycle_days: 28,
  daily_login_reset_hour: 4,
  daily_login_cycle_anchor: '2026-08-01T04:30:00+07:00',
  daily_login_rewards_json: DAILY_REWARDS,
  missions_enabled: true,
  mission_definitions_json: MISSIONS,
  turnover_rewards_enabled: true,
  turnover_reward_tiers_json: TURNOVER_TIERS,
  lottery_prediction_enabled: true,
  lottery_prediction_rounds_json: LOTTERY_ROUNDS,
};

export default function ActivitySettingsPage() {
  return (
    <SettingsSectionPage
      group="features"
      permissionBase="settings.features"
      title="กิจกรรม ภารกิจ และรางวัล"
      description="ตั้งค่าหน้ากิจกรรม รอบล็อคอิน ภารกิจ Turn และทายผลจากจุดเดียว ระบบสมาชิกและ API ใช้ข้อมูลชุดเดียวกัน"
      preview="features"
      risk="sensitive"
      defaults={DEFAULTS}
      fields={[
        { key: 'activity_system_enabled', label: 'เปิดระบบกิจกรรมทั้งหมด', type: 'checkbox', section: 'ระบบกลาง', helper: 'ปิดแล้ว Public API จะคืนรายการว่าง และสมาชิกจะเข้าร่วมไม่ได้' },
        { key: 'activity_timezone', label: 'เขตเวลาของกิจกรรม', type: 'text', section: 'ระบบกลาง', required: true, maxLength: 80, helper: 'แนะนำ Asia/Bangkok เพื่อให้รอบวันตรงกับหน้า Member' },
        { key: 'activity_cards_json', label: 'รายการการ์ดหน้ากิจกรรม (JSON)', type: 'textarea', section: 'ระบบกลาง', required: true, helper: 'กำหนด code, title, imageUrl, href, enabled, sortOrder และ requiresLogin' },

        { key: 'daily_login_enabled', label: 'เปิดล็อคอินประจำวัน', type: 'checkbox', section: 'ล็อคอินประจำวัน' },
        { key: 'daily_login_cycle_days', label: 'จำนวนวันต่อรอบ', type: 'number', section: 'ล็อคอินประจำวัน', min: 1, max: 366, required: true },
        { key: 'daily_login_reset_hour', label: 'เวลารีเซ็ตรอบรายวัน', type: 'number', section: 'ล็อคอินประจำวัน', min: 0, max: 23, required: true, helper: 'ใช้ชั่วโมง 0-23 ตามเขตเวลาของกิจกรรม' },
        { key: 'daily_login_cycle_anchor', label: 'เวลาเริ่มรอบอ้างอิง', type: 'text', section: 'ล็อคอินประจำวัน', required: true, helper: 'ISO 8601 เช่น 2026-08-01T04:30:00+07:00' },
        { key: 'daily_login_rewards_json', label: 'รางวัลวันที่ 1-28 (JSON)', type: 'textarea', section: 'ล็อคอินประจำวัน', required: true, helper: 'rewardType รองรับ CREDIT, POINT และ TICKET' },

        { key: 'missions_enabled', label: 'เปิดระบบภารกิจ', type: 'checkbox', section: 'ภารกิจ' },
        { key: 'mission_definitions_json', label: 'กฎภารกิจ (JSON)', type: 'textarea', section: 'ภารกิจ', required: true, helper: 'metricCode ต้องตรงกับข้อมูลที่ส่งเข้า POST /admin/activities/metrics' },

        { key: 'turnover_rewards_enabled', label: 'เปิดรางวัล Turn', type: 'checkbox', section: 'ทำยอด Turn' },
        { key: 'turnover_reward_tiers_json', label: 'ตาราง Turn สล็อต/คาสิโน (JSON)', type: 'textarea', section: 'ทำยอด Turn', required: true, helper: 'รองรับ category slot และ casino ระบบกันรับซ้ำด้วย period + tier code' },

        { key: 'lottery_prediction_enabled', label: 'เปิดกิจกรรมทายผลหวย', type: 'checkbox', section: 'ทายผลหวย' },
        { key: 'lottery_prediction_rounds_json', label: 'รอบทายผลหวย (JSON)', type: 'textarea', section: 'ทายผลหวย', required: true, helper: 'กำหนดเวลาเปิด/ปิด จำนวนหลัก รางวัล และเงื่อนไข แต่ละ round code ต้องไม่ซ้ำ' },
      ]}
    />
  );
}
