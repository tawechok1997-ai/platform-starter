'use client';

import { useEffect, useMemo } from 'react';
import { useSiteSettings } from './site-settings-provider';

const STYLE_ID = 'member-runtime-theme-authority';

const AUTHORITY_CSS = `
:root[data-member-theme-authority='true'] {
  --member-canvas: var(--member-runtime-background);
  --member-page: var(--member-runtime-background);
  --member-sidebar: var(--member-runtime-card);
  --member-surface-1: var(--member-runtime-card);
  --member-surface-2: color-mix(in srgb, var(--member-runtime-card) 88%, var(--member-runtime-text) 12%);
  --member-surface-3: color-mix(in srgb, var(--member-runtime-card) 78%, var(--member-runtime-text) 22%);
  --member-surface-4: color-mix(in srgb, var(--member-runtime-card) 68%, var(--member-runtime-text) 32%);
  --member-text-primary: var(--member-runtime-text);
  --member-text-secondary: var(--member-runtime-muted);
  --member-text-tertiary: color-mix(in srgb, var(--member-runtime-muted) 76%, transparent);
  --member-text-disabled: color-mix(in srgb, var(--member-runtime-muted) 54%, transparent);
  --member-border-subtle: color-mix(in srgb, var(--member-runtime-border) 58%, transparent);
  --member-border-default: var(--member-runtime-border);
  --member-border-strong: color-mix(in srgb, var(--member-runtime-border) 72%, var(--member-runtime-text) 28%);
  --member-accent: var(--member-runtime-primary);
  --member-accent-hover: color-mix(in srgb, var(--member-runtime-primary) 84%, var(--member-runtime-text) 16%);
  --member-accent-active: color-mix(in srgb, var(--member-runtime-primary) 82%, #000 18%);
  --member-accent-soft: color-mix(in srgb, var(--member-runtime-primary) 16%, transparent);
  --member-success: var(--member-runtime-success);
  --member-warning: var(--member-runtime-warning);
  --member-danger: var(--member-runtime-danger);
  --member-info: var(--member-runtime-info);
  --radius: var(--member-runtime-card-radius);
}

html[data-member-theme-authority='true'] body {
  background-color: var(--member-runtime-background) !important;
  color: var(--member-runtime-text) !important;
}

html[data-member-theme-authority='true'] :where(
  [data-mobile-home-root='true'],
  [data-mobile-member-page],
  [data-mobile-search-owner='true'],
  [data-mobile-avatar-owner='true'],
  [data-mobile-popup-owner],
  .auth-reference-scope
) {
  --mobile-source-bg: var(--member-runtime-background) !important;
  --mobile-source-bg-deep: color-mix(in srgb, var(--member-runtime-background) 86%, #000 14%) !important;
  --mobile-source-surface: var(--member-runtime-card) !important;
  --mobile-source-surface-raised: color-mix(in srgb, var(--member-runtime-card) 82%, var(--member-runtime-text) 18%) !important;
  --mobile-source-surface-gradient: linear-gradient(0deg, var(--member-runtime-card), color-mix(in srgb, var(--member-runtime-card) 76%, var(--member-runtime-text) 24%)) !important;
  --mobile-source-card-gradient: linear-gradient(180deg, color-mix(in srgb, var(--member-runtime-card) 80%, var(--member-runtime-text) 20%), var(--member-runtime-card)) !important;
  --mobile-source-card-gradient-soft: linear-gradient(180deg, color-mix(in srgb, var(--member-runtime-card) 80%, var(--member-runtime-text) 20%), transparent) !important;
  --mobile-source-border: var(--member-runtime-border) !important;
  --mobile-source-border-soft: color-mix(in srgb, var(--member-runtime-border) 62%, transparent) !important;
  --mobile-source-border-accent: var(--member-runtime-primary) !important;
  --mobile-source-accent: var(--member-runtime-primary) !important;
  --mobile-source-accent-strong: color-mix(in srgb, var(--member-runtime-primary) 84%, #000 16%) !important;
  --mobile-source-accent-deep: color-mix(in srgb, var(--member-runtime-primary) 70%, #000 30%) !important;
  --mobile-source-accent-tab: var(--member-runtime-primary) !important;
  --mobile-source-accent-field: color-mix(in srgb, var(--member-runtime-primary) 52%, var(--member-runtime-card) 48%) !important;
  --mobile-source-text: var(--member-runtime-text) !important;
  --mobile-source-text-muted: var(--member-runtime-muted) !important;
  --mobile-source-text-subtle: color-mix(in srgb, var(--member-runtime-muted) 72%, transparent) !important;
  --mobile-source-radius-dialog: var(--member-runtime-modal-radius) !important;
  --mobile-source-radius-card: var(--member-runtime-card-radius) !important;
  --mobile-source-radius-control: var(--member-runtime-control-radius) !important;
}

html[data-member-theme-authority='true'] :where(
  .member-card,
  .member-panel,
  .member-surface,
  [data-member-card],
  [data-member-surface]
) {
  background-color: var(--member-runtime-card) !important;
  border-color: var(--member-runtime-border) !important;
  color: var(--member-runtime-text) !important;
  border-radius: var(--member-runtime-card-radius) !important;
}

html[data-member-theme-authority='true'] :where(input, select, textarea) {
  border-radius: var(--member-runtime-control-radius) !important;
}

html[data-member-theme-authority='true'][data-member-bottom-navigation='false'] [data-mobile-member-bottom-navigation='true'] {
  display: none !important;
}

html[data-member-theme-authority='true'][data-member-desktop-sidebar='false'] :where(
  .desktop-reference-home .reference-sidebar,
  [data-member-desktop-sidebar]
) {
  display: none !important;
}

html[data-member-theme-authority='true'][data-member-hero-banner='false'] :where(
  [data-member-home-hero],
  [data-home-hero],
  .member-home-hero,
  [class*='hero-banner']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-provider-menu='false'] :where(
  [data-provider-menu],
  .provider-menu,
  [class*='provider-menu']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-promotion-banner='false'] :where(
  [data-promotion-banner],
  .promotion-banner,
  [class*='promotion-banner']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-game-categories='false'] :where(
  [data-game-categories],
  .game-categories,
  [class*='game-categories']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-popular-providers='false'] :where(
  [data-popular-providers],
  .popular-providers,
  [class*='popular-provider']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-recommended-games='false'] :where(
  [data-recommended-games],
  .recommended-games,
  [class*='recommended-game']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-balance-header='false'] :where(
  [data-balance-header],
  .balance-header,
  [class*='balance-header']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-deposit-withdraw-buttons='false'] :where(
  [data-deposit-withdraw-actions],
  [data-wallet-actions],
  .deposit-withdraw-actions
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-floating-deposit-button='false'] :where(
  [data-floating-deposit-button],
  .floating-deposit-button,
  [class*='floating-deposit']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-provider-name='false'] :where(
  [data-provider-name],
  .provider-name,
  [class*='provider-name']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-hot-badge='false'] :where(
  [data-game-badge='hot'],
  [data-badge='hot'],
  .hot-badge,
  [class*='hot-badge']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-new-badge='false'] :where(
  [data-game-badge='new'],
  [data-badge='new'],
  .new-badge,
  [class*='new-badge']
) { display: none !important; }

html[data-member-theme-authority='true'][data-member-sticky-wallet='false'] :where(
  [data-sticky-wallet],
  .sticky-wallet,
  [class*='sticky-wallet']
) {
  position: static !important;
  inset: auto !important;
}

html[data-member-theme-authority='true'] :where(
  [data-member-game-grid],
  .member-game-grid,
  .game-grid
) {
  grid-template-columns: repeat(var(--member-runtime-game-grid-columns), minmax(0, 1fr)) !important;
}
`;

type ThemeLayoutState = {
  animationLevel: 'off' | 'subtle' | 'lively';
  gameGridColumns: number;
  heroBannerEnabled: boolean;
  providerMenuEnabled: boolean;
  showPromotionBanner: boolean;
  showGameCategories: boolean;
  showPopularProviders: boolean;
  showRecommendedGames: boolean;
  bottomNavigationEnabled: boolean;
  desktopSidebarEnabled: boolean;
  stickyWalletEnabled: boolean;
  floatingDepositButtonEnabled: boolean;
  showBalanceHeader: boolean;
  showDepositWithdrawButtons: boolean;
  showProviderName: boolean;
  showHotBadge: boolean;
  showNewBadge: boolean;
  cardRadius: string;
  controlRadius: string;
  modalRadius: string;
  sectionGapDesktop: string;
  sectionGapMobile: string;
  cardGapDesktop: string;
  cardGapMobile: string;
};

export function MemberThemeSettingsRuntime() {
  const { typedSettings } = useSiteSettings();
  const state = useMemo(() => buildThemeLayoutState(typedSettings.theme as Record<string, unknown>), [typedSettings]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = new Map<string, string | undefined>();
    const setData = (name: string, value: string) => {
      previous.set(`data:${name}`, root.dataset[name]);
      root.dataset[name] = value;
    };
    const setVar = (name: string, value: string) => {
      previous.set(`var:${name}`, root.style.getPropertyValue(name) || undefined);
      root.style.setProperty(name, value);
    };

    setData('memberThemeAuthority', 'true');
    setData('memberMotion', state.animationLevel);
    setData('memberHeroBanner', String(state.heroBannerEnabled));
    setData('memberProviderMenu', String(state.providerMenuEnabled));
    setData('memberPromotionBanner', String(state.showPromotionBanner));
    setData('memberGameCategories', String(state.showGameCategories));
    setData('memberPopularProviders', String(state.showPopularProviders));
    setData('memberRecommendedGames', String(state.showRecommendedGames));
    setData('memberBottomNavigation', String(state.bottomNavigationEnabled));
    setData('memberDesktopSidebar', String(state.desktopSidebarEnabled));
    setData('memberStickyWallet', String(state.stickyWalletEnabled));
    setData('memberFloatingDepositButton', String(state.floatingDepositButtonEnabled));
    setData('memberBalanceHeader', String(state.showBalanceHeader));
    setData('memberDepositWithdrawButtons', String(state.showDepositWithdrawButtons));
    setData('memberProviderName', String(state.showProviderName));
    setData('memberHotBadge', String(state.showHotBadge));
    setData('memberNewBadge', String(state.showNewBadge));

    setVar('--member-runtime-game-grid-columns', String(state.gameGridColumns));
    setVar('--member-runtime-card-radius', state.cardRadius);
    setVar('--member-runtime-control-radius', state.controlRadius);
    setVar('--member-runtime-modal-radius', state.modalRadius);
    setVar('--member-runtime-section-gap-desktop', state.sectionGapDesktop);
    setVar('--member-runtime-section-gap-mobile', state.sectionGapMobile);
    setVar('--member-runtime-card-gap-desktop', state.cardGapDesktop);
    setVar('--member-runtime-card-gap-mobile', state.cardGapMobile);

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== AUTHORITY_CSS) style.textContent = AUTHORITY_CSS;

    return () => {
      for (const [key, value] of previous) {
        if (key.startsWith('data:')) {
          const name = key.slice(5);
          if (value === undefined) delete root.dataset[name];
          else root.dataset[name] = value;
        } else {
          const name = key.slice(4);
          if (value === undefined) root.style.removeProperty(name);
          else root.style.setProperty(name, value);
        }
      }
    };
  }, [state]);

  return null;
}

export function buildThemeLayoutState(theme: Record<string, unknown>): ThemeLayoutState {
  return {
    animationLevel: enumValue(theme.animation_level, ['off', 'subtle', 'lively'] as const, 'subtle'),
    cardRadius: cssSize(theme.card_radius, '18px'),
    controlRadius: cssSize(theme.control_radius, '12px'),
    modalRadius: cssSize(theme.modal_radius, '22px'),
    sectionGapDesktop: cssSize(theme.section_gap_desktop, '24px'),
    sectionGapMobile: cssSize(theme.section_gap_mobile, '16px'),
    cardGapDesktop: cssSize(theme.card_gap_desktop, '14px'),
    cardGapMobile: cssSize(theme.card_gap_mobile, '10px'),
    gameGridColumns: integer(theme.game_grid_columns, 1, 12, 5),
    heroBannerEnabled: boolean(theme.hero_banner_enabled, true),
    providerMenuEnabled: boolean(theme.provider_menu_enabled, true),
    showPromotionBanner: boolean(theme.show_promotion_banner, true),
    showGameCategories: boolean(theme.show_game_categories, true),
    showPopularProviders: boolean(theme.show_popular_providers, true),
    showRecommendedGames: boolean(theme.show_recommended_games, true),
    bottomNavigationEnabled: boolean(theme.bottom_navigation_enabled, true),
    desktopSidebarEnabled: boolean(theme.desktop_sidebar_enabled, true),
    stickyWalletEnabled: boolean(theme.sticky_wallet_enabled, true),
    floatingDepositButtonEnabled: boolean(theme.floating_deposit_button_enabled, true),
    showBalanceHeader: boolean(theme.show_balance_header, true),
    showDepositWithdrawButtons: boolean(theme.show_deposit_withdraw_buttons, true),
    showProviderName: boolean(theme.show_provider_name, true),
    showHotBadge: boolean(theme.show_hot_badge, true),
    showNewBadge: boolean(theme.show_new_badge, true),
  };
}

function boolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function integer(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function cssSize(value: unknown, fallback: string) {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return /^-?\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?$/i.test(normalized)
    ? (/^-?\d+(?:\.\d+)?$/.test(normalized) ? `${normalized}px` : normalized)
    : fallback;
}

function enumValue<const T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
    ? value as T[number]
    : fallback;
}
