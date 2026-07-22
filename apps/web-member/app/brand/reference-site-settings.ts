export type ReferenceAssetSettings = {
  logo: string;
  logoMobile: string;
  logoLogin: string;
  logoRegister: string;
  favicon: string;
  languageIcon: string;
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

/**
 * Binary reference assets are intentionally empty until the checksum-backed
 * asset commit lands. Runtime settings remain authoritative and empty defaults
 * avoid shipping internal URLs that would return 404.
 */
export const DEFAULT_REFERENCE_ASSETS: ReferenceAssetSettings = {
  logo: '',
  logoMobile: '',
  logoLogin: '',
  logoRegister: '',
  favicon: '',
  languageIcon: '',
  announcementIcon: '',
  jackpotImage: '',
  promotionCardBackground: '',
  supportIcon: '',
};

/**
 * Text/emoji fallbacks keep navigation usable without network requests. Admin
 * configured image URLs override these values through the normal settings path.
 */
export const DEFAULT_REFERENCE_MENU_ICONS: ReferenceMenuIconSettings = {
  home: '⌂',
  deposit: '＋',
  withdraw: '−',
  games: '▦',
  promotion: '★',
  bonus: '◆',
  affiliate: '◎',
  support: '?',
  history: '◷',
  bank: '◈',
  profile: '●',
  notification: '•',
  vip: '♛',
  wallet: '฿',
  casino: '♠',
  slot: '▦',
  fishing: '◁',
  sport: '⚽',
  lottery: '◎',
  live: '●',
  card: '♣',
  arcade: '◆',
  new: 'N',
  popular: '★',
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
  gameCategoryFishingLabel: 'เกมตกปลา',
  gameCategoryLotteryLabel: 'หวย',
  gameCategoryCardLabel: 'ไพ่',
  gameCategoryArcadeLabel: 'อาร์เคด',
  gameCategoryNewLabel: 'เกมใหม่',
  gameCategoryPopularLabel: 'ยอดนิยม',
  gameCategoryOtherLabel: 'เกมอื่น ๆ',
};
