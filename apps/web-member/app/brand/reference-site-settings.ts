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
  card: string;
  arcade: string;
  new: string;
  popular: string;
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
  gameCategoryHomeLabel: string;
  gameCategoryCasinoLabel: string;
  gameCategorySlotLabel: string;
  gameCategoryLiveLabel: string;
  gameCategorySportLabel: string;
  gameCategoryFishingLabel: string;
  gameCategoryLotteryLabel: string;
  gameCategoryCardLabel: string;
  gameCategoryArcadeLabel: string;
  gameCategoryNewLabel: string;
  gameCategoryPopularLabel: string;
  gameCategoryOtherLabel: string;
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
  home: `${ROOT}/menu/home.png`,
  deposit: `${ROOT}/menu/deposit.png`,
  withdraw: `${ROOT}/menu/withdraw.png`,
  games: `${ROOT}/menu/home.png`,
  promotion: `${ROOT}/menu/promotion.png`,
  bonus: `${ROOT}/menu/bonus.png`,
  affiliate: `${ROOT}/menu/affiliate.png`,
  support: `${ROOT}/menu/support.png`,
  history: `${ROOT}/menu/history.png`,
  bank: '◈',
  profile: '👤',
  notification: `${ROOT}/menu/notification.png`,
  vip: '♛',
  wallet: '฿',
  casino: `${ROOT}/menu/casino.png`,
  slot: `${ROOT}/menu/slot.png`,
  fishing: `${ROOT}/menu/fishing.png`,
  sport: `${ROOT}/menu/sport.png`,
  lottery: `${ROOT}/menu/lottery.png`,
  live: `${ROOT}/menu/live.png`,
  card: `${ROOT}/menu/card.png`,
  arcade: `${ROOT}/menu/activities.png`,
  new: `${ROOT}/menu/news.png`,
  popular: `${ROOT}/menu/recommended.png`,
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
  gameCategoryHomeLabel: 'หน้าหลัก',
  gameCategoryCasinoLabel: 'คาสิโน',
  gameCategorySlotLabel: 'สล็อต',
  gameCategoryLiveLabel: 'คาสิโนสด',
  gameCategorySportLabel: 'กีฬา',
  gameCategoryFishingLabel: 'ยิงปลา',
  gameCategoryLotteryLabel: 'หวย',
  gameCategoryCardLabel: 'ไพ่',
  gameCategoryArcadeLabel: 'อาร์เคด',
  gameCategoryNewLabel: 'เกมใหม่',
  gameCategoryPopularLabel: 'ยอดนิยม',
  gameCategoryOtherLabel: 'เกมอื่น ๆ',
};
