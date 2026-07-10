import SettingsSectionPage from '../settings-section-page';

export default function ThemeSettingsPage() {
  return (
    <SettingsSectionPage
      group="theme"
      title="Theme / Layout Settings"
      description="ตั้งค่า layout ผู้เล่น มือถือ เดสก์ท็อป เกม และระดับ animation"
      fields={[
        { key: 'animation_level', label: 'Animation Level', placeholder: 'off / subtle / lively' },
        { key: 'bottom_navigation_enabled', label: 'Bottom Navigation เปิด/ปิด', type: 'checkbox' },
        { key: 'sticky_wallet_enabled', label: 'Sticky Wallet เปิด/ปิด', type: 'checkbox' },
        { key: 'floating_deposit_button_enabled', label: 'Floating Deposit Button เปิด/ปิด', type: 'checkbox' },
        { key: 'desktop_sidebar_enabled', label: 'Desktop Sidebar เปิด/ปิด', type: 'checkbox' },
        { key: 'hero_banner_enabled', label: 'Hero Banner เปิด/ปิด', type: 'checkbox' },
        { key: 'provider_menu_enabled', label: 'Provider Menu เปิด/ปิด', type: 'checkbox' },
        { key: 'game_grid_columns', label: 'Game Grid Columns' },
        { key: 'show_hot_badge', label: 'Show HOT badge', type: 'checkbox' },
        { key: 'show_new_badge', label: 'Show NEW badge', type: 'checkbox' },
        { key: 'show_provider_name', label: 'Show Provider name', type: 'checkbox' },
        { key: 'show_balance_header', label: 'Show Balance Header', type: 'checkbox' },
        { key: 'show_deposit_withdraw_buttons', label: 'Show Deposit / Withdraw Buttons', type: 'checkbox' },
        { key: 'show_promotion_banner', label: 'Show Promotion Banner', type: 'checkbox' },
        { key: 'show_game_categories', label: 'Show Game Categories', type: 'checkbox' },
        { key: 'show_popular_providers', label: 'Show Popular Providers', type: 'checkbox' },
        { key: 'show_recommended_games', label: 'Show Recommended Games', type: 'checkbox' },
      ]}
    />
  );
}
