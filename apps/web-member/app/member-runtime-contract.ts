import type { CmsAnnouncement, CmsContent, MemberFeatureFlags } from './site-settings';
import type { TypedPublicSiteSettings } from './site-settings-types';
import type { MemberLocale } from './member-locale-provider';
import type { MemberWalletSummary } from '../src/features/wallet/member-wallet';
import { memberAnnouncementsRuntime } from './member-settings-runtime';
import { V47_ASSETS } from './components/member-home/v47-asset-map';

export type MemberRuntimeProfile = {
  id?: string;
  username?: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  phoneVerifiedAt?: string | null;
  emailVerifiedAt?: string | null;
  kycStatus?: string | null;
  vipLevel?: string | number | null;
};

export type MemberRuntimeIconKey =
  | 'home'
  | 'casino'
  | 'slot'
  | 'fishing'
  | 'sport'
  | 'card'
  | 'lottery'
  | 'live'
  | 'search'
  | 'mission'
  | 'announcement'
  | 'promotion'
  | 'activity'
  | 'news'
  | 'tournament'
  | 'jackpot'
  | 'leaderboard'
  | 'miniGame'
  | 'popular'
  | 'online'
  | 'classic'
  | 'contact'
  | 'close';

export type MemberIconRuntime = Record<MemberRuntimeIconKey, string>;

export type MemberNavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  feature?: keyof MemberFeatureFlags;
  desktop: boolean;
  mobile: boolean;
  requiresAuth: boolean;
  badge?: string;
};

export type MemberFeatureVisibilityRuntime = MemberFeatureFlags & {
  hero: boolean;
  announcement: boolean;
  activity: boolean;
  news: boolean;
  tournament: boolean;
  jackpot: boolean;
  leaderboard: boolean;
  miniGames: boolean;
  popularGames: boolean;
  onlineGames: boolean;
  liveGames: boolean;
  classicGames: boolean;
  usageGuide: boolean;
};

export type MemberThemeRuntime = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  radius: {
    card: string;
    control: string;
    modal: string;
  };
  spacing: {
    sectionDesktop: string;
    sectionMobile: string;
    cardGapDesktop: string;
    cardGapMobile: string;
  };
  motion: 'off' | 'subtle' | 'lively';
};

export type MemberRuntimeContentItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  image: string;
  icon: string;
  kind: 'promotion' | 'activity' | 'news' | 'system';
  priority: number;
  startsAt?: string;
  endsAt?: string;
};

export type MemberQuickActionRuntime = MemberRuntimeContentItem & {
  enabled: boolean;
};

export type MemberLeaderboardEntry = {
  rank: number;
  name: string;
  user: string;
  amount: string;
  image: string;
};

export type MemberMiniGameRuntime = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  enabled: boolean;
};

export type MemberHomeContentRuntime = {
  announcement: MemberRuntimeContentItem;
  quickActions: MemberQuickActionRuntime[];
  activities: MemberRuntimeContentItem[];
  news: MemberRuntimeContentItem[];
  tournament: MemberRuntimeContentItem;
  jackpot: {
    title: string;
    amount: string;
    subtitle: string;
    image: string;
    icon: string;
    enabled: boolean;
  };
  leaderboard: {
    title: string;
    entries: MemberLeaderboardEntry[];
    enabled: boolean;
  };
  miniGames: MemberMiniGameRuntime[];
  sectionTitles: Record<'popular' | 'online' | 'live' | 'classic' | 'featured' | 'guide', string>;
};

export type MemberGameSectionRuntime = {
  id: 'featured' | 'popular' | 'online' | 'live' | 'classic';
  title: string;
  icon: string;
  href: string;
  enabled: boolean;
  desktopLimit: number;
  mobileLimit: number;
  category?: string;
};

export type MemberSummaryRuntime = {
  ready: boolean;
  isLoggedIn: boolean;
  displayName: string;
  username: string;
  walletCurrency: string;
  walletAvailable: string;
  walletLocked: string;
  walletStatus: string;
  pendingCount: number;
  profileStatus: string;
  kycStatus: string;
  vipLevel: string;
  phoneVerified: boolean;
  emailVerified: boolean;
};

export type MemberRuntimeSnapshot = {
  icons: MemberIconRuntime;
  navigation: MemberNavigationItem[];
  features: MemberFeatureVisibilityRuntime;
  theme: MemberThemeRuntime;
  home: MemberHomeContentRuntime;
  gameSections: MemberGameSectionRuntime[];
  summary: MemberSummaryRuntime;
};

const DEFAULT_ANNOUNCEMENT = 'ยินดีต้อนรับสู่ NOAH345 โปรโมชั่น กิจกรรม และเกมใหม่อัปเดตตลอด 24 ชั่วโมง';
const DEFAULT_TOURNAMENT_IMAGE = '/assets/asset-pc/images/ZAB1/tournament/4a7df032-03f5-4999-ba59-f38d12c13761.png';
const DEFAULT_JACKPOT_IMAGE = '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif';

export function buildMemberFeatureVisibility(settings: TypedPublicSiteSettings): MemberFeatureVisibilityRuntime {
  const features = settings.features as Record<string, unknown>;
  const theme = settings.theme as Record<string, unknown>;
  const bool = (keys: string[], fallback: boolean) => firstBoolean(keys.map((key) => features[key]), firstBoolean(keys.map((key) => theme[key]), fallback));

  return {
    registration: settings.features.registration_enabled,
    login: settings.features.login_enabled,
    deposit: settings.features.deposit_enabled,
    withdraw: settings.features.withdraw_enabled,
    promotion: settings.features.promotion_enabled,
    bonus: settings.features.bonus_enabled,
    affiliate: settings.features.affiliate_enabled,
    support: settings.features.support_enabled,
    kyc: settings.features.kyc_enabled,
    games: settings.features.game_lobby_enabled,
    profile: settings.features.profile_enabled,
    notifications: settings.features.notification_enabled,
    hero: bool(['hero_enabled', 'show_hero_banner'], true),
    announcement: bool(['announcement_enabled', 'show_announcement'], true),
    activity: bool(['activity_enabled', 'event_enabled'], true),
    news: bool(['news_enabled', 'article_enabled'], true),
    tournament: bool(['tournament_enabled'], true),
    jackpot: bool(['jackpot_enabled'], true),
    leaderboard: bool(['leaderboard_enabled'], true),
    miniGames: bool(['mini_game_enabled', 'mini_games_enabled'], true),
    popularGames: bool(['popular_games_enabled', 'show_recommended_games'], true),
    onlineGames: bool(['online_games_enabled'], true),
    liveGames: bool(['live_enabled', 'live_games_enabled'], true),
    classicGames: bool(['classic_games_enabled'], true),
    usageGuide: bool(['usage_guide_enabled', 'guide_enabled'], true),
  };
}

export function buildMemberThemeRuntime(settings: TypedPublicSiteSettings): MemberThemeRuntime {
  const branding = settings.branding as Record<string, unknown>;
  const theme = settings.theme as Record<string, unknown>;
  return {
    colors: {
      primary: color(branding.primary_color, '#f5c542'),
      secondary: color(branding.secondary_color, '#7c3aed'),
      accent: color(branding.accent_color, color(branding.primary_color, '#f5c542')),
      background: color(branding.background_color, '#080808'),
      card: color(branding.card_color, '#181818'),
      text: color(branding.text_color, '#ffffff'),
      muted: color(branding.muted_text_color, '#94a3b8'),
      border: color(branding.border_color, 'rgba(148, 163, 184, 0.22)'),
      success: color(branding.success_color, '#22c55e'),
      warning: color(branding.warning_color, '#f59e0b'),
      danger: color(branding.danger_color, '#ef4444'),
      info: color(branding.info_color, '#3b82f6'),
    },
    radius: {
      card: cssSize(theme.card_radius, '18px'),
      control: cssSize(theme.control_radius, '12px'),
      modal: cssSize(theme.modal_radius, '22px'),
    },
    spacing: {
      sectionDesktop: cssSize(theme.section_gap_desktop, '24px'),
      sectionMobile: cssSize(theme.section_gap_mobile, '16px'),
      cardGapDesktop: cssSize(theme.card_gap_desktop, '14px'),
      cardGapMobile: cssSize(theme.card_gap_mobile, '10px'),
    },
    motion: theme.animation_level === 'off' || theme.animation_level === 'lively' ? theme.animation_level : 'subtle',
  };
}

export function memberThemeCssVariables(theme: MemberThemeRuntime): Record<string, string> {
  return {
    '--member-runtime-primary': theme.colors.primary,
    '--member-runtime-secondary': theme.colors.secondary,
    '--member-runtime-accent': theme.colors.accent,
    '--member-runtime-background': theme.colors.background,
    '--member-runtime-card': theme.colors.card,
    '--member-runtime-text': theme.colors.text,
    '--member-runtime-muted': theme.colors.muted,
    '--member-runtime-border': theme.colors.border,
    '--member-runtime-success': theme.colors.success,
    '--member-runtime-warning': theme.colors.warning,
    '--member-runtime-danger': theme.colors.danger,
    '--member-runtime-info': theme.colors.info,
    '--member-runtime-card-radius': theme.radius.card,
    '--member-runtime-control-radius': theme.radius.control,
    '--member-runtime-modal-radius': theme.radius.modal,
    '--member-runtime-section-gap-desktop': theme.spacing.sectionDesktop,
    '--member-runtime-section-gap-mobile': theme.spacing.sectionMobile,
    '--member-runtime-card-gap-desktop': theme.spacing.cardGapDesktop,
    '--member-runtime-card-gap-mobile': theme.spacing.cardGapMobile,
  };
}

export function buildMemberIconRuntime(settings: TypedPublicSiteSettings, content: CmsContent): MemberIconRuntime {
  const configured = settings.icons as Record<string, unknown>;
  const icon = (keys: string[], aliases: string[], fallback: string) => firstText(
    ...keys.map((key) => configured[key]),
    findCmsAsset(content, aliases)?.url,
    fallback,
  );

  return {
    home: icon(['home'], ['home', 'หน้าหลัก'], V47_ASSETS.menuHome),
    casino: icon(['casino'], ['casino', 'คาสิโน'], V47_ASSETS.menuCasino),
    slot: icon(['slot', 'games'], ['slot', 'สล็อต'], V47_ASSETS.menuSlot),
    fishing: icon(['fishing'], ['fishing', 'fish', 'ตกปลา'], V47_ASSETS.menuFishing),
    sport: icon(['sport'], ['sport', 'กีฬา'], V47_ASSETS.menuSport),
    card: icon(['card'], ['card', 'ไพ่'], V47_ASSETS.menuCard),
    lottery: icon(['lottery'], ['lottery', 'หวย'], V47_ASSETS.menuLottery),
    live: icon(['live'], ['live', 'ถ่ายทอดสด'], V47_ASSETS.menuLive),
    search: icon(['search'], ['search', 'ค้นหา'], ''),
    mission: icon(['mission'], ['mission', 'ภารกิจ'], V47_ASSETS.headerMission),
    announcement: icon(['announcement'], ['announcement', 'ประกาศ'], V47_ASSETS.announcement),
    promotion: icon(['promotion', 'bonus'], ['promotion', 'promo', 'โปรโมชั่น'], V47_ASSETS.quickPromotion),
    activity: icon(['activity'], ['activity', 'event', 'กิจกรรม'], V47_ASSETS.quickActivity),
    news: icon(['news', 'notification'], ['news', 'announcement', 'ข่าว'], V47_ASSETS.quickNews),
    tournament: icon(['tournament'], ['tournament', 'competition', 'ทัวร์นาเมนต์'], V47_ASSETS.tournamentIcon),
    jackpot: icon(['jackpot'], ['jackpot', 'แจ็คพอต'], V47_ASSETS.coin),
    leaderboard: icon(['leaderboard'], ['leaderboard', 'อันดับ'], V47_ASSETS.leaderboard),
    miniGame: icon(['mini_game'], ['mini game', 'mini', 'มินิเกม'], V47_ASSETS.miniGame),
    popular: icon(['popular_games'], ['popular', 'เกมยอดนิยม'], V47_ASSETS.gameHit),
    online: icon(['online_games'], ['online', 'ออนไลน์'], V47_ASSETS.mostOnline),
    classic: icon(['classic_games'], ['classic', 'คลาสสิก'], V47_ASSETS.gameHit),
    contact: icon(['contact', 'support'], ['contact', 'support', 'ติดต่อ'], '/assets/asset-pc/images/footer/contact/icon-open-gold.webp'),
    close: icon(['close'], ['close', 'ปิด'], '/images/close.svg'),
  };
}

export function buildMemberNavigationRuntime(
  locale: MemberLocale,
  features: MemberFeatureVisibilityRuntime,
  icons: MemberIconRuntime,
): MemberNavigationItem[] {
  const labels = locale === 'th'
    ? { home: 'หน้าหลัก', casino: 'คาสิโน', slot: 'สล็อต', fishing: 'ตกปลา', sport: 'กีฬา', card: 'ไพ่', lottery: 'หวย', live: 'ถ่ายทอดสด' }
    : { home: 'Home', casino: 'Casino', slot: 'Slots', fishing: 'Fishing', sport: 'Sports', card: 'Cards', lottery: 'Lottery', live: 'Live' };

  const items: MemberNavigationItem[] = [
    { id: 'home', label: labels.home, href: '/', icon: icons.home, desktop: true, mobile: true, requiresAuth: false },
    { id: 'casino', label: labels.casino, href: '/browse/games?category=casino', icon: icons.casino, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
    { id: 'slot', label: labels.slot, href: '/browse/games?category=slot', icon: icons.slot, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
    { id: 'fishing', label: labels.fishing, href: '/browse/games?category=fishing', icon: icons.fishing, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
    { id: 'sport', label: labels.sport, href: '/browse/games?category=sport', icon: icons.sport, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
    { id: 'card', label: labels.card, href: '/browse/games?category=card', icon: icons.card, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
    { id: 'lottery', label: labels.lottery, href: '/browse/games?category=lottery', icon: icons.lottery, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
    { id: 'live', label: labels.live, href: '/?category=live#live', icon: icons.live, feature: 'games', desktop: true, mobile: true, requiresAuth: false },
  ];

  return items.filter((item) => !item.feature || features[item.feature]);
}

export function buildMemberHomeContentRuntime(
  settings: TypedPublicSiteSettings,
  content: CmsContent,
  locale: MemberLocale,
  icons: MemberIconRuntime,
  features: MemberFeatureVisibilityRuntime,
): MemberHomeContentRuntime {
  const announcements = memberAnnouncementsRuntime(content, 'all');
  const system = pickAnnouncement(announcements, 'system');
  const activities = announcements.filter((item) => item.kind === 'event').map((item) => contentItem(item, content, icons.activity));
  const news = announcements.filter((item) => item.kind === 'news').map((item) => contentItem(item, content, icons.news));
  const activity = activities[0] ?? fallbackActivity(locale, icons.activity);
  const newsItem = news[0] ?? fallbackNews(locale, icons.news);
  const promotion = fallbackPromotion(locale, icons.promotion);
  const tournamentAnnouncement = activities.find((item) => /tournament|competition|ทัวร์นาเมนต์/i.test(`${item.id} ${item.title}`));
  const tournamentAsset = findCmsAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']);
  const jackpotAsset = findCmsAsset(content, ['jackpot', 'แจ็คพอต']);
  const runtime = settings.features as Record<string, unknown>;

  return {
    announcement: system ? contentItem(system, content, icons.announcement) : {
      id: 'global-home-announcement-fallback',
      title: locale === 'th' ? 'ประกาศ' : 'Announcement',
      summary: DEFAULT_ANNOUNCEMENT,
      href: '',
      image: icons.announcement,
      icon: icons.announcement,
      kind: 'system',
      priority: 0,
    },
    quickActions: [
      { ...promotion, enabled: features.promotion },
      { ...activity, enabled: features.activity },
      { ...newsItem, enabled: features.news },
    ],
    activities,
    news,
    tournament: tournamentAnnouncement ?? {
      id: 'home-tournament',
      title: text(runtime.tournament_title, locale === 'th' ? 'TOURNAMENT เข้าร่วมชิงความเป็นที่ 1' : 'TOURNAMENT Compete for first place'),
      summary: text(runtime.tournament_summary, locale === 'th' ? 'ร่วมสนุกกับกิจกรรม Tournament' : 'Join the tournament activity'),
      href: '/browse/promotions?view=activity',
      image: tournamentAsset?.url || text(runtime.tournament_image_url, DEFAULT_TOURNAMENT_IMAGE),
      icon: icons.tournament,
      kind: 'activity',
      priority: 0,
    },
    jackpot: {
      title: text(runtime.jackpot_title, 'JACKPOTS'),
      amount: text(runtime.jackpot_amount, '194,428,645'),
      subtitle: text(runtime.jackpot_subtitle, 'Epic of the day'),
      image: jackpotAsset?.url || text(runtime.jackpot_image_url, DEFAULT_JACKPOT_IMAGE),
      icon: icons.jackpot,
      enabled: features.jackpot,
    },
    leaderboard: {
      title: text(runtime.leaderboard_title, 'Leaderboard'),
      enabled: features.leaderboard,
      entries: normalizeLeaderboard(runtime.leaderboard_items),
    },
    miniGames: normalizeMiniGames(runtime.mini_games, icons.miniGame, features.miniGames),
    sectionTitles: {
      featured: text(runtime.featured_title, locale === 'th' ? 'เกมไฮไลท์' : 'Featured Games'),
      popular: text(runtime.popular_title, 'Top 10 Popular Games'),
      online: text(runtime.online_title, 'Most Online Now'),
      live: text(runtime.live_title, 'Live Now!!'),
      classic: text(runtime.classic_title, 'Classic Games'),
      guide: text(runtime.guide_title, locale === 'th' ? 'คู่มือการใช้งาน' : 'Usage Guide'),
    },
  };
}

export function buildMemberGameSections(
  home: MemberHomeContentRuntime,
  icons: MemberIconRuntime,
  features: MemberFeatureVisibilityRuntime,
): MemberGameSectionRuntime[] {
  return [
    { id: 'featured', title: home.sectionTitles.featured, icon: icons.popular, href: '/browse/games', enabled: features.games, desktopLimit: 8, mobileLimit: 6 },
    { id: 'popular', title: home.sectionTitles.popular, icon: icons.popular, href: '/browse/games?sort=popular', enabled: features.popularGames && features.games, desktopLimit: 10, mobileLimit: 6 },
    { id: 'online', title: home.sectionTitles.online, icon: icons.online, href: '/browse/games?sort=online', enabled: features.onlineGames && features.games, desktopLimit: 10, mobileLimit: 6 },
    { id: 'live', title: home.sectionTitles.live, icon: icons.live, href: '/browse/games?category=sport', enabled: features.liveGames && features.games, desktopLimit: 6, mobileLimit: 1, category: 'sport' },
    { id: 'classic', title: home.sectionTitles.classic, icon: icons.classic, href: '/browse/games?category=arcade', enabled: features.classicGames && features.games, desktopLimit: 6, mobileLimit: 6, category: 'arcade' },
  ];
}

export function buildMemberSummaryRuntime(input: {
  ready: boolean;
  isLoggedIn: boolean;
  profile: MemberRuntimeProfile | null;
  wallet: MemberWalletSummary | null;
  pendingCount: number;
}): MemberSummaryRuntime {
  const profile = input.profile ?? {};
  const wallet = input.wallet;
  return {
    ready: input.ready,
    isLoggedIn: input.isLoggedIn,
    displayName: firstText(profile.displayName, profile.username, input.isLoggedIn ? 'Member' : 'Guest'),
    username: firstText(profile.username, ''),
    walletCurrency: wallet?.currency || 'THB',
    walletAvailable: wallet?.availableBalance || '0',
    walletLocked: wallet?.lockedBalance || '0',
    walletStatus: wallet?.status || '',
    pendingCount: Math.max(0, Number(input.pendingCount) || 0),
    profileStatus: firstText(profile.status, input.isLoggedIn ? 'ACTIVE' : 'GUEST'),
    kycStatus: firstText(profile.kycStatus, 'UNKNOWN'),
    vipLevel: profile.vipLevel === null || profile.vipLevel === undefined ? '' : String(profile.vipLevel),
    phoneVerified: Boolean(profile.phoneVerifiedAt),
    emailVerified: Boolean(profile.emailVerifiedAt),
  };
}

export function resolveMemberAsset(
  content: CmsContent,
  options: {
    configured?: unknown;
    aliases?: string[];
    localFallback?: string;
    remoteFallback?: string;
  },
) {
  return firstText(
    options.configured,
    options.aliases?.length ? findCmsAsset(content, options.aliases)?.url : '',
    options.localFallback,
    options.remoteFallback,
  );
}

export function findCmsAsset(content: CmsContent, aliases: string[]) {
  const normalized = aliases.map(normalizeSearchText);
  return (Array.isArray(content.assets) ? content.assets : []).find((asset) => {
    if (!asset.enabled || asset.type !== 'image' || !asset.url) return false;
    const haystack = normalizeSearchText(`${asset.id} ${asset.name} ${asset.tag ?? ''} ${asset.url}`);
    return normalized.some((alias) => haystack.includes(alias));
  });
}

function contentItem(item: CmsAnnouncement, content: CmsContent, fallbackIcon: string): MemberRuntimeContentItem {
  const metadata = item as CmsAnnouncement & Record<string, unknown>;
  const image = resolveMemberAsset(content, {
    configured: firstText(item.imageUrl, item.desktopImageUrl, item.mobileImageUrl),
    aliases: [item.id, item.kind, item.title],
    localFallback: fallbackIcon,
  });
  return {
    id: item.id || `${item.kind}-${item.title}`,
    title: firstText(item.title, item.message),
    summary: firstText(item.message, item.title),
    href: safeHref(item.href),
    image,
    icon: fallbackIcon,
    kind: item.kind,
    priority: number(metadata.priority ?? metadata.sequence, 0),
    startsAt: optionalText(metadata.startsAt ?? metadata.startAt),
    endsAt: optionalText(metadata.endsAt ?? metadata.endAt),
  };
}

function pickAnnouncement(items: CmsAnnouncement[], kind: CmsAnnouncement['kind']) {
  return items.find((item) => item.kind === kind) ?? items[0];
}

function fallbackPromotion(locale: MemberLocale, icon: string): MemberRuntimeContentItem {
  return {
    id: 'promotion-center',
    title: locale === 'th' ? 'โปรโมชั่นพิเศษ' : 'Special promotions',
    summary: locale === 'th' ? 'โปรโมชั่นพิเศษเฉพาะคุณ' : 'Offers selected for you',
    href: '/browse/promotions?view=promotion',
    image: V47_ASSETS.promoBackgroundPromotion,
    icon,
    kind: 'promotion',
    priority: 100,
  };
}

function fallbackActivity(locale: MemberLocale, icon: string): MemberRuntimeContentItem {
  return {
    id: 'activity-center',
    title: locale === 'th' ? 'กิจกรรม' : 'Activities',
    summary: locale === 'th' ? 'กิจกรรมตลอด 24 ชั่วโมง' : 'Activities available around the clock',
    href: '/browse/promotions?view=activity',
    image: V47_ASSETS.promoBackgroundActivity,
    icon,
    kind: 'activity',
    priority: 50,
  };
}

function fallbackNews(locale: MemberLocale, icon: string): MemberRuntimeContentItem {
  return {
    id: 'news-center',
    title: locale === 'th' ? 'ข่าวสาร' : 'News',
    summary: locale === 'th' ? 'ข่าวสารที่คุณไม่ควรพลาด' : 'Updates you should not miss',
    href: '/browse/promotions?view=news',
    image: V47_ASSETS.promoBackgroundNews,
    icon,
    kind: 'news',
    priority: 40,
  };
}

function normalizeLeaderboard(value: unknown): MemberLeaderboardEntry[] {
  if (Array.isArray(value)) {
    const entries = value.map((raw, index) => {
      const item = record(raw);
      return {
        rank: number(item.rank, index + 1),
        name: text(item.name, `Player ${index + 1}`),
        user: text(item.user ?? item.username, '-'),
        amount: text(item.amount ?? item.wins, '0'),
        image: text(item.image ?? item.imageUrl, ''),
      };
    }).filter((item) => item.name);
    if (entries.length) return entries;
  }
  return [
    { rank: 1, name: 'Fortune Dragon', user: '062XXXXX176', amount: '2,800', image: '' },
    { rank: 2, name: 'Lalika', user: '061XXXXX197', amount: '2,288', image: '' },
    { rank: 3, name: 'Fortune Gems 500', user: '081XXXXX58', amount: '2,135', image: '' },
    { rank: 4, name: 'DJ BOOM BOOM', user: '081XXXXX89', amount: '2,024', image: '' },
    { rank: 5, name: 'Funky Fortunes', user: '048XXXXX31', amount: '1,351', image: '' },
  ];
}

function normalizeMiniGames(value: unknown, fallbackIcon: string, enabled: boolean): MemberMiniGameRuntime[] {
  if (Array.isArray(value)) {
    const items = value.map((raw, index) => {
      const item = record(raw);
      return {
        id: text(item.id, `mini-game-${index + 1}`),
        title: text(item.title, `Mini Game ${index + 1}`),
        subtitle: text(item.subtitle, ''),
        href: safeHref(item.href) || '/?auth=login',
        image: text(item.image ?? item.imageUrl, fallbackIcon),
        enabled: item.enabled !== false && enabled,
      };
    });
    if (items.length) return items;
  }
  return [
    { id: 'wheel', title: 'วงล้อ', subtitle: 'ลุ้นรางวัลทุกวัน', href: '/?auth=login', image: V47_ASSETS.miniGameWheel, enabled },
    { id: 'mission-card', title: 'ทายการ์ด', subtitle: 'เล่นง่าย รับรางวัล', href: '/?auth=login', image: V47_ASSETS.miniGameMission, enabled },
  ];
}

function safeHref(value: unknown) {
  const href = text(value, '');
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
}

function firstBoolean(values: unknown[], fallback: boolean) {
  const value = values.find((candidate) => typeof candidate === 'boolean');
  return typeof value === 'boolean' ? value : fallback;
}

function color(value: unknown, fallback: string) {
  const normalized = text(value, fallback);
  return /^#[0-9a-f]{3,8}$/i.test(normalized) || /^(?:rgb|hsl|oklch|color-mix)\(/i.test(normalized) || normalized.startsWith('var(')
    ? normalized
    : fallback;
}

function cssSize(value: unknown, fallback: string) {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const normalized = text(value, fallback);
  return /^-?\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%)$/i.test(normalized) ? normalized : fallback;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s_\-./\\]+/g, '');
}

function optionalText(value: unknown) {
  const normalized = text(value, '');
  return normalized || undefined;
}

function firstText(...values: unknown[]) {
  return values.map((value) => text(value, '')).find(Boolean) ?? '';
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
