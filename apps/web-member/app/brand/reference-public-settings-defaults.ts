import {
  DEFAULT_REFERENCE_ASSETS,
  DEFAULT_REFERENCE_CONTENT,
  DEFAULT_REFERENCE_MENU_ICONS,
} from './reference-site-settings';

/**
 * Initial values copied from the approved reference package. Admin/public site
 * settings remain authoritative because the normalizer applies runtime values
 * after these defaults.
 */
export const REFERENCE_WEBSITE_DEFAULTS: Record<string, unknown> = {
  site_name: DEFAULT_REFERENCE_CONTENT.siteName,
  site_description: DEFAULT_REFERENCE_CONTENT.siteDescription,
  home_heading: DEFAULT_REFERENCE_CONTENT.homeHeading,
  home_subtitle: DEFAULT_REFERENCE_CONTENT.homeSubtitle,
  announcement_label: DEFAULT_REFERENCE_CONTENT.announcementLabel,
  promotions_heading: DEFAULT_REFERENCE_CONTENT.promotionsHeading,
  games_heading: DEFAULT_REFERENCE_CONTENT.gamesHeading,
  providers_heading: DEFAULT_REFERENCE_CONTENT.providersHeading,
  featured_games_heading: DEFAULT_REFERENCE_CONTENT.featuredGamesHeading,
  popular_games_heading: DEFAULT_REFERENCE_CONTENT.popularGamesHeading,
  recent_games_heading: DEFAULT_REFERENCE_CONTENT.recentGamesHeading,
  favorite_games_heading: DEFAULT_REFERENCE_CONTENT.favoriteGamesHeading,
  empty_games_message: DEFAULT_REFERENCE_CONTENT.emptyGamesMessage,
  empty_promotions_message: DEFAULT_REFERENCE_CONTENT.emptyPromotionsMessage,
  login_title: DEFAULT_REFERENCE_CONTENT.loginTitle,
  login_subtitle: DEFAULT_REFERENCE_CONTENT.loginSubtitle,
  register_title: DEFAULT_REFERENCE_CONTENT.registerTitle,
  register_subtitle: DEFAULT_REFERENCE_CONTENT.registerSubtitle,
  deposit_label: DEFAULT_REFERENCE_CONTENT.depositLabel,
  withdraw_label: DEFAULT_REFERENCE_CONTENT.withdrawLabel,
  support_label: DEFAULT_REFERENCE_CONTENT.supportLabel,
  game_category_home_label: DEFAULT_REFERENCE_CONTENT.gameCategoryHomeLabel,
  game_category_casino_label: DEFAULT_REFERENCE_CONTENT.gameCategoryCasinoLabel,
  game_category_slot_label: DEFAULT_REFERENCE_CONTENT.gameCategorySlotLabel,
  game_category_live_label: DEFAULT_REFERENCE_CONTENT.gameCategoryLiveLabel,
  game_category_sport_label: DEFAULT_REFERENCE_CONTENT.gameCategorySportLabel,
  game_category_fishing_label: DEFAULT_REFERENCE_CONTENT.gameCategoryFishingLabel,
  game_category_lottery_label: DEFAULT_REFERENCE_CONTENT.gameCategoryLotteryLabel,
  game_category_card_label: DEFAULT_REFERENCE_CONTENT.gameCategoryCardLabel,
  game_category_arcade_label: DEFAULT_REFERENCE_CONTENT.gameCategoryArcadeLabel,
  game_category_new_label: DEFAULT_REFERENCE_CONTENT.gameCategoryNewLabel,
  game_category_popular_label: DEFAULT_REFERENCE_CONTENT.gameCategoryPopularLabel,
  game_category_other_label: DEFAULT_REFERENCE_CONTENT.gameCategoryOtherLabel,
};

export const REFERENCE_BRANDING_DEFAULTS: Record<string, unknown> = {
  logo_url: DEFAULT_REFERENCE_ASSETS.logo,
  logo_mobile_url: DEFAULT_REFERENCE_ASSETS.logoMobile,
  logo_login_url: DEFAULT_REFERENCE_ASSETS.logoLogin,
  logo_register_url: DEFAULT_REFERENCE_ASSETS.logoRegister,
  favicon_url: DEFAULT_REFERENCE_ASSETS.favicon,
  language_icon_url: DEFAULT_REFERENCE_ASSETS.languageIcon,
};

/**
 * Reference menu defaults are merged into the normalized icon settings once.
 * Every Member consumer can therefore use the shared BrandIcon renderer without
 * maintaining a second fallback chain.
 */
export const REFERENCE_LEGACY_MENU_ICON_DEFAULTS: Record<string, string> = {
  home: DEFAULT_REFERENCE_MENU_ICONS.home,
  deposit: DEFAULT_REFERENCE_MENU_ICONS.deposit,
  withdraw: DEFAULT_REFERENCE_MENU_ICONS.withdraw,
  games: DEFAULT_REFERENCE_MENU_ICONS.games,
  promotion: DEFAULT_REFERENCE_MENU_ICONS.promotion,
  bonus: DEFAULT_REFERENCE_MENU_ICONS.bonus,
  affiliate: DEFAULT_REFERENCE_MENU_ICONS.affiliate,
  support: DEFAULT_REFERENCE_MENU_ICONS.support,
  history: DEFAULT_REFERENCE_MENU_ICONS.history,
  notification: DEFAULT_REFERENCE_MENU_ICONS.notification,
};

export const REFERENCE_GAME_CATEGORY_ICON_DEFAULTS: Record<string, string> = {
  game_category_home_icon: DEFAULT_REFERENCE_MENU_ICONS.home,
  game_category_casino_icon: DEFAULT_REFERENCE_MENU_ICONS.casino,
  game_category_slot_icon: DEFAULT_REFERENCE_MENU_ICONS.slot,
  game_category_live_icon: DEFAULT_REFERENCE_MENU_ICONS.live,
  game_category_sport_icon: DEFAULT_REFERENCE_MENU_ICONS.sport,
  game_category_fishing_icon: DEFAULT_REFERENCE_MENU_ICONS.fishing,
  game_category_lottery_icon: DEFAULT_REFERENCE_MENU_ICONS.lottery,
  game_category_card_icon: DEFAULT_REFERENCE_MENU_ICONS.card,
  game_category_arcade_icon: DEFAULT_REFERENCE_MENU_ICONS.arcade,
  game_category_new_icon: DEFAULT_REFERENCE_MENU_ICONS.new,
  game_category_popular_icon: DEFAULT_REFERENCE_MENU_ICONS.popular,
  game_category_other_icon: DEFAULT_REFERENCE_MENU_ICONS.games,
};

export const REFERENCE_PUBLIC_SETTINGS_DEFAULTS = {
  website: REFERENCE_WEBSITE_DEFAULTS,
  branding: REFERENCE_BRANDING_DEFAULTS,
  icons: {
    ...REFERENCE_LEGACY_MENU_ICON_DEFAULTS,
    ...REFERENCE_GAME_CATEGORY_ICON_DEFAULTS,
  },
} as const;
