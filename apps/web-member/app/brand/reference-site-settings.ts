export type ReferenceAssetSettings = {
  logo: string;
  logoMobile: string;
  logoLogin: string;
  logoRegister: string;
  favicon: string;
  announcementIcon: string;
  jackpotImage: string;
  promotionCardBackground: string;
  supportIcon: string;
};

export type ReferenceMenuIconSettings = {
  home: string;
  deposit: string;
  withdraw: string;
  games: string;
  promotion: string;
  bonus: string;
  affiliate: string;
  support: string;
  history: string;
  bank: string;
  profile: string;
  notification: string;
  vip: string;
  wallet: string;
  casino: string;
  slot: string;
  fishing: string;
  sport: string;
  lottery: string;
  live: string;
};

export type ReferenceContentSettings = {
  siteName: string;
  siteDescription: string;
  homeHeading: string;
  homeSubtitle: string;
  announcementLabel: string;
  promotionsHeading: string;
  gamesHeading: string;
  providersHeading: string;
  featuredGamesHeading: string;
  popularGamesHeading: string;
  recentGamesHeading: string;
  favoriteGamesHeading: string;
  emptyGamesMessage: string;
  emptyPromotionsMessage: string;
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  depositLabel: string;
  withdrawLabel: string;
  supportLabel: string;
};

const ROOT = '/assets/reference-brand';

export const DEFAULT_REFERENCE_ASSETS: ReferenceAssetSettings = {
  logo: `${ROOT}/header/noah345-logo.png`,
  logoMobile: `${ROOT}/header/noah345-logo.png`,
  logoLogin: `${ROOT}/home/login.webp`,
  logoRegister: `${ROOT}/header/noah345-logo.png`,
  favicon: `${ROOT}/header/noah345-logo.png`,
  announcementIcon: `${ROOT}/home-source/announcement-megaphone.png`,
  jackpotImage: `${ROOT}/home-source/jackpot.gif`,
  promotionCardBackground: `${ROOT}/home-source/promo-card-bg.png`,
  supportIcon: `${ROOT}/home/support-headset.webp`,
};

export const DEFAULT_REFERENCE_MENU_ICONS: ReferenceMenuIconSettings = {
  home: '⌂',
  deposit: '＋',
  withdraw: '↗',
  games: '🎮',
  promotion: '🎁',
  bonus: '★',
  affiliate: '↔',
  support: DEFAULT_REFERENCE_ASSETS.supportIcon,
  history: '≡',
  bank: '◈',
  profile: '👤',
  notification: '🔔',
  vip: '♛',
  wallet: '฿',
  casino: `${ROOT}/casino-mobile/ab.webp`,
  slot: `${ROOT}/slot/slot-bg.webp`,
  fishing: `${ROOT}/fishing/fishing-bg.webp`,
  sport: '⚽',
  lottery: `${ROOT}/lotto/bg_lotto.webp`,
  live: `${ROOT}/live/logo_live.webp`,
};

export const DEFAULT_REFERENCE_CONTENT: ReferenceContentSettings = {
  siteName: 'NOAH345',
  siteDescription: 'ประสบการณ์สมาชิกครบทุกบริการในที่เดียว',
  homeHeading: 'ยินดีต้อนรับ',
  homeSubtitle: 'เลือกเกม โปรโมชั่น และบริการที่ต้องการ',
  announcementLabel: 'ประกาศ',
  promotionsHeading: 'โปรโมชั่นแนะนำ',
  gamesHeading: 'เกมทั้งหมด',
  providersHeading: 'ค่ายเกม',
  featuredGamesHeading: 'เกมแนะนำ',
  popularGamesHeading: 'ยอดนิยม',
  recentGamesHeading: 'เล่นล่าสุด',
  favoriteGamesHeading: 'เกมโปรด',
  emptyGamesMessage: 'ยังไม่มีเกมที่พร้อมแสดง',
  emptyPromotionsMessage: 'ยังไม่มีโปรโมชั่นที่เปิดใช้งาน',
  loginTitle: 'ยินดีต้อนรับกลับ',
  loginSubtitle: 'เข้าสู่บัญชีของคุณอย่างปลอดภัย',
  registerTitle: 'สมัครสมาชิก',
  registerSubtitle: 'กรอกข้อมูลให้ครบในไม่กี่ขั้นตอน',
  depositLabel: 'ฝากเงิน',
  withdrawLabel: 'ถอนเงิน',
  supportLabel: 'ติดต่อเรา',
};
