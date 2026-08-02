export type ActivityRewardType = 'CREDIT' | 'POINT' | 'TICKET';
export type ActivityPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CAMPAIGN';
export type TurnoverCategory = 'slot' | 'casino';

export type ActivityCardConfig = {
  code: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
  requiresLogin: boolean;
};

export type DailyRewardConfig = {
  day: number;
  code: string;
  rewardType: ActivityRewardType;
  amount: number;
  imageUrl: string;
};

export type MissionDefinition = {
  code: string;
  title: string;
  description: string;
  metricCode: string;
  category?: string;
  target: number;
  rewardType: ActivityRewardType;
  rewardAmount: number;
  period: ActivityPeriod;
  enabled: boolean;
  expiresAt?: string;
};

export type TurnoverRewardTier = {
  code: string;
  category: TurnoverCategory;
  order: number;
  turnover: number;
  bonus: number;
  enabled: boolean;
};

export type LotteryRoundConfig = {
  code: string;
  title: string;
  bannerUrl: string;
  enabled: boolean;
  opensAt: string;
  closesAt: string;
  resultAt?: string;
  topDigits: number;
  bottomDigits: number;
  topReward: number;
  bottomReward: number;
  bothReward: number;
  conditions: string[];
};

export type ActivityConfig = {
  enabled: boolean;
  timezone: string;
  cards: ActivityCardConfig[];
  dailyLogin: {
    enabled: boolean;
    cycleDays: number;
    resetHour: number;
    cycleAnchor: string;
    rewards: DailyRewardConfig[];
  };
  missions: {
    enabled: boolean;
    definitions: MissionDefinition[];
  };
  turnover: {
    enabled: boolean;
    tiers: TurnoverRewardTier[];
  };
  lottery: {
    enabled: boolean;
    rounds: LotteryRoundConfig[];
  };
};

const CREDIT_ICON = 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png';
const TICKET_ICON = 'https://cdn.zabbet.com/FEZX/rewards/1719041616090-bc9abbd0-743b-4efe-b3ea-abc91d132851.png';
const POINT_ICON = 'https://cdn.zabbet.com/FEZX/rewards/1719041921061-0895cbb8-7950-4410-aec8-ac091190235d.png';

export const DEFAULT_ACTIVITY_CARDS: ActivityCardConfig[] = [
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
];

const DAILY_REWARD_AMOUNTS = [5, 1, 2, 2, 2, 2, 50, 1, 2, 2, 2, 2, 2, 100, 1, 2, 2, 2, 2, 2, 200, 1, 2, 2, 2, 2, 2, 300];

export const DEFAULT_DAILY_REWARDS: DailyRewardConfig[] = DAILY_REWARD_AMOUNTS.map((amount, index) => {
  const day = index + 1;
  const rewardType: ActivityRewardType = day % 7 === 1 && day !== 1 ? 'TICKET' : day === 1 ? 'POINT' : 'CREDIT';
  return {
    day,
    code: `daily-${day}`,
    rewardType,
    amount,
    imageUrl: rewardType === 'TICKET' ? TICKET_ICON : rewardType === 'POINT' ? POINT_ICON : CREDIT_ICON,
  };
});

export const DEFAULT_MISSIONS: MissionDefinition[] = [
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
];

const TURNOVER_LEVELS = [
  [5000, 49],
  [30000, 69],
  [100000, 89],
  [300000, 399],
  [600000, 699],
  [1000000, 999],
  [3000000, 1699],
  [8000000, 4999],
  [20000000, 9999],
  [50000000, 19999],
] as const;

export const DEFAULT_TURNOVER_TIERS: TurnoverRewardTier[] = (['slot', 'casino'] as const).flatMap((category) => (
  TURNOVER_LEVELS.map(([turnover, bonus], index) => ({
    code: `${category}-${index + 1}`,
    category,
    order: index + 1,
    turnover,
    bonus,
    enabled: true,
  }))
));

export const DEFAULT_LOTTERY_ROUNDS: LotteryRoundConfig[] = [
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
];

export const DEFAULT_ACTIVITY_CONFIG: ActivityConfig = {
  enabled: true,
  timezone: 'Asia/Bangkok',
  cards: DEFAULT_ACTIVITY_CARDS,
  dailyLogin: {
    enabled: true,
    cycleDays: 28,
    resetHour: 4,
    cycleAnchor: '2026-08-01T04:30:00+07:00',
    rewards: DEFAULT_DAILY_REWARDS,
  },
  missions: {
    enabled: true,
    definitions: DEFAULT_MISSIONS,
  },
  turnover: {
    enabled: true,
    tiers: DEFAULT_TURNOVER_TIERS,
  },
  lottery: {
    enabled: true,
    rounds: DEFAULT_LOTTERY_ROUNDS,
  },
};

export function parseActivityConfig(settings: Record<string, unknown>): ActivityConfig {
  const enabled = booleanValue(settings.activity_system_enabled, DEFAULT_ACTIVITY_CONFIG.enabled);
  const timezone = stringValue(settings.activity_timezone, DEFAULT_ACTIVITY_CONFIG.timezone);
  const cards = jsonArray<ActivityCardConfig>(settings.activity_cards_json, DEFAULT_ACTIVITY_CONFIG.cards)
    .filter((item) => item && typeof item.code === 'string' && typeof item.href === 'string')
    .map((item, index) => ({
      ...item,
      enabled: item.enabled !== false,
      requiresLogin: item.requiresLogin !== false,
      sortOrder: finiteNumber(item.sortOrder, (index + 1) * 10),
    }));
  const cycleDays = boundedInteger(settings.daily_login_cycle_days, DEFAULT_ACTIVITY_CONFIG.dailyLogin.cycleDays, 1, 366);
  const resetHour = boundedInteger(settings.daily_login_reset_hour, DEFAULT_ACTIVITY_CONFIG.dailyLogin.resetHour, 0, 23);
  const rewards = jsonArray<DailyRewardConfig>(settings.daily_login_rewards_json, DEFAULT_ACTIVITY_CONFIG.dailyLogin.rewards)
    .filter((item) => item && finiteNumber(item.day, 0) >= 1)
    .map((item) => ({ ...item, day: boundedInteger(item.day, 1, 1, cycleDays), amount: Math.max(0, finiteNumber(item.amount, 0)) }));
  const missions = jsonArray<MissionDefinition>(settings.mission_definitions_json, DEFAULT_ACTIVITY_CONFIG.missions.definitions)
    .filter((item) => item && typeof item.code === 'string' && typeof item.metricCode === 'string')
    .map((item) => ({ ...item, target: Math.max(0, finiteNumber(item.target, 0)), rewardAmount: Math.max(0, finiteNumber(item.rewardAmount, 0)), enabled: item.enabled !== false }));
  const tiers = jsonArray<TurnoverRewardTier>(settings.turnover_reward_tiers_json, DEFAULT_ACTIVITY_CONFIG.turnover.tiers)
    .filter((item) => item && (item.category === 'slot' || item.category === 'casino'))
    .map((item, index) => ({ ...item, order: boundedInteger(item.order, index + 1, 1, 1000), turnover: Math.max(0, finiteNumber(item.turnover, 0)), bonus: Math.max(0, finiteNumber(item.bonus, 0)), enabled: item.enabled !== false }));
  const rounds = jsonArray<LotteryRoundConfig>(settings.lottery_prediction_rounds_json, DEFAULT_ACTIVITY_CONFIG.lottery.rounds)
    .filter((item) => item && typeof item.code === 'string')
    .map((item) => ({
      ...item,
      enabled: item.enabled !== false,
      topDigits: boundedInteger(item.topDigits, 3, 1, 10),
      bottomDigits: boundedInteger(item.bottomDigits, 2, 1, 10),
      topReward: Math.max(0, finiteNumber(item.topReward, 0)),
      bottomReward: Math.max(0, finiteNumber(item.bottomReward, 0)),
      bothReward: Math.max(0, finiteNumber(item.bothReward, 0)),
      conditions: Array.isArray(item.conditions) ? item.conditions.filter((value): value is string => typeof value === 'string') : [],
    }));

  return {
    enabled,
    timezone,
    cards,
    dailyLogin: {
      enabled: booleanValue(settings.daily_login_enabled, DEFAULT_ACTIVITY_CONFIG.dailyLogin.enabled),
      cycleDays,
      resetHour,
      cycleAnchor: stringValue(settings.daily_login_cycle_anchor, DEFAULT_ACTIVITY_CONFIG.dailyLogin.cycleAnchor),
      rewards,
    },
    missions: {
      enabled: booleanValue(settings.missions_enabled, DEFAULT_ACTIVITY_CONFIG.missions.enabled),
      definitions: missions,
    },
    turnover: {
      enabled: booleanValue(settings.turnover_rewards_enabled, DEFAULT_ACTIVITY_CONFIG.turnover.enabled),
      tiers,
    },
    lottery: {
      enabled: booleanValue(settings.lottery_prediction_enabled, DEFAULT_ACTIVITY_CONFIG.lottery.enabled),
      rounds,
    },
  };
}

function jsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function finiteNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(finiteNumber(value, fallback))));
}
