'use client';

import type { CSSProperties } from 'react';
import { createGameCategoryNavigationConfig } from './brand/game-category-navigation';
import type { MemberFeatureFlags } from './site-settings';
import MemberHome from './member-home';
import { MemberCard } from './components/member-ui';
import { useSiteSettings } from './site-settings-provider';

type BrandStyle = CSSProperties & Record<`--${string}`, string>;

export default function Page() {
  const { typedSettings, ready } = useSiteSettings();
  const { website, branding, theme, maintenance, features, icons } = typedSettings;

  const featureFlags: MemberFeatureFlags = {
    registration: features.registration_enabled,
    login: features.login_enabled,
    deposit: features.deposit_enabled,
    withdraw: features.withdraw_enabled,
    promotion: features.promotion_enabled,
    bonus: features.bonus_enabled,
    affiliate: features.affiliate_enabled,
    support: features.support_enabled,
    kyc: features.kyc_enabled,
    games: features.game_lobby_enabled,
    profile: features.profile_enabled,
    notifications: features.notification_enabled,
  };
  const gameCategoryNavigation = createGameCategoryNavigationConfig(typedSettings);

  const maintenanceEnabled = maintenance.enabled || maintenance.member_enabled || website.maintenance_mode;
  const animationLevel = theme.animation_level ?? 'subtle';
  const brandStyle: BrandStyle = {
    minHeight: '100vh',
    background: branding.background_color,
    color: branding.text_color,
    overflowX: 'hidden',
    '--color-brand': branding.primary_color,
    '--color-bg': branding.background_color,
    '--color-card': branding.card_color,
    '--color-text': branding.text_color,
    '--color-success': branding.success_color,
    '--color-danger': branding.danger_color,
  };

  if (!ready) return <main className="member-loading-screen">กำลังโหลดการตั้งค่า...</main>;

  if (maintenanceEnabled) {
    return <main className="member-ui-page member-maintenance"><div className="member-ui-container"><MemberCard tone="warning"><p className="member-maintenance__eyebrow">Maintenance</p><h1>{website.site_name}</h1><p>{maintenance.message}</p></MemberCard></div></main>;
  }

  return <main data-animation-level={animationLevel} style={brandStyle}>
    <MemberHome
      siteName={website.site_name}
      description={website.site_description}
      primaryColor={branding.primary_color}
      cardColor={branding.card_color}
      textColor={branding.text_color}
      showBalanceHeader={theme.show_balance_header}
      showButtons={theme.show_deposit_withdraw_buttons}
      showPromotion={theme.show_promotion_banner}
      showCategories={theme.show_game_categories}
      showProviders={theme.show_popular_providers}
      showRecommended={theme.show_recommended_games}
      cmsContent={features.cms_content}
      gameCategoryNavigation={gameCategoryNavigation}
      icons={icons}
      features={featureFlags}
    />
  </main>;
}
