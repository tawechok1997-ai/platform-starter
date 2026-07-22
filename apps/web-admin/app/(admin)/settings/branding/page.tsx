import SettingsSectionPage from '../settings-section-page';

export default function BrandingSettingsPage() {
  return (
    <SettingsSectionPage
      group="branding"
      title="Branding Settings"
      description="ตั้งค่าโลโก้ สี ไอคอน และตัวอย่างหน้าตาแบรนด์ที่ Member ใช้งานจริง"
      preview="branding"
      fields={[
        { key: 'brand_mark', label: 'Brand Mark', placeholder: 'เช่น P, K, ★ หรือชื่อย่อ' },
        { key: 'logo_url', label: 'Primary Logo URL', placeholder: '/assets/reference-brand/header/noah345-logo.webp' },
        { key: 'logo_horizontal_url', label: 'Horizontal Logo URL' },
        { key: 'logo_square_url', label: 'Square Logo URL' },
        { key: 'logo_mobile_url', label: 'Mobile Logo URL' },
        { key: 'logo_login_url', label: 'Login Logo URL' },
        { key: 'logo_register_url', label: 'Register Logo URL' },
        { key: 'logo_dark_url', label: 'Dark Background Logo URL' },
        { key: 'logo_light_url', label: 'Light Background Logo URL' },
        { key: 'favicon_url', label: 'Favicon URL' },
        { key: 'apple_touch_icon_url', label: 'Apple Touch Icon URL' },
        { key: 'pwa_icon_url', label: 'PWA Icon URL' },
        { key: 'open_graph_image_url', label: 'Open Graph Image URL' },
        { key: 'default_avatar_url', label: 'Default Avatar URL' },
        { key: 'game_placeholder_url', label: 'Game Placeholder URL' },
        { key: 'promotion_placeholder_url', label: 'Promotion Placeholder URL' },
        { key: 'app_icon_url', label: 'App Icon URL' },
        { key: 'footer_logo_url', label: 'Footer Logo URL' },
        { key: 'loading_logo_url', label: 'Loading Logo URL' },
        { key: 'watermark_logo_url', label: 'Watermark Logo URL' },
        { key: 'primary_color', label: 'Primary Color', type: 'color' },
        { key: 'secondary_color', label: 'Secondary Color', type: 'color' },
        { key: 'accent_color', label: 'Accent Color', type: 'color' },
        { key: 'background_color', label: 'Background Color', type: 'color' },
        { key: 'card_color', label: 'Card Color', type: 'color' },
        { key: 'button_color', label: 'Button Color', type: 'color' },
        { key: 'text_color', label: 'Text Color', type: 'color' },
        { key: 'muted_text_color', label: 'Muted Text Color', type: 'color' },
        { key: 'border_color', label: 'Border Color', type: 'color' },
        { key: 'success_color', label: 'Success Color', type: 'color' },
        { key: 'danger_color', label: 'Danger Color', type: 'color' },
        { key: 'warning_color', label: 'Warning Color', type: 'color' },
        { key: 'info_color', label: 'Info Color', type: 'color' },
        { key: 'card_radius', label: 'Card Radius', placeholder: '16px' },
        { key: 'content_width', label: 'Content Width', placeholder: '1440px' },
        { key: 'font_thai', label: 'Thai Font Family', placeholder: 'LINE Seed Sans TH, Noto Sans Thai, sans-serif' },
        { key: 'font_latin', label: 'Latin Font Family', placeholder: 'Inter, sans-serif' },
        { key: 'font_numeric', label: 'Numeric Font Family', placeholder: 'Inter, sans-serif' },
      ]}
    />
  );
}
